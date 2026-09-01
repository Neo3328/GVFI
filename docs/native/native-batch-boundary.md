# Phase D3 — Native Batch Call-Boundary Optimization

> 日期:2026-08-19
> 范围:仅 `NativeInterpolatorBackend` 调用边界优化;未改 GUI / FFmpeg / 编码器 / RifeCLIBackend / RIFE 模型 / ncnn / RIFE Warp / 默认 backend_mode;CLI fallback 保留。
> 对应:`docs/phase-d-plan.md` 第三节(D3,原 Phase C6)。

---

## 1. 优化前:逐帧调用问题

`NativeInterpolatorBackend.process_directory()`(优化前)对每个插值输出:

```
for output_index in range(output_count):
    left, right, fraction = map_native_directory_sample(...)
    result = self.process_frames(Frame0, Frame1, timestamp=fraction)   # ← 每帧 1 次 Python→ctypes→C++
    cv2.imwrite(output, ...)                                            # ← 每帧 1 次 PNG 写
```

问题:
- **每插值帧 1 次 Python→ctypes→DLL 调用**(1080p 视频每秒目标 48 帧 → 每秒 45+ 次调用);
- 每次调用都重建 `Frame`、转换像素、分配输出缓冲;
- 每次调用都在 GPU 上单帧 submit + wait,无法复用 command buffer;
- 输入帧 `cache.clear()` 导致**每帧重复读盘**(24 帧输入在 47 输出时读 48 次)。

## 2. 批量接口设计

### 2.1 已有批量 ABI(来自 C6.4/C6.5,此前未接入生产路径)

- **C 头**:`native/include/gvfi_native.h` → `gvfi_process_batch(handle, frames0[], frames1[], timestamps[], outputs[], batch_size)`
- **C++ 实现**:`native/src/gvfi_native.cpp` → `NcnnVulkanBackend::processBgrBatch()` → `RIFE::process_v4_batch()`(单 VkCompute / 单 submit_and_wait,算法不变)
- **ctypes 绑定**:`gvfi_runtime/native_library.py` → `NativeLibraryLoader.process_batch(frames0, frames1, timestamps) -> (result, frames_out)`

### 2.2 接入策略(`interpolator_backend.py`)

`process_directory()` 重写为三阶段:

1. **映射一次**:`map_native_directory_sample()` 为全部 `output_count` 输出生成 `(left, right, fraction, output_index)`;
2. **直通与插值分离**:
   - `right == left` 或 `fraction ≈ 0` → 直通复制源帧(不推理,不占 GPU);
   - 其余 → 进入**单个**批量调用(同一场景尺寸一致;每个输出保留自己的 timestep);
3. **有界 LRU 帧缓存**:每输入帧最多读盘一次(`png_read_count == input_count`)。

关键不变式:
- 帧顺序:输出按 `output_index` 顺序写盘,批量内按相同顺序;`frame_index`/`timestamp` 由映射填充;
- **禁止跨场景传递帧**:每个 `process_directory` 调用即一个场景;调用之间无共享帧状态(backend 常驻但帧数据不跨场景);
- 批量不可用(异常)时回退逐帧:保留原 `process_frames()` 路径,行为与优化前逐帧一致。

## 3. 调用次数变化(实测,24 帧输入 → 47 输出)

| 指标 | 优化前(逐帧) | 优化后(批量) |
|------|-------------|-------------|
| Python→Native 调用次数 | 23 次/场景(每插值帧 1 次) | **1 次/场景** |
| PNG 读取次数 | 48 次(缓存只留 1 帧) | **24 次**(=输入帧数,LRU) |
| PNG 写入次数 | 47 次 | 47 次(不变) |
| GPU submit | 23 次(每帧 1 次 submit+wait) | **1 次**(process_v4_batch 单 submit) |

> 注:47 输出中 23 个为插值(24 个整数位置帧直通),故优化前调用 23 次而非 45 次。

## 4. 性能对比(固定视频 A/B,3 轮)

测试:`tests/test_c6_ab_bench.py`
- 输入:`p0_src_1080p24_audio.mp4`(SHA-256 校验,1920×1080,24fps,24 帧)
- CLI:`backend_mode=cli`, `pipeline_mode=disk`, `-j 2:4:4`, `-g 0`
- Native:`backend_mode=native`, `pipeline_mode=disk`, `1:2:2`, `-g 0`
- 只测 RIFE 阶段(`process_directory`),排除解码/编码

| 轮次 | CLI 总耗时 | Native 总耗时 | 比值 | Native 调用数 | PSNR(CLI vs Native) |
|------|-----------|--------------|------|--------------|---------------------|
| R1 | 2.126s | 2.181s | 0.97x | 1 | 24.52 dB |
| R2 | 2.156s | 2.268s | 0.95x | 1 | 24.52 dB |
| R3 | 2.191s | 2.197s | 1.00x | 1 | 24.52 dB |

**结论**:优化前 Native 慢 2–3 倍 → 优化后 **Native ≈ CLI(0.95–1.00x)**,调用次数从 23 降到 1,PNG 读从 48 降到 24。

> 注:PSNR 24.52dB 是 CLI 与 Native **映射差异**导致(CLI 用 rife 自身时序、Native 用 `map_native_directory_sample`),不是批量引入的回归;批量 vs 逐帧在相同映射下像素级一致(见 §5)。

## 5. 输出一致性

`tests/test_c6_batch_boundary.py`:
- **批量 vs 逐帧像素级一致**:同一映射下 31 帧全同(`np.array_equal`),帧数、顺序、`frame_index`、`timestamp` 均一致;
- 映射数学不变量:首输出采样帧 0、末输出采样末帧、left 单调、fraction ∈ [0,1);
- 统计计数:`native_batch_count=1`、`native_frame_count=插值数`、`python_to_native_call_count=1`、`png_read=input_count`、`png_write=output_count`。

## 6. 稳定性结果(10 任务连续)

`tests/test_c6_stability.py` — 完整 RIFE 阶段 10 次连续任务(每次 24→47 帧):

| 指标 | 结果 |
|------|------|
| 成功 | **10/10** |
| 崩溃 | 0 |
| Vulkan 错误 | 0 |
| 模型重复加载错误 | 0 |
| 帧丢失 | 0(每任务 47/47) |
| 顺序错误 | 0 |
| NaN/Inf 帧 | 0 |
| 推理时间 | min=0.974s max=1.050s avg=1.012s(波动 <8%) |
| 每任务批量调用 | 1(全部任务) |

## 7. 统计指标(Phase D3 新增)

`NativeInterpolatorBackend` 新增 `stats()` / `reset_stats()`,`RifePipelineStats` 新增累计字段,任务日志 `RIFE PIPELINE:` 输出:

```
native_batch_count=1
native_frame_count=23
python_to_native_call_count=1
png_read_count=24
png_write_count=47
native_inference_time=0.999s
native_total_time=2.197s
```

每个 `_run_rife` 场景后累计一次并 `reset_stats()`,多场景任务自动汇总。

## 8. 失败处理(fallback 语义不变)

Native 初始化 / 模型加载 / forward 失败时(`main.py::_switch_to_cli`):

```
⚠️ NATIVE BACKEND FAILED — FALLING BACK TO CLI
  reason: <错误>
  Native backend will not be used for this task.
BACKEND CONFIG:
mode=cli
requested_backend=native
active_backend=cli
fallback=native_to_cli
reason=<错误>
```

- 不静默 fallback;失败阶段与原因可见;
- 每任务仅 fallback 一次;CLI 再失败则正常报错;
- `backend_mode=cli` 行为完全不变。

## 9. 涉及文件

| 文件 | 改动 |
|------|------|
| `ECCV2022-RIFE/gvfi_runtime/interpolator_backend.py` | 批量接入 + LRU 缓存 + 统计 |
| `ECCV2022-RIFE/gvfi_runtime/rife_cli_pipeline.py` | `RifePipelineStats` 新增 Native 统计字段 |
| `ECCV2022-RIFE/main.py` | `_run_rife` 每场景累计 Native 统计 |
| `ECCV2022-RIFE/tests/test_c6_batch_boundary.py` | 新增:映射/分组/统计/像素一致性 |
| `ECCV2022-RIFE/tests/test_c6_ab_bench.py` | 新增:固定视频 3 轮 A/B |
| `ECCV2022-RIFE/tests/test_c6_stability.py` | 新增:10 任务连续稳定性 |

## 10. 未进入范围(明确不做)

- memory pipeline、GPU decode/encode、多 GPU、模型替换、默认 backend 切换(均留待后续 Phase)。

## 11. 结论

- Python→Native 调用次数:23/场景 → **1/场景**(−96%);
- PNG 读取:48 → **24**(−50%);
- 性能:Native 慢 2–3 倍 → **与 CLI 持平**(0.95–1.00x);
- 输出:帧数、顺序、像素级一致;10/10 稳定性通过;
- CLI fallback 与 `backend_mode=cli` 行为完全不变。
