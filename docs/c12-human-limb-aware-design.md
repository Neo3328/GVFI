# C12-0 — Human / Limb-Aware Dual-Defect Design

**Date:** 2026-08-13  
**Phase:** **Design only** · **no experiment** · **no download** · **no production change**  
**Prior stop:** C11-E Verdict = **CHANGE_APPROACH**  

**Production preserved (binding):** `backend_mode=cli` · RIFE **`rife-v4.6`**  

**Forbidden this phase:** download models · run A/B · modify GVFI · call VideoWorker · change `backend_mode` · replace RIFE · auto-enter **C12-A** / integration  

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Status of this document

| Item | Value |
|------|--------|
| Document type | Human/limb-aware **route design** |
| Experiment executed? | **No** |
| Models downloaded? | **No** |
| Production touched? | **No** |
| C12-A authorized? | **No** (design ≠ auth) |

**C12-0 方案已经设计完成，但尚未执行。**

---

## 0. Why C12 (from C11-E — CONFIRMED only)

| Fact | Source | Grade |
|------|--------|-------|
| RIFE-v4.6 shows stable fast-limb **layered Ghost** on #12/#21/#36/#39/#130 | C10-B | **CONFIRMED** |
| IFRNet / SGM-VFI / PerVFI / EMA-VFI all **lower Ghost** | C10-D…C11-D | **CONFIRMED** |
| Mean **Smear rises**; Ghost→Smear morph repeats across families | C11-E | **CONFIRMED** |
| **Zero** dual-defect GO; no Ghost∧Smear simultaneous win | C11-E | **CONFIRMED** |
| Blind ordinary VFI hunt is rejected as default | C11-E | **CONFIRMED decision** |

**Binding rule for C12:** do **not** propose another “swap whole VFI model and hope.”  
Any C12 route must **explicitly target Ghost and Smear together** on the same P0 limb regions.

**Core question:**

> 能否用 **人体/肢体感知** 处理，在保持或改善 RIFE 全局可用性的同时，使高速肢体 **Ghost↓ 且 Smear 不恶化（优先↓）**，并让 Overall 明确下降？

---

## 1. Goals & non-goals

### Goals

1. Design ≥3 **distinct** human/limb-aware technical routes.  
2. Each route must state **how Ghost and Smear are both attacked**.  
3. Reuse C11 evaluation slots and dual-defect GO gates.  
4. Rank routes; recommend one for a **later authorized** C12-A (not started here).

### Non-goals

- Blind IFRNet/SGM/PerVFI/EMA-class retests  
- Production integration / VideoWorker / `backend_mode` change  
- Claiming untested routes as CONFIRMED fixes  
- Auto-start C12-A

---

## 2. Evaluation contract (unchanged)

| Item | Rule |
|------|------|
| Frames | **#12 / #21 / #36 / #39 / #130** (#25 excluded) |
| Protocol | Same SRC n/n+1 · **`t=0.5`** · **720×1038** · isolated deps |
| Side A | Offline **`rife-v4.6`** mids (reuse C10-D/C11 copies) |
| Rubric | Ghost / Smear / Occlusion / Warp / Overall 0–3 |
| Morph rule | Ghost↓ + Smear↑ ⇒ Overall **not** credited |
| GO (all required) | Ghost mean↓ · Smear mean not↑ · Overall mean↓≥0.6 · Overall↑≥3/5 · no major Ghost→Smear morph |
| Production | Always **`cli` + `rife-v4.6`** until separate ship auth |

---

## 3. Evidence grades used in this design

| Grade | Meaning |
|-------|---------|
| **CONFIRMED** | Already measured in C10–C11 |
| **SUPPORTED** | Strongly implied by multiple morph results |
| **HYPOTHESIS** | Plausible C12 thesis — **not proven** |
| **UNKNOWN** | Needs experiment / legal / eng check |

---

## 4. Route catalog (≥3)

### Route R1 — Limb-ROI dual-path fusion (structure-preserving local mid)

| Field | Content |
|-------|---------|
| Idea | Keep **global RIFE mid** for body/background; in a **limb ROI mask**, replace or blend with a **structure-preserving local mid** that forbids both (a) multi-contour ghost and (b) amorphous smear |
| Ghost attack | Local path constrained to **one limb instance** (mask / instance ID continuity from SRC n↔n+1); reject double-contour composites |
| Smear attack | Local synthesis uses **edge / skeleton / silhouette priors** (or high-frequency preserve) so the limb is not allowed to collapse into a mush blob |
| Dual-defect link | Ghost and Smear are controlled **in the same ROI fusion objective**, not by swapping global VFI |
| Eng shape | Post-process or hybrid on top of shipping RIFE — lower product risk than full model replace |
| License risk | Depends on pose/seg stack chosen later — **UNKNOWN** until selected |
| Grade | Thesis = **HYPOTHESIS**; need for ROI localization = **SUPPORTED** (diff energy on arms in prior A/Bs) |

### Route R2 — Two-stage: Ghost-clean then Limb Structure Restore (LSR)

| Field | Content |
|-------|---------|
| Idea | **Stage A:** produce a mid with reduced layered Ghost (may temporarily look smear-like). **Stage B:** **limb-only restore** (structure / texture / edge refine) inside mask so Smear is pulled back down |
| Ghost attack | Stage A may reuse a known Ghost↓ generator **only as an intermediate**, not as final deliverable |
| Smear attack | Stage B is **explicitly anti-smear**: restore single-limb contour + local detail; fail Stage B ⇒ fail route |
| Dual-defect link | Separates “remove double contour” from “restore structure” — directly answers C11 morph failure |
| Risk | Stage A alone = morph (CONFIRMED pattern). Route **invalid** if Stage B is skipped |
| Eng shape | Research pipeline first; production only if both stages clear GO |
| Grade | Stage-A morph without Stage-B = **CONFIRMED failure mode**; Stage-B success = **HYPOTHESIS** |

### Route R3 — Pose / skeleton guided intermediate geometry

| Field | Content |
|-------|---------|
| Idea | Estimate pose (or sparse limb keypoints) on SRC n and n+1; **interpolate skeleton at t=0.5**; warp/inpaint limb appearance along the **single interpolated pose**, not unconstrained bidirectional blend |
| Ghost attack | One pose ⇒ one limb geometry ⇒ blocks layered double-arm |
| Smear attack | Appearance fill is anchored to skeleton / part segments ⇒ limits free-form mush; optional part-wise texture copy from nearer SRC |
| Dual-defect link | Geometry prior attacks Ghost; part-constrained fill attacks Smear |
| Risk | Pose error on heavy native blur; occlusion (arm over torso) still hard |
| Eng shape | Extra detectors; not ncnn-native by default |
| Grade | Entire route = **HYPOTHESIS**; occlusion outcome = **UNKNOWN** |

### Route R4 (optional alternate) — Occlusion-aware limb matte + forward-warp with conflict resolve

| Field | Content |
|-------|---------|
| Idea | Explicit **limb matte / occlusion order**, then forward-warp with conflict resolution (not SoftSplat-dependent product stack unless licensed) |
| Ghost attack | Softmax-style conflict or z-order prevents translucent double limbs |
| Smear attack | Matte-limited splat + hole-fill with structure prior; avoid unbounded blur kernel |
| Dual-defect link | Occlusion + warp conflict is P0/P1 adjacent |
| Risk | SoftSplat academic license historically blocked product; must use **cleared** alternate |
| Grade | Theory fit **SUPPORTED** by C11-A SoftSplat card; product path **UNKNOWN/blocked** unless SoftSplat-free |

**R4 is recorded but not recommended as first C12-A** without SoftSplat-free clearance.

---

## 5. How each route addresses Ghost ∧ Smear (summary)

| Route | Ghost lever | Smear lever | Why not “another VFI swap” |
|-------|-------------|-------------|----------------------------|
| **R1** | Single-instance ROI mid | Structure/edge prior in ROI | Global RIFE kept; local dual objective |
| **R2** | Stage A Ghost↓ | Stage B mandatory restore | Morph is expected intermediate, not final |
| **R3** | Single interpolated pose | Part-anchored appearance | Geometry prior before pixels |
| **R4** | Occlusion/conflict resolve | Matte-limited fill | Explicit occlusion model |

---

## 6. Ranking & recommendation

| Rank | Route | Dual-defect thesis | Eng / product fit | Recommend for first authorized C12-A? |
|-----:|-------|--------------------|-------------------|----------------------------------------|
| **1** | **R1 Limb-ROI dual-path** | Strong | Best GVFI fit (RIFE-preserving) | **Yes (primary)** |
| **2** | **R2 Ghost-clean + LSR** | Strongest vs morph narrative | Medium (two stages) | Secondary / ablation |
| **3** | **R3 Pose-guided** | Strong | Higher detector cost | Later if R1 fails |
| — | R4 Occlusion warp | Strong on paper | License minefield | Pause |

### Recommended primary: **R1**

**Reasons (evidence-tied):**

1. C11-E **CONFIRMED** that whole-model swaps convert Ghost→Smear globally.  
2. Prior diffs concentrate on **arms** (**SUPPORTED** localization).  
3. R1 keeps shipping RIFE for non-limb regions → smallest product surface and clearest A/B (“RIFE vs RIFE+limb-aware ROI”).  
4. Dual-defect is enforceable in ROI scoring (same #12…#130 P0 crops).

**R2** is the best **scientific control** against morph: if Stage B is ablated, Overall must not improve — matching C11 lessons.

---

## 7. Suggested C12-A protocol (design only — **do not run**)

When later authorized:

| Step | Action |
|------|--------|
| 0 | Explicit user auth for **C12-A R1 only** |
| 1 | Isolated root e.g. `D:\GVFI-deps\c12a-limb-roi\` |
| 2 | Build minimal limb ROI (manual boxes OK for PoC; auto mask later) on #12/#21/#36/#39/#130 |
| 3 | Side A: RIFE `t=0.5` (reuse) |
| 4 | Side B: RIFE + R1 ROI dual-path |
| 5 | Score dual-defect GO gates; write `docs/c12-a-*.md` |
| 6 | Stop; no production switch |

**Success definition:** same GO as C11-C/D — Ghost↓ ∧ Smear not↑ ∧ Overall clear↓.  
Ghost-only ROI win = **WEAK-GO / morph** again.

---

## 8. Explicit HYPOTHESIS list (do not upgrade without data)

1. Limb ROI processing can lower Ghost **without** raising Smear. (**HYPOTHESIS**)  
2. Pose-guided mid will beat unconstrained blend on this dance clip. (**HYPOTHESIS**)  
3. Two-stage restore can reverse Stage-A smear. (**HYPOTHESIS**)  
4. The morph is inevitable for all pixel VFI without human prior. (**HYPOTHESIS** — C11 only shows it for four families)  
5. Auto limb masks will be accurate under native night motion blur. (**UNKNOWN**)

---

## 9. What C12 deliberately does **not** do

- Retest IFRNet / SGM / PerVFI / EMA as “fixes”  
- FILM / AMT / GIMM / GMFSS product shortcuts  
- SoftSplat-dependent product stacks without grant  
- Claim C12-0 as quality proof  

---

## 10. Decision answers

| # | Question | Answer |
|---|----------|--------|
| 1 | C12 theme | Human/limb-aware **dual-defect** repair |
| 2 | Routes designed | **R1, R2, R3** (+ R4 recorded) |
| 3 | Recommended | **R1** (RIFE + limb-ROI dual-path); R2 as morph-control ablation |
| 4 | Enter C12-A now? | **No** |
| 5 | Production | **`cli` + `rife-v4.6` unchanged** |

---

## Safety check (this design phase)

| Check | Result |
|-------|--------|
| Download / A/B / VideoWorker | **No** |
| GVFI / `backend_mode` / RIFE | **Unchanged** |
| C12-A started | **No** |
| Blind ordinary VFI continued | **No** |

---

## Closing

**C12-0 方案已经设计完成，但尚未执行。**  
Await **new explicit authorization** before C12-A.  
Keep production: **`backend_mode=cli` + `rife-v4.6`**.
