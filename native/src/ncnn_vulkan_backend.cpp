#include "gvfi/ncnn_vulkan_backend.hpp"

#include <gpu.h>
#include <net.h>

#include <exception>

namespace gvfi {

struct NcnnVulkanBackend::Impl {
  ncnn::Net net;
  NcnnBackendInfo info;
  bool owns_gpu_instance{false};
};

NcnnVulkanBackend::NcnnVulkanBackend() : impl_(std::make_unique<Impl>()) {}

NcnnVulkanBackend::~NcnnVulkanBackend() { release(); }

bool NcnnVulkanBackend::initialize(int device_index, std::string& error) {
  if (impl_->info.initialized) {
    return true;
  }
  try {
    ncnn::create_gpu_instance();
    impl_->owns_gpu_instance = true;
    const int gpu_count = ncnn::get_gpu_count();
    if (gpu_count <= 0) {
      error = "ncnn found no Vulkan compute device";
      release();
      return false;
    }
    const int selected = device_index < 0 ? 0 : device_index;
    if (selected >= gpu_count) {
      error = "requested ncnn Vulkan device is unavailable";
      release();
      return false;
    }
    const ncnn::VulkanDevice* device = ncnn::get_gpu_device(selected);
    if (!device) {
      error = "ncnn failed to acquire the Vulkan device";
      release();
      return false;
    }
    impl_->net.opt.use_vulkan_compute = true;
    impl_->net.set_vulkan_device(selected);
    impl_->info.device_index = selected;
    impl_->info.gpu_name = device->info().device_name();
    impl_->info.vulkan_api_version = device->info().api_version();
#ifdef NCNN_VERSION_STRING
    impl_->info.ncnn_version = NCNN_VERSION_STRING;
#else
    impl_->info.ncnn_version = "unknown";
#endif
    impl_->info.initialized = true;
    return true;
  } catch (const std::exception& exc) {
    error = exc.what();
  } catch (...) {
    error = "unknown ncnn Vulkan initialization failure";
  }
  release();
  return false;
}

bool NcnnVulkanBackend::loadModel(const char* param_path,
                                  const char* bin_path,
                                  std::string& error) {
  if (!impl_->info.initialized || !param_path || !bin_path) {
    error = "ncnn backend or model arguments are invalid";
    return false;
  }
  if (impl_->net.load_param(param_path) != 0) {
    error = "ncnn failed to load the param file";
    return false;
  }
  if (impl_->net.load_model(bin_path) != 0) {
    impl_->net.clear();
    error = "ncnn failed to load the bin file";
    return false;
  }
  auto extractor = impl_->net.create_extractor();
  (void)extractor;
  impl_->info.model_loaded = true;
  return true;
}

void NcnnVulkanBackend::release() noexcept {
  if (!impl_) {
    return;
  }
  impl_->net.clear();
  impl_->info = NcnnBackendInfo{};
  if (impl_->owns_gpu_instance) {
    ncnn::destroy_gpu_instance();
    impl_->owns_gpu_instance = false;
  }
}

const NcnnBackendInfo& NcnnVulkanBackend::info() const noexcept {
  return impl_->info;
}

}  // namespace gvfi
