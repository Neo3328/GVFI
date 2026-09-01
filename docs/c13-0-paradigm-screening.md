# C13-0 — New Paradigm Screening & Priority Design

**Date:** 2026-08-13  
**Phase:** Public survey + priority design only · **no download** · **no install** · **no Smoke/A/B** · **no production change** · **no C13-A**  

**Prior:** C12-D Verdict = **CHANGE_TECHNICAL_PARADIGM**  

**Production preserved:** `backend_mode=cli` · RIFE **`rife-v4.6`**  

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Executive Summary

C11 ordinary VFI (IFRNet / SGM / PerVFI / EMA) and C12 Human/Limb heuristics (R1 / R2 / R3) all failed **dual-defect GO**, with a **CONFIRMED** Ghost→Smear morphological outcome pattern. C13-0 surveys four **mechanism-different** research paradigms and ranks three for a later authorized experiment.

| Rank | Paradigm | Role |
|------|----------|------|
| **P0 / Top 1** | **Explicit Visibility / Occlusion Reasoning** | Best dual-defect thesis fit to layered Ghost |
| **P1 / Top 2** | **Generative / Inpainting-style Intermediate Synthesis** | Most different synthesis pathway vs warp morph |
| **P2 / Top 3** | **Dense Human / Limb Reconstruction** | Distinct from failed **sparse** R3; not “all human-prior dead” |

**Bidirectional Correspondence** is surveyed and kept as a **watchlist**, not Top 3 — SGM already tested; AMT is NC; BiM-VFI remains partially **UNKNOWN** on license and may still be an ordinary-VFI cousin.

# C13-0 Verdict = **CONTINUE_RESEARCH**

| Lock | Value |
|------|--------|
| C13-A started | **NO** |
| New experiment / download | **NO** |
| Production modified | **NO** |
| Production | **`cli` + `rife-v4.6`** |

---

## C12 evidence baseline (not re-scored)

| Source | Result |
|--------|--------|
| C11-E | Ordinary VFI → all **WEAK-GO**; Ghost→Smear **CONFIRMED** morphology; stop blind ordinary VFI |
| C12-A R1 | ROI/activity + half-translation → Ghost 2.8→1.0; Smear→3.0; morph 5/5; **WEAK-GO** |
| C12-B R2 | OF Ghost-clean + LSR → same Ghost/Smear morph; Warp↑; **WEAK-GO** |
| C12-C R3 | Sparse pose bone-affine → Ghost↓; Smear→2.6; morph 3/5; Overall↑ 1/5; **WEAK-GO** |
| C12-D | **CHANGE_TECHNICAL_PARADIGM**; no more default ROI/OF/sparse-pose heuristic |

**Allowed outcome phrasing (C11-E / C12-D):**  
结果表现出稳定的 Ghost→Smear 形态转换，但其内部因果机制尚未被实验直接证明。

---

## Paradigm comparison

| Paradigm | vs R1 | vs R2 | vs R3 | Ghost thesis | Smear thesis | Dual-defect promise | Ordinary-VFI risk |
|----------|-------|-------|-------|--------------|--------------|---------------------|-------------------|
| **Visibility / Occlusion** | Not ROI paste | Not OF-WTA clean+freq LSR | Not sparse bone ribbon | Multi-hypothesis translucency → single visibility winner | Visible-side fill / hole handling vs mush average | **High (HYPOTHESIS)** | Medium if just soft mask + same blend |
| **Bidirectional Correspondence** | Not matte replace | Not heuristic OF | Not pose | Coherent match volume | Consistency vs soft blend | Medium; SGM already failed GO | **High** (cousin risk) |
| **Dense Human / Limb** | Not activity matte only | Not OF LSR | **≠ sparse 4-bone R3** | Dense part geometry → one limb instance | Part-anchored appearance | Medium–High (**HYPOTHESIS**) | Low if truly dense/SMPL |
| **Generative / Inpainting** | Not paste | Not warp restore | Not affine ribbon | Synthesize one mid limb under condition | Avoid warp mush by generation | **High (HYPOTHESIS)** | Low mechanism; high product risk |

---

## Candidate cards (illustrative exemplars — **not selected to run**)

Grades below mark **claims**, not GVFI measured results.

### A. Explicit Visibility / Occlusion Reasoning

#### A1 — Occlusion-aware forward warping / visibility weighting (class)

| Field | Content |
|-------|---------|
| Candidate / Method | **Paradigm class**: occlusion/visibility-aware mid reconstruction (exemplars: OCAI-style occlusion-aware forward warp; visibility-guided fusion papers; historically Softmax Splatting family) |
| Paper | OCAI (CVPR 2024, Jeong et al., Qualcomm); SoftSplat literature (prior C11-A); related visibility-guidance VFI drafts |
| Official repository | OCAI: **no clear public code found** in this survey · SoftSplat: known academic stack · VOS-VFI: `junsang7777/VOS-VFI` (ICCV 2023) |
| Year | 2019–2024 family |
| Technical paradigm | Explicit Visibility / Occlusion |
| P0 relevance | **High** — layered Ghost ≈ multi-source translucency / conflict [SUPPORTED by defect morphology; fix = HYPOTHESIS] |
| P1 relevance | **High** — occlusion boundaries ↔ Warp/Smear [SUPPORTED adjacency; fix = HYPOTHESIS] |
| Why different from R1/R2/R3 | Models **who-sees-whom / conflict resolve**, not ROI paste, OF-WTA clean, or pose ribbon |
| Ghost thesis | Single visibility winner per pixel reduces layered doubles [HYPOTHESIS] |
| Smear thesis | Visible-side reconstruction + structured hole-fill may avoid equal mush [HYPOTHESIS] |
| Occlusion thesis | Core of the paradigm [by definition] |
| Large-motion thesis | Forward-warp conflict worsens with large limb motion — directly on-topic [SUPPORTED] |
| Code license | SoftSplat path historically **academic-restricted** (C11) · OCAI code **UNKNOWN/unavailable** · VOS-VFI GitHub license **null/UNKNOWN** |
| Weight license | **UNKNOWN** until specific package chosen |
| Commercial use | SoftSplat-class → **product exclude** until cleared · others **UNKNOWN** |
| Redistribution | SoftSplat-class blocked historically · others UNKNOWN |
| Windows / RTX 5060 | PyTorch path **feasible in principle** [SUPPORTED by prior VFI envs] · ncnn/Vulkan **UNKNOWN** |
| Eng complexity | Medium–High |
| Risk | SoftSplat license trap; “visibility” that collapses to soft average → another morph [HYPOTHESIS] |

#### A2 — VOS-aware / object-boundary VFI (VOS-VFI)

| Field | Content |
|-------|---------|
| Candidate / Method | VOS-VFI (Video Object Segmentation-aware VFI) |
| Paper | ICCV 2023 Yoo et al. |
| Official repository | https://github.com/junsang7777/VOS-VFI |
| Year | 2023 |
| Technical paradigm | Visibility/object-aware training (auxiliary VOS), not full z-order engine |
| P0 / P1 | Object-boundary clarity relevant to limb edges [SUPPORTED relevance; Ghost∧Smear win **UNKNOWN**] |
| Why different | Object-aware loss / bi-directional consistency vs R1–R3 heuristics |
| Licenses | GitHub license field **null → UNKNOWN**; weights **UNKNOWN** |
| Commercial / Redistribution | **Cannot PASS** while UNKNOWN |
| Eng / GPU | PyTorch; Windows/5060 **LIKELY** but unverified [UNKNOWN] |
| Risk | May still be “ordinary VFI + aux loss” cousin [SUPPORTED caution] |

---

### B. Bidirectional Correspondence / Explicit Correspondence Reconstruction

#### B1 — SGM-VFI (already tested — demote)

| Field | Content |
|-------|---------|
| Candidate | SGM-VFI |
| Paper / Repo | CVPR 2024 · `MCG-NJU/SGM-VFI` |
| Status | **C11-B WEAK-GO** (Ghost↓, Smear↑, SoftSplat in stack) |
| Why not Top 3 | Mechanism already A/B’d; SoftSplat product risk; not a *new* paradigm for C13 |

#### B2 — AMT (All-Pairs Multi-Field Transforms)

| Field | Content |
|-------|---------|
| Candidate / Method | AMT |
| Paper | CVPR 2023 Li et al. |
| Official repository | https://github.com/MCG-NKU/AMT |
| Year | 2023 |
| Technical paradigm | Bidirectional all-pairs correlation volumes + multi-field warps |
| P0/P1 | Large motion + occlusion handling claimed in paper [paper claim ≠ GVFI proof] |
| Why different | Explicit correlation volumes vs R1–R3; denser than SGM sparse match |
| Code license | **CC BY-NC 4.0** (non-commercial without permission) |
| Weight license | **UNKNOWN** separate SPDX (Drive/HF) |
| Commercial / Redistribution | **Product path EXCLUDE** under NC |
| Windows / 5060 | PyTorch likely OK [SUPPORTED class] |
| Risk | NC; still mid-blend VFI family cousin risk |

#### B3 — BiM-VFI (Bidirectional Motion Field)

| Field | Content |
|-------|---------|
| Candidate / Method | BiM-VFI |
| Paper | CVPR 2025 Seo et al. |
| Official repository | https://github.com/KAIST-VICLab/BiM-VFI |
| Year | 2025 |
| Technical paradigm | Bidirectional motion field for non-uniform motion; targets blur ambiguity |
| P0/P1 | Smear/blur thesis adjacent [SUPPORTED relevance]; Ghost∧Smear dual GO **UNKNOWN** |
| Why different | Explicit BiM descriptor vs sparse pose / ROI paste; aims at non-uniform motion blur |
| Code license | GitHub license **null → UNKNOWN** |
| Weight license | **UNKNOWN** |
| Commercial | **Cannot PASS** |
| Eng / GPU | PyTorch; complexity Medium–High; 5060 **UNKNOWN** until profiled |
| Risk | May be “better motion VFI” without solving dual-defect (C11-E caution) [SUPPORTED] |

---

### C. Dense Human / Limb Reconstruction

#### C1 — PoseFuse3D-KI (SMPL-X + generative prior)

| Field | Content |
|-------|---------|
| Candidate / Method | PoseFuse3D-KI |
| Paper | NeurIPS 2025 Guo et al. — Controllable Human-centric Keyframe Interpolation |
| Official repository | https://github.com/GSeanCDAT/PoseFuse3D-KI · project https://gseancdat.github.io/projects/PoseFuse3D_KI |
| Year | 2025 |
| Technical paradigm | **Dense/3D human geometry (SMPL-X) + generative video prior** — not sparse 2D bone ribbons |
| P0 relevance | Articulated human mid synthesis — direct to dance limbs [SUPPORTED topical fit; win **HYPOTHESIS**] |
| P1 relevance | Structure under large articulated motion [HYPOTHESIS] |
| Why different from R3 | R3 = MediaPipe sparse joints + affine ribbons (**failed GO**). This = **3D body model + diffusion control** — denser geometry/appearance prior |
| Ghost / Smear theses | One articulated body hypothesis + generative fill [HYPOTHESIS] |
| Code license | GitHub **Other / NOASSERTION** |
| Paper license note | OpenReview lists **CC BY-NC 4.0** on submission metadata → treat commercial as **blocked until cleared** |
| Weight license | **UNKNOWN** / tied to diffusion + SMPL-X stack |
| Commercial / Redistribution | **EXCLUDE for product** until formal clearance; research-only possible under NC constraints |
| Windows / 5060 | Heavy diffusion → VRAM/time risk **HIGH** [SUPPORTED class risk] |
| Eng complexity | **Very High** |
| Risk | NC/NOASSERTION; hallucination; monocular SMPL-X error on blurry limbs |

#### C2 — Forge4D / multi-view 4D human (demote for GVFI monocular)

| Field | Content |
|-------|---------|
| Candidate | Forge4D (arXiv 2025) |
| Fit | Sparse-view **multi-camera** 4D human — poor match to GVFI single-clip 2D pipeline |
| Rank | Documented as dense-human family member; **not** recommended next A/B |

**Critical distinction (binding):**  
R3 sparse-pose implementation **FAILED GO** = **CONFIRMED**.  
“All human-prior methods fail” = **HYPOTHESIS — rejected as overclaim**.

---

### D. Generative / Inpainting-style Intermediate Synthesis

#### D1 — EDEN (Enhanced Diffusion for Large-motion VFI)

| Field | Content |
|-------|---------|
| Candidate / Method | EDEN |
| Paper | CVPR 2025 Zhang et al. |
| Official repository | https://github.com/bbldCVer/EDEN · https://bbldcver.github.io/EDEN/ |
| Year | 2025 |
| Technical paradigm | Generative diffusion VFI for large motion |
| P0/P1 | Large-motion perceptual quality; may synthesize single instance vs layered ghost [HYPOTHESIS] |
| Why different | Latent generative mid ≠ ROI/OF/pose heuristic; not ordinary flow blend |
| Ghost thesis | Generation conditioned on ends may avoid translucent doubles [HYPOTHESIS] |
| Smear thesis | Diffusion claims sharpness under large motion [paper claim]; dual-defect GO **UNKNOWN** |
| Code license | **Apache-2.0** (GitHub) |
| Weight license | **UNKNOWN** (must re-check before any run) |
| Commercial | Code Apache ≠ weight PASS; overall **not commercial PASS** until weights cleared |
| Redistribution | Weights **UNKNOWN** |
| Windows / 5060 | Possible with care; diffusion VRAM **HIGH risk** [SUPPORTED] |
| Eng complexity | High |
| Risk | Hallucination · identity drift · temporal flicker · still may morph perceptually |

#### D2 — LDMVFI

| Field | Content |
|-------|---------|
| Candidate / Method | LDMVFI |
| Paper | AAAI 2024 Danier et al. |
| Official repository | https://github.com/danier97/LDMVFI |
| Year | 2024 |
| Technical paradigm | Latent diffusion conditional VFI |
| Code license | **MIT** (GitHub) |
| Weight license | Drive ckpt → **UNKNOWN** separate |
| Commercial | Code MIT OK-ish; weights UNKNOWN → **no commercial PASS** |
| Eng / GPU | Heavy; 5060 feasibility **UNKNOWN** |
| Risk | Same generative risks; not limb-specialized |

#### D3 — Generic video inpainting (AVID etc.) — lower for VFI mid

| Field | Content |
|-------|---------|
| Note | Text-guided video inpainting (e.g. AVID, MIT code) is related but not turnkey `t=0.5` VFI; useful as **inspiration** for mask-conditioned limb fill, not as drop-in next A/B |

---

## License matrix

| Item | Code | Weights | Commercial ship? |
|------|------|---------|------------------|
| SoftSplat-class visibility | Academic-restricted (prior) | — | **EXCLUDE** |
| OCAI | **UNKNOWN** / no public repo found | **UNKNOWN** | **No PASS** |
| VOS-VFI | **UNKNOWN** | **UNKNOWN** | **No PASS** |
| SGM-VFI | Apache (prior) | UNKNOWN + SoftSplat | **EXCLUDE** ship |
| AMT | **CC BY-NC** | UNKNOWN | **EXCLUDE** |
| BiM-VFI | **UNKNOWN** | **UNKNOWN** | **No PASS** |
| PoseFuse3D-KI | NOASSERTION | UNKNOWN + NC paper meta | **EXCLUDE** until cleared |
| EDEN | **Apache-2.0** | **UNKNOWN** | **No PASS** until weights cleared |
| LDMVFI | **MIT** | **UNKNOWN** | **No PASS** until weights cleared |

**Rule restated:** code MIT/Apache + weights UNKNOWN ⇒ overall commercial **≠ PASS**.

---

## Engineering matrix (static)

| Paradigm | Windows | RTX 5060 | Stack | Eng cost |
|----------|---------|----------|-------|----------|
| Visibility / Occlusion (non-SoftSplat) | Likely | Likely | PyTorch first | Med–High |
| Bidirectional correspondence | Likely | Likely | PyTorch | Med–High |
| Dense human (SMPL-X + diffusion) | Harder | Tight VRAM | PyTorch + body models | Very High |
| Generative VFI (EDEN/LDMVFI) | Harder | Tight VRAM | PyTorch diffusion | High |
| ncnn/Vulkan productization | — | — | **UNKNOWN** for all new classes | Separate later |

---

## P0 / P1 relevance (to GVFI defects)

| Paradigm | P0 layered Ghost | P1 Warp/Smear | Notes |
|----------|------------------|---------------|-------|
| Visibility / Occlusion | ★★★ | ★★★ | Best mechanistic story for translucency conflict |
| Generative / Inpainting | ★★★ | ★★ | Sharpness claims; structure risk via hallucination |
| Dense Human / Limb | ★★★ | ★★ | Articulation prior; R3≠dense |
| Bidirectional Correspondence | ★★ | ★★ | Large motion yes; SGM already morph’d |

---

## Cross-paradigm ranking → Top 3

| Rank | Paradigm | Label |
|-----:|----------|-------|
| **1** | Explicit Visibility / Occlusion Reasoning | **P0** |
| **2** | Generative / Inpainting-style Intermediate Synthesis | **P1** |
| **3** | Dense Human / Limb Reconstruction | **P2** |

**Watchlist (not Top 3):** Bidirectional Correspondence (BiM-VFI / denser correlation) — only after SoftSplat-free, non-SGM-cousin thesis + license clear.

---

## Top 1 recommendation

**Top 1 = Explicit Visibility / Occlusion Reasoning** (SoftSplat-free instantiation required for any product path).

### Why Top 1

1. **Defect fit:** P0 Ghost is layered/translucent multi-contour — visibility conflict is the closest named mechanism [SUPPORTED morphological fit; causal proof **HYPOTHESIS**].  
2. **C11-A card:** SoftSplat/occlusion theory was already flagged as P0/P1-adjacent; blocked then by **license**, not by “wrong problem.”  
3. **Difference from R1–R3:** R1–R3 never modeled who-sees-whom; they replaced/cleaned/ribboned pixels.  
4. **Dual-defect thesis:** Ghost↓ by single visible winner; Smear control by visible-side structure fill / hole handling — **HYPOTHESIS**, but coherent.  
5. **Public materials exist** at paper/class level (OCAI, VOS-VFI, SoftSplat literature) even if some repos are incomplete/NC.

### Why not the others as Top 1

| Alternative | Why not #1 now |
|-------------|----------------|
| Generative / Inpainting | Strong paradigm difference, but higher eng/VRAM/hallucination risk; weight clearance heavier; better as **P1** after visibility thesis scoped |
| Dense Human | Worth keeping (R3≠dense), but SMPL-X+diffusion license/eng cost worse; NC signals on PoseFuse3D-KI |
| Bidirectional Correspondence | Partially spent (SGM WEAK-GO); AMT NC; BiM still cousin-risk + license UNKNOWN |

---

## Core Q&A

| # | Question | Answer | Grade |
|---|----------|--------|-------|
| 1 | Stop ordinary VFI as default? | **Yes** | **CONFIRMED** (C11-E) |
| 2 | Visibility closer to problem than R1–R3? | **Yes as thesis fit** | **SUPPORTED**; experimental win **UNKNOWN** |
| 3 | Bidirectional correspondence distinct thesis? | **Yes in principle**; partially already tested via SGM | Mechanism distinct **SUPPORTED**; new GO hope **UNKNOWN** |
| 4 | Dense human worth continuing? | **Yes as class** (≠ sparse R3 fail) | **SUPPORTED** distinction; win **HYPOTHESIS** |
| 5 | Generative/inpainting worth research? | **Yes as P1** | **SUPPORTED** priority; win **HYPOTHESIS** |
| 6 | Most likely to break Ghost↓→Smear↑? | Visibility (conflict resolve) or Generative (non-warp synthesis) | **HYPOTHESIS** |
| 7 | Best for RTX 5060 / Windows? | Visibility / lighter correspondence first; diffusion last | **SUPPORTED** engineering judgment |
| 8 | Worst license/commercial risk? | SoftSplat-class · AMT NC · PoseFuse3D-KI NC/NOASSERTION · diffusion weights UNKNOWN | **CONFIRMED** for NC declarations; others **UNKNOWN** |
| 9 | If only one next direction? | **Explicit Visibility / Occlusion (SoftSplat-free)** | Design recommendation |
| 10 | Why not the other three? | See “Why not” table above | — |

---

## CONFIRMED / SUPPORTED / HYPOTHESIS / UNKNOWN

| Claim | Grade |
|-------|-------|
| Ordinary VFI default hunt should stay stopped | **CONFIRMED** |
| R1–R3 all Ghost↓ without dual-defect GO | **CONFIRMED** |
| Ghost→Smear is a stable morphological pattern | **CONFIRMED** |
| Internal causal mechanism of morph | **HYPOTHESIS** (unproven) |
| Sparse R3 fail ≠ all human-prior fail | **SUPPORTED** (logical + PoseFuse3D-KI existence) |
| Visibility paradigm best mechanistic fit to layered Ghost | **SUPPORTED** |
| Visibility / Generative / Dense-human will achieve GO | **HYPOTHESIS** |
| SoftSplat / AMT / PoseFuse3D-KI product-blocked without clearance | **CONFIRMED** (NC/academic/NOASSERTION signals as recorded) |
| Which concrete package to A/B first | **UNKNOWN** until C13-A auth + license deep-dive |

---

## C13-0 Verdict

# **CONTINUE_RESEARCH**

**Basis:** ≥1 paradigm (Visibility; also Generative & Dense-human) has (a) clear mechanism difference from R1–R3, (b) plausible P0/P1 thesis, (c) public papers/repos, (d) research value under C12-D paradigm change.

**Not HOLD:** evidence does not say “no interesting next class exists”; it says “don’t repeat ordinary VFI / ROI-OF-sparse-pose.”

**Not C13-A:** no package selected to download or run.

---

## Stop condition

| Check | Result |
|-------|--------|
| Download / install / Smoke / A/B | **No** |
| GVFI / VideoWorker / `backend_mode` / RIFE | **Unchanged** |
| C13-A started | **No** |
| Specific model auto-chosen to run | **No** |

**Stop after this document.** Await **new explicit authorization** before C13-A (package pick + license deep-dive + isolated A/B).

---

## Final box

| # | Item | Value |
|---|------|--------|
| 1 | **C13-0 Verdict** | **CONTINUE_RESEARCH** |
| 2 | **Top 1** | Explicit Visibility / Occlusion Reasoning (SoftSplat-free) |
| 3 | **Top 2** | Generative / Inpainting-style Intermediate Synthesis |
| 4 | **Top 3** | Dense Human / Limb Reconstruction (≠ sparse R3) |
| 5 | Production | **`cli` + `rife-v4.6`** |
| 6 | Production modified | **NO** |
| 7 | C13-A started | **NO** |
| 8 | Report | `docs/c13-0-paradigm-screening.md` |
