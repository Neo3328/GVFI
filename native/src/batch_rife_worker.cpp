/**
 * GVFI — Batch RIFE Worker Implementation
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

#include "gvfi/batch_rife_worker.hpp"
#include "rife.h"

#include <gpu.h>
#include <net.h>
#include <exception>
#include <filesystem>
#include <vector>

namespace gvfi {

BatchRifeWorker::BatchRifeWorker(int device_index)
    : vkdev_(nullptr), device_index_(device_index) {}

BatchRifeWorker::~BatchRifeWorker() {
    release();
}

bool BatchRifeWorker::initialize(std::string& error) {
    if (info_.initialized) {
        return true;
    }
    try {
        ncnn::create_gpu_instance();
        const int gpu_count = ncnn::get_gpu_count();
        if (gpu_count <= 0) {
            error = "ncnn found no Vulkan compute device";
            return false;
        }
        const int selected = device_index_ < 0 ? 0 : device_index_;
        if (selected >= gpu_count) {
            error = "requested ncnn Vulkan device is unavailable";
            return false;
        }
        vkdev_ = ncnn::get_gpu_device(selected);
        if (!vkdev_) {
            error = "ncnn failed to acquire the Vulkan device";
            return false;
        }
        info_.device_index = selected;
        info_.gpu_name = vkdev_->info.device_name();
        info_.vulkan_api_version = vkdev_->info.api_version();
        info_.initialized = true;
        return true;
    } catch (const std::exception& exc) {
        error = exc.what();
    } catch (...) {
        error = "unknown ncnn Vulkan initialization failure";
    }
    return false;
}

bool BatchRifeWorker::loadModel(const char* param_path, const char* bin_path, std::string& error) {
    if (!info_.initialized || !param_path || !bin_path) {
        error = "batch worker not initialized or model arguments are invalid";
        return false;
    }
    const std::filesystem::path param(param_path);
    const std::filesystem::path model(bin_path);
    if (param.filename() != "flownet.param" || model.filename() != "flownet.bin" ||
        param.parent_path() != model.parent_path() || 
        !std::filesystem::is_regular_file(param) ||
        !std::filesystem::is_regular_file(model)) {
        error = "RIFE v4.6 requires flownet.param and flownet.bin in one model directory";
        return false;
    }
    try {
        auto rife = std::make_unique<RIFE>(info_.device_index, false, false, false, 1, false, true);
        if (rife->load(param.parent_path().wstring()) != 0) {
            error = "RIFE failed to load the v4.6 model";
            return false;
        }
        rife_ = std::move(rife);
    } catch (const std::exception& exc) {
        error = exc.what();
        return false;
    } catch (...) {
        error = "unknown RIFE model load failure";
        return false;
    }
    info_.model_loaded = true;
    return true;
}

bool BatchRifeWorker::processSingle(
    const unsigned char* frame0_bgr,
    const unsigned char* frame1_bgr,
    float timestamp,
    int width,
    int height,
    unsigned char* output_bgr,
    std::string& error) {
    
    if (!info_.model_loaded || !rife_ || !frame0_bgr || !frame1_bgr || !output_bgr ||
        width <= 0 || height <= 0 || timestamp < 0.f || timestamp > 1.f) {
        error = "RIFE single process arguments or lifecycle state are invalid";
        return false;
    }

    ncnn::Mat input0(width, height, const_cast<unsigned char*>(frame0_bgr), static_cast<size_t>(3), 3);
    ncnn::Mat input1(width, height, const_cast<unsigned char*>(frame1_bgr), static_cast<size_t>(3), 3);
    ncnn::Mat result(width, height, output_bgr, static_cast<size_t>(3), 3);

    const int process_result = rife_->process(input0, input1, timestamp, result);
    if (process_result != 0 || result.empty() || result.w != width ||
        result.h != height || result.elempack != 3) {
        error = "RIFE Vulkan single forward failed";
        return false;
    }
    return true;
}

bool BatchRifeWorker::processBatch(
    const BatchFrameInput* inputs,
    BatchFrameOutput* outputs,
    int batch_size,
    int width,
    int height,
    std::string& error) {
    
    if (!info_.model_loaded || !rife_ || !inputs || !outputs ||
        batch_size <= 0 || width <= 0 || height <= 0) {
        error = "RIFE batch process arguments or lifecycle state are invalid";
        return false;
    }

    try {
        // Prepare arrays for batch processing
        std::vector<ncnn::Mat> input0_batch(batch_size);
        std::vector<ncnn::Mat> input1_batch(batch_size);
        std::vector<float> timestamp_batch(batch_size);
        std::vector<ncnn::Mat> output_batch(batch_size);

        for (int i = 0; i < batch_size; ++i) {
            const auto& input = inputs[i];
            
            if (!input.frame0_bgr || !input.frame1_bgr || !outputs[i].output_bgr) {
                error = "RIFE batch frame pointer is null at index " + std::to_string(i);
                return false;
            }
            
            if (input.timestamp < 0.f || input.timestamp > 1.f) {
                error = "RIFE batch timestamp out of range at index " + std::to_string(i);
                return false;
            }

            input0_batch[i] = ncnn::Mat(width, height, const_cast<unsigned char*>(input.frame0_bgr),
                                       static_cast<size_t>(3), 3);
            input1_batch[i] = ncnn::Mat(width, height, const_cast<unsigned char*>(input.frame1_bgr),
                                       static_cast<size_t>(3), 3);
            timestamp_batch[i] = input.timestamp;
            output_batch[i] = ncnn::Mat(width, height, outputs[i].output_bgr,
                                       static_cast<size_t>(3), 3);
        }

        // Use the new batch GPU processing
        const int result = rife_->process_v4_batch(
            input0_batch.data(),
            input1_batch.data(),
            timestamp_batch.data(),
            output_batch.data(),
            batch_size);

        if (result != 0) {
            error = "RIFE Vulkan batch GPU forward failed with code " + std::to_string(result);
            return false;
        }

        // Verify outputs
        for (int i = 0; i < batch_size; ++i) {
            if (output_batch[i].empty() || output_batch[i].w != width ||
                output_batch[i].h != height || output_batch[i].elempack != 3) {
                error = "RIFE Vulkan batch output invalid at index " + std::to_string(i);
                return false;
            }
        }
        
        return true;
    } catch (const std::exception& exc) {
        error = std::string("RIFE batch processing exception: ") + exc.what();
        return false;
    } catch (...) {
        error = "unknown RIFE batch processing failure";
        return false;
    }
}

void BatchRifeWorker::release() noexcept {
    rife_.reset();
    vkdev_ = nullptr;
    info_ = BatchRifeInfo{};
    ncnn::destroy_gpu_instance();
}

} // namespace gvfi
