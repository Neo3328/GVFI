# C8.1 — Real Steam SVFI vs GVFI CLI (black-box A/B)

**Phase:** C8.1 (black-box only)  
**Date:** 2026-08-12  
**Constraint:** No reverse/crack/DRM bypass; no GVFI production code changes; no C8.2.

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Purpose

Compare **Steam official SVFI** OLS output to an already-produced **GVFI production CLI** output on the same short clip, using only public settings, I/O, logs, performance, and final video metrics.

---

## Install / version / public settings

| Item | Value | Status |
|------|--------|--------|
| SVFI path | `D:\Steam\steamapps\common\SVFI` | Confirmed |
| Steam AppID | `1692080` | Confirmed (`steam_appid.txt`) |
| `SVFI.ini` version | `8.0.14 Professional - Steam` | Confirmed |
| OLS self-report | `OLS: 12.0.3 <-> 8.0.9` | Confirmed (run logs) |
| Mux metadata description | `SVFI 8.0.9 Professional - Steam` | Confirmed (run5 encode log) |
| Matched config | `D:\GVFI-deps\native-video-worker-ab\c81_ab\c81_svfi_ab.ini` (UTF-8 no BOM) | Confirmed |
| `target_fps` | 48 | Confirmed |
| `rife_exp` | 1 | Confirmed |
| `use_sr` | false | Confirmed |
| `vfi_algo` / `vfi_model` | `GmfSs` / `GmfSs_pg_104` | Confirmed (ini + load log) |
| Encode | `render_encoder="H265,8bit"`, `use_crf=true`, `render_crf=18`, preset `medium`, CPU encode | Confirmed |
| Output ext | mp4 | Confirmed |
| Dedup (public) | `remove_dup_mode=4`, `remove_dup_threshold=1.5`, `is_no_dedup_render=true` | Confirmed from ini |
| Scene cut (public) | `is_no_scdet=false`, thresholds present | Confirmed from ini |
| GPU used (SVFI log) | NVIDIA GeForce RTX 5060 Laptop GPU | Confirmed (run5) |
| GVFI VFI backend for prior CLI run | RIFE ncnn/CLI production path (per C8.0 audit; this phase did not re-run GVFI) | Confirmed from prior repo audit / prior success |
| Exact GVFI CLI argv / encoder CRF for `gvfi_cli` artifact | Not re-captured in this session | **UNKNOWN** |
| Subjective looks-better judgment | No human visual review in this run | **UNKNOWN** |

**Input:** `D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4` — 1920x1080, 24 fps, 24 frames (SVFI auto-detect confirmed).

**A/B dir:** `D:\GVFI-deps\native-video-worker-ab\c81_ab\`

---

## Run results

| Run | Side | Wall time | Exit | Result | Evidence |
|-----|------|-----------|------|--------|----------|
| Prior | GVFI CLI | ~6.05 s (reported earlier; not re-timed here) | success (prior) | Output present | `gvfi_cli\p0_src_1080p24_audio_enhanced.mp4` (2,323,260 B, mtime 11:47:05) |
| hung OLS | SVFI | n/a | hung overnight | Killed PID 41744 | Process check 2026-08-12 |
| run4 | SVFI OLS | **19.45 s** | fail (Steam API) | **BLOCKED** | `svfi_run4.err`: `Failed to initiate Steam API` / `SteamNotLoadedException` (Steam client was running) |
| GUI warmup | Steam | — | — | `SVFI.Professional.exe` started | `steam -applaunch 1692080` |
| run5 | SVFI OLS | **77.76 s** wall; OLS reports **0:01:08.37** | finished (ExitCode null but Program Finished) | **SUCCESS** | `svfi_run5.err`; Steam Stats OK after GUI; output mp4 written |

### BLOCKED evidence (run4)

With Steam running (`steam.exe` present) but **without** SVFI GUI session first:

- `LicenseModule`: `License expired` then `Failed to initiate Steam API.`
- `SteamNotLoadedException: Steam not loaded, please add SVFI to the whitelist or disable Anti-virus software, and restart Steam`

### Unblock (legitimate, no DRM bypass)

1. Start Steam client.
2. Launch owned app: `steam -applaunch 1692080` → `SVFI.Professional.exe`.
3. Retry OLS → `Steam Stats successfully retrieved!` → GmfSs model load → encode complete.

**Note:** A local license HTTP check to `127.0.0.1:7897` timed out during run5; run still proceeded after Steam purchase/DLC checks (`DLC 1718750` / `1813870` Status: True).

### SVFI outputs located

| Path | Role |
|------|------|
| `c81_ab\svfi_out\p0_src_1080p24_audio-48.000fps.GmfSs_pg_104.D3.DBG.000004.mp4` | Final deliverable (**1,319,345 B**) |
| `c81_ab\svfi_dump\p0_src_1080p24_audio_c81ab00000004\chunk-001-00000000-00000048.mp4` | Chunk dump |

Task id used for successful run: `c81ab00000004` (run4 used `c81ab00000003` and failed before render).

---

## ffprobe comparison

| Field | GVFI CLI output | SVFI OLS output | Tag |
|-------|-----------------|-----------------|-----|
| Resolution | 1920x1080 | 1920x1080 | [SAME] |
| Frame rate | 48/1 | 48/1 | [SAME] |
| Video frames (`nb_frames`) | 48 | 48 | [SAME] |
| Duration | 1.000 s | 1.000 s | [SAME] |
| Video codec | hevc (Main), yuv420p | hevc (Main), yuv420p | [SAME] |
| Audio | aac LC, 44100 Hz, mono | aac LC, 44100 Hz, mono | [SAME] |
| Audio packets (`nb_frames`) | 44 | 45 | [DIFF] |
| File size | 2,323,260 B (~18.6 Mbps) | 1,319,345 B (~10.6 Mbps) | [DIFF] |
| Container duration vs audio | video 1.000 / audio 0.998 | video 1.000 / audio 1.000 | [DIFF] (minor) |

SVFI write path (public log): `libx265` CRF 18, `preset medium`, intermediate `format=yuv444p10le` then output `yuv420p`.

---

## Pixel metrics (decode to PNG to OpenCV)

Decoded 48 PNGs each under `decoded_gvfi/` and `decoded_svfi/`. Metrics treat **GVFI vs SVFI** as two outputs of the same input (not vs ground-truth intermediate frames).

| Metric | Value |
|--------|-------|
| Frames compared | 48 |
| MAE mean / min / max | 1.6758 / 0.6736 / 2.8703 |
| PSNR mean / min / max (dB) | 32.322 / 25.712 / 41.278 |
| SSIM mean / min / max | 0.97662 / 0.95699 / 0.99702 |
| Max pixel abs-diff (global) | 255 |
| Max-diff mean across frames | 192.52 |
| Identical consecutive frames (GVFI) | none |
| Identical consecutive frames (SVFI) | none |

Worst PSNR frames (most divergent): **26, 38, 30, 36, 31** (mid-sequence).  
Best PSNR frames: **1, 48, 47, 45, 3** (near endpoints).

JSON dump: `c81_ab\c81_frame_metrics.json`.

**Interpretation (black-box):** Endpoints agree more than mid frames; divergence concentrates where interpolators synthesize content. This is consistent with **different public VFI algorithms**, not proof of a single root cause.

---

## Comparison table (strict tags only)

每项仅标记 `[SAME]` / `[DIFF]` / `[UNKNOWN]`。不得猜测。

| 项目 | GVFI | 官方 SVFI | 判定 | 证据 |
|------|------|-----------|------|------|
| 输入 | `p0_src_1080p24_audio.mp4` 1920×1080 @24, 24 frames | 同文件；OLS 检测 24fps / 24 frames / 1920×1080 | [SAME] | 共享输入；`svfi_run5` 媒体探测 |
| 输出 FPS | 48/1，`nb_frames=48` | 48/1，`nb_frames=48` | [SAME] | ffprobe 两侧 |
| 插值算法 | RIFE（生产 `backend_mode=cli` / ncnn） | **GmfSs**（公开 `vfi_algo`） | [DIFF] | C8.0 + `c81_svfi_ab.ini` + run5 加载日志 |
| 模型 | RIFE v4.6 路径（C8.0 / 既有 CLI 产物） | `GmfSs_pg_104` | [DIFF] | 公开模型名不同；非同族 |
| Scene | 生产有 hist scdet（C8.0）；本产物是否开启未重验 | `is_no_scdet=false`，阈值 12/80 等 | [UNKNOWN] | 1s 短片无切镜审片；GVFI argv 未重抓 |
| Dedupe | 生产有 MAD dedupe 选项（C8.0）；本产物未重验 | `remove_dup_mode=4`, thr 1.5；两侧无连续全同帧 | [UNKNOWN] | knobs 存在，本 clip 未证明生效差异 |
| SR | 既有 CLI 产物预期关闭（argv 未重验） | `use_sr=false` | [UNKNOWN] | SVFI 确认关；GVFI 本会话未重抓 |
| Encode | HEVC Main yuv420p；2.32 MB | HEVC Main yuv420p；libx265 CRF18 medium；1.32 MB | [DIFF] | ffprobe + 体积；SVFI 有 yuv444p10le 中间路径 |
| Color | 生产 encode 常打 BT.709（C8.0）；本产物未逐项重验 | 输入 color tags 空；警告可能色偏 | [UNKNOWN] | SVFI warning 有据；GVFI tags 未重 dump |
| Frame mapping | 48 输出帧 / 1s；中段烧录时间码常与 SVFI 错位 | 同 48 帧；烧录 OSD 时间/帧号多处与 GVFI 不同 | [DIFF] | 容器帧数 [SAME]；**片内时间轴映射见视觉评审 [DIFF]**（`docs/c81-visual-frame-review.md`） |

补充观测：

| Aspect | Tag | Notes |
|--------|-----|-------|
| Audio AAC mono 44.1k | [SAME] | 两侧均有 |
| Audio packet count | [DIFF] | 44 vs 45 |
| Pixel identity | [DIFF] | MAE~1.68, PSNR~32.3, maxdiff 255 |
| Wall-clock | [DIFF] | GVFI ~6 s vs SVFI ~68–78 s |
| 主观观感（运动/人脸/细线/纹理/ghost/warp） | [UNKNOWN] | 本阶段未做人眼审片 |

---

## P0 / P1 / P2 — why SVFI may look better (evidence-based)

Do **not** assume “RIFE model version” is the cause. Rank by black-box evidence from this run.

### P0 — 模型 / 插值算法差异（最高证据）

- SVFI 公开配置与 run5 日志加载 **GmfSs / `GmfSs_pg_104`**（GMF+SoftSplat 族），**不是** 与 GVFI 同跑的 RIFE。
- GVFI 生产默认是 **RIFE ncnn CLI**（C8.0）。
- 像素：端点 PSNR ~40 dB，中间帧可低至 ~26 dB —— 与“中间插值帧算法不同”一致。
- 因此“SVFI 看起来更好”**首先**应归因于**公开可见的算法族不同**，而不是假设“同模型下 RIFE 实现差”。

### P1 — frame mapping / scene handling（视觉补充后升为**强 P1**）

- 容器级：输出帧数与时长仍 [SAME]；无连续全同帧。
- **烧录 OSD：** 同 output index 上时间码/源帧号多处不一致（详见 `docs/c81-visual-frame-review.md`）→ **frame timing [DIFF]**。
- Scene/dedupe 仍无法用本 1s 片证明；但 **时间映射差异已不再是 UNKNOWN**。
- 未做按烧录时间对齐的二次比较前，不把同 index 伪影差写成“模型更好”。

### P1 — 后处理 / SR

- SVFI 本 A/B：`use_sr=false`（已确认）。
- GVFI 本产物 SR 开关 **未重验** → 不能把观感差归因于 SR。
- promote 类参数在 ini 中存在，但本 run **未证明**它们驱动了输出差异。

### P1 — color pipeline

- SVFI 明确警告输入 color metadata 为空。
- 两侧 HEVC 体积差大；SVFI 日志有 `yuv444p10le` 中间路径。
- 足以造成观感差，但 **未与同 VFI 对照隔离**，故作 P1 候选而非唯一主因。

### P2 — encode

- 同为 HEVC 8-bit 4:2:0，但码率/体积 [DIFF]（2.32 MB vs 1.32 MB）。
- 可解释锐度/banding 差异，通常次于算法族差异。

### P2 — 其他

- 运行时差（~6 s vs ~78 s）主要是加载/实现路径，不直接等于画质。
- 未做 DRM/私有权重逆向；私有实现细节标 UNKNOWN，不进入因果断言。

**Not ranked as proven causes here:** Steam DRM internals, undocumented private post-filters beyond publicly named model id (would require C8.2+ / non-black-box work).

---

## Artifacts checklist

| Artifact | Path |
|----------|------|
| Report | `docs/c81-real-svfi-ab.md` (this file) |
| SVFI config | `...\c81_ab\c81_svfi_ab.ini` |
| GVFI video | `...\c81_ab\gvfi_cli\p0_src_1080p24_audio_enhanced.mp4` |
| SVFI video | `...\c81_ab\svfi_out\p0_src_1080p24_audio-48.000fps.GmfSs_pg_104.D3.DBG.000004.mp4` |
| BLOCKED log | `...\c81_ab\svfi_run4.err` |
| SUCCESS log | `...\c81_ab\svfi_run5.err` |
| Frame metrics | `...\c81_ab\c81_frame_metrics.json` |
| Visual frame review | `docs/c81-visual-frame-review.md` |
| Visual assets | `...\c81_ab\visual_review\` |

---

## Status summary

- **SVFI produced video:** YES (after Steam GUI warm-up; run4 BLOCKED by Steam API).
- **Key metrics:** both 48x1080p@48 HEVC+AAC; MAE~1.68; PSNR~32.3 dB; SSIM~0.977; SVFI wall ~78 s vs GVFI ~6 s.
- **Primary documented difference:** public VFI algo **GmfSs** vs GVFI **RIFE**.
- **Visual supplement:** same out-index **burned-in timing often [DIFF]**; ghost/warp morphology [DIFF] but not proof of “SVFI better” until time-aligned.
- **Blocker (resolved for A/B):** OLS requires Steam API init that failed until `SVFI.Professional.exe` was launched via Steam; AV whitelist message may still apply on other machines.
