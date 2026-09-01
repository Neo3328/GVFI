# C9.2-A — IFRNet Readiness Check (License · Weights · ncnn/Vulkan)

**Date:** 2026-08-12  
**Phase:** Desk research + static host observation only · **not** C9.2-B · **not** A/B · **not** C10  
**Trigger:** C9.1-B FILM GPU Smoke **FAIL** (`docs/c91-film-ab.md`) — do **not** continue FILM env work  
**Scope:** Official public sources + static local Vulkan/GPU observation  
**Forbidden performed:** no weight download · no compile · no install · no GPU smoke · no benchmark · no A/B · no GVFI code change  

**Production preserved:** `backend_mode=cli` · RIFE CLI `rife-v4.6`

**Disclaimer:** Not legal advice. Weight redistribute clearance may still need counsel even when repo SPDX is MIT.

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## 1. Executive Summary

| Question | Answer |
|----------|--------|
| Does IFRNet qualify for a **controlled offline A/B** vs RIFE? | **G-IFRNET = PASS-WITH-UNKNOWN** |
| Why not plain PASS? | Pretrained **weights** (Dropbox `.pth` and ncnn-converted `.bin`) lack a **separate explicit SPDX / redistrib statement** |
| Why not FAIL? | Official code MIT; third-party ncnn/Vulkan port MIT; **no** NC / Research-Only ban found; public Windows Vulkan binaries + preconverted models + documented 24→48 path; host already has working Vulkan + RTX 5060 enumeration (GVFI RIFE ncnn path proven elsewhere) |
| Product ship? | **Not cleared** — gate is offline A/B eligibility only |
| Enter C9.2-B? | **Yes, allowed** when explicitly instructed (isolated smoke only) |
| vs FILM on this machine | IFRNet’s ncnn/Vulkan route **avoids** the TF 2.x / CUDA 11 stack that blocked FILM — stronger **engineering** candidate here; quality still **[UNKNOWN]** |

**Commercial class (aligned with C9):** **R1**  
**Offline engineering class:** **E0** (portable Windows release) · GVFI-shaped product adapter later **E1**

---

## 2. Official IFRNet source

| Field | Fact | Tag |
|-------|------|-----|
| Name | IFRNet: Intermediate Feature Refine Network for Efficient Frame Interpolation | **[CONFIRMED]** |
| Paper | CVPR 2022 · arXiv:2205.14620 | **[CONFIRMED]** |
| Authors | Lingtong Kong et al. | **[CONFIRMED]** |
| Official GitHub | https://github.com/ltkong218/IFRNet | **[CONFIRMED]** |
| Default branch / HEAD | `main` @ `b117bcafcf074b2de756b882f8a6ca02c3169bfe` (2024-02-19) | **[CONFIRMED]** |
| Stack | Official PyTorch demos (`demo_2x.py`, `demo_8x.py`) | **[CONFIRMED]** |
| Core IO | Two frames → one intermediate (`embt` / timestep tensor) | **[CONFIRMED]** |
| Official link to ncnn | README section “ncnn Implementation of IFRNet” → `nihui/ifrnet-ncnn-vulkan` | **[CONFIRMED]** (linked, not authored by Kong) |

---

## 3. ncnn/Vulkan source

| Field | Fact | Tag |
|-------|------|-----|
| Repo | https://github.com/nihui/ifrnet-ncnn-vulkan | **[CONFIRMED]** |
| Author | **nihui** (Shuizhuyuanluo) — same lineage as many `*-ncnn-vulkan` tools | **[CONFIRMED]** |
| Official? | **No** — third-party port | **[CONFIRMED]** |
| Fork of IFRNet? | **No** (`fork: false`) — independent implementation using ncnn | **[CONFIRMED]** |
| Recognized by upstream? | Yes — linked from official IFRNet README | **[CONFIRMED]** |
| License field | MIT | **[CONFIRMED]** |
| HEAD / release commit | `3592a70355ec011fe7cefb3a9ba08b63d82a2b6d` (2022-07-20 “update ncnn”) | **[CONFIRMED]** |
| Release | `20220720` — Windows / Ubuntu / macOS zips | **[CONFIRMED]** |
| Windows asset | `ifrnet-ncnn-vulkan-20220720-windows.zip` (~110 MB) | **[CONFIRMED]** |
| README status note | “early development stage, it may bite your cat” | **[CONFIRMED]** soft maturity risk |
| Vulkan? | Yes — project name + `-g` GPU id; build docs require Vulkan SDK | **[CONFIRMED]** |
| NVIDIA? | README: Intel/AMD/**Nvidia** GPU packages; driver upgrade guidance includes NVIDIA | **[CONFIRMED]** docs |
| Preconverted models in repo | `models/IFRNet_{,S_,L_}{Vimeo90K,GoPro}/ifrnet.param` + `ifrnet.bin` | **[CONFIRMED]** |
| Example sizes | `IFRNet_Vimeo90K/ifrnet.bin` ≈ 10.5 MB | **[CONFIRMED]** listing |
| Self-convert required for smoke? | **No** if using release/repo ncnn packs | **[CONFIRMED]** |
| If converting from PyTorch | Would be PyTorch → (tooling) → ncnn `.param/.bin`; **not** required for first offline path | **[INFERENCE]** |

**Hard rule:** Port MIT ≠ automatic clearance of underlying pretrained weight redistrib.

---

## 4. Code license (official IFRNet)

| Item | Finding | Tag |
|------|---------|-----|
| SPDX | MIT | **[CONFIRMED]** |
| Copyright | Copyright (c) 2022 Lingtong Kong | **[CONFIRMED]** |
| NC / Research-Only / Academic-Only | **Not present** in LICENSE | **[CONFIRMED]** |
| Commercial use of **source code** | MIT permits use/modify/distribute/sell under MIT conditions | **[CONFIRMED]** for code |

---

## 5. Port license (`ifrnet-ncnn-vulkan`)

| Item | Finding | Tag |
|------|---------|-----|
| SPDX | MIT | **[CONFIRMED]** |
| Copyright | Copyright (c) 2022 nihui | **[CONFIRMED]** |
| Scope | Port **software** (C++/ncnn glue, CLI) | **[CONFIRMED]** |
| Bundled ncnn models in release | Treated as redistributed converted weights — **separate** from port code MIT | **[UNKNOWN]** weight column |

---

## 6. Weight license

| Question | Answer | Tag |
|----------|--------|-----|
| Official pretrained weights? | **Yes** — Dropbox folder linked from README | **[CONFIRMED]** |
| Dropbox URL (README) | `https://www.dropbox.com/sh/hrewbpedd2cgdp3/AADbEivu0-CKDQcHtKdMNJPJa?dl=0` | **[CONFIRMED]** |
| Variants (official naming) | IFRNet / IFRNet_L / IFRNet_S · Vimeo90K (2×) and GoPro (8×) | **[CONFIRMED]** |
| Separate weights LICENSE / SPDX? | **Not found** in official LICENSE/README | **[UNKNOWN]** |
| Explicit commercial grant for weights? | **Not found** | **[UNKNOWN]** |
| Explicit commercial ban (NC / no redistrib)? | **Not found** | **[CONFIRMED]** no hard ban text |
| ncnn `.bin` in nihui repo/release | Converted derivatives of above — inherit weight-terms uncertainty | **[UNKNOWN]** |
| Local download in C9.2-A | **No** | **[CONFIRMED]** |

**Hard rule applied:** “Public Dropbox” / “GitHub models folder” ≠ proven commercial-redistributable.

---

## 7. Dependency license

| Component | Typical SPDX / class | Role | Note |
|-----------|----------------------|------|------|
| PyTorch (official path) | BSD-style | Official training/demo | Not needed for ncnn offline smoke |
| **ncnn** (Tencent) | **BSD 3-Clause** (+ listed 3rd-party) | Inference | Same family as GVFI RIFE ncnn |
| libwebp | BSD | Image codec in port | README cites |
| stb | Public domain / MIT-like | Linux/mac image IO | README cites |
| dirent (Windows) | MIT-like common | Directory listing | README cites |
| Vulkan loader / ICD | Vendor / Khronos | GPU runtime | System driver; SDK for **build** |
| ffmpeg | LGPL/GPL depending on build | 24→48 mux only | Outside model |

No SoftSplat / NC-only core dependency identified for **inference** path **[CONFIRMED]** from public READMEs.

---

## 8. Weight availability

| Item | Status |
|------|--------|
| Official `.pth` via Dropbox | Documented; **not downloaded** |
| Preconverted ncnn in GitHub `models/` | Documented; **not downloaded** |
| Windows release includes binaries **and** models | README: “package includes all the binaries and models required” | **[CONFIRMED]** |
| On this machine now | No local IFRNet weights found under `D:\GVFI-deps` | **[CONFIRMED]** static |

---

## 9. Windows feasibility

| Item | Finding | Tag |
|------|---------|-----|
| Windows binaries | Official release zip for Windows | **[CONFIRMED]** |
| Portable claim | “no CUDA or PyTorch runtime environment is needed” | **[CONFIRMED]** README |
| Build-from-source | CMake + Vulkan SDK (`vulkan.lunarg.com`) | **[CONFIRMED]** |
| Local Vulkan SDK | `D:\VulkanSDK\1.4.357.0` already present (GVFI env check) | **[CONFIRMED]** static |
| Local MSVC/CMake | Present per `docs/native/environment-check.md` | **[CONFIRMED]** prior |
| Windows blocker in docs | **None** stated | **[CONFIRMED]** |

---

## 10. Vulkan feasibility

| Check | Result | Tag |
|-------|--------|-----|
| Public IFRNet ncnn Vulkan impl exists? | **Yes** (`nihui/ifrnet-ncnn-vulkan`) | **[CONFIRMED]** |
| Truly GPU Vulkan (not CUDA-only)? | **Yes** — ncnn Vulkan backend; CLI `-g` GPU id (`-1`=CPU) | **[CONFIRMED]** docs |
| Vulkan SDK required to **run** portable zip? | **No** (loader via GPU driver) · required to **build** from source | **[INFERENCE]** standard for nihui ports; README emphasizes portable |
| NVIDIA supported in docs? | **Yes** | **[CONFIRMED]** |
| Host Vulkan instance | Vulkan **1.4.357**; GPU0 **NVIDIA GeForce RTX 5060 Laptop GPU** apiVersion **1.4.341** driver **610.88** | **[CONFIRMED]** `vulkaninfo` |
| Host integrated GPU | Intel RaptorLake also enumerated | **[CONFIRMED]** |

---

## 11. RTX 5060 feasibility

| Item | Judgment | Tag |
|------|----------|-----|
| Vulkan device present | **Yes** — discrete NVIDIA enumerated | **[CONFIRMED]** |
| Depends on old TF/CUDA 11 stack? | **No** for ncnn path | **[CONFIRMED]** vs FILM |
| Theoretical Vulkan compute on this GPU | **Supported at driver/API level** | **[CONFIRMED]** enumeration |
| IFRNet-specific forward on RTX 5060 | **Not run** this phase | **[UNKNOWN]** |
| Related evidence | GVFI already validated **RIFE ncnn/Vulkan** forwards on this same GPU/driver family | **[INFERENCE]** favorable for stack class, **not** a substitute for IFRNet smoke |
| Soft risk | Port last updated **2022-07**; older ncnn submodule may need validation on Blackwell | **[UNKNOWN]** until C9.2-B |

**Relative to FILM:** Avoiding TF 2.6/2.10 + CUDA 11 is a **material** advantage on this host **[CONFIRMED]** by C9.1-B failure mode.

---

## 12. 24→48 feasibility

| Requirement | IFRNet evidence | Tag |
|-------------|-----------------|-----|
| Two-frame input | CLI `-0`/`-1` or directory pairs | **[CONFIRMED]** |
| One mid-frame output | Default / documented | **[CONFIRMED]** |
| Native 2× | Official `demo_2x.py`; ncnn default `num-frame = N*2` | **[CONFIRMED]** |
| Documented video 24→48 | README ffmpeg recipe: decode → ifrnet → encode `-framerate 48` | **[CONFIRMED]** |
| Arbitrary timestep | Official: `embt` tensor (demo uses `1/2`); ncnn: `-s time-step (0~1, default=0.5)` | **[CONFIRMED]** API |
| Primary A/B mode | Fixed **t=0.5** mid-frame is enough for 24→48 | **[CONFIRMED]** sufficient |
| 1080p | Paper timing at **1280×720**; 1080p success **not proven** here | **[UNKNOWN]** runtime |
| UHD mode | CLI `-u` listed; README TODO still mentions UHD | **[UNKNOWN]** maturity |

---

## 13. GVFI engineering fit

| Aspect | Assessment |
|--------|------------|
| Production today | `backend_mode=cli` · RIFE ncnn (external CLI / native DLL path) |
| IFRNet offline smoke | Run portable `ifrnet-ncnn-vulkan` **outside** GVFI · **E0** |
| Pair pipeline match | Two frames → one mid → interleaved 2× · **good fit** |
| Product integration later | New CLI worker or DLL path analogous to RIFE · **E1** (not authorized now) |
| vs FILM product-native | FILM was **E2** TF stack; IFRNet ncnn is **closer** to GVFI shape | **[CONFIRMED]** architectural |
| Must not touch | `backend_mode`, RIFE, VideoWorker, production requirements | obeyed this phase |

**C9.2-A engineering class for offline A/B: E0** (release binary) / **E1** if building from source against newer ncnn.

---

## 14. Quality evidence (public only — no GVFI run)

Paper Table 1 (Tesla **V100**, time/FLOPs at **1280×720** — do **not** transpose to RTX 5060):

| Model | Vimeo90K PSNR/SSIM | Params (M) | Time (s) | FLOPs |
|-------|--------------------|------------|----------|-------|
| RIFE (paper cite) | 35.62 / 0.9780 | 9.8 | 0.026 | 0.20 |
| IFRNet | 35.80 / 0.9794 | 5.0 | 0.025 | 0.21 |
| IFRNet small | 35.59 / 0.9786 | 2.8 | 0.019 | 0.12 |
| IFRNet large | 36.20 / 0.9808 | 19.7 | 0.079 | 0.79 |

SNU-FILM (paper): Hard/Extreme columns show IFRNet competitive; qualitative Fig. 6 claims sharper motion boundaries vs several baselines on **SNU-FILM Hard** **[CONFIRMED]** paper text.  
Middlebury: IFRNet large average IE/NIE reported competitive with SoftSplat **[CONFIRMED]** Table 2.  
Human dance / GVFI real clip: **[UNKNOWN]** — no C9.2 run.  
Claim “IFRNet better than RIFE on GVFI content”: **forbidden** — paper deltas ≠ product proof.

Tags only: paper numbers **[CONFIRMED]**; real-content win **[UNKNOWN]**.

---

## 15. Commercial classification

| Layer | Class | Note |
|-------|-------|------|
| Official source code | Clear MIT commercial-capable | **[CONFIRMED]** |
| ncnn port code | Clear MIT | **[CONFIRMED]** |
| ncnn / Vulkan deps | Generally commercial-friendly BSD-family | **[CONFIRMED]** typical |
| Pretrained weights use (internal offline) | No NC ban found | **[UNKNOWN]** formal grant |
| Pretrained / converted weight redistrib in product | **Not cleared** | **[UNKNOWN]** |
| Overall shortlist class | **R1** | same as C9 matrix |

Not **R0** (weights SPDX incomplete). Not **R3** (no NC text found).

---

## 16. G-IFRNET result

### Gate checklist

| # | Condition | Result |
|---|-----------|--------|
| 1 | Public implementation exists | **PASS** |
| 2 | ncnn/Vulkan GPU path documented | **PASS** |
| 3 | Windows route explicit (binaries + build) | **PASS** |
| 4 | 2× / 24→48 path explicit | **PASS** |
| 5 | No hard commercial ban on code | **PASS** |
| 6 | Weights commercial redistrib explicit | **FAIL → UNKNOWN** (no ban, no grant) |
| 7 | RTX 5060 Vulkan presence | **PASS** (enumeration); IFRNet forward **UNKNOWN** |

# G-IFRNET = PASS-WITH-UNKNOWN

| Alternate | Why not |
|-----------|---------|
| PASS | Would overclaim weight redistrib clearance |
| FAIL | Would require hard commercial ban or impossible engineering — neither found |
| UNKNOWN | Engineering route is clear enough for an offline smoke gate |

---

## 17. Blocking issues

| Severity | Issue | Blocks |
|----------|-------|--------|
| **Hard (product redistrib)** | Weight SPDX / redistrib statement missing | Product bundling |
| **Soft (runtime)** | 2022 port + Blackwell: IFRNet Vulkan forward unproven | May fail C9.2-B smoke |
| **Soft (maturity)** | README “early development”; UHD TODO | Quality/edge cases |
| **Soft (1080p)** | Paper timing is 720p-class | Perf UNKNOWN at 1080p24→48 |
| **Non-blocker** | No TF/CUDA 11 dependency for ncnn path | Advantage vs FILM |
| **Non-blocker** | Self ONNX conversion not required for first smoke | Preconverted models exist |

**Largest blocker for commercial ship:** weight license **[UNKNOWN]**.  
**Largest soft risk for next experiment:** unproven IFRNet binary on RTX 5060 (stack class is favorable, not guaranteed).

---

## 18. Recommendation

**Allow C9.2-B** (isolated environment bring-up / GPU smoke only), when explicitly authorized, with:

1. Prefer **portable Windows release** `20220720` under an isolated `D:\GVFI-deps\...` tree — **do not** modify GVFI production.  
2. Prefer model **`IFRNet_Vimeo90K`** (2× mid-frame) for first smoke.  
3. Verify: load model · Vulkan device 0 = RTX 5060 · pair forward · mid-frame write.  
4. Still **no** `backend_mode` change · **no** VideoWorker · **no** formal A/B until smoke PASS.  
5. Keep weight redistrib **UNKNOWN**.  
6. **Do not** resume FILM TF env work on this machine.  
7. **Do not** enter C10 from this document.

---

## 19. Sources

- Paper: https://arxiv.org/abs/2205.14620 · CVPR 2022 Open Access PDF  
- Official repo: https://github.com/ltkong218/IFRNet · LICENSE MIT · HEAD `b117bcaf…`  
- Official README Dropbox weights + ncnn link  
- Port: https://github.com/nihui/ifrnet-ncnn-vulkan · LICENSE MIT · HEAD/release `3592a703…` / tag `20220720`  
- ncnn LICENSE: BSD 3-Clause (Tencent)  
- Prior: `docs/c9-commercial-vfi-candidate-survey.md`, `docs/c91-film-readiness-check.md`, `docs/c91-film-ab.md`, `docs/native/environment-check.md`  
- Static host: `nvidia-smi` · `vulkaninfo --summary` (2026-08-12)

---

## Decision box (required outputs)

1. **G-IFRNET:** `PASS-WITH-UNKNOWN`  
2. **License:** Official code **MIT** · Port code **MIT** · **no** NC ban found  
3. **Weight:** Public Dropbox + ncnn packs · formal commercial redistrib **UNKNOWN**  
4. **ncnn/Vulkan feasibility:** **Yes** (public Windows Vulkan port + preconverted models)  
5. **RTX 5060 feasibility:** Vulkan device **present**; IFRNet forward **UNKNOWN** until smoke · **not** blocked by FILM’s TF/CUDA failure mode  
6. **Enter C9.2-B?** **Yes** (isolated smoke only; wait for explicit instruction)  
7. **Report path:** `docs/c92-ifrnet-readiness-check.md`
