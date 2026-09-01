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

#define GVFI_BACKEND_INFO_ABI_VERSION 1u
#define GVFI_BACKEND_NAME_CAPACITY 256u
#define GVFI_NCNN_VERSION_CAPACITY 64u

typedef struct gvfi_backend_info {
  uint32_t struct_size;
  uint32_t abi_version;
  int32_t ncnn_enabled;
  int32_t initialized;
  int32_t model_loaded;
  int32_t device_index;
  uint32_t vulkan_api_version;
  char gpu_name[GVFI_BACKEND_NAME_CAPACITY];
  char ncnn_version[GVFI_NCNN_VERSION_CAPACITY];
} gvfi_backend_info_t;

GVFI_NATIVE_API const char* gvfi_version(void);
GVFI_NATIVE_API gvfi_result_t gvfi_create(gvfi_handle_t* out_handle);
GVFI_NATIVE_API gvfi_result_t gvfi_destroy(gvfi_handle_t handle);
GVFI_NATIVE_API gvfi_result_t gvfi_initialize(gvfi_handle_t handle);
GVFI_NATIVE_API gvfi_result_t gvfi_release(gvfi_handle_t handle);
GVFI_NATIVE_API gvfi_result_t gvfi_get_backend_info(gvfi_handle_t handle,
                                                    gvfi_backend_info_t* info);
GVFI_NATIVE_API gvfi_result_t gvfi_load_model(gvfi_handle_t handle,
                                              const char* param_path,
                                              const char* bin_path);
GVFI_NATIVE_API gvfi_result_t gvfi_process(gvfi_handle_t handle,
                                           const gvfi_frame_t* frame0,
                                           const gvfi_frame_t* frame1,
                                           double timestamp,
                                           gvfi_frame_t* output);

// Experimental batch ABI (C6.4/C6.5). NOT on the VideoWorker production path
// (production uses gvfi_process only). Retained for profile/regression harnesses.
// All frame pairs must have the same dimensions.
GVFI_NATIVE_API gvfi_result_t gvfi_process_batch(
    gvfi_handle_t handle,
    const gvfi_frame_t* frames0,      // Array of batch_size frames (frame0 of each pair)
    const gvfi_frame_t* frames1,     // Array of batch_size frames (frame1 of each pair)
    const double* timestamps,         // Array of batch_size timestamps
    gvfi_frame_t* outputs,           // Array of batch_size output frames
    int batch_size);

// C6.5 PoC: last process_v4_batch phase timings (ms). Does not alter algorithm.
// Test/profile only; VideoWorker does not call this.
#define GVFI_BATCH_PROFILE_ABI_VERSION 1u
typedef struct gvfi_batch_profile {
  uint32_t struct_size;
  uint32_t abi_version;
  int32_t batch_size;
  int32_t vk_submit_count;
  double total_ms;
  double record_ms;
  double submit_ms;
  double postprocess_ms;
} gvfi_batch_profile_t;

GVFI_NATIVE_API gvfi_result_t gvfi_get_last_batch_profile(
    gvfi_batch_profile_t* out_profile);

// ---------------------------------------------------------------------------
// C6.6 PoC-only pipeline overlap ABI (independent handle; not production path)
// ---------------------------------------------------------------------------
typedef void* gvfi_pipeline_handle_t;

#define GVFI_PIPELINE_PROFILE_ABI_VERSION 1u
typedef struct gvfi_pipeline_profile {
  uint32_t struct_size;
  uint32_t abi_version;
  int32_t depth;
  int32_t frame_count;
  int32_t submit_count;
  double wall_ms;
  double sum_job_ms;
  double avg_frame_ms;
  double overlap_ratio;
} gvfi_pipeline_profile_t;

GVFI_NATIVE_API gvfi_result_t gvfi_pipeline_create(gvfi_pipeline_handle_t* out_handle);
GVFI_NATIVE_API gvfi_result_t gvfi_pipeline_destroy(gvfi_pipeline_handle_t handle);
GVFI_NATIVE_API gvfi_result_t gvfi_pipeline_initialize(gvfi_pipeline_handle_t handle);
GVFI_NATIVE_API gvfi_result_t gvfi_pipeline_load_model(gvfi_pipeline_handle_t handle,
                                                       const char* param_path,
                                                       const char* bin_path);
GVFI_NATIVE_API gvfi_result_t gvfi_pipeline_process_sequence(
    gvfi_pipeline_handle_t handle,
    const gvfi_frame_t* frames0,
    const gvfi_frame_t* frames1,
    const double* timestamps,
    gvfi_frame_t* outputs,
    int frame_count,
    int depth);
GVFI_NATIVE_API gvfi_result_t gvfi_pipeline_get_last_profile(
    gvfi_pipeline_handle_t handle,
    gvfi_pipeline_profile_t* out_profile);

#ifdef __cplusplus
}
#endif
