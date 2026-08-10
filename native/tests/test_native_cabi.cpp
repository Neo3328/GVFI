#include "gvfi_native.h"

#include <cassert>
#include <cstring>
#include <iostream>

int main() {
  assert(std::strcmp(gvfi_version(), "gvfi_native/0.3.0") == 0);
  assert(gvfi_create(nullptr) == GVFI_INVALID_ARGUMENT);

  gvfi_handle_t handle = nullptr;
  assert(gvfi_create(&handle) == GVFI_SUCCESS);
  assert(handle != nullptr);

  unsigned char pixels0[3] = {0, 0, 0};
  unsigned char pixels1[3] = {255, 255, 255};
  gvfi_frame_t frame0{pixels0, sizeof(pixels0), 1, 1, 3,
                      GVFI_PIXEL_FORMAT_RGB24, 0, 0.0};
  gvfi_frame_t frame1{pixels1, sizeof(pixels1), 1, 1, 3,
                      GVFI_PIXEL_FORMAT_RGB24, 1, 1.0};
  gvfi_frame_t output{};

  assert(gvfi_process(handle, &frame0, &frame1, 0.5, &output) == GVFI_FAILED);
  assert(gvfi_initialize(handle) == GVFI_SUCCESS);
  gvfi_backend_info_t info{};
  info.struct_size = sizeof(info);
  assert(gvfi_get_backend_info(handle, &info) == GVFI_SUCCESS);
  assert(info.abi_version == GVFI_BACKEND_INFO_ABI_VERSION);
  assert(info.initialized == 1);
#ifndef GVFI_ENABLE_NCNN_BACKEND
  assert(info.ncnn_enabled == 0);
  assert(gvfi_load_model(handle, "test.param", "test.bin") ==
         GVFI_NOT_IMPLEMENTED);
#endif
  assert(gvfi_process(handle, &frame0, &frame1, 12.5, &output) ==
         GVFI_NOT_IMPLEMENTED);
  assert(gvfi_process(handle, nullptr, &frame1, 0.5, &output) ==
         GVFI_INVALID_ARGUMENT);
  assert(gvfi_destroy(handle) == GVFI_SUCCESS);
  assert(gvfi_destroy(nullptr) == GVFI_INVALID_ARGUMENT);

  std::cout << "test_native_cabi: PASS\n";
  return 0;
}
