# C9 — Commercial VFI Candidate Survey

**Date:** 2026-08-12  
**Phase:** Desk research only · **not** C9.1 · **not** C8.2  
**Forbidden in this phase:** code changes · `backend_mode` changes · model download/install · compile · benchmark · production integration · Steam reverse / private assets  

**Disclaimer:** Public license / source facts only. **Not legal advice.** Redistribution clearance for pretrained weights often needs counsel even when repo SPDX is permissive.

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## 1. Executive Summary

Survey goal: find **legal, public, commercially usable** VFI candidates with **real engineering feasibility** for GVFI (Windows / CUDA / RTX 5060 Laptop / 24→48), not paper-rank chasing.

| Verdict | Detail |
|---------|--------|
| Production baseline | Keep **RIFE `rife-v4.6`** (`backend_mode=cli`). C8.1 B: SVFI-RIFE ≈ GVFI-RIFE **[SAME]** on real content. |
| GMFSS / GmfSs | Quality direction important vs RIFE on limbs/motion (**[DIFF]** in C8.1 A), but commercial path remains **R2**. Not next A/B product candidate. |
| AMT | Official **CC BY-NC 4.0** → **R3**. Technical reference only. |
| GIMM-VFI | **S-Lab License 1.0** (non-commercial) → **R3**. |
| Strongest offline A/B | **FILM** (large-motion thesis matches C8 gap) |
| Strongest product-shaped path | **IFRNet** (MIT + public `ifrnet-ncnn-vulkan`) |
| Survey NO-GO? | **No full NO-GO.** At least two non-RIFE candidates clear the bar for a **controlled offline A/B** under **R1** weight caveats. Product ship still needs weight/redistrib counsel. |

**If only one non-RIFE algorithm can be tested next: FILM.**

---

## 2. Existing baseline

| Item | Status |
|------|--------|
| GVFI production | `rife-v4.6`, `backend_mode=cli` |
| Steam SVFI-RIFE | `ncnn_rife` / `rife-v4.6` |
| C8.1 RIFE alignment (p0) | Letter **A** — SVFI-RIFE ≈ GVFI-RIFE (encode path still **[DIFF]**: nvenc vs libx265) |
| C8.1 real content B | SVFI-RIFE vs GVFI-RIFE → **基本相同** |
| C8.1 real content A | GmfSs vs GVFI-RIFE → **轻微差异** (fast limbs: RIFE layered ghost vs GmfSs smear) |
| RIFE role in C9 | **BASELINE only** — not the primary re-validation target |

RIFE is **not** discarded; it remains the ship path until a non-RIFE candidate wins offline A/B **and** clears commercial/engineering gates.

---

## 3. Candidate list

Prioritized **7** research candidates (plus baseline). Dropped quantity-padding (SepConv era, UTI-VFI without clear commercial stack, etc.).

| # | Candidate | Why included |
|---|-----------|--------------|
| 0 | **RIFE** (Practical-RIFE lineage) | Production BASELINE |
| 1 | **FILM** | Large-motion focus; Apache-2.0 official Google Research code; Windows install docs |
| 2 | **IFRNet** | Efficient encoder–decoder; MIT; official demos + **ncnn-vulkan** port |
| 3 | **AMT** | Strong modern VFI; must classify license → confirmed NC |
| 4 | **GMFSS / GmfSs** | C8 quality direction; prior **R2** (no re-litigation) |
| 5 | **FLAVR** | Apache-2.0; multi-frame; public inference |
| 6 | **VFIformer** | MIT; transformer VFI; public code |
| 7 | **GIMM-VFI** | Recent high-profile; license check → NC |
| — | ST-MFNet / M2M-VFI | Brief notes only (4-frame / SoftSplat-adjacent / license weak) |

### 3.1 Per-candidate A/B/C (algorithm · public impl · license sketch)

#### RIFE — BASELINE

| Field | Fact |
|-------|------|
| Name | Real-Time Intermediate Flow Estimation (RIFE) / Practical-RIFE |
| Paper | ECCV 2022 (and Practical-RIFE follow-ons) |
| Core | Real-time intermediate flow + fusion; arbitrary timestep in Practical-RIFE family |
| Problem | Fast, practical 2× / multi-frame VFI |
| GitHub | `megvii-research/ECCV2022-RIFE`, `hzwer/Practical-RIFE` |
| Inference / video / 2× | Yes / yes / yes (native 2× and recursive) |
| Code license | MIT (Practical-RIFE states pretrained under same MIT — treat as **claimed**; counsel still advised for redistribute) |
| Commercial class | **R0/R1** for GVFI’s **already-shipping** path (existing product baseline). Not re-opened here. |
| Engineering | **E0** in GVFI (ncnn Vulkan worker already) |

#### FILM — priority survey

| Field | Fact |
|-------|------|
| Name | FILM: Frame Interpolation for Large Motion |
| Paper | ECCV 2022, arXiv:2202.04901 · Google Research |
| Core | Single network, multi-scale shared-weight feature extractor; trainable from triplets; **large motion** emphasis; no extra flow/depth nets |
| Problem | Near-duplicate / large-displacement interpolation quality |
| GitHub | `google-research/frame-interpolation` (**Apache-2.0**, **archived**) |
| Inference | Official TF2 SavedModel + `eval.interpolator_cli` / `interpolator_test` |
| Video | Yes (`--output_video`, frame dirs) |
| Arbitrary t / 2× | Mid-frame `t=0.5`; multi-frame via `--times_to_interpolate` (recursive power-of-two style). **Natural 2×:** yes (`times_to_interpolate=1` → one mid frame per pair) |
| Weights | Google Drive SavedModels (`film_net/L1|Style|VGG`) + TF Hub demos; pack also includes `imagenet-vgg-verydeep-19.mat` for Style/VGG paths |
| Code license | Apache-2.0 **[SAME]** as stated on GitHub |
| Weights license | **No separate SPDX beyond repo Apache found** → **[UNKNOWN]** for commercial redistribute → class **R1** |
| Engineering | TF2 + CUDA; official `WINDOWS_INSTALLATION.md`; not ncnn. For GVFI-shaped stack: **E1** (offline CUDA OK; production native **E2**) |

**FILM worth next offline candidate?** Yes — quality thesis aligns with C8 limb/motion morphology gap. Not automatic product R0.

#### IFRNet — priority survey

| Field | Fact |
|-------|------|
| Name | IFRNet: Intermediate Feature Refine Network |
| Paper | CVPR 2022, arXiv:2205.14620 |
| Core | Joint flow + context feature refinement in one encoder–decoder; distillation / geometry losses |
| Problem | SOTA-ish accuracy with **speed + small model** for mobile/real-time |
| GitHub | `ltkong218/IFRNet` (MIT) · community `nihui/ifrnet-ncnn-vulkan` (MIT) |
| Inference | Official `demo_2x.py` / `demo_8x.py` |
| Video / 2× / arbitrary t | Video demos exist; **2× native**; 8× via multi-step training/demo. Continuous arbitrary-t like RIFE: **not as primary API** → treat multi-frame as recursive **[UNKNOWN]** vs RIFE-style `t` |
| Weights | Dropbox checkpoints (README); **no explicit weight SPDX** → **[UNKNOWN]** redistribute → **R1** |
| Engineering | PyTorch CUDA **E0**; **ncnn-vulkan** path **E0/E1** (closest non-RIFE to GVFI native shape) |

**Worth next A/B?** Yes — especially if goal is “product-shaped alternative,” not only quality spike.

#### AMT — confirmed non-commercial

| Field | Fact |
|-------|------|
| Name | AMT: All-Pairs Multi-Field Transforms |
| Paper | CVPR 2023 |
| GitHub | `MCG-NKU/AMT` |
| LICENSE | **CC BY-NC 4.0** + commercial contact `cmm[AT]nankai.edu.cn` |
| Class | **R3** — not a GVFI product integration candidate |
| Role | Technical reference only |

#### GMFSS / GmfSs — retain prior conclusion

| Field | Fact |
|-------|------|
| Prior docs | `docs/c81-gmfss-public-feasibility.md`, `docs/c81-gmfss-legal-alternative-research.md` |
| Class | **R2** |
| Note | Quality direction important on real dance content vs RIFE; **no clear commercial complete stack** (SoftSplat academic risk; Steam weights forbidden) |
| This survey | **No re-investigation of licenses** |

#### FLAVR

| Field | Fact |
|-------|------|
| Name | FLAVR |
| Paper | CVPR 2021 / follow-on |
| Core | 3D CNN multi-frame interpolation (typically 4 inputs) |
| GitHub | `tarun005/FLAVR` · **Apache-2.0** |
| 2× | Supported in demos; not classic two-frame arbitrary-t |
| Weights | Public checkpoints via README/Drive — separate SPDX **[UNKNOWN]** → **R1** |
| Engineering | PyTorch CUDA **E1**; multi-frame IO differs from GVFI pair pipeline → **E1/E2** for product |

#### VFIformer

| Field | Fact |
|-------|------|
| Name | VFIformer |
| Paper | CVPR 2022 |
| GitHub | `JIA-Lab-research/VFIformer` · **MIT** |
| Core | Transformer-based VFI |
| Weights | Public links typical; SPDX for weights **[UNKNOWN]** → **R1** |
| Engineering | Heavier transformer cost at 1080p → **E1**; no first-party ncnn → product **E2** |

#### GIMM-VFI

| Field | Fact |
|-------|------|
| Name | GIMM / GIMM-VFI |
| Paper | NeurIPS 2024 lineage |
| GitHub | `GSeanCDAT/GIMM-VFI` |
| LICENSE | **S-Lab License 1.0** — redistribution/use for **non-commercial** purpose; commercial requires contacting contributors |
| Class | **R3** |

#### Brief: ST-MFNet / M2M-VFI

| Candidate | Note | Class |
|-----------|------|-------|
| ST-MFNet | `danier97/ST-MFNet` MIT code; needs ≥4 frames; 2×-oriented | **R1** / engineering **E1–E2** for GVFI pair pipeline |
| M2M-VFI | SoftSplat-adjacent (Niklaus coauthor); public reimpl `feinanshan/M2M_VFI` SPDX **NOASSERTION** | **R4** / SoftSplat risk → treat as unsuitable for commercial shortlist |

---

## 4. License matrix

| Candidate | Source code | Stated pretrained / model text | Dataset note | Key 3rd-party dep risk |
|-----------|-------------|-------------------------------|--------------|-------------------------|
| RIFE / Practical-RIFE | MIT | Practical-RIFE claims MIT for pretrained | Vimeo90K etc. (train) | ncnn / Vulkan stack (GVFI already) |
| FILM | Apache-2.0 | Drive SavedModels under repo; **no separate weight SPDX found** | Vimeo90K train | TF2; VGG `.mat` for Style/VGG models |
| IFRNet | MIT | Dropbox; **no weight SPDX** | Vimeo / GoPro train | Official PyTorch; `nihui` ncnn MIT |
| AMT | **CC BY-NC 4.0** | Same NC grant | — | Paid commercial grant possible (email) |
| GMFSS family | Fortuna MIT top-level | Drive **[UNKNOWN]**; Steam proprietary | ATD-12K copyright risk | SoftSplat academic |
| FLAVR | Apache-2.0 | Checkpoints **[UNKNOWN]** SPDX | Multi-frame datasets | PyTorch |
| VFIformer | MIT | Checkpoints **[UNKNOWN]** SPDX | — | PyTorch / transformer mem |
| GIMM-VFI | **S-Lab 1.0 NC** | NC | — | Commercial contact required |
| M2M reimpl | NOASSERTION | **[UNKNOWN]** | SoftSplat lineage | SoftSplat academic |

**Rule:** Repo MIT/Apache ≠ automatic commercial redistribute of Drive/Dropbox weights.

---

## 5. Model-weight matrix

| Candidate | Public weights? | Download source | Explicit commercial redistribute? | Evidence tag |
|-----------|-----------------|-----------------|-----------------------------------|--------------|
| RIFE v4.6 (GVFI) | Yes (in product path) | Practical-RIFE / GVFI native packs | Claimed MIT in Practical-RIFE | **[SAME]** for baseline use; counsel for third-party redistribute still advised |
| FILM | Yes | Google Drive + TF Hub | Not separately SPDX’d beyond Apache repo | **[UNKNOWN]** |
| IFRNet | Yes | Dropbox | Not SPDX’d | **[UNKNOWN]** |
| AMT | Yes | Official (NC) | **No** (NC) | **[DIFF]** |
| GMFSS Fortuna | Yes (public) | Drive | Unclear + SoftSplat risk | **[UNKNOWN]** / **[DIFF]** |
| Steam GmfSs_pg_104 | Yes (Steam) | Steam | Proprietary; extract forbidden | **[DIFF]** |
| FLAVR | Yes | README links | Not verified SPDX | **[UNKNOWN]** |
| VFIformer | Yes | README links | Not verified SPDX | **[UNKNOWN]** |
| GIMM | Yes (typical) | Official under S-Lab NC | **No** | **[DIFF]** |

---

## 6. Quality evidence

Cross-paper PSNR is **not** comparable as a ranking oracle. Tags only when grounded in paper/official claims or **GVFI C8** evidence.

| Candidate | Benchmarks claimed | Large motion | Occlusion / boundaries | Real video (GVFI) | Params / speed (paper claims) |
|-----------|-------------------|--------------|------------------------|-------------------|-------------------------------|
| RIFE | Vimeo / Middlebury / etc. | Moderate | Known ghosting on fast limbs in C8 | C8 B ≈ SVFI-RIFE **[SAME]** | Real-time design |
| FILM | Vimeo, Middlebury, UCF101, Xiph | **Paper focus** large motion | Paper demos emphasize hard motion | No GVFI run yet → **[UNKNOWN]** | Heavier than RIFE; TF2 |
| IFRNet | Vimeo, UCF101, SNU-FILM, Middlebury | SNU-FILM hard sets reported | Paper qualitative on SNU-FILM | **[UNKNOWN]** on GVFI clips | README: 720p timing/FLOPs competitive vs cascade flow methods |
| AMT | Strong modern tables | Strong paper claims | Strong paper claims | N/A (R3) | Efficient multi-field |
| GmfSs | Product visual | C8 A limb morphology **[DIFF]** vs RIFE | Smear vs ghost tradeoff observed | C8 real dance | Steam private |
| FLAVR | Multi-frame benches | Different IO prior | — | **[UNKNOWN]** | 3D CNN cost |
| VFIformer | CVPR tables | — | — | **[UNKNOWN]** | Transformer cost |

**C8 implication:** The gap worth chasing is **motion morphology under human/fast limbs**, not “highest Vimeo PSNR.”

---

## 7. Engineering feasibility

Target: **NVIDIA RTX 5060 Laptop**, Windows, 1080p-class, **24→48**, prefer path compatible with GVFI (ncnn/Vulkan or at least offline CUDA).

| Candidate | PyTorch/CUDA | TensorRT/ONNX | ncnn / Vulkan | FP16 | Windows | 1080p 24→48 | Class |
|-----------|--------------|---------------|---------------|------|---------|-------------|-------|
| RIFE (GVFI) | Optional | Partial | **Yes (prod)** | Yes | Yes | Yes (prod) | **E0** |
| FILM | TF2+CUDA | Possible community; not first-party | No official | TF mixed | Official Windows doc | Offline plausible; slower | **E1** offline / **E2** prod-native |
| IFRNet | Yes | Feasible | **`nihui/ifrnet-ncnn-vulkan`** | Yes | Yes | Plausible | **E0–E1** |
| AMT | Yes | — | Community only | — | — | — | N/A (R3) |
| GMFSS | Yes | Hard | No clear public ncnn | — | — | Rebuild heavy | **E2–E3** commercial |
| FLAVR | Yes | — | No | — | Yes | Multi-frame IO | **E1–E2** |
| VFIformer | Yes | — | No | — | Yes | Mem/latency risk | **E1–E2** |
| GIMM | Yes | — | No | — | — | — | N/A (R3) |

Architecture judgment only — **no runs in C9**.

---

## 8. Commercial suitability

| Candidate | Class | One-line reason |
|-----------|-------|-----------------|
| RIFE (baseline) | **R0/R1** | Shipping path; Practical-RIFE MIT claims |
| FILM | **R1** | Apache code clear; **weights redistribute SPDX incomplete**; VGG mat for Style |
| IFRNet | **R1** | MIT code + MIT ncnn port; Dropbox weights SPDX incomplete |
| FLAVR | **R1** | Apache code; weight SPDX incomplete; multi-frame product fit weaker |
| VFIformer | **R1** | MIT code; weight SPDX incomplete; heavier eng |
| GMFSS | **R2** | Prior conclusion — rebuild/retrain/license stack |
| AMT | **R3** | CC BY-NC 4.0 |
| GIMM-VFI | **R3** | S-Lab License 1.0 NC |
| M2M (public reimpl) | **R4** | NOASSERTION + SoftSplat-adjacent |

---

## 9. Candidate ranking

Status cells: **[SAME]** / **[DIFF]** / **[UNKNOWN]** only.

| Candidate | Quality Potential | License | Weights | Engineering | 24→48 | Status |
|-----------|-------------------|---------|---------|-------------|-------|--------|
| RIFE v4.6 | BASELINE | **[SAME]** MIT path | **[SAME]** (claimed MIT / in-use) | **[SAME]** E0 | **[SAME]** | BASELINE — keep |
| FILM | Large-motion thesis **[SAME]** paper intent; vs RIFE real **[UNKNOWN]** | Code Apache **[SAME]** | Redistrib **[UNKNOWN]** | Offline E1 **[SAME]**; prod-native **[DIFF]** | Recursive 2× **[SAME]** | TOP offline A/B |
| IFRNet | Efficient SOTA-era **[UNKNOWN]** vs RIFE real | MIT **[SAME]** | Redistrib **[UNKNOWN]** | ncnn path **[SAME]** shape | 2× demos **[SAME]** | TOP product-shaped |
| FLAVR | Multi-frame **[UNKNOWN]** | Apache **[SAME]** | **[UNKNOWN]** | Pair-pipeline **[DIFF]** | 2× possible **[SAME]** | Backup |
| VFIformer | **[UNKNOWN]** | MIT **[SAME]** | **[UNKNOWN]** | Cost **[DIFF]** vs RIFE | **[UNKNOWN]** | Backup |
| GMFSS | C8 visual **[DIFF]** (interesting) | Stack **[DIFF]** / **[UNKNOWN]** | Steam **[DIFF]**; public **[UNKNOWN]** | **[DIFF]** | **[UNKNOWN]** | R2 — not next |
| AMT | Paper strong **[UNKNOWN]** real | NC **[DIFF]** | NC **[DIFF]** | N/A | N/A | R3 — exclude |
| GIMM | **[UNKNOWN]** | NC **[DIFF]** | NC **[DIFF]** | N/A | N/A | R3 — exclude |

---

## 10. TOP 3

### TOP 1 — FILM

**Why worth testing:** C8.1 showed the only meaningful visual gap vs a non-RIFE engine was **fast human motion morphology**. FILM’s published problem statement is **large motion** with public inference, Windows CUDA docs, and clear **2×** mid-frame path. Best match to the *quality question* GVFI actually has.

### TOP 2 — IFRNet

**Why:** Closest **commercial+engineering** shape to GVFI (MIT + `ifrnet-ncnn-vulkan`). Strong candidate if the next goal is “can we ship an alternative backend,” not only “can we beat RIFE on one dance clip.”

### TOP 3 — FLAVR (backup: VFIformer)

**Why:** Apache-2.0 (FLAVR) / MIT (VFIformer), public code+weights, but weaker fit to GVFI’s two-frame 24→48 pipeline and/or higher cost. Hold as backup if FILM/IFRNet fail visually or on license counsel.

---

## 11. Recommended next experiment

**Not started in C9.** When C9.1 is explicitly authorized:

1. **Offline A/B:** FILM (Style or L1 SavedModel) vs GVFI CLI RIFE `rife-v4.6` on the same C8.1 real clip (`L1L2_douyin_t3s.mp4`) + optional p0, with time-aligned visual protocol (avoid OSD confounders).
2. **Parallel desk:** counsel checklist on FILM Drive weights + VGG `.mat` redistribute.
3. **If FILM wins visually but eng is too heavy:** schedule IFRNet ncnn-vulkan smoke (still offline, not production).
4. **Do not** change `backend_mode`, do not touch GMFSS Steam assets, do not integrate AMT/GIMM.

---

## 12. NO-GO conditions

Declare **NO-GO** (stop pursuing that candidate for product) if any hold:

| Condition | Applies to |
|-----------|------------|
| License is Non-Commercial / S-Lab NC / academic-only without grant | AMT, GIMM, SoftSplat-official, Steam weights |
| No public weights and no willingness to retrain | Many paper-only forks |
| Requires SoftSplat academic stack or Steam extract | GMFSS commercial shortcut |
| Offline A/B shows **no** meaningful visual win vs RIFE on target content | Any TOP candidate after C9.1 |
| Weight redistrib counsel returns hard no | FILM / IFRNet product ship |
| Only path is multi-month full retrain + operator rewrite | GMFSS **R2** as near-term product |

**Survey-level NO-GO (no candidate at all)?** **No.** FILM and IFRNet both clear “worth a controlled offline A/B” under **R1**.

---

## 13. UNKNOWN

| Item | Why unknown |
|------|-------------|
| FILM / IFRNet / FLAVR / VFIformer weight commercial redistributability | No separate SPDX beyond repo license text found |
| FILM vs RIFE on GVFI real dance clip | No C9 run |
| IFRNet vs RIFE on GVFI real dance clip | No C9 run |
| FILM 1080p sustained FPS on RTX 5060 Laptop | Architecture only |
| Whether FILM Style VGG `.mat` blocks product redistribute | Needs counsel |
| Patent landscape | Out of scope |
| GMFSS rebuild fidelity vs Steam GmfSs | Forbidden / R2 |

---

## 14. Sources

### Prior GVFI docs
- `docs/c81-real-svfi-ab.md`
- `docs/c81-rife-alignment-ab.md`
- `docs/c81-real-content-ab.md`
- `docs/c81-gmfss-public-feasibility.md`
- `docs/c81-gmfss-legal-alternative-research.md`

### Official / primary repos (fetched 2026-08-12)
- https://github.com/google-research/frame-interpolation (Apache-2.0, archived) + README / WINDOWS_INSTALLATION
- https://github.com/ltkong218/IFRNet (MIT) + README
- https://github.com/nihui/ifrnet-ncnn-vulkan (MIT)
- https://github.com/MCG-NKU/AMT (CC BY-NC 4.0 LICENSE text)
- https://github.com/GSeanCDAT/GIMM-VFI (S-Lab License 1.0)
- https://github.com/tarun005/FLAVR (Apache-2.0)
- https://github.com/JIA-Lab-research/VFIformer (MIT)
- https://github.com/danier97/ST-MFNet (MIT)
- https://github.com/feinanshan/M2M_VFI (NOASSERTION)
- arXiv:2202.04901 (FILM), arXiv:2205.14620 (IFRNet), arXiv:2204.03513 (M2M)

### Papers / hubs
- FILM project: https://film-net.github.io/
- TF Hub FILM tutorial (public inference path)

---

## Decision box

### If only one non-RIFE algorithm can be tested next

**FILM.**

### Why not GMFSS?

C8 already showed GmfSs can look different from RIFE in a useful way, but the **commercial complete route is R2**: SoftSplat academic restrictions, unclear/public weight redistribute, Steam `GmfSs_pg_104` forbidden, and no clear Windows/ncnn product path without a large rebuild/retrain. Quality interest ≠ shippable candidate.

### Production reminder

**Keep `backend_mode=cli`.** C9 stops at this report.
