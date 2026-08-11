#include "gvfi/ncnn_vulkan_backend.hpp"

#include <gpu.h>
#include <net.h>

#include "rife.h"

#include <exception>
#include <filesystem>

namespace gvfi {

struct NcnnVulkanBackend::Impl {
  std::unique_ptr<RIFE> rife;
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
    impl_->info.device_index = selected;
    impl_->info.gpu_name = device->info.device_name();
    impl_->info.vulkan_api_version = device->info.api_version();
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
  const std::filesystem::path param(param_path);
  const std::filesystem::path model(bin_path);
  if (param.filename() != "flownet.param" || model.filename() != "flownet.bin" ||
      param.parent_path() != model.parent_path() || !std::filesystem::is_regular_file(param) ||
      !std::filesystem::is_regular_file(model)) {
    error = "RIFE v4.6 requires flownet.param and flownet.bin in one model directory";
    return false;
  }
  try {
    auto rife = std::make_unique<RIFE>(impl_->info.device_index, false, false,
                                      false, 1, false, true);
    if (rife->load(param.parent_path().wstring()) != 0) {
      error = "RIFE failed to load the v4.6 model";
      return false;
    }
    impl_->rife = std::move(rife);
  } catch (const std::exception& exc) {
    error = exc.what();
    return false;
  } catch (...) {
    error = "unknown RIFE model load failure";
    return false;
  }
  impl_->info.model_loaded = true;
  return true;
}

bool NcnnVulkanBackend::processBgr(const unsigned char* frame0,
                                   const unsigned char* frame1,
                                   int width,
                                   int height,
                                   float timestamp,
                                   unsigned char* output,
                                   std::string& error) {
  if (!impl_->info.model_loaded || !impl_->rife || !frame0 || !frame1 ||
      !output || width <= 0 || height <= 0 || timestamp < 0.f || timestamp > 1.f) {
    error = "RIFE process arguments or lifecycle state are invalid";
    return false;
  }
  ncnn::Mat input0(width, height, const_cast<unsigned char*>(frame0),
                   static_cast<size_t>(3), 3);
  ncnn::Mat input1(width, height, const_cast<unsigned char*>(frame1),
                   static_cast<size_t>(3), 3);
  ncnn::Mat result(width, height, output, static_cast<size_t>(3), 3);
  const int process_result = impl_->rife->process(input0, input1, timestamp, result);
  if (process_result != 0 || result.empty() || result.w != width ||
      result.h != height || result.elempack != 3) {
    error = "RIFE Vulkan forward failed";
    return false;
  }
  return true;
}

void NcnnVulkanBackend::release() noexcept {
  if (!impl_) {
    return;
  }
  impl_->rife.reset();
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
