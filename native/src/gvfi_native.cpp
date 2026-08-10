#include "gvfi_native.h"

#include <cmath>
#include <new>

namespace {

struct NativeInstance {
  bool initialized{false};
};

bool valid_input_frame(const gvfi_frame_t* frame) {
  return frame && frame->data && frame->data_size > 0 && frame->width > 0 &&
         frame->height > 0 && frame->row_stride > 0 &&
         frame->pixel_format != GVFI_PIXEL_FORMAT_UNKNOWN;
}

}  // namespace

extern "C" {

const char* gvfi_version(void) { return "gvfi_native/0.2.0"; }

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
  reinterpret_cast<NativeInstance*>(handle)->initialized = true;
  return GVFI_SUCCESS;
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
