#include "gvfi_native.h"

#include <cmath>
#include <cstring>
#include <memory>
#include <new>
#include <string>
#include <vector>

#ifdef GVFI_ENABLE_NCNN_BACKEND
#include "gvfi/batch_profile.hpp"
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
  if (!frame || !frame->data || frame->width == 0 || frame->height == 0 ||
      (frame->pixel_format != GVFI_PIXEL_FORMAT_RGB24 &&
       frame->pixel_format != GVFI_PIXEL_FORMAT_BGR24)) {
    return false;
  }
  const size_t minimum_stride = static_cast<size_t>(frame->width) * 3;
  return frame->row_stride >= minimum_stride &&
         frame->data_size >= static_cast<size_t>(frame->row_stride) * frame->height;
}

void copy_to_bgr(const gvfi_frame_t& source, std::vector<unsigned char>& destination) {
  const auto* data = static_cast<const unsigned char*>(source.data);
  const size_t packed_stride = static_cast<size_t>(source.width) * 3;
  destination.resize(packed_stride * source.height);
  for (uint32_t y = 0; y < source.height; ++y) {
    const unsigned char* input = data + static_cast<size_t>(y) * source.row_stride;
    unsigned char* output = destination.data() + static_cast<size_t>(y) * packed_stride;
    if (source.pixel_format == GVFI_PIXEL_FORMAT_BGR24) {
      std::memcpy(output, input, packed_stride);
      continue;
    }
    for (uint32_t x = 0; x < source.width; ++x) {
      output[x * 3] = input[x * 3 + 2];
      output[x * 3 + 1] = input[x * 3 + 1];
      output[x * 3 + 2] = input[x * 3];
    }
  }
}

void copy_from_bgr(const std::vector<unsigned char>& source, gvfi_frame_t& destination) {
  auto* data = static_cast<unsigned char*>(destination.data);
  const size_t packed_stride = static_cast<size_t>(destination.width) * 3;
  for (uint32_t y = 0; y < destination.height; ++y) {
    const unsigned char* input = source.data() + static_cast<size_t>(y) * packed_stride;
    unsigned char* output = data + static_cast<size_t>(y) * destination.row_stride;
    if (destination.pixel_format == GVFI_PIXEL_FORMAT_BGR24) {
      std::memcpy(output, input, packed_stride);
      continue;
    }
    for (uint32_t x = 0; x < destination.width; ++x) {
      output[x * 3] = input[x * 3 + 2];
      output[x * 3 + 1] = input[x * 3 + 1];
      output[x * 3 + 2] = input[x * 3];
    }
  }
}

}  // namespace

extern "C" {

const char* gvfi_version(void) { return "gvfi_native/0.4.0"; }

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

gvfi_result_t gvfi_release(gvfi_handle_t handle) {
  if (!handle) {
    return GVFI_INVALID_ARGUMENT;
  }
  auto* instance = reinterpret_cast<NativeInstance*>(handle);
#ifdef GVFI_ENABLE_NCNN_BACKEND
  if (instance->ncnn_backend) {
    instance->ncnn_backend->release();
    instance->ncnn_backend.reset();
  }
#endif
  instance->initialized = false;
  instance->last_error.clear();
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
  auto* instance = reinterpret_cast<NativeInstance*>(handle);
  if (!instance->initialized) {
    return GVFI_FAILED;
  }
#ifdef GVFI_ENABLE_NCNN_BACKEND
  if (frame0->width != frame1->width || frame0->height != frame1->height ||
      timestamp < 0.0 || timestamp > 1.0 || !valid_input_frame(output) ||
      output->width != frame0->width || output->height != frame0->height) {
    return GVFI_INVALID_ARGUMENT;
  }
  if (!instance->ncnn_backend || !instance->ncnn_backend->info().model_loaded) {
    return GVFI_FAILED;
  }
  std::vector<unsigned char> input0;
  std::vector<unsigned char> input1;
  std::vector<unsigned char> result(static_cast<size_t>(frame0->width) *
                                    frame0->height * 3);
  copy_to_bgr(*frame0, input0);
  copy_to_bgr(*frame1, input1);
  if (!instance->ncnn_backend->processBgr(
          input0.data(), input1.data(), static_cast<int>(frame0->width),
          static_cast<int>(frame0->height), static_cast<float>(timestamp),
          result.data(), instance->last_error)) {
    return GVFI_FAILED;
  }
  copy_from_bgr(result, *output);
  output->frame_index = frame0->frame_index;
  output->timestamp = timestamp;
  return GVFI_SUCCESS;
#else
  return GVFI_NOT_IMPLEMENTED;
#endif
}

gvfi_result_t gvfi_process_batch(gvfi_handle_t handle,
                                  const gvfi_frame_t* frames0,
                                  const gvfi_frame_t* frames1,
                                  const double* timestamps,
                                  gvfi_frame_t* outputs,
                                  int batch_size) {
#ifndef GVFI_ENABLE_NCNN_BACKEND
  (void)handle;
  (void)frames0;
  (void)frames1;
  (void)timestamps;
  (void)outputs;
  (void)batch_size;
  return GVFI_NOT_IMPLEMENTED;
#else
  if (!handle || !frames0 || !frames1 || !timestamps || !outputs || batch_size <= 0) {
    return GVFI_INVALID_ARGUMENT;
  }

  auto* instance = reinterpret_cast<NativeInstance*>(handle);
  if (!instance->initialized) {
    return GVFI_FAILED;
  }

  // Validate all frames have the same dimensions
  uint32_t width = frames0[0].width;
  uint32_t height = frames0[0].height;
  for (int i = 0; i < batch_size; ++i) {
    if (!valid_input_frame(&frames0[i]) || !valid_input_frame(&frames1[i]) ||
        frames0[i].width != width || frames0[i].height != height ||
        frames1[i].width != width || frames1[i].height != height ||
        !valid_input_frame(&outputs[i]) ||
        outputs[i].width != width || outputs[i].height != height) {
      return GVFI_INVALID_ARGUMENT;
    }
  }

  if (!instance->ncnn_backend || !instance->ncnn_backend->info().model_loaded) {
    return GVFI_FAILED;
  }

  // Convert all frames and prepare batch pointers for processBgrBatch().
  std::vector<std::vector<unsigned char>> input0_batch(
      static_cast<size_t>(batch_size));
  std::vector<std::vector<unsigned char>> input1_batch(
      static_cast<size_t>(batch_size));
  std::vector<std::vector<unsigned char>> result_batch(
      static_cast<size_t>(batch_size));
  std::vector<const unsigned char*> frames0_ptrs(
      static_cast<size_t>(batch_size));
  std::vector<const unsigned char*> frames1_ptrs(
      static_cast<size_t>(batch_size));
  std::vector<unsigned char*> output_ptrs(static_cast<size_t>(batch_size));
  std::vector<float> timestamp_batch(static_cast<size_t>(batch_size));

  for (int i = 0; i < batch_size; ++i) {
    if (timestamps[i] < 0.0 || timestamps[i] > 1.0) {
      return GVFI_INVALID_ARGUMENT;
    }
    copy_to_bgr(frames0[i], input0_batch[static_cast<size_t>(i)]);
    copy_to_bgr(frames1[i], input1_batch[static_cast<size_t>(i)]);
    result_batch[static_cast<size_t>(i)].resize(static_cast<size_t>(width) *
                                                height * 3);
    frames0_ptrs[static_cast<size_t>(i)] =
        input0_batch[static_cast<size_t>(i)].data();
    frames1_ptrs[static_cast<size_t>(i)] =
        input1_batch[static_cast<size_t>(i)].data();
    output_ptrs[static_cast<size_t>(i)] =
        result_batch[static_cast<size_t>(i)].data();
    timestamp_batch[static_cast<size_t>(i)] =
        static_cast<float>(timestamps[i]);
  }

  // No sequential fallback: batch path must go through processBgrBatch().
  if (!instance->ncnn_backend->processBgrBatch(
          frames0_ptrs.data(), frames1_ptrs.data(), timestamp_batch.data(),
          output_ptrs.data(), batch_size, static_cast<int>(width),
          static_cast<int>(height), instance->last_error)) {
    return GVFI_FAILED;
  }

  for (int i = 0; i < batch_size; ++i) {
    copy_from_bgr(result_batch[static_cast<size_t>(i)], outputs[i]);
    outputs[i].frame_index = frames0[i].frame_index;
    outputs[i].timestamp = timestamps[i];
  }

  return GVFI_SUCCESS;
#endif
}

gvfi_result_t gvfi_get_last_batch_profile(gvfi_batch_profile_t* out_profile) {
  if (!out_profile || out_profile->struct_size < sizeof(gvfi_batch_profile_t)) {
    return GVFI_INVALID_ARGUMENT;
  }
#ifndef GVFI_ENABLE_NCNN_BACKEND
  return GVFI_NOT_IMPLEMENTED;
#else
  gvfi::BatchGpuProfile profile;
  if (!gvfi::load_batch_gpu_profile(profile) || !profile.valid) {
    return GVFI_FAILED;
  }
  out_profile->abi_version = GVFI_BATCH_PROFILE_ABI_VERSION;
  out_profile->batch_size = profile.batch_size;
  out_profile->vk_submit_count = profile.vk_submit_count;
  out_profile->total_ms = profile.total_ms;
  out_profile->record_ms = profile.record_ms;
  out_profile->submit_ms = profile.submit_ms;
  out_profile->postprocess_ms = profile.postprocess_ms;
  return GVFI_SUCCESS;
#endif
}

}  // extern "C"
