# C10-C — Candidate Screening (P0/P1 Directed)

**Date:** 2026-08-12  
**Phase:** Candidate **readiness + minimal isolated smoke** only  
**Baseline:** `docs/c10-b-rife-fast-limb-quantification.md` · `D:\GVFI-deps\rife-defect-audit\c10b\`  
**Not in this phase:** production integration · GVFI / `backend_mode` / RIFE config change · auto A/B · auto GO  

**Production (unchanged):** `backend_mode=cli` · **`rife-v4.6`**

**Disclaimer:** Not legal advice. Code MIT ≠ weight commercial redistrib clearance.

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Decision

# **WEAK-GO**

| Label | Applies? |
|-------|----------|
| **GO** (clear P0/P1 improve + runnable + product path) | **No** — this phase did **not** prove P0/P1 improvement |
| **WEAK-GO** | **Yes** — one product-shaped candidate (**IFRNet** ncnn/Vulkan) reconfirmed **runnable** on C10-B critical pairs; prior C9.2-C shows local limb morph **[DIFF]** without clear overall win; weight redistrib **UNKNOWN** |
| **NO-GO** | FILM (host GPU smoke fail); GMFSS product path; AMT; GIMM-VFI |
| **UNKNOWN** | Whether IFRNet (or any candidate) **reduces C10-B Ghost/Warp scores** on the same slots — requires **authorized directed A/B** (not started) |

**Production remains:** `backend_mode=cli` + RIFE **`rife-v4.6`**. Do **not** replace RIFE. Do **not** auto-integrate.

---

## Goal & constraints

| Goal | Detail |
|------|--------|
| Target defects | **P0** fast-limb / layered ghost · **P1** warp / smear (C10-B scored) |
| Method | Reuse C10-B focus slots; screen candidates for host + product fit; smoke only |
| Work root | `D:\GVFI-deps\c10c-screening\` (isolated) |

| Forbidden | Status |
|-----------|--------|
| Modify GVFI production | **Not done** |
| Modify `backend_mode` | **Not done** (still `cli`) |
| Replace RIFE | **Not done** |
| Auto production integration | **Not done** |
| Declare GO from single visual glance | **Not done** |
| Repeat full C10-B quantification | **Not done** (mapping/scores reused) |

---

## C10-B anchor (reused, not re-measured)

Critical **reliable mid** slots (Ghost ≥2):

| Out # | SRC n / n+1 | frac | Ghost | Overall |
|------:|-------------|-----:|------:|--------:|
| 12 | 7 / 8 | 0.875 | 2 | 2 |
| 21 | 13 / 14 | 0.500 | **3** | **3** |
| 36 | 22 / 23 | 0.875 | 2 | 2 |
| 39 | 24 / 25 | 0.750 | **3** | **3** |
| 130 | 81 / 82 | 0.625 | **3** | **3** |

#25 (`frac=0`) is **not** a mid sample — excluded from P0 mid smoke pairs.

---

## Candidate shortlist (P0/P1 directed)

Priority filters: RTX 5060 runnable · ncnn/Vulkan or shippable path · no production RIFE edit · weight license tracked separately.

| # | Candidate | Why considered for P0/P1 | Prior evidence |
|---|-----------|---------------------------|----------------|
| 1 | **IFRNet** (ncnn/Vulkan) | Efficient joint flow+context; product-shaped like GVFI native | C9.2-B smoke **PASS** · C9.2-C **WEAK-GO** · C9.3 weights **UNKNOWN** |
| 2 | **FILM** | Large-motion thesis ↔ C8/C10 limb gap | C9.1-B GPU smoke **FAIL** on this host |
| 3 | **GMFSS / GmfSs** | C8 already showed limb morph **[DIFF]** vs RIFE | Commercial path **R2** / Steam weights forbidden |
| 4 | **AMT** | Strong modern VFI | **CC BY-NC 4.0** → **R3** |
| 5 | **GIMM-VFI** | Recent high-profile | S-Lab NC → **R3** |
| 6 | **FLAVR / VFIformer** | Survey backups | Weaker GVFI-shaped path; not smoke-tested here |

RIFE stays **baseline only** (not a “candidate to replace itself”).

---

## Per-candidate screening cards

### 1) IFRNet — **WEAK-GO** (smoke reconfirmed · A/B not claimed)

| Field | Record |
|-------|--------|
| **Runnable (this host)** | **Yes** — C10-C smoke **PASS** on 3 C10-B P0 pairs |
| **GPU path** | `ifrnet-ncnn-vulkan` · Vulkan · device **0 = RTX 5060 Laptop** |
| **Model / weights** | `IFRNet_Vimeo90K` (`ifrnet.param` / `ifrnet.bin`) from release `20220720` under `D:\GVFI-deps\ifrnet-c92b\` |
| **Code license** | MIT (official + port) |
| **Weight commercial redistrib** | **UNKNOWN** (`docs/c93-ifrnet-weight-license.md`) — **do not** treat MIT as weight clearance |
| **P0/P1 theoretical fit** | Intermediate feature refine + occlusion-aware design; may change ghost↔smear morphology (C9.2-C: RIFE clearer **double-edge ghost**, IFRNet more **smear**) |
| **P0/P1 evidence (this phase)** | Smoke only — **no** Ghost/Warp rescore · **no** GO claim |
| **Prior quality vs RIFE** | C9.2-C: local **[DIFF]** on fast limbs; **no clear overall IFRNet win** on same dance material |
| **Engineering integrate cost** | **Medium**: ncnn/Vulkan EXE path exists; VideoWorker / CLI dual-backend still large; Vimeo90K port = fixed **2×** (no free `-n`/`-s` like RIFE); production default must stay RIFE until cleared |
| **C10-C smoke detail** | Pairs SRC 13↔14, 24↔25, 81↔82 → mid `t=0.5` · exit 0 · non-black 720×1038 · ~1.0–1.2 s wall each · logs/sheets under `D:\GVFI-deps\c10c-screening\` |

**IFRNet sub-verdict:** Eligible for a later **explicitly authorized P0-directed A/B** on C10-B slots. **Not** production-ready. **Not** GO.

---

### 2) FILM — **NO-GO** (this host / near-term)

| Field | Record |
|-------|--------|
| **Runnable** | **No** — C9.1-B TF2.10 + missing CUDA 11 runtime (`cudart64_110`); C10-C re-probe: `CUDA_PATH` empty · no `cudart64_110` in common toolkit paths · WSL2 absent |
| **GPU path** | TF2 CUDA era — **blocked** on RTX 5060 / driver 610 host stack as previously recorded |
| **Model / weights** | Planned `film_net/L1`; **not downloaded** (prior stop before fetch; not re-fetched) |
| **Code license** | Apache-2.0 |
| **Weight redistrib** | **UNKNOWN** (C9.1-A) |
| **P0/P1 theoretical fit** | **Strong on paper** (large motion) — untested here |
| **Engineering cost** | **High** without new env strategy (WSL2 / modern TF-GPU / cloud) |
| **C10-C action** | No weight download · no re-install · readiness = still **FAIL** |

---

### 3) GMFSS / GmfSs — **NO-GO** (product)

| Field | Record |
|-------|--------|
| **Runnable** | Prior C8 path existed for research A/B; **not** re-run |
| **GPU path** | PyTorch / SVFI-stack adjacent — **not** GVFI ncnn product path |
| **License / commercial** | Product stack **R2**; Steam weights **forbidden** |
| **P0/P1 fit** | C8 morph **[DIFF]** interesting for ghost vs smear — **cannot ship** |
| **Engineering** | **High / blocked** for legal product bundling |

---

### 4) AMT — **NO-GO**

| Field | Record |
|-------|--------|
| **License** | **CC BY-NC 4.0** → commercial **R3** |
| **P0/P1 fit** | Irrelevant for product while NC |
| **Smoke** | **Not run** (license gate) |

---

### 5) GIMM-VFI — **NO-GO**

| Field | Record |
|-------|--------|
| **License** | S-Lab **non-commercial** → **R3** |
| **Smoke** | **Not run** |

---

### 6) FLAVR / VFIformer — **UNKNOWN** (deferred)

| Field | Record |
|-------|--------|
| **Runnable / GPU** | Not smoke-tested in C10-C |
| **Product path** | Weaker vs IFRNet ncnn/Vulkan |
| **License sketch** | FLAVR Apache-2.0 · VFIformer MIT (weights still need separate check) |
| **Action** | Defer; do **not** auto-open new downloads |

---

## C10-C smoke evidence (IFRNet only)

| Pair (C10-B) | Inputs | Output | Exit | Non-black | GPU |
|--------------|--------|--------|-----:|:---------:|-----|
| out#21 | SRC 13, 14 | `...\smoke\ifrnet\f21_ifrnet_mid.png` | 0 | Yes | RTX 5060 `#0` |
| out#39 | SRC 24, 25 | `...\smoke\ifrnet\f39_ifrnet_mid.png` | 0 | Yes | RTX 5060 `#0` |
| out#130 | SRC 81, 82 | `...\smoke\ifrnet\f130_ifrnet_mid.png` | 0 | Yes | RTX 5060 `#0` |

Contact sheets (SRC n | IFRNet | existing RIFE mid | SRC n+1) — **audit copies only, not scored**:

- `D:\GVFI-deps\c10c-screening\smoke\sheets\f21_smoke_sheet.png`
- `D:\GVFI-deps\c10c-screening\smoke\sheets\f39_smoke_sheet.png`
- `D:\GVFI-deps\c10c-screening\smoke\sheets\f130_smoke_sheet.png`

Manifest: `D:\GVFI-deps\c10c-screening\smoke\logs\smoke_manifest.json`

**Explicit:** These sheets do **not** authorize GO. Prior C9.2-C already cautioned that limb **[DIFF]** ≠ IFRNet superiority.

---

## Aggregate decision matrix

| Candidate | Runnable | Product path | Weight redistrib | P0/P1 theory | Proven P0/P1 fix | C10-C class |
|-----------|:--------:|:------------:|:----------------:|:------------:|:----------------:|-------------|
| IFRNet | Yes | Yes (ncnn/Vulkan) | UNKNOWN | Medium | **No** (this phase) | **WEAK-GO** |
| FILM | No | Weak (TF) | UNKNOWN | High | No | **NO-GO** |
| GMFSS | Prior only | No (R2) | Fail product | Medium | No ship | **NO-GO** |
| AMT | — | No (NC) | NC | — | — | **NO-GO** |
| GIMM | — | No (NC) | NC | — | — | **NO-GO** |
| FLAVR / VFIformer | UNKNOWN | Weak | Check later | UNKNOWN | No | **UNKNOWN** / deferred |

---

## Safety check

| Check | Result |
|-------|--------|
| GVFI production modified | **No** |
| `backend_mode` still `cli` | **Yes** |
| RIFE still `rife-v4.6` | **Yes** |
| Production RIFE replaced | **No** |
| Original / enhanced dance MP4 overwritten | **No** (timestamps unchanged vs C10-B) |
| New model families downloaded this phase | **No** (reused existing IFRNet pack; FILM weights not fetched) |
| IFRNet / FILM “auto A/B” started | **No** (smoke only) |
| Report written | **Yes** (this file) |

---

## Next Action

**Stop at C10-C screening.**

1. Keep production: **`backend_mode=cli` + `rife-v4.6`**.  
2. **Do not** auto-start directed A/B.  
3. **Do not** integrate IFRNet into VideoWorker / GVFI.  
4. If authorized later: **P0-directed offline A/B** only — IFRNet vs existing RIFE on C10-B mapped pairs (#21 / #39 / #130 / #12 / #36), rescoring Ghost / Smear / Occlusion / Warp with the C10-B rubric; still no production switch from a single visual win.

**Entering directed A/B or any production work requires a new explicit user authorization.**
