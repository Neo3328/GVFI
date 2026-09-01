/**
 * GVFI — Batch RIFE Worker for GPU Batch Submission PoC
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

#pragma once

#include <memory>
#include <string>
#include <cstdint>

class RIFE;

namespace ncnn {
class VulkanDevice;
}

namespace gvfi {

struct BatchFrameInput {
    const unsigned char* frame0_bgr;  // BGR24 packed, width * height * 3
    const unsigned char* frame1_bgr;  // BGR24 packed, width * height * 3
    float timestamp;                   // [0.0, 1.0]
};

struct BatchFrameOutput {
    unsigned char* output_bgr;  // Pre-allocated BGR24 buffer: width * height * 3
};

struct BatchRifeInfo {
    bool initialized{false};
    bool model_loaded{false};
    int device_index{-1};
    std::string gpu_name;
    uint32_t vulkan_api_version{0};
};

class BatchRifeWorker {
public:
    explicit BatchRifeWorker(int device_index = -1);
    ~BatchRifeWorker();

    BatchRifeWorker(const BatchRifeWorker&) = delete;
    BatchRifeWorker& operator=(const BatchRifeWorker&) = delete;

    bool initialize(std::string& error);
    bool loadModel(const char* param_path, const char* bin_path, std::string& error);
    
    // Process multiple frames in a single GPU submission
    // All frames must have the same width and height
    bool processBatch(
        const BatchFrameInput* inputs,
        BatchFrameOutput* outputs,
        int batch_size,
        int width,
        int height,
        std::string& error
    );
    
    // Process a single frame (baseline comparison mode)
    bool processSingle(
        const unsigned char* frame0_bgr,
        const unsigned char* frame1_bgr,
        float timestamp,
        int width,
        int height,
        unsigned char* output_bgr,
        std::string& error
    );

    const BatchRifeInfo& info() const noexcept { return info_; }
    void release() noexcept;

private:
    std::unique_ptr<RIFE> rife_;
    ncnn::VulkanDevice* vkdev_;
    int device_index_;
    BatchRifeInfo info_;
};

} // namespace gvfi
