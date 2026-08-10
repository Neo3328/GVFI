#include "gvfi_native.h"

#include <cmath>
#include <cstring>
#include <memory>
#include <new>
#include <string>

#ifdef GVFI_ENABLE_NCNN_BACKEND
#include "gvfi/ncnn_vulkan_backend.hpp"
#endif

namespace {

static_assert(GVFI_SUCCESS == 0 && GVFI_FAILED == 1 &&
              GVFI_NOT_IMPLEMENTED == 2 && GVFI_INVALID_ARGUMENT == 3);
static_assert(sizeof(gvfi_backend_info_t) == 348);

struct NativeInstance {
  bool initialized{false};
  std::string last_error;
#ifdef GVFI_ENABLE_NCNN_BACKEND
  std::unique_ptr<gvfi::NcnnVulkanBackend> ncnn_backend;
#endif
};

template <std::size_t N>
void copy_text(char (&destination)[N], const std::string& source) {
  const std::size_t count = source.size() < N - 1 ? source.size() : N - 1;
  std::memcpy(destination, source.data(), count);
  destination[count] = '\0';
}

bool valid_input_frame(const gvfi_frame_t* frame) {
  return frame && frame->data && frame->data_size > 0 && frame->width > 0 &&
         frame->height > 0 && frame->row_stride > 0 &&
         frame->pixel_format != GVFI_PIXEL_FORMAT_UNKNOWN;
}

}  // namespace

extern "C" {

const char* gvfi_version(void) { return "gvfi_native/0.3.0"; }

gvfi_result_t gvfi_create(gvfi_handle_t* out_handle) {
  if (!out_handle) {
    return GVFI_INVALID_ARGUMENT;
  }
  *out_handle = nullptr;
  auto* instance = new (std::nothrow) NativeInstance();
  if (!instance) {
    return GVFI_FAILED;
  }
  *out_handle = reinterpret_cast<gvfi_handle_t>(instance);
  return GVFI_SUCCESS;
}

gvfi_result_t gvfi_destroy(gvfi_handle_t handle) {
  if (!handle) {
    return GVFI_INVALID_ARGUMENT;
  }
  delete reinterpret_cast<NativeInstance*>(handle);
  return GVFI_SUCCESS;
}

gvfi_result_t gvfi_initialize(gvfi_handle_t handle) {
  if (!handle) {
    return GVFI_INVALID_ARGUMENT;
  }
  auto* instance = reinterpret_cast<NativeInstance*>(handle);
#ifdef GVFI_ENABLE_NCNN_BACKEND
  if (!instance->ncnn_backend) {
    instance->ncnn_backend = std::make_unique<gvfi::NcnnVulkanBackend>();
  }
  if (!instance->ncnn_backend->initialize(-1, instance->last_error)) {
    return GVFI_FAILED;
  }
#endif
  instance->initialized = true;
  return GVFI_SUCCESS;
}

gvfi_result_t gvfi_get_backend_info(gvfi_handle_t handle,
                                    gvfi_backend_info_t* info) {
  if (!handle || !info || info->struct_size < sizeof(gvfi_backend_info_t)) {
    return GVFI_INVALID_ARGUMENT;
  }
  auto* instance = reinterpret_cast<NativeInstance*>(handle);
  const uint32_t requested_size = info->struct_size;
  std::memset(info, 0, sizeof(*info));
  info->struct_size = requested_size;
  info->abi_version = GVFI_BACKEND_INFO_ABI_VERSION;
  info->device_index = -1;
  info->initialized = instance->initialized ? 1 : 0;
#ifdef GVFI_ENABLE_NCNN_BACKEND
  info->ncnn_enabled = 1;
  if (instance->ncnn_backend) {
    const auto& backend_info = instance->ncnn_backend->info();
    info->model_loaded = backend_info.model_loaded ? 1 : 0;
    info->device_index = backend_info.device_index;
    info->vulkan_api_version = backend_info.vulkan_api_version;
    copy_text(info->gpu_name, backend_info.gpu_name);
    copy_text(info->ncnn_version, backend_info.ncnn_version);
  }
#endif
  return GVFI_SUCCESS;
}

gvfi_result_t gvfi_load_model(gvfi_handle_t handle,
                              const char* param_path,
                              const char* bin_path) {
  if (!handle || !param_path || !bin_path || !param_path[0] || !bin_path[0]) {
    return GVFI_INVALID_ARGUMENT;
  }
  auto* instance = reinterpret_cast<NativeInstance*>(handle);
  if (!instance->initialized) {
    return GVFI_FAILED;
  }
#ifdef GVFI_ENABLE_NCNN_BACKEND
  if (!instance->ncnn_backend ||
      !instance->ncnn_backend->loadModel(param_path, bin_path,
                                         instance->last_error)) {
    return GVFI_FAILED;
  }
  return GVFI_SUCCESS;
#else
  return GVFI_NOT_IMPLEMENTED;
#endif
}

gvfi_result_t gvfi_process(gvfi_handle_t handle,
                           const gvfi_frame_t* frame0,
                           const gvfi_frame_t* frame1,
                           double timestamp,
                           gvfi_frame_t* output) {
  if (!handle || !valid_input_frame(frame0) || !valid_input_frame(frame1) ||
      !output || !std::isfinite(timestamp)) {
    return GVFI_INVALID_ARGUMENT;
  }
  if (!reinterpret_cast<NativeInstance*>(handle)->initialized) {
    return GVFI_FAILED;
  }
  return GVFI_NOT_IMPLEMENTED;
}

}  // extern "C"
