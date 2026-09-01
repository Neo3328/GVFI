# C9.2-B — IFRNet Isolated GPU Smoke

**Date:** 2026-08-12  
**Phase:** Isolated GPU smoke only · **not** C9.2-C · **not** A/B · **not** metrics · **not** visual QA  
**Prior:** C9.2-A `G-IFRNET = PASS-WITH-UNKNOWN` (`docs/c92-ifrnet-readiness-check.md`)  
**Question answered:** Can the public IFRNet ncnn/Vulkan path complete a minimal legal GPU forward on this RTX 5060 host?

**Production preserved:**  
- Modified GVFI: **NO**  
- Modified `backend_mode`: **NO** (`cli`)  
- Modified RIFE: **NO** (`rife-v4.6`)

**Disclaimer:** Weight commercial redistrib remains **[UNKNOWN]** (unchanged from C9.2-A). Smoke success ≠ commercial clearance ≠ quality win vs RIFE.

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Decision box

| Gate | Result |
|------|--------|
| **F0 Smoke** | **PASS** |
| **F1 Minimal inference** (multi-frame / video clip validation) | **NOT RUN** (out of this phase) |
| **C9.2-B Verdict** | **GO** (smoke only — eligible for a later authorized offline A/B; **do not** auto-start C9.2-C) |

| Tag | Meaning used here |
|-----|-------------------|
| **[PASS]** | Gate criterion met with evidence |
| **[FAIL]** | Gate criterion failed |
| **[CONFIRMED]** | Fact verified from log/file |
| **[UNKNOWN]** | Not established / not licensed / not measured as pure GPU kernel time |

---

## F0 Gate checklist

| ID | Criterion | Result |
|----|-----------|--------|
| F0-1 | ncnn/Vulkan executable starts | **[PASS]** `-h` prints usage |
| F0-2 | RTX 5060 recognized by Vulkan/ncnn | **[PASS]** log: `[0 NVIDIA GeForce RTX 5060 Laptop GPU]` |
| F0-3 | Public IFRNet model loads | **[PASS]** run completes with model `IFRNet_Vimeo90K` |
| F0-4 | Legal inputs | **[PASS]** PNG pair from public p0 source (source file not modified) |
| F0-5 | ≥1× 2× mid-frame inference | **[PASS]** `timestep = 0.500000` → `done` |
| F0-6 | Output exists, correct size | **[PASS]** 640×360 and 1920×1080 RGB; not all-black |
| F0-7 | GPU inference time recorded | **[PASS]** wall-clock recorded (CLI does not print pure kernel ms) |

---

## Environment

| Item | Value | Tag |
|------|-------|-----|
| Isolated root | `D:\GVFI-deps\ifrnet-c92b\` | **[CONFIRMED]** |
| Port release | `ifrnet-ncnn-vulkan` tag **20220720** | **[CONFIRMED]** |
| Port commit (release target) | `3592a70355ec011fe7cefb3a9ba08b63d82a2b6d` | **[CONFIRMED]** (C9.2-A / GitHub release) |
| Official IFRNet (reference only) | `ltkong218/IFRNet` MIT · HEAD not required for binary smoke | **[CONFIRMED]** prior |
| Runtime | Native Windows EXE (no Python for inference) | **[CONFIRMED]** |
| Python | Used only for PNG size/stats (host 3.12) | **[CONFIRMED]** |
| GPU | NVIDIA GeForce RTX 5060 Laptop GPU | **[CONFIRMED]** |
| Driver | 610.88 | **[CONFIRMED]** |
| Vulkan / ncnn device | GPU index **0** = RTX 5060; also lists Intel iGPU as 1 | **[CONFIRMED]** |
| Model | `IFRNet_Vimeo90K` (`ifrnet.param` + `ifrnet.bin`) | **[CONFIRMED]** |
| Model source | GitHub release zip `ifrnet-ncnn-vulkan-20220720-windows.zip` | **[CONFIRMED]** |
| Code license (port) | MIT (bundled `LICENSE`) | **[CONFIRMED]** |
| Weight license / redistrib | Formal commercial SPDX **[UNKNOWN]** (C9.2-A) | **[UNKNOWN]** |

### SHA-256

| File | SHA-256 |
|------|---------|
| `ifrnet-ncnn-vulkan.exe` | `87213F1C4350A521EACF3C07F7E6E3E438501C5C59D37711774DD9A56FB2C196` |
| `IFRNet_Vimeo90K/ifrnet.bin` | `1F01421CBC3918F240AC7212E40F2D3423F61618A3A6434D1F25A32007ABE9CF` |
| `IFRNet_Vimeo90K/ifrnet.param` | `86334EC3A5AA85E4457A364F3169E962267C2D5DADA2FEB6484973D91B762C03` |

---

## Commands (complete)

Working directory: `D:\GVFI-deps\ifrnet-c92b\ifrnet-ncnn-vulkan-20220720-windows`

### Help (F0-1)

```text
.\ifrnet-ncnn-vulkan.exe -h
```

### Smoke 640×360 (cold)

```text
.\ifrnet-ncnn-vulkan.exe -v -0 D:\GVFI-deps\ifrnet-c92b\smoke_in\frame0_640.png -1 D:\GVFI-deps\ifrnet-c92b\smoke_in\frame1_640.png -o D:\GVFI-deps\ifrnet-c92b\smoke_out\mid_640.png -m IFRNet_Vimeo90K -s 0.5 -g 0 -j 1:1:1
```

- Exit: **0**  
- Wall time: **2778 ms** (includes process start / Vulkan init / model load)

### Smoke 640×360 (warm)

```text
.\ifrnet-ncnn-vulkan.exe -v -0 ...\frame0_640.png -1 ...\frame1_640.png -o ...\mid_640_warm.png -m IFRNet_Vimeo90K -s 0.5 -g 0 -j 1:1:1
```

- Exit: **0**  
- Wall time: **960 ms**

### Smoke 1920×1080

```text
.\ifrnet-ncnn-vulkan.exe -v -0 D:\GVFI-deps\ifrnet-c92b\smoke_in\frame0.png -1 D:\GVFI-deps\ifrnet-c92b\smoke_in\frame1.png -o D:\GVFI-deps\ifrnet-c92b\smoke_out\mid_1080.png -m IFRNet_Vimeo90K -s 0.5 -g 0 -j 1:1:1
```

- Exit: **0**  
- Wall time: **1222 ms**

**Timing note:** CLI verbose log does **not** emit a separate “GPU kernel only” millisecond. Values above are **end-to-end wall-clock** of the process for one pair. Treat as **[CONFIRMED]** wall time; pure inference-only ms remains **[UNKNOWN]** without instrumented build.

---

## Inputs / outputs

| Role | Path | Size |
|------|------|------|
| Source video (read-only) | `D:\GVFI-deps\native-video-worker-ab\input\p0_src_1080p24_audio.mp4` | untouched |
| Input0 1080 | `...\smoke_in\frame0.png` | 1920×1080 RGB |
| Input1 1080 | `...\smoke_in\frame1.png` | 1920×1080 RGB |
| Input0 640 | `...\smoke_in\frame0_640.png` | 640×360 RGB |
| Input1 640 | `...\smoke_in\frame1_640.png` | 640×360 RGB |
| Output 640 | `...\smoke_out\mid_640.png` | **640×360** RGB · mean≈126.4 · not black |
| Output 1080 | `...\smoke_out\mid_1080.png` | **1920×1080** RGB · mean≈126.4 · not black |

Log artifacts: `D:\GVFI-deps\ifrnet-c92b\logs\` (`smoke_640.txt`, `smoke_640_warm.txt`, `smoke_1080.txt`, `output_stats.json`, …).

### Verbose GPU recognition excerpt **[CONFIRMED]**

```text
[0 NVIDIA GeForce RTX 5060 Laptop GPU]  queueC=2[8]  queueG=0[16]  queueT=1[2]
...
timestep = 0.500000
...frame0.png ...frame1.png 0.500000 -> ...\mid_1080.png done
```

---

## What this does **not** claim

- No formal A/B vs GVFI RIFE  
- No visual quality ranking  
- No MAE/PSNR/SSIM/LPIPS  
- No “IFRNet better than RIFE”  
- No commercial weight redistrib authorization  
- No production integration  

---

## Verdict

| Item | Value |
|------|-------|
| F0 Smoke | **PASS** |
| F1 Minimal inference (video) | **NOT RUN** |
| C9.2-B Verdict | **GO** |

**Answer to the phase question:** **Yes** — the public IFRNet ncnn/Vulkan Windows build completed legal GPU mid-frame forwards on RTX 5060 (640×360 and 1920×1080).

**Stop here.** Do **not** auto-enter C9.2-C.

**Report path:** `docs/c92-ifrnet-smoke.md`
