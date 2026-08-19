/**
 * GVFI — C6.6 independent pipeline-overlap PoC worker (depth>=2)
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 *
 * Not wired into production VideoWorker / CLI / default backend_mode.
 */

#pragma once

#include <cstdint>
#include <memory>
#include <string>
#include <vector>

class RIFE;

namespace ncnn {
class VulkanDevice;
}

namespace gvfi {

struct PipelineFrameInput {
  const unsigned char* frame0_bgr;
  const unsigned char* frame1_bgr;
  float timestamp;
};

struct PipelineFrameOutput {
  unsigned char* output_bgr;
};

struct PipelineJobTiming {
  double job_ms{0.0};       // full process() wall for this frame
  double record_proxy_ms{0.0};  // reserved (0 unless instrumented later)
  int submit_count{1};
};

struct PipelineRunProfile {
  int depth{1};
  int frame_count{0};
  int submit_count{0};
  double wall_ms{0.0};
  double sum_job_ms{0.0};
  double avg_frame_ms{0.0};
  double overlap_ratio{0.0};  // 1 - wall/sum_job (0 for depth=1)
  std::vector<PipelineJobTiming> jobs;
};

struct PipelineRifeInfo {
  bool initialized{false};
  bool model_loaded{false};
  int device_index{-1};
  std::string gpu_name;
  uint32_t vulkan_api_version{0};
};

class PipelineRifeWorker {
 public:
  explicit PipelineRifeWorker(int device_index = -1);
  ~PipelineRifeWorker();

  PipelineRifeWorker(const PipelineRifeWorker&) = delete;
  PipelineRifeWorker& operator=(const PipelineRifeWorker&) = delete;

  bool initialize(std::string& error);
  bool loadModel(const char* param_path, const char* bin_path, std::string& error);

  // Sequential baseline: depth=1, one process() after another.
  bool processSequenceBaseline(const PipelineFrameInput* inputs,
                               PipelineFrameOutput* outputs,
                               int frame_count,
                               int width,
                               int height,
                               PipelineRunProfile& profile,
                               std::string& error);

  // Depth-N sliding window of concurrent process() calls (independent slots).
  bool processSequencePipelined(const PipelineFrameInput* inputs,
                                PipelineFrameOutput* outputs,
                                int frame_count,
                                int width,
                                int height,
                                int depth,
                                PipelineRunProfile& profile,
                                std::string& error);

  const PipelineRifeInfo& info() const noexcept { return info_; }
  void release() noexcept;

 private:
  bool processOne(const PipelineFrameInput& input,
                  PipelineFrameOutput& output,
                  int width,
                  int height,
                  PipelineJobTiming& timing,
                  std::string& error) const;

  std::unique_ptr<RIFE> rife_;
  ncnn::VulkanDevice* vkdev_{nullptr};
  int device_index_{-1};
  PipelineRifeInfo info_;
  bool owns_gpu_instance_{false};
};

}  // namespace gvfi
