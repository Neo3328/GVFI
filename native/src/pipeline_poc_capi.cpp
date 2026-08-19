/**
 * GVFI — C6.6 pipeline overlap PoC C ABI (independent of production path)
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

#include "gvfi_native.h"

#include "gvfi/pipeline_rife_worker.hpp"

#include <cstring>
#include <memory>
#include <string>
#include <vector>

namespace {

struct PipelinePocInstance {
  std::unique_ptr<gvfi::PipelineRifeWorker> worker;
  gvfi::PipelineRunProfile last_profile;
  std::string last_error;
};

void fill_profile(const gvfi::PipelineRunProfile& src, gvfi_pipeline_profile_t* out) {
  out->abi_version = GVFI_PIPELINE_PROFILE_ABI_VERSION;
  out->depth = src.depth;
  out->frame_count = src.frame_count;
  out->submit_count = src.submit_count;
  out->wall_ms = src.wall_ms;
  out->sum_job_ms = src.sum_job_ms;
  out->avg_frame_ms = src.avg_frame_ms;
  out->overlap_ratio = src.overlap_ratio;
}

bool valid_frame(const gvfi_frame_t* frame) {
  if (!frame || !frame->data || frame->width == 0 || frame->height == 0 ||
      (frame->pixel_format != GVFI_PIXEL_FORMAT_RGB24 &&
       frame->pixel_format != GVFI_PIXEL_FORMAT_BGR24)) {
    return false;
  }
  const size_t minimum_stride = static_cast<size_t>(frame->width) * 3;
  return frame->row_stride >= minimum_stride &&
         frame->data_size >= static_cast<size_t>(frame->row_stride) * frame->height;
}

void copy_to_bgr(const gvfi_frame_t& source, std::vector<unsigned char>& destination) {
  const auto* data = static_cast<const unsigned char*>(source.data);
  const size_t packed_stride = static_cast<size_t>(source.width) * 3;
  destination.resize(packed_stride * source.height);
  for (uint32_t y = 0; y < source.height; ++y) {
    const unsigned char* row = data + static_cast<size_t>(y) * source.row_stride;
    unsigned char* dst = destination.data() + static_cast<size_t>(y) * packed_stride;
    if (source.pixel_format == GVFI_PIXEL_FORMAT_BGR24) {
      std::memcpy(dst, row, packed_stride);
    } else {
      for (uint32_t x = 0; x < source.width; ++x) {
        dst[x * 3 + 0] = row[x * 3 + 2];
        dst[x * 3 + 1] = row[x * 3 + 1];
        dst[x * 3 + 2] = row[x * 3 + 0];
      }
    }
  }
}

void copy_from_bgr(const std::vector<unsigned char>& source, gvfi_frame_t& destination) {
  auto* data = static_cast<unsigned char*>(destination.data);
  const size_t packed_stride = static_cast<size_t>(destination.width) * 3;
  for (uint32_t y = 0; y < destination.height; ++y) {
    const unsigned char* row = source.data() + static_cast<size_t>(y) * packed_stride;
    unsigned char* dst = data + static_cast<size_t>(y) * destination.row_stride;
    if (destination.pixel_format == GVFI_PIXEL_FORMAT_BGR24) {
      std::memcpy(dst, row, packed_stride);
    } else {
      for (uint32_t x = 0; x < destination.width; ++x) {
        dst[x * 3 + 0] = row[x * 3 + 2];
        dst[x * 3 + 1] = row[x * 3 + 1];
        dst[x * 3 + 2] = row[x * 3 + 0];
      }
    }
  }
}

}  // namespace

extern "C" {

gvfi_result_t gvfi_pipeline_create(gvfi_pipeline_handle_t* out_handle) {
  if (!out_handle) {
    return GVFI_INVALID_ARGUMENT;
  }
#ifndef GVFI_ENABLE_NCNN_BACKEND
  *out_handle = nullptr;
  return GVFI_NOT_IMPLEMENTED;
#else
  try {
    auto* instance = new PipelinePocInstance();
    instance->worker = std::make_unique<gvfi::PipelineRifeWorker>(-1);
    *out_handle = instance;
    return GVFI_SUCCESS;
  } catch (...) {
    *out_handle = nullptr;
    return GVFI_FAILED;
  }
#endif
}

gvfi_result_t gvfi_pipeline_destroy(gvfi_pipeline_handle_t handle) {
  if (!handle) {
    return GVFI_INVALID_ARGUMENT;
  }
#ifndef GVFI_ENABLE_NCNN_BACKEND
  return GVFI_NOT_IMPLEMENTED;
#else
  auto* instance = reinterpret_cast<PipelinePocInstance*>(handle);
  delete instance;
  return GVFI_SUCCESS;
#endif
}

gvfi_result_t gvfi_pipeline_initialize(gvfi_pipeline_handle_t handle) {
#ifndef GVFI_ENABLE_NCNN_BACKEND
  (void)handle;
  return GVFI_NOT_IMPLEMENTED;
#else
  if (!handle) {
    return GVFI_INVALID_ARGUMENT;
  }
  auto* instance = reinterpret_cast<PipelinePocInstance*>(handle);
  if (!instance->worker->initialize(instance->last_error)) {
    return GVFI_FAILED;
  }
  return GVFI_SUCCESS;
#endif
}

gvfi_result_t gvfi_pipeline_load_model(gvfi_pipeline_handle_t handle,
                                       const char* param_path,
                                       const char* bin_path) {
#ifndef GVFI_ENABLE_NCNN_BACKEND
  (void)handle;
  (void)param_path;
  (void)bin_path;
  return GVFI_NOT_IMPLEMENTED;
#else
  if (!handle || !param_path || !bin_path) {
    return GVFI_INVALID_ARGUMENT;
  }
  auto* instance = reinterpret_cast<PipelinePocInstance*>(handle);
  if (!instance->worker->loadModel(param_path, bin_path, instance->last_error)) {
    return GVFI_FAILED;
  }
  return GVFI_SUCCESS;
#endif
}

gvfi_result_t gvfi_pipeline_process_sequence(
    gvfi_pipeline_handle_t handle,
    const gvfi_frame_t* frames0,
    const gvfi_frame_t* frames1,
    const double* timestamps,
    gvfi_frame_t* outputs,
    int frame_count,
    int depth) {
#ifndef GVFI_ENABLE_NCNN_BACKEND
  (void)handle;
  (void)frames0;
  (void)frames1;
  (void)timestamps;
  (void)outputs;
  (void)frame_count;
  (void)depth;
  return GVFI_NOT_IMPLEMENTED;
#else
  if (!handle || !frames0 || !frames1 || !timestamps || !outputs ||
      frame_count <= 0 || depth < 1) {
    return GVFI_INVALID_ARGUMENT;
  }
  auto* instance = reinterpret_cast<PipelinePocInstance*>(handle);
  if (!instance->worker || !instance->worker->info().model_loaded) {
    return GVFI_FAILED;
  }

  const uint32_t width = frames0[0].width;
  const uint32_t height = frames0[0].height;
  for (int i = 0; i < frame_count; ++i) {
    if (!valid_frame(&frames0[i]) || !valid_frame(&frames1[i]) ||
        !valid_frame(&outputs[i]) || frames0[i].width != width ||
        frames0[i].height != height || frames1[i].width != width ||
        frames1[i].height != height || outputs[i].width != width ||
        outputs[i].height != height || timestamps[i] < 0.0 ||
        timestamps[i] > 1.0) {
      return GVFI_INVALID_ARGUMENT;
    }
  }

  std::vector<std::vector<unsigned char>> in0(static_cast<size_t>(frame_count));
  std::vector<std::vector<unsigned char>> in1(static_cast<size_t>(frame_count));
  std::vector<std::vector<unsigned char>> out(static_cast<size_t>(frame_count));
  std::vector<gvfi::PipelineFrameInput> inputs(static_cast<size_t>(frame_count));
  std::vector<gvfi::PipelineFrameOutput> pipeline_outputs(
      static_cast<size_t>(frame_count));

  for (int i = 0; i < frame_count; ++i) {
    copy_to_bgr(frames0[i], in0[static_cast<size_t>(i)]);
    copy_to_bgr(frames1[i], in1[static_cast<size_t>(i)]);
    out[static_cast<size_t>(i)].resize(static_cast<size_t>(width) * height * 3);
    inputs[static_cast<size_t>(i)].frame0_bgr = in0[static_cast<size_t>(i)].data();
    inputs[static_cast<size_t>(i)].frame1_bgr = in1[static_cast<size_t>(i)].data();
    inputs[static_cast<size_t>(i)].timestamp = static_cast<float>(timestamps[i]);
    pipeline_outputs[static_cast<size_t>(i)].output_bgr =
        out[static_cast<size_t>(i)].data();
  }

  gvfi::PipelineRunProfile profile;
  const bool ok =
      depth <= 1
          ? instance->worker->processSequenceBaseline(
                inputs.data(), pipeline_outputs.data(), frame_count,
                static_cast<int>(width), static_cast<int>(height), profile,
                instance->last_error)
          : instance->worker->processSequencePipelined(
                inputs.data(), pipeline_outputs.data(), frame_count,
                static_cast<int>(width), static_cast<int>(height), depth,
                profile, instance->last_error);
  if (!ok) {
    return GVFI_FAILED;
  }

  for (int i = 0; i < frame_count; ++i) {
    copy_from_bgr(out[static_cast<size_t>(i)], outputs[i]);
    outputs[i].frame_index = frames0[i].frame_index;
    outputs[i].timestamp = timestamps[i];
  }
  instance->last_profile = profile;
  return GVFI_SUCCESS;
#endif
}

gvfi_result_t gvfi_pipeline_get_last_profile(gvfi_pipeline_handle_t handle,
                                             gvfi_pipeline_profile_t* out_profile) {
  if (!handle || !out_profile ||
      out_profile->struct_size < sizeof(gvfi_pipeline_profile_t)) {
    return GVFI_INVALID_ARGUMENT;
  }
#ifndef GVFI_ENABLE_NCNN_BACKEND
  return GVFI_NOT_IMPLEMENTED;
#else
  auto* instance = reinterpret_cast<PipelinePocInstance*>(handle);
  if (instance->last_profile.frame_count <= 0) {
    return GVFI_FAILED;
  }
  fill_profile(instance->last_profile, out_profile);
  return GVFI_SUCCESS;
#endif
}

}  // extern "C"
