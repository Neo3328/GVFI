/**
 * GVFI — C6.6 independent pipeline-overlap PoC worker
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

#include "gvfi/pipeline_rife_worker.hpp"

#include "rife.h"

#include <gpu.h>
#include <net.h>

#include <chrono>
#include <future>
#include <exception>
#include <filesystem>
#include <mutex>
#include <deque>

namespace gvfi {
namespace {

using Clock = std::chrono::steady_clock;

double ms_since(Clock::time_point start) {
  return std::chrono::duration<double, std::milli>(Clock::now() - start).count();
}

}  // namespace

PipelineRifeWorker::PipelineRifeWorker(int device_index)
    : device_index_(device_index) {}

PipelineRifeWorker::~PipelineRifeWorker() { release(); }

bool PipelineRifeWorker::initialize(std::string& error) {
  if (info_.initialized) {
    return true;
  }
  try {
    ncnn::create_gpu_instance();
    owns_gpu_instance_ = true;
    const int gpu_count = ncnn::get_gpu_count();
    if (gpu_count <= 0) {
      error = "ncnn found no Vulkan compute device";
      release();
      return false;
    }
    const int selected = device_index_ < 0 ? 0 : device_index_;
    if (selected >= gpu_count) {
      error = "requested ncnn Vulkan device is unavailable";
      release();
      return false;
    }
    vkdev_ = ncnn::get_gpu_device(selected);
    if (!vkdev_) {
      error = "ncnn failed to acquire the Vulkan device";
      release();
      return false;
    }
    info_.device_index = selected;
    info_.gpu_name = vkdev_->info.device_name();
    info_.vulkan_api_version = vkdev_->info.api_version();
    info_.initialized = true;
    return true;
  } catch (const std::exception& exc) {
    error = exc.what();
  } catch (...) {
    error = "unknown pipeline worker initialization failure";
  }
  release();
  return false;
}

bool PipelineRifeWorker::loadModel(const char* param_path,
                                   const char* bin_path,
                                   std::string& error) {
  if (!info_.initialized || !param_path || !bin_path) {
    error = "pipeline worker not initialized or model arguments are invalid";
    return false;
  }
  const std::filesystem::path param(param_path);
  const std::filesystem::path model(bin_path);
  if (param.filename() != "flownet.param" || model.filename() != "flownet.bin" ||
      param.parent_path() != model.parent_path() ||
      !std::filesystem::is_regular_file(param) ||
      !std::filesystem::is_regular_file(model)) {
    error = "RIFE v4.6 requires flownet.param and flownet.bin in one model directory";
    return false;
  }
  try {
    auto rife = std::make_unique<RIFE>(info_.device_index, false, false, false, 1,
                                       false, true);
    if (rife->load(param.parent_path().wstring()) != 0) {
      error = "RIFE failed to load the v4.6 model";
      return false;
    }
    rife_ = std::move(rife);
  } catch (const std::exception& exc) {
    error = exc.what();
    return false;
  } catch (...) {
    error = "unknown RIFE model load failure";
    return false;
  }
  info_.model_loaded = true;
  return true;
}

bool PipelineRifeWorker::processOne(const PipelineFrameInput& input,
                                    PipelineFrameOutput& output,
                                    int width,
                                    int height,
                                    PipelineJobTiming& timing,
                                    std::string& error) const {
  if (!info_.model_loaded || !rife_ || !input.frame0_bgr || !input.frame1_bgr ||
      !output.output_bgr || width <= 0 || height <= 0 || input.timestamp < 0.f ||
      input.timestamp > 1.f) {
    error = "pipeline processOne arguments invalid";
    return false;
  }

  const auto t0 = Clock::now();
  ncnn::Mat input0(width, height, const_cast<unsigned char*>(input.frame0_bgr),
                   static_cast<size_t>(3), 3);
  ncnn::Mat input1(width, height, const_cast<unsigned char*>(input.frame1_bgr),
                   static_cast<size_t>(3), 3);
  ncnn::Mat result(width, height, output.output_bgr, static_cast<size_t>(3), 3);

  // Uses stock RIFE::process → process_v4 (same algorithm / Warp / FP16 path).
  const int process_result =
      rife_->process(input0, input1, input.timestamp, result);
  timing.job_ms = ms_since(t0);
  timing.submit_count = 1;

  if (process_result != 0 || result.empty() || result.w != width ||
      result.h != height || result.elempack != 3) {
    error = "RIFE Vulkan pipeline forward failed";
    return false;
  }
  return true;
}

bool PipelineRifeWorker::processSequenceBaseline(
    const PipelineFrameInput* inputs,
    PipelineFrameOutput* outputs,
    int frame_count,
    int width,
    int height,
    PipelineRunProfile& profile,
    std::string& error) {
  profile = PipelineRunProfile{};
  profile.depth = 1;
  if (!inputs || !outputs || frame_count <= 0) {
    error = "baseline sequence arguments invalid";
    return false;
  }

  const auto wall0 = Clock::now();
  profile.jobs.resize(static_cast<size_t>(frame_count));
  for (int i = 0; i < frame_count; ++i) {
    if (!processOne(inputs[i], outputs[i], width, height, profile.jobs[static_cast<size_t>(i)],
                    error)) {
      return false;
    }
    profile.sum_job_ms += profile.jobs[static_cast<size_t>(i)].job_ms;
    profile.submit_count += profile.jobs[static_cast<size_t>(i)].submit_count;
  }
  profile.wall_ms = ms_since(wall0);
  profile.frame_count = frame_count;
  profile.avg_frame_ms =
      profile.frame_count > 0 ? profile.wall_ms / profile.frame_count : 0.0;
  profile.overlap_ratio = 0.0;
  return true;
}

bool PipelineRifeWorker::processSequencePipelined(
    const PipelineFrameInput* inputs,
    PipelineFrameOutput* outputs,
    int frame_count,
    int width,
    int height,
    int depth,
    PipelineRunProfile& profile,
    std::string& error) {
  profile = PipelineRunProfile{};
  if (!inputs || !outputs || frame_count <= 0 || depth < 1) {
    error = "pipelined sequence arguments invalid";
    return false;
  }
  if (depth == 1) {
    return processSequenceBaseline(inputs, outputs, frame_count, width, height,
                                   profile, error);
  }

  profile.depth = depth;
  profile.jobs.resize(static_cast<size_t>(frame_count));

  struct FutureItem {
    int index;
    std::future<std::pair<bool, std::string>> future;
  };

  const auto wall0 = Clock::now();
  std::deque<FutureItem> in_flight;
  std::mutex error_mu;
  std::string first_error;

  auto launch = [&](int index) {
    // Capture pointers/values by copy for the async task.
    const PipelineFrameInput input = inputs[index];
    PipelineFrameOutput output = outputs[index];
    PipelineJobTiming* timing = &profile.jobs[static_cast<size_t>(index)];
    return std::async(std::launch::async, [this, input, output, timing, width,
                                           height]() mutable {
      std::string local_error;
      const bool ok =
          processOne(input, output, width, height, *timing, local_error);
      return std::make_pair(ok, local_error);
    });
  };

  auto reap_one = [&](bool wait_any) -> bool {
    if (in_flight.empty()) {
      return true;
    }
    auto it = in_flight.begin();
    if (wait_any) {
      // Prefer a ready future to maximize overlap; fall back to front.
      for (auto cand = in_flight.begin(); cand != in_flight.end(); ++cand) {
        if (cand->future.wait_for(std::chrono::milliseconds(0)) ==
            std::future_status::ready) {
          it = cand;
          break;
        }
      }
    }
    auto result = it->future.get();
    in_flight.erase(it);
    if (!result.first) {
      std::lock_guard<std::mutex> lock(error_mu);
      if (first_error.empty()) {
        first_error = result.second.empty() ? "pipeline job failed"
                                            : result.second;
      }
      return false;
    }
    return true;
  };

  for (int i = 0; i < frame_count; ++i) {
    while (static_cast<int>(in_flight.size()) >= depth) {
      if (!reap_one(true)) {
        // Drain remaining to avoid std::future blocking in destructor.
        while (!in_flight.empty()) {
          reap_one(false);
        }
        error = first_error;
        return false;
      }
    }
    in_flight.push_back(FutureItem{i, launch(i)});
  }

  while (!in_flight.empty()) {
    if (!reap_one(false)) {
      while (!in_flight.empty()) {
        reap_one(false);
      }
      error = first_error;
      return false;
    }
  }

  profile.wall_ms = ms_since(wall0);
  profile.frame_count = frame_count;
  for (const auto& job : profile.jobs) {
    profile.sum_job_ms += job.job_ms;
    profile.submit_count += job.submit_count;
  }
  profile.avg_frame_ms =
      profile.frame_count > 0 ? profile.wall_ms / profile.frame_count : 0.0;
  profile.overlap_ratio =
      profile.sum_job_ms > 0.0
          ? (1.0 - (profile.wall_ms / profile.sum_job_ms))
          : 0.0;
  if (profile.overlap_ratio < 0.0) {
    profile.overlap_ratio = 0.0;
  }
  return true;
}

void PipelineRifeWorker::release() noexcept {
  rife_.reset();
  vkdev_ = nullptr;
  info_ = PipelineRifeInfo{};
  if (owns_gpu_instance_) {
    ncnn::destroy_gpu_instance();
    owns_gpu_instance_ = false;
  }
}

}  // namespace gvfi
