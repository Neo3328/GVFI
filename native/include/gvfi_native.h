#pragma once

#include <stddef.h>
#include <stdint.h>

#ifdef _WIN32
#  ifdef GVFI_NATIVE_EXPORTS
#    define GVFI_NATIVE_API __declspec(dllexport)
#  else
#    define GVFI_NATIVE_API __declspec(dllimport)
#  endif
#else
#  define GVFI_NATIVE_API
#endif

#ifdef __cplusplus
extern "C" {
#endif

typedef enum gvfi_result {
  GVFI_SUCCESS = 0,
  GVFI_FAILED = 1,
  GVFI_NOT_IMPLEMENTED = 2,
  GVFI_INVALID_ARGUMENT = 3
} gvfi_result_t;

typedef enum gvfi_pixel_format {
  GVFI_PIXEL_FORMAT_UNKNOWN = 0,
  GVFI_PIXEL_FORMAT_RGB24 = 1,
  GVFI_PIXEL_FORMAT_BGR24 = 2,
  GVFI_PIXEL_FORMAT_RGBA32 = 3,
  GVFI_PIXEL_FORMAT_BGRA32 = 4
} gvfi_pixel_format_t;

typedef void* gvfi_handle_t;

typedef struct gvfi_frame {
  void* data;
  size_t data_size;
  uint32_t width;
  uint32_t height;
  uint32_t row_stride;
  gvfi_pixel_format_t pixel_format;
  int64_t frame_index;
  double timestamp;
} gvfi_frame_t;

GVFI_NATIVE_API const char* gvfi_version(void);
GVFI_NATIVE_API gvfi_result_t gvfi_create(gvfi_handle_t* out_handle);
GVFI_NATIVE_API gvfi_result_t gvfi_destroy(gvfi_handle_t handle);
GVFI_NATIVE_API gvfi_result_t gvfi_initialize(gvfi_handle_t handle);
GVFI_NATIVE_API gvfi_result_t gvfi_process(gvfi_handle_t handle,
                                           const gvfi_frame_t* frame0,
                                           const gvfi_frame_t* frame1,
                                           double timestamp,
                                           gvfi_frame_t* output);

#ifdef __cplusplus
}
#endif
