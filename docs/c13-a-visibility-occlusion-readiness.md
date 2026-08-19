# C13-A — Explicit Visibility / Occlusion Candidate Readiness & License Deep-Dive

**Date:** 2026-08-13  
**Phase:** Public verification only · **no download** · **no install** · **no compile** · **no Smoke/A/B** · **no production change** · **no C13-B**  

**Prior:** C13-0 Top 1 = Explicit Visibility / Occlusion Reasoning · SoftSplat-free required  

**Production preserved:** `backend_mode=cli` · RIFE **`rife-v4.6`**  

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Executive Summary

Deep-dive of SoftSplat-free visibility/occlusion packages shows:

| Role | Candidate | SoftSplat | Code | Weights | Windows/5060 path |
|------|-----------|-----------|------|---------|-------------------|
| **Best** | **Super-SloMo (visibility-map VFI)** via `avinashpaliwal/Super-SloMo` | **None** [CONFIRMED] | MIT (reimpl) | **UNKNOWN** (community Drive; authors never released official code/weights) | Pure PyTorch · Windows docs [SUPPORTED] |
| **Backup** | **ABME** (`JunHeum/ABME`) | **None** (backward-warp path) [SUPPORTED] | MIT | **UNKNOWN** (Drive zip) | Needs `correlation_package` CUDA build [SUPPORTED risk] |
| — | SoftSplat / EBME / M2M / OCAI / DAIN(practical) / VOS-VFI | See Reject | — | — | — |

# C13-A Verdict = **GO**

Meaning here: **worth a later authorized isolated research Smoke** — **not** quality win · **not** commercial clear · **not** production integration.

| Lock | Value |
|------|--------|
| SoftSplat commercial block on Best/Backup | **Excluded** [CONFIRMED for Best; SUPPORTED for Backup] |
| Weight commercial redistrib | **UNKNOWN** (must label on any Smoke) |
| C13-B started | **NO** |
| Production modified | **NO** |

---

## Scope & rules

| Rule | Application |
|------|-------------|
| SoftSplat academic-only / uncleared commercial | **Hard exclude** for Best/Backup |
| Ordinary mid-blend / ROI / OF-WTA / sparse-pose reskin | Deprioritize / Reject |
| Code MIT/Apache ≠ weight commercial PASS | Enforced |
| Third-party HF/Drive reupload ≠ author grant | Enforced (Super-SloMo weights especially) |
| Grades | CONFIRMED / SUPPORTED / HYPOTHESIS / UNKNOWN |

---

## Candidate cards

### 1) SoftSplat / Softmax Splatting (full VFI + operator)

| Field | Content |
|-------|---------|
| Candidate | Softmax Splatting (SoftSplat) |
| Paper | Niklaus & Liu, CVPR 2020 |
| Official repository | https://github.com/sniklaus/softmax-splatting |
| Year | 2020 |
| Technical mechanism | Differentiable **forward warp** with softmax importance to resolve multi-to-one collisions (visibility-like conflict) |
| SoftSplat dependency | **Is SoftSplat** |
| Code license | **Academic purposes only**; commercial requires contacting authors [CONFIRMED README] |
| Weight / Commercial / Redistribution | Academic stack → **product EXCLUDE** |
| Verdict for C13-A | **REJECT** |

---

### 2) EBME

| Field | Content |
|-------|---------|
| Candidate | EBME |
| Paper | Jin et al., WACV 2023 |
| Official repository | https://github.com/srcn-ivl/EBME |
| Year | 2023 |
| Technical mechanism | Bi-directional motion + synthesis; **forward warping via CuPy SoftSplat** |
| SoftSplat dependency | **Yes** — README requires CuPy SoftSplat and warns to respect SoftSplat license [CONFIRMED] |
| Code license | Apache-2.0 on GitHub API |
| Commercial | SoftSplat dep → **blocked** for SoftSplat-free / product |
| Verdict | **REJECT** |

---

### 3) M2M-VFI

| Field | Content |
|-------|---------|
| Candidate | M2M-VFI (Many-to-Many Splatting) |
| Paper | Hu et al., CVPR 2022 |
| Official repository | https://github.com/feinanshan/M2M_VFI |
| Year | 2022 |
| Technical mechanism | Multi bidirectional flow forward splat + reliability fusion (paper notes similarity to SoftSplat form) |
| SoftSplat dependency | Not sniklaus import required, but **splatting-family / SoftSplat-adjacent** [SUPPORTED] |
| Code license | **Adobe Research License** — **noncommercial research only** [CONFIRMED LICENSE file] |
| Commercial / Redistribution | **EXCLUDE** |
| Verdict | **REJECT** |

---

### 4) OCAI (class exemplar from C13-0)

| Field | Content |
|-------|---------|
| Candidate | OCAI |
| Paper | Jeong et al., CVPR 2024 (Qualcomm) |
| Official repository | **No public implementation found** in this survey [CONFIRMED absence] |
| Year | 2024 |
| Technical mechanism | Occlusion-aware forward warp + FB-consistency hole fill (paper) |
| SoftSplat dependency | **UNKNOWN** (no code) |
| Public impl / Smoke path | **None** |
| Verdict | **REJECT** (cannot Smoke) |

---

### 5) VOS-VFI

| Field | Content |
|-------|---------|
| Candidate | VOS-VFI |
| Paper | Yoo et al., ICCV 2023 |
| Official repository | https://github.com/junsang7777/VOS-VFI |
| Year | 2023 |
| Technical mechanism | **AdaCoF-based VFI** + VOS auxiliary losses / bi-directional consistency for sharper object boundaries; `cupy_module/adacof.py` [CONFIRMED] |
| Why different from R1/R2/R3 | Object-aware training signal — **not** ROI paste / OF-WTA / pose ribbon |
| P0 / P1 relevance | Boundary clarity [SUPPORTED topical]; explicit who-sees-whom **weak** vs depth/visibility maps [SUPPORTED] |
| SoftSplat dependency | **No** — AdaCoF CuPy, not SoftSplat [CONFIRMED tree] |
| Code license | GitHub license **null → UNKNOWN** |
| Weight license | Drive `ada-VOS_pretrained.pth` + STCN → **UNKNOWN** |
| Commercial / Redistribution | **Cannot PASS** |
| Windows / RTX 5060 | CuPy AdaCoF path possible in principle [SUPPORTED class]; untested [UNKNOWN] |
| Framework | PyTorch + CuPy |
| Eng complexity | Medium–High |
| t=0.5 / #12…#130 | `interpolate_twoframe.py` exists [CONFIRMED]; protocol fit **SUPPORTED** |
| Main risk | Closer to “ordinary VFI + aux loss” than z-order engine; license UNKNOWN |
| Verdict | **REJECT as Best/Backup** (thesis too soft + license gap); keep as watchlist only |

---

### 6) DAIN

| Field | Content |
|-------|---------|
| Candidate | DAIN (Depth-Aware Video Frame Interpolation) |
| Paper | Bao et al., CVPR 2019 |
| Official repository | https://github.com/baowenbo/DAIN |
| Year | 2019 |
| Technical mechanism | **Depth-aware flow projection** preferring closer objects → **explicit occlusion / z-order proxy** [CONFIRMED paper+README] |
| Why different from R1/R2/R3 | Depth-ordered sampling conflict resolve — not matte/OF-WTA/pose ribbon |
| P0 / P1 | Strong occlusion thesis [SUPPORTED]; Ghost∧Smear GO **HYPOTHESIS** |
| SoftSplat dependency | **No** — own CUDA depth-flow projection [CONFIRMED] |
| Code license | **MIT** [CONFIRMED] |
| Weight license | Author-hosted `best.pth` / MegaDepth / PWC — **no separate SPDX → UNKNOWN** |
| Commercial | Code MIT OK-ish; weights UNKNOWN → **no commercial PASS** |
| Windows feasibility | README targets **Ubuntu + PyTorch 1.0 + gcc 4.9 + Cuda 9**; custom extensions; compute_50–61 noted — **Windows/RTX 5060 practical path poor** [SUPPORTED] |
| RTX 5060 | Would need extension recompile / capability edits — **HIGH risk** [SUPPORTED] |
| Framework | PyTorch 1.0-era CUDA extensions |
| Eng complexity | **Very High** on this host |
| t=0.5 / protocol | `time_step` supported (incl. 0.5) [CONFIRMED]; offline pair protocol **SUPPORTED** |
| Main risk | Eng blockage before science; may still morph as ordinary depth-VFI [HYPOTHESIS] |
| Verdict | **REJECT for next Smoke** (no reasonable Windows path); mechanism remains valuable if eng later solved |

---

### 7) Super-SloMo (visibility maps) — **BEST**

| Field | Content |
|-------|---------|
| Candidate | Super-SloMo (Jiang et al.) via community PyTorch |
| Paper | Jiang et al., CVPR 2018 — soft visibility maps for occlusion |
| Official author code | **Not published** (authors stated unable to release) [CONFIRMED project FAQ] |
| Implementation used for readiness | https://github.com/avinashpaliwal/Super-SloMo (MIT, archived) |
| Year | Paper 2018 · reimpl 2018– |
| Technical mechanism | Bi-directional flow → approximate intermediate flows → **predict soft visibility maps** → warp + **visibility-weighted fusion** excluding occluded contributions |
| Why truly different from R1/R2/R3 | Explicit **per-pixel visibility / occlusion reasoning** in fusion — not ROI paste, OF-WTA Ghost-clean, or sparse pose ribbons |
| P0 relevance | Layered Ghost ≈ multi-source translucency; visibility can suppress occluded ghost layers [HYPOTHESIS win; SUPPORTED defect fit] |
| P1 relevance | Motion-boundary occlusion ↔ Warp/Smear [SUPPORTED adjacency] |
| SoftSplat dependency | **None** — backward warp + visibility [CONFIRMED architecture] |
| Code license | Reimpl **MIT** [CONFIRMED]; **not** author-official |
| Weight license | Community Google Drive ckpt (Adobe240fps-trained claim) → **UNKNOWN**; **not** author-official weights |
| Commercial use | **Not cleared** (UNKNOWN weights + third-party reimpl) |
| Redistribution | Weights **UNKNOWN** |
| Windows feasibility | README includes Windows `video_to_slomo` / ffmpeg path [SUPPORTED] |
| RTX 5060 feasibility | Pure PyTorch UNet — **LIKELY** under modern torch [SUPPORTED class]; not profiled [UNKNOWN] |
| Framework | PyTorch |
| Eng complexity | **Low–Medium** (no SoftSplat CUDA; archived but runnable class) |
| t=0.5? | **Yes** (arbitrary-time design; t=0.5 natural) [CONFIRMED paper] |
| #12/#21/#36/#39/#130 protocol? | Offline two-frame mid → **SUPPORTED** |
| Main risk | Third-party code/weights; old model may still Ghost→Smear; not commercial |
| Role | **BEST** for SoftSplat-free + runnable research Smoke |

---

### 8) ABME — **BACKUP**

| Field | Content |
|-------|---------|
| Candidate | ABME (Asymmetric Bilateral Motion Estimation) |
| Paper | Park et al., ICCV 2021 |
| Official repository | https://github.com/JunHeum/ABME |
| Year | 2021 |
| Technical mechanism | Symmetric then **asymmetric bilateral motions** for occlusion/disocclusion; backward warp; reliability mask / synthesis — SoftSplat mentioned as alternative they **do not** use [SUPPORTED paper] |
| Why different from R1/R2/R3 | Occlusion-aware bilateral motion + reliability — not ROI/OF-WTA/pose ribbon |
| P0 / P1 | Occlusion/disocclusion thesis [SUPPORTED]; dual-defect GO **HYPOTHESIS** |
| SoftSplat dependency | **No SoftSplat package** [SUPPORTED] |
| Code license | **MIT** [CONFIRMED] |
| Weight license | Official Drive `ABME_Weights.zip` → **UNKNOWN** separate SPDX |
| Commercial | Code MIT; weights UNKNOWN → **no commercial PASS** |
| Windows / 5060 | Needs `correlation_package` CUDA/`nvcc` match — **medium eng risk** on Windows [SUPPORTED] |
| Framework | PyTorch 1.7 + custom correlation |
| Eng complexity | Medium–High |
| t=0.5 / protocol | `run.py` two-frame mid [CONFIRMED]; protocol **SUPPORTED** |
| Main risk | Closer to advanced bilateral VFI cousin; CUDA build friction |
| Role | **BACKUP** |

---

### 9) BMBC (brief)

| Field | Content |
|-------|---------|
| Candidate | BMBC |
| Repo | https://github.com/JunHeum/BMBC · MIT · arbitrary `time_step` |
| SoftSplat | No SoftSplat stack [SUPPORTED] |
| Note | Predecessor-style bilateral VFI; weaker “visibility” branding than Super-SloMo/DAIN |
| Verdict | Not Best/Backup; optional tertiary if ABME blocked |

---

## SoftSplat exclusion status

| Item | Status |
|------|--------|
| SoftSplat official | **REJECT** — academic-only [CONFIRMED] |
| EBME | **REJECT** — depends on SoftSplat [CONFIRMED] |
| M2M | **REJECT** — Adobe NC + splat-family [CONFIRMED / SUPPORTED] |
| PerVFI / SGM (prior C11) | Already SoftSplat-touched / morph — not reopened |
| **Best Super-SloMo** | SoftSplat **excluded** [CONFIRMED] |
| **Backup ABME** | SoftSplat **excluded** [SUPPORTED] |

**SoftSplat thoroughly excluded from Best/Backup.**

---

## Best / Backup / Reject

### Best candidate
**Super-SloMo visibility-map VFI** — paper Jiang et al. CVPR 2018; runnable stack `avinashpaliwal/Super-SloMo` (MIT reimpl).

### Backup candidate
**ABME** — `JunHeum/ABME` (MIT, SoftSplat-free, official).

### Reject list
| Reject | Why |
|--------|-----|
| SoftSplat / SoftSplat-Full | Academic-only SoftSplat |
| EBME | SoftSplat CuPy dependency |
| M2M-VFI | Adobe Research NC license |
| OCAI | No public code |
| DAIN (for next Smoke) | SoftSplat-free & MIT, but **Windows/RTX 5060 eng path not reasonable** |
| VOS-VFI (as Best/Backup) | SoftSplat-free but weak z-order thesis + license UNKNOWN + AdaCoF ordinary-VFI cousin risk |

---

## Why Best ≠ R1 / R2 / R3

| Route | Mechanism |
|-------|-----------|
| R1 | Activity matte + single-SRC half-translation |
| R2 | OF Ghost-clean + frequency-split LSR |
| R3 | Sparse MediaPipe bone-affine ribbons |
| **Best Super-SloMo** | Learned **soft visibility / occlusion maps** that gate warped contributions before fusion |

This is **explicit visibility reasoning**, not another ROI/OF/pose heuristic. Dual-defect success remains **HYPOTHESIS**.

---

## C13-A Verdict

# **GO**

| Gate for Smoke readiness | Result |
|--------------------------|--------|
| Mechanism ≠ R1/R2/R3 | **PASS** (visibility maps) |
| P0/P1 thesis clear | **PASS** (occlusion/visibility) |
| Public implementation | **PASS** (MIT reimpl + paper) |
| SoftSplat commercial block | **PASS** (absent on Best) |
| Reasonable Windows/5060 path | **PASS** (pure PyTorch class) [SUPPORTED] |
| Weight commercial clear | **FAIL** → **UNKNOWN** (allowed for research Smoke with label) |

**GO = authorized-later research Smoke candidate exists.**  
**Not** dual-defect quality GO · **Not** ship clearance · **Not** auto-start C13-B.

### Residual caveats (must carry into any C13-B auth)
1. Author-official Super-SloMo code/weights **never released** — Best uses **third-party** MIT reimpl + Drive ckpt → research-only.  
2. Weight license **UNKNOWN** — cannot claim commercial redistrib.  
3. May still produce Ghost→Smear (ordinary visibility-blend risk) — **HYPOTHESIS** until measured.  
4. If Super-SloMo Smoke blocked, fall back to **ABME** (CUDA correlation build).

---

## Answers (required fields)

| # | Item | Value |
|---|------|--------|
| 1 | **C13-A Verdict** | **GO** (Smoke-readiness only) |
| 2 | **Best candidate** | Super-SloMo visibility-map VFI (`avinashpaliwal/Super-SloMo` + Jiang et al. paper) |
| 3 | **Backup candidate** | ABME (`JunHeum/ABME`) |
| 4 | Why Best ≠ R1/R2/R3 | Explicit soft visibility/occlusion gating of warped frames |
| 5 | SoftSplat excluded? | **Yes** on Best & Backup |
| 6 | Weight license | **UNKNOWN** (must label; not commercial PASS) |
| 7 | Windows / RTX 5060 | Best: **LIKELY** pure PyTorch [SUPPORTED]; Backup: medium CUDA-build risk |
| 8 | Allow C13-B? | **Not started**; **may** enter only under **new explicit auth** |
| 9 | Production | **`cli` + `rife-v4.6`** · modified **NO** |

---

## Stop condition

| Check | Result |
|-------|--------|
| Download / install / compile / Smoke / A/B | **No** |
| GVFI / VideoWorker / backend_mode / RIFE | **Unchanged** |
| C13-B started | **No** |

**Stop after this document.** Await new authorization before C13-B isolated Smoke.

---

## Final box

| Item | Value |
|------|--------|
| C13-A Verdict | **GO** |
| Best | Super-SloMo (visibility maps; SoftSplat-free) |
| Backup | ABME |
| SoftSplat on Best/Backup | **Excluded** |
| Weights | **UNKNOWN** |
| Production | **cli + rife-v4.6** |
| C13-B | **NO** |
| Report | `docs/c13-a-visibility-occlusion-readiness.md` |
