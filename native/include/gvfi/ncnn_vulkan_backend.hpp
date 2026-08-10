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
  void release() noexcept;
  const NcnnBackendInfo& info() const noexcept;

 private:
  struct Impl;
  std::unique_ptr<Impl> impl_;
};

}  // namespace gvfi
