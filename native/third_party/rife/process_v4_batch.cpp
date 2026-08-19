// RIFE v4 batch GPU submission — single VkCompute / one submit_and_wait.
// C6.5: lightweight phase timing only; algorithm unchanged.
// Developed by Mr. Gong
// Copyright © 2026 Mr. Gong. All Rights Reserved.

#include "rife.h"

#include "gvfi/batch_profile.hpp"

#include <chrono>
#include <vector>

namespace {

using Clock = std::chrono::steady_clock;

double ms_since(Clock::time_point start) {
  return std::chrono::duration<double, std::milli>(Clock::now() - start).count();
}

}  // namespace

int RIFE::process_v4_batch(
    const ncnn::Mat* in0images,
    const ncnn::Mat* in1images,
    const float* timesteps,
    ncnn::Mat* outimages,
    int batch_size) const
{
    const auto total_start = Clock::now();
    gvfi::BatchGpuProfile profile;
    profile.batch_size = batch_size;

    if (!vkdev || !in0images || !in1images || !timesteps || !outimages ||
        batch_size <= 0) {
        return -1;
    }

    // Fast path for tta_mode=false (most common case)
    if (!tta_mode) {
        const int w = in0images[0].w;
        const int h = in0images[0].h;
        const int channels = 3;

        for (int i = 0; i < batch_size; ++i) {
            if (in0images[i].w != w || in0images[i].h != h ||
                in1images[i].w != w || in1images[i].h != h) {
                return -1;
            }
        }

        int w_padded = (w + 31) / 32 * 32;
        int h_padded = (h + 31) / 32 * 32;

        ncnn::VkAllocator* blob_vkallocator = vkdev->acquire_blob_allocator();
        ncnn::VkAllocator* staging_vkallocator = vkdev->acquire_staging_allocator();

        ncnn::Option opt = flownet.opt;
        opt.blob_vkallocator = blob_vkallocator;
        opt.workspace_vkallocator = blob_vkallocator;
        opt.staging_vkallocator = staging_vkallocator;

        const size_t in_out_tile_elemsize = opt.use_fp16_storage ? 2u : 4u;

        // Single command buffer for the entire batch.
        ncnn::VkCompute cmd(vkdev);

        // All GPU/CPU mats and extractors must stay alive until submit_and_wait().
        std::vector<ncnn::Mat> in0_cpu_batch(static_cast<size_t>(batch_size));
        std::vector<ncnn::Mat> in1_cpu_batch(static_cast<size_t>(batch_size));
        std::vector<ncnn::VkMat> in0_gpu_batch(static_cast<size_t>(batch_size));
        std::vector<ncnn::VkMat> in1_gpu_batch(static_cast<size_t>(batch_size));
        std::vector<ncnn::VkMat> in0_gpu_padded_batch(static_cast<size_t>(batch_size));
        std::vector<ncnn::VkMat> in1_gpu_padded_batch(static_cast<size_t>(batch_size));
        std::vector<ncnn::VkMat> timestep_gpu_padded_batch(static_cast<size_t>(batch_size));
        std::vector<ncnn::VkMat> out_gpu_padded_batch(static_cast<size_t>(batch_size));
        std::vector<ncnn::VkMat> out_gpu_batch(static_cast<size_t>(batch_size));
        std::vector<ncnn::Mat> out_cpu_batch(static_cast<size_t>(batch_size));
        std::vector<ncnn::Extractor> extractors;
        extractors.reserve(static_cast<size_t>(batch_size));

        const auto record_start = Clock::now();

        // Upload all frames.
        for (int i = 0; i < batch_size; ++i) {
            const unsigned char* pixel0data =
                (const unsigned char*)in0images[i].data;
            const unsigned char* pixel1data =
                (const unsigned char*)in1images[i].data;

            if (opt.use_fp16_storage && opt.use_int8_storage) {
                in0_cpu_batch[static_cast<size_t>(i)] = ncnn::Mat(
                    w, h, (unsigned char*)pixel0data, (size_t)channels, 1);
                in1_cpu_batch[static_cast<size_t>(i)] = ncnn::Mat(
                    w, h, (unsigned char*)pixel1data, (size_t)channels, 1);
            } else {
#if _WIN32
                in0_cpu_batch[static_cast<size_t>(i)] = ncnn::Mat::from_pixels(
                    pixel0data, ncnn::Mat::PIXEL_BGR2RGB, w, h);
                in1_cpu_batch[static_cast<size_t>(i)] = ncnn::Mat::from_pixels(
                    pixel1data, ncnn::Mat::PIXEL_BGR2RGB, w, h);
#else
                in0_cpu_batch[static_cast<size_t>(i)] = ncnn::Mat::from_pixels(
                    pixel0data, ncnn::Mat::PIXEL_RGB, w, h);
                in1_cpu_batch[static_cast<size_t>(i)] = ncnn::Mat::from_pixels(
                    pixel1data, ncnn::Mat::PIXEL_RGB, w, h);
#endif
            }

            cmd.record_clone(in0_cpu_batch[static_cast<size_t>(i)],
                             in0_gpu_batch[static_cast<size_t>(i)], opt);
            cmd.record_clone(in1_cpu_batch[static_cast<size_t>(i)],
                             in1_gpu_batch[static_cast<size_t>(i)], opt);
        }

        // Record preproc + inference + postproc + download for every item.
        for (int i = 0; i < batch_size; ++i) {
            ncnn::VkMat& in0_gpu = in0_gpu_batch[static_cast<size_t>(i)];
            ncnn::VkMat& in1_gpu = in1_gpu_batch[static_cast<size_t>(i)];
            ncnn::VkMat& in0_gpu_padded =
                in0_gpu_padded_batch[static_cast<size_t>(i)];
            ncnn::VkMat& in1_gpu_padded =
                in1_gpu_padded_batch[static_cast<size_t>(i)];
            ncnn::VkMat& timestep_gpu_padded =
                timestep_gpu_padded_batch[static_cast<size_t>(i)];
            ncnn::VkMat& out_gpu_padded =
                out_gpu_padded_batch[static_cast<size_t>(i)];
            ncnn::VkMat& out_gpu = out_gpu_batch[static_cast<size_t>(i)];
            ncnn::Mat& out_cpu = out_cpu_batch[static_cast<size_t>(i)];

            {
                in0_gpu_padded.create(w_padded, h_padded, 3, in_out_tile_elemsize,
                                      1, blob_vkallocator);
                std::vector<ncnn::VkMat> bindings(2);
                bindings[0] = in0_gpu;
                bindings[1] = in0_gpu_padded;
                std::vector<ncnn::vk_constant_type> constants(6);
                constants[0].i = in0_gpu.w;
                constants[1].i = in0_gpu.h;
                constants[2].i = in0_gpu.cstep;
                constants[3].i = in0_gpu_padded.w;
                constants[4].i = in0_gpu_padded.h;
                constants[5].i = in0_gpu_padded.cstep;
                cmd.record_pipeline(rife_preproc, bindings, constants,
                                    in0_gpu_padded);
            }
            {
                in1_gpu_padded.create(w_padded, h_padded, 3, in_out_tile_elemsize,
                                      1, blob_vkallocator);
                std::vector<ncnn::VkMat> bindings(2);
                bindings[0] = in1_gpu;
                bindings[1] = in1_gpu_padded;
                std::vector<ncnn::vk_constant_type> constants(6);
                constants[0].i = in1_gpu.w;
                constants[1].i = in1_gpu.h;
                constants[2].i = in1_gpu.cstep;
                constants[3].i = in1_gpu_padded.w;
                constants[4].i = in1_gpu_padded.h;
                constants[5].i = in1_gpu_padded.cstep;
                cmd.record_pipeline(rife_preproc, bindings, constants,
                                    in1_gpu_padded);
            }
            {
                timestep_gpu_padded.create(w_padded, h_padded, 1,
                                           in_out_tile_elemsize, 1,
                                           blob_vkallocator);
                std::vector<ncnn::VkMat> bindings(1);
                bindings[0] = timestep_gpu_padded;
                std::vector<ncnn::vk_constant_type> constants(4);
                constants[0].i = timestep_gpu_padded.w;
                constants[1].i = timestep_gpu_padded.h;
                constants[2].i = timestep_gpu_padded.cstep;
                constants[3].f = timesteps[i];
                cmd.record_pipeline(rife_v4_timestep, bindings, constants,
                                    timestep_gpu_padded);
            }

            {
                extractors.push_back(flownet.create_extractor());
                ncnn::Extractor& ex = extractors.back();
                ex.set_blob_vkallocator(blob_vkallocator);
                ex.set_workspace_vkallocator(blob_vkallocator);
                ex.set_staging_vkallocator(staging_vkallocator);
                ex.input("in0", in0_gpu_padded);
                ex.input("in1", in1_gpu_padded);
                ex.input("in2", timestep_gpu_padded);
                ex.extract("out0", out_gpu_padded, cmd);
            }

            {
                if (opt.use_fp16_storage && opt.use_int8_storage) {
                    out_gpu.create(w, h, (size_t)channels, 1, blob_vkallocator);
                } else {
                    out_gpu.create(w, h, channels, (size_t)4u, 1,
                                   blob_vkallocator);
                }
                std::vector<ncnn::VkMat> bindings(2);
                bindings[0] = out_gpu_padded;
                bindings[1] = out_gpu;
                std::vector<ncnn::vk_constant_type> constants(6);
                constants[0].i = out_gpu_padded.w;
                constants[1].i = out_gpu_padded.h;
                constants[2].i = out_gpu_padded.cstep;
                constants[3].i = out_gpu.w;
                constants[4].i = out_gpu.h;
                constants[5].i = out_gpu.cstep;
                cmd.record_pipeline(rife_postproc, bindings, constants, out_gpu);
            }

            // Download into a container Mat that outlives submit_and_wait().
            if (opt.use_fp16_storage && opt.use_int8_storage) {
                out_cpu = ncnn::Mat(w, h, (unsigned char*)outimages[i].data,
                                    (size_t)channels, 1);
            }
            cmd.record_clone(out_gpu, out_cpu, opt);
        }

        profile.record_ms = ms_since(record_start);

        // One submission for the whole batch.
        const auto submit_start = Clock::now();
        cmd.submit_and_wait();
        profile.submit_ms = ms_since(submit_start);
        profile.vk_submit_count = 1;

        // CPU conversion only after GPU work completes.
        const auto post_start = Clock::now();
        for (int i = 0; i < batch_size; ++i) {
            if (!(opt.use_fp16_storage && opt.use_int8_storage)) {
#if _WIN32
                out_cpu_batch[static_cast<size_t>(i)].to_pixels(
                    (unsigned char*)outimages[i].data, ncnn::Mat::PIXEL_RGB2BGR);
#else
                out_cpu_batch[static_cast<size_t>(i)].to_pixels(
                    (unsigned char*)outimages[i].data, ncnn::Mat::PIXEL_RGB);
#endif
            }
        }
        profile.postprocess_ms = ms_since(post_start);

        vkdev->reclaim_blob_allocator(blob_vkallocator);
        vkdev->reclaim_staging_allocator(staging_vkallocator);

        profile.total_ms = ms_since(total_start);
        gvfi::store_batch_gpu_profile(profile);
        return 0;
    }

    // TTA mode: fall back to sequential process_v4 (still no ABI sequential path).
    int result = 0;
    int submits = 0;
    for (int i = 0; i < batch_size; ++i) {
        result = process_v4(in0images[i], in1images[i], timesteps[i], outimages[i]);
        ++submits;
        if (result != 0) {
            break;
        }
    }
    profile.vk_submit_count = submits;
    profile.total_ms = ms_since(total_start);
    // TTA path does not expose phase splits; leave record/submit/post at 0.
    gvfi::store_batch_gpu_profile(profile);
    return result;
}
