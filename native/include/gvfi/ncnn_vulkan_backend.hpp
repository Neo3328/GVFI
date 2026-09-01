#pragma once

#include <cstdint>
#include <memory>
#include <string>

namespace gvfi {

struct NcnnBackendInfo {
  std::string gpu_name;
  std::string ncnn_version;
  std::uint32_t vulkan_api_version{0};
  int device_index{-1};
  bool initialized{false};
  bool model_loaded{false};
};

class NcnnVulkanBackend {
 public:
  NcnnVulkanBackend();
  ~NcnnVulkanBackend();

  NcnnVulkanBackend(const NcnnVulkanBackend&) = delete;
  NcnnVulkanBackend& operator=(const NcnnVulkanBackend&) = delete;

  bool initialize(int device_index, std::string& error);
  bool loadModel(const char* param_path, const char* bin_path, std::string& error);
  bool processBgr(const unsigned char* frame0,
                  const unsigned char* frame1,
                  int width,
                  int height,
                  float timestamp,
                  unsigned char* output,
                  std::string& error);
  // Batch entry: multiple BGR frame pairs in one RIFE GPU submission.
  bool processBgrBatch(const unsigned char* const* frames0,
                       const unsigned char* const* frames1,
                       const float* timestamps,
                       unsigned char* const* outputs,
                       int batch_size,
                       int width,
                       int height,
                       std::string& error);
  void release() noexcept;
  const NcnnBackendInfo& info() const noexcept;

 private:
  struct Impl;
  std::unique_ptr<Impl> impl_;
};

}  // namespace gvfi
