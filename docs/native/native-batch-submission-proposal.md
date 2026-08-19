# Phase C6.3 — Native RIFE GPU 批量提交方案

**GVFI — Native RIFE GPU Batch Submission Proposal**  
**Developed by Mr. Gong**  
**Copyright © 2026 Mr. Gong. All Rights Reserved.**

---

## 1. 前置分析总结

### 1.1 当前 ctypes/forward 调用边界

**Python → C ABI 调用链**：

```
Python (NativeInterpolatorBackend.process_directory)
  └─> for each output_frame:
        └─> NativeLibraryLoader.process(frame0, frame1, timestamp)
              └─> ctypes: gvfi_process(handle, native0, native1, ts, output)
                    └─> C++: gvfi_native.cpp::gvfi_process()
                          └─> NcnnVulkanBackend::processBgr()
                                └─> RIFE::process() / RIFE::process_v4()
                                      └─> ncnn::VkCompute cmd
                                            └─> cmd.submit_and_wait()
```

**关键发现**：

1. **每帧一次跨界**：每个输出帧都会触发一次 Python → C 的 `ctypes` 调用
2. **每帧一次 GPU 提交**：`RIFE::process_v4()` 内部在 **line 3186** 调用 `cmd.submit_and_wait()`，每帧提交一次 Vulkan 命令队列并同步等待
3. **ncnn Extractor 生命周期**：
   - `ncnn::VkCompute cmd(vkdev)` 在 `process_v4()` 函数栈内创建
   - `cmd.record_clone()` 记录 upload/download 命令
   - `ncnn::Extractor ex = flownet.create_extractor()` 记录推理命令到 `cmd`
   - `cmd.submit_and_wait()` 提交所有命令并同步等待 GPU 完成
   - 函数返回后 `cmd` 析构，allocator 回收

4. **Vulkan allocator 生命周期**：
   - `blob_vkallocator` 和 `staging_vkallocator` 在每次 `process_v4()` 调用时从 `vkdev` 获取
   - 在 `submit_and_wait()` 后通过 `vkdev->reclaim_*_allocator()` 回收

**瓶颈识别**：

- **GPU submit 开销**：每帧调用 `submit_and_wait()` 产生 CPU-GPU 同步开销和 Vulkan driver overhead
- **ctypes 跨界开销**：每帧一次跨界调用（虽然比 I/O 小，但累积仍有影响）
- **内存分配开销**：每帧申请和回收 GPU allocator

### 1.2 ncnn Vulkan Extractor 生命周期

**ncnn VkCompute 工作流**：

```cpp
// RIFE::process_v4() 内部
ncnn::VkCompute cmd(vkdev);  // 创建命令记录器

// Phase 1: Upload
cmd.record_clone(in0, in0_gpu, opt);
cmd.record_clone(in1, in1_gpu, opt);

// Phase 2: Inference (通过 Extractor)
ncnn::Extractor ex = flownet.create_extractor();
ex.set_blob_vkallocator(blob_vkallocator);
ex.set_workspace_vkallocator(blob_vkallocator);
ex.set_staging_vkallocator(staging_vkallocator);
ex.input("in0", in0_gpu_padded);
ex.input("in1", in1_gpu_padded);
ex.input("in2", timestep_gpu_padded);
ex.extract("out0", out_gpu_padded, cmd);  // 记录推理命令到 cmd

// Phase 3: Postproc
cmd.record_pipeline(rife_postproc, bindings, constants, out_gpu);

// Phase 4: Download
cmd.record_clone(out_gpu, out, opt);

// Phase 5: Submit and synchronize
cmd.submit_and_wait();  // 提交所有记录的命令，等待 GPU 完成
```

**关键点**：

1. `ncnn::VkCompute` 是命令记录器，**不立即执行 GPU 操作**
2. 所有操作（upload、inference、download）都通过 `record_*` 方法记录到命令缓冲区
3. 只有 `submit_and_wait()` 才真正提交到 GPU 并同步等待
4. `ncnn::Extractor` 是无状态的，每次 `create_extractor()` 都是新实例

**ncnn 核心约束**：

- `ncnn::Net::flownet` 是线程安全的（推理网络可以并发创建多个 Extractor）
- `ncnn::VkCompute` 必须在单个线程内顺序记录和提交
- `vkdev->acquire_*_allocator()` 获取的 allocator 必须在同一个 submit 周期内使用

---

## 2. 最小批量提交方案

### 2.1 设计原则

**严格限制**（Phase C6.3 PoC）：

1. ✅ **禁止修改 ncnn 核心**：不修改 `ncnn` 库源码或 `RIFE::process_v4()`
2. ✅ **禁止修改生产代码**：不改动 `gvfi_native.cpp`、`ncnn_vulkan_backend.cpp`、`native_library.py`、`interpolator_backend.py`
3. ✅ **独立 benchmark**：在 `tests/` 下实现完全独立的 PoC，验证批量提交可行性

**优化策略**：

- **批量 GPU 提交**：将多帧的 Vulkan 命令记录到单个 `VkCompute`，一次性提交
- **减少同步点**：从"每帧一次 `submit_and_wait()`"改为"每批次一次 `submit_and_wait()`"

### 2.2 方案架构

**Batch Worker 模式**：

```
Python Benchmark (test_c63_batch_poc.py)
  └─> Batch loop (process N frames):
        └─> 预加载 N 对输入帧到内存
        └─> C++ BatchRifeWorker::processBatch(frames[], N, outputs[])
              └─> VkCompute cmd(vkdev)  // 单个命令记录器
              └─> for i in 0..N:
                    ├─> 记录 upload(frame0[i], frame1[i])
                    ├─> 记录 inference(flownet, timestep[i])
                    ├─> 记录 postproc
                    └─> 记录 download(output[i])
              └─> cmd.submit_and_wait()  // 一次性提交所有帧
              └─> 回收 allocators
```

**关键改进**：

| 维度 | 当前实现 | 批量提交方案 |
|------|---------|------------|
| **GPU submit 次数** | N 次 (每帧一次) | 1 次 (整批一次) |
| **CPU-GPU 同步次数** | N 次 | 1 次 |
| **Vulkan driver 调用开销** | N × overhead | 1 × overhead |
| **Allocator 申请/回收** | N 次 | 1 次 |

### 2.3 技术实现路径

**新增文件**（不修改现有代码）：

```
native/include/gvfi/batch_rife_worker.hpp  // Batch 接口定义
native/src/batch_rife_worker.cpp           // Batch 实现
native/tests/test_batch_rife.cpp           // C++ 单元测试
ECCV2022-RIFE/tests/test_c63_batch_poc.py  // Python benchmark
```

**核心接口设计**：

```cpp
// batch_rife_worker.hpp
namespace gvfi {

struct BatchFrameInput {
    const unsigned char* frame0_bgr;
    const unsigned char* frame1_bgr;
    float timestamp;
};

struct BatchFrameOutput {
    unsigned char* output_bgr;  // 预分配的输出缓冲区
};

class BatchRifeWorker {
public:
    BatchRifeWorker(int device_index);
    ~BatchRifeWorker();

    bool initialize(std::string& error);
    bool loadModel(const char* param_path, const char* bin_path, std::string& error);
    
    // 批量处理：一次提交多帧
    bool processBatch(
        const BatchFrameInput* inputs,
        BatchFrameOutput* outputs,
        int batch_size,
        int width,
        int height,
        std::string& error
    );

private:
    std::unique_ptr<RIFE> rife_;
    ncnn::VulkanDevice* vkdev_;
    int device_index_;
    bool initialized_;
};

} // namespace gvfi
```

**实现要点**：

1. **复用 RIFE 网络**：`RIFE` 实例在整个 batch 期间保持，只创建一次
2. **单次命令提交**：整个 batch 共享一个 `ncnn::VkCompute cmd`
3. **内存池化**（可选优化）：预分配 GPU buffer 避免每帧重复分配
4. **错误处理**：batch 内任一帧失败则整批失败，rollback 已分配资源

---

## 3. Benchmark 实现计划

### 3.1 对比基准

**Baseline**（单帧模式）：

- 模拟当前 `NativeInterpolatorBackend` 的行为
- 每帧调用一次 `RIFE::process_v4()`（通过新的单帧 wrapper）
- 测量总时间、平均帧时间、GPU 利用率

**Batch Mode**（批量模式）：

- 使用 `BatchRifeWorker::processBatch()` 一次性处理 N 帧
- 批量大小：4、8、16、32 帧
- 测量总时间、平均帧时间、GPU 利用率

### 3.2 测试指标

**性能指标**：

- **总时间（Total Time）**：处理所有帧的总耗时
- **平均帧时间（Avg Frame Time）**：总时间 / 帧数
- **加速比（Speedup）**：Baseline 时间 / Batch 时间
- **GPU 提交次数（Submit Count）**：Vulkan submit 调用次数

**正确性指标**：

- **Bit-exact 匹配**：批量输出与单帧输出逐像素对比
- **MAE、PSNR、SSIM**：量化图像质量差异

**稳定性指标**：

- **多次运行一致性**：10 次运行结果方差
- **内存泄漏检测**：Vulkan allocator 泄漏监控

### 3.3 测试环境

**输入数据**：

- 视频：`test_540p.mp4`（C6.2 使用的同一视频）
- 分辨率：960×540
- 输入帧数：20 帧（取前 10 对连续帧）
- 目标插值：2×（生成 19 个中间帧）

**模型**：

- RIFE v4.6 (`train_log/flownet.param` + `flownet.bin`)

**硬件**：

- GPU：NVIDIA RTX 系列（通过 Vulkan）
- 平台：Windows 10+

---

## 4. 预期收益与风险

### 4.1 预期收益

**理论分析**：

根据 C6.1 profiling 数据：

- **GPU forward 占比**：44.7% (1.96s / 4.39s 可优化部分)
- **ctypes 跨界开销**：每帧约 0.01-0.02s（预估）

**批量提交预期改进**：

1. **消除 CPU-GPU 同步延迟**：
   - 当前：每帧 submit + fence wait → GPU 空闲等待 CPU
   - 批量：一次 submit → GPU 流水线饱和

2. **减少 Vulkan driver 开销**：
   - 当前：每帧调用 `vkQueueSubmit` + `vkWaitForFences`
   - 批量：批次内只调用一次

3. **Allocator 复用**：
   - 当前：每帧 acquire + reclaim allocator
   - 批量：批次内只申请一次

**保守估计加速比**：

- **批量大小 8**：1.3-1.5× (GPU forward 部分)
- **批量大小 16**：1.4-1.6×
- **批量大小 32**：1.5-1.7×（受限于 GPU 内存）

### 4.2 风险与限制

**技术风险**：

1. **GPU 内存压力**：
   - 批量越大，同时驻留 GPU 的 VkMat 越多
   - 960×540 × 32 帧 ≈ 150MB（fp16）→ 可控
   - 缓解：动态调整 batch_size 或分片处理

2. **延迟增加**：
   - 批量处理必须等待整批准备好才能提交
   - 对实时场景不友好（但 GVFI 是离线渲染，可接受）

3. **错误传播**：
   - batch 内任一帧失败会导致整批重试
   - 缓解：实现 fallback 机制，失败时降级为单帧模式

**工程限制**：

1. **不修改 ncnn 核心**：
   - 无法优化 ncnn 内部的 Extractor 实现
   - 只能在 RIFE wrapper 层面批量化

2. **Python ctypes 接口**：
   - 批量接口需要传递数组指针，ctypes 绑定复杂度提升
   - 缓解：先在 C++ 层实现和测试，再考虑 Python 暴露

---

## 5. 后续生产集成路径（Phase C6.4+）

**PoC 验证通过后**，集成到生产代码的步骤：

### 5.1 C ABI 扩展

在 `gvfi_native.h` 添加批量接口：

```c
typedef struct gvfi_batch_frame_input {
    const void* frame0_data;
    const void* frame1_data;
    double timestamp;
} gvfi_batch_frame_input_t;

GVFI_NATIVE_API gvfi_result_t gvfi_process_batch(
    gvfi_handle_t handle,
    const gvfi_batch_frame_input_t* inputs,
    gvfi_frame_t* outputs,
    uint32_t batch_size
);
```

### 5.2 Python 绑定

在 `native_library.py` 添加批量方法：

```python
def process_batch(self, frame_pairs: list[tuple[Frame, Frame, float]]) -> list[Frame]:
    # ctypes 数组构造
    # 调用 gvfi_process_batch
    # 返回批量结果
```

### 5.3 Backend 集成

在 `NativeInterpolatorBackend.process_directory()` 中：

```python
# 当前：for 循环逐帧处理
# 改为：分批处理，每批 16 帧
for batch_start in range(0, output_count, BATCH_SIZE):
    batch_end = min(batch_start + BATCH_SIZE, output_count)
    batch_frames = prepare_batch(batch_start, batch_end)
    batch_results = self.lib.process_batch(batch_frames)
    write_batch_results(batch_results)
```

---

## 6. C6.3 PoC 实施检查清单

- [ ] 实现 `BatchRifeWorker` C++ 类
- [ ] 实现 C++ 单元测试 `test_batch_rife.cpp`
- [ ] 实现 Python benchmark `test_c63_batch_poc.py`
- [ ] 运行 baseline vs batch 性能对比（batch_size = 4, 8, 16, 32）
- [ ] 验证正确性（bit-exact / MAE / PSNR / SSIM）
- [ ] 验证稳定性（10 次运行，无内存泄漏）
- [ ] 生成性能报告 `docs/native/native-batch-submission-poc.md`
- [ ] 评估是否值得进入 C6.4 生产集成

---

## 7. 总结

**核心洞察**：

当前 Native RIFE 实现的瓶颈之一是 **GPU submit 粒度过细**（每帧一次），导致 CPU-GPU 同步开销和 Vulkan driver overhead 成为瓶颈。通过将多帧的 Vulkan 命令记录到单个 `VkCompute` 并一次性提交，可以：

1. 消除帧间 CPU-GPU 同步延迟
2. 减少 Vulkan driver 调用次数
3. 提高 GPU 流水线利用率

**技术可行性**：

- ncnn 的 `VkCompute` 设计支持批量记录命令
- RIFE 网络是无状态的，可以复用推理流程
- 无需修改 ncnn 核心或 RIFE 实现

**下一步行动**：

开始实现 C6.3 PoC，先在独立的 C++ 测试中验证批量提交的性能增益，再决定是否集成到生产代码。
