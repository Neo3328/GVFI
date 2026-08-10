# 修复记录：BT.709 颜色管线（color pipeline fix）

> 日期：2026-08-10
> 提交：`fix: correct bt709 color pipeline`
> 范围：仅修复输出视频的颜色空间转换与色彩元数据标记。未改动 AI 模型、RIFE 参数、GPU 调度、性能逻辑、GUI 与项目结构。

---

## 1. 原问题描述

输出视频相比原视频出现：**发灰、色彩不准确、饱和度下降、播放器显示颜色异常**。

### 根因分析

完整输出链路：

```
输入视频 (YUV, 通常 BT.709/BT.601)
  → ffmpeg 解码 → raw_frames/%08d.png      (RGB888, full range, 无色彩元数据)   main.py:642-649
  → 去重/场景检测 (svfi_pipeline.py, 仅灰度统计, 不影响颜色)
  → rife-ncnn-vulkan (RGB 进 RGB 出)
  → [可选] realesrgan-ncnn-vulkan (RGB 进 RGB 出)
  → ffmpeg 合成 → libx265 yuv420p           (main.py:686-728，修复前无任何颜色参数)
```

问题出在最后一环：

1. **转换矩阵错配**：PNG 是 RGB 帧，合成时 swscale 执行 RGB→YUV 转换。未指定矩阵时使用默认 **BT.601** 系数，而高清内容的标准是 **BT.709** —— 像素值在编码时就已被错误转换。
2. **缺少色彩标记**：输出容器/码流未写入 `colorspace / color_primaries / color_trc`，ffprobe 显示 `color_space=unknown`，播放器只能按启发式猜测（高清通常猜 BT.709）→ **编码用 601、解码按 709** 的双重错配，表现为发灰、偏色、饱和度下降。
3. **颜色范围**：`yuv420p` 默认 limited(TV) range，本身正确，但因无标记，部分播放器存在误判风险。本次修复显式固定 limited range。

## 2. 修改文件列表

| 文件 | 改动 |
|------|------|
| `ECCV2022-RIFE/main.py` | `VideoWorker._process_file` 的最终合成命令新增 1 个视频滤镜 + 3 个色彩元数据输出选项（+9 行） |

其余文件零改动。插帧流程、模型调用、超分流程、GUI、API 契约均未触碰。

## 3. 修改内容

`main.py` 合成段（`ffmpeg_merge` 构建处，原 715-718 行之间）新增：

```python
# PNG 序列是不带色彩元数据的 RGB 全范围帧；swscale 默认用 BT.601 矩阵
# 转 YUV 且输出不打标记，播放器对高清内容会按 BT.709 猜测 → 发灰/偏色。
# 这里固定按 BT.709 矩阵转换、限定 limited(TV) range，并写入色彩元数据。
ffmpeg_merge.extend([
    "-vf", "scale=out_color_matrix=bt709:out_range=tv",
    "-colorspace", "bt709",
    "-color_primaries", "bt709",
    "-color_trc", "bt709",
])
```

逐项说明：

| 参数 | 作用 |
|------|------|
| `-vf scale=out_color_matrix=bt709` | 让 RGB→YUV 的**像素级转换**使用 BT.709 矩阵（不再走默认 BT.601）。只做矩阵转换，不做缩放 |
| `out_range=tv` | 显式输出 limited(TV) range，杜绝 full/pc range 误用 |
| `-colorspace bt709` | 写入矩阵标记（ffprobe 的 `color_space`，即用户要求的 `matrix=bt709`） |
| `-color_primaries bt709` | 写入色域基色标记 |
| `-color_trc bt709` | 写入传递函数标记 |

该参数块位于编码器参数之前、音频映射之前，对 **H.265 / H.265 10bit / AV1 / ProRes / 带音频合成** 全部分支统一生效。

**关于 HDR**：本管线中间格式为 8-bit PNG，不存在真正的 HDR 数据通路；本次未新增任何 HDR 功能。`H.265 10bit` 分支行为保持不变（`yuv420p10le` + BT.709 SDR 标记，经回归验证正常）。

## 4. 测试结果

测试环境：Linux, ffmpeg 6.1.1, libx265。
固定测试视频：`testsrc2` 生成的 1920x1080@30fps、2 秒、60 帧、BT.709 标记源（含高饱和色块）。
流程完全复刻 `VideoWorker`：同参数抽 PNG → 分别用修复前/后的合成命令编码。

### 4.1 ffprobe 元数据对比

修复前（原命令：`-c:v libx265 -crf 18 -preset medium -pix_fmt yuv420p`）：

```
pix_fmt=yuv420p
color_range=tv
color_space=unknown        ← 矩阵未标记（问题核心）
color_transfer=bt709
color_primaries=bt709
```

修复后（新增 scale 滤镜 + 3 个色彩标记）：

```
pix_fmt=yuv420p
color_range=tv             ← limited range，符合要求
color_space=bt709          ✓
color_transfer=bt709       ✓
color_primaries=bt709      ✓
```

与预期目标完全一致。

### 4.2 像素级颜色准确性（PSNR vs 原始 PNG 帧）

模拟真实播放器行为（对输出按 BT.709 解码），与管线内的原始 PNG 帧逐像素对比：

| 输出 | PSNR R | PSNR G | PSNR B | PSNR avg |
|------|--------|--------|--------|----------|
| 修复前（601 转换 + 无标记） | 44.17 | **20.70** | 43.29 | **25.43 dB** |
| 修复后（709 转换 + 709 标记） | 39.58 | 40.84 | 38.83 | **39.67 dB** |

- 修复前 G 通道 PSNR 仅 20.7 dB（绿色通道严重失真，典型的 601/709 矩阵错配特征），整体色偏明显。
- 修复后三通道均衡（39~41 dB），剩余误差仅为 x265 CRF18 正常量化损失。
- **平均提升 +14.2 dB**，颜色准确性恢复到编码器量化极限。

### 4.3 全部分支回归

| 分支 | 结果 |
|------|------|
| H.265 8bit（API 默认路径） | ✓ `yuv420p / bt709 / tv` |
| H.265 10bit | ✓ `yuv420p10le / bt709 / tv`，未被破坏 |
| AV1 (libsvtav1) | ✓ `yuv420p / bt709 / tv` |
| ProRes 422 | ✓ 正常编码，`color_space=bt709`（ProRes 无 range 标记属正常） |
| 带音轨合成（`-map 0:v:0 -map 1:a:0 -shortest`） | ✓ 视频 bt709 + 音频 AAC 正常 |

### 4.4 未变更确认

- 插帧（rife-ncnn-vulkan 调用参数）、超分（ESRGAN 调用参数）、去重/场景检测、进度上报、GUI、API 参数契约：全部未改动（`git diff` 仅 `main.py` +9 行 + 本文档）。

---

Developed by Mr. Gong
Copyright © 2026 Mr. Gong. All Rights Reserved.
