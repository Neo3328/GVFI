# C12-D — Human/Limb Route Synthesis & Exit Decision

**Date:** 2026-08-13  
**Phase:** Evidence synthesis & exit decision only · **no new experiment** · **no download** · **no production change**  
**Sources (disk):** C11-E · C12-A · C12-B · C12-C reports + `scores.json` / manifests  

**Production preserved:** `backend_mode=cli` · RIFE **`rife-v4.6`**  

**Forbidden performed:** no download · no A/B/Smoke · no GVFI / VideoWorker / `backend_mode` / RIFE change · no re-scoring · no sample re-selection · no C12-E · no new model research start  

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Executive Summary

C11-E rejected **blind ordinary VFI** after IFRNet / SGM-VFI / PerVFI / EMA-VFI all showed **Ghost↓ + Smear↑** with **zero dual-defect GO**.  
C12 then tested three **Human/Limb-aware** routes on the same locked slots (**#12 / #21 / #36 / #39 / #130**, `t=0.5`, 720×1038):

| Route | Verdict | Ghost | Smear | Overall | Morph | GO |
|-------|---------|-------|-------|---------|-------|-----|
| **R1** ROI/activity local mid | **WEAK-GO** | 2.8→1.0 | 2.0→3.0 | 2.8→2.8 (0/5↑) | **5/5** | **No** |
| **R2** OF Ghost-clean + LSR | **WEAK-GO** | 2.8→1.0 | 2.0→3.0 | 2.8→2.8 (0/5↑) | **5/5** | **No** |
| **R3** Pose/skeleton-guided | **WEAK-GO** | 2.8→1.0 | 2.0→2.6 | 2.8→2.6 (1/5↑) | **3/5** | **No** |

**No Human/Limb route reached GO.** R3 is the least-bad of the three (Smear mean +0.6 vs +1.0; one Overall win on #36) but still fails dual-defect gates. Continuing another ROI / simple-OF / sparse-pose heuristic is **diminishing EV**.

# C12-D Verdict = **CHANGE_TECHNICAL_PARADIGM**

| Lock | Value |
|------|--------|
| Current phase | **C12-D complete** |
| Production | **`backend_mode=cli` + `rife-v4.6`** |
| Production modified | **NO** |
| New experiment started | **NO** |
| C12-E started | **NO** |

---

## Evidence baseline

### Shared protocol (unchanged)

| Item | Value |
|------|--------|
| Clip / SRC | Same dance stills lineage (`rife-defect-audit\src`) |
| Slots | **#12 / #21 / #36 / #39 / #130** |
| Excluded | **#25** |
| Timestep | **`t=0.5`** both sides |
| Resolution | **720×1038** |
| Side A | Offline **`rife-v4.6`** mids (C10-D copies) |
| Rubric | Ghost / Smear / Occlusion / Warp / Overall 0–3 |
| Morph rule | Ghost↓ + Smear↑ ⇒ Overall not credited |
| GO (all required) | Ghost mean↓ · Smear mean not↑ · Overall mean↓≥0.6 · Overall↑≥3/5 · no major morph |

### Prior campaign posture (C11-E)

| Item | Value |
|------|--------|
| C11-E Verdict | **CHANGE_APPROACH** |
| Ordinary VFI (IFRNet/SGM/PerVFI/EMA) | All **WEAK-GO**; Ghost→Smear morphological pattern **CONFIRMED** |
| Production | Kept **`cli` + `rife-v4.6`** |

### Defect framing (C10-B / C11-E — not re-scored)

| Claim | Grade |
|-------|-------|
| P0 = fast-limb **layered Ghost** on reliable mids | **CONFIRMED** |
| P1 = motion-boundary **Warp/Smear** present on several mids | **CONFIRMED** |
| Exact ghost area / displacement without reliable limb mask | **UNKNOWN** |

---

## R1 / R2 / R3 comparison

Numbers copied from disk `scores.json` — **not re-scored**.

### Master table

| Route | Ghost (RIFE→) | Smear | Occlusion | Warp | Overall | Overall↑ | Morph | GO | Main failure | Conclusion |
|-------|---------------|-------|-----------|------|---------|----------|-------|-----|--------------|------------|
| **RIFE baseline** | 2.8 | 2.0 | 2.0 | 1.6 | 2.8 | — | Layered Ghost | Shipping | P0 Ghost | Production |
| **R1** activity matte + single-SRC half-translation | **1.0** (−1.8) | **3.0** (+1.0) | 2.0 | 1.6 (0) | **2.8** (0) | **0/5** | **5/5** | **No** | Ghost→Smear; no structure restore | **WEAK-GO** |
| **R2** OF Ghost-clean + freq-split LSR + clone | **1.0** (−1.8) | **3.0** (+1.0) | 2.0 | **2.6** (+1.0) | **2.8** (0) | **0/5** | **5/5** | **No** | LSR fails; Warp↑; same morph | **WEAK-GO** |
| **R3** Pose lerp + bone-affine ribbon WTA | **1.0** (−1.8) | **2.6** (+0.6) | 2.0 | **2.4** (+0.8) | **2.6** (−0.2) | **1/5** (#36) | **3/5** | **No** | Morph on 3/5; ribbon/Warp artifacts; Overall gates fail | **WEAK-GO** |

### GO gate rollup

| Gate | R1 | R2 | R3 |
|------|:--:|:--:|:--:|
| Ghost mean ↓ | PASS | PASS | PASS |
| Smear mean not worse | FAIL | FAIL | FAIL |
| Overall mean ↓ ≥ 0.6 | FAIL | FAIL | FAIL |
| Overall↑ ≥ 3/5 | FAIL | FAIL | FAIL |
| No major morph | FAIL | FAIL | FAIL |
| **all_pass** | **No** | **No** | **No** |

### Ranking among Human/Limb WEAK-GOs (not GO)

| Rank | Route | Why |
|-----:|-------|-----|
| 1 (least bad) | **R3** | Lowest Smear mean among three; only route with any Overall↑ (1/5); morph 3/5 not 5/5 |
| 2 | **R1** | Ghost↓ real; Warp not worsened; but Smear +1.0 and 0/5 Overall |
| 3 (worst) | **R2** | Same Ghost/Smear/Overall as R1 morph, **plus** Warp mean↑ |

**R3 vs R1/R2 substantive net dual-defect gain?**  
**No** for GO purposes (**CONFIRMED** by gates).  
**Partial relative improvement** on Smear mean and one frame Overall (**SUPPORTED** by score deltas only) — **not** dual-defect success.

---

## Common failure pattern

### Key Q&A (evidence-graded)

| # | Question | Answer | Grade |
|---|----------|--------|-------|
| 1 | R1/R2/R3 all lower Ghost? | **Yes** — each **2.8→1.0** on **5/5** | **CONFIRMED** |
| 2 | Ghost→Smear on Human/Limb routes? | **Yes** — R1/R2 morph **5/5**; R3 morph **3/5**; all Smear means ↑ | **CONFIRMED** (morphology / scores) |
| 3 | R3 substantive net improve vs R1/R2? | **Not for GO**; mild relative Smear/Overall edge only | **SUPPORTED** (ranking); dual-defect win = **CONFIRMED absent** |
| 4 | Any route Ghost↓ ∧ Smear not↑ ∧ Overall clearly↓? | **No** | **CONFIRMED** |
| 5 | Any route reaches GO? | **No** | **CONFIRMED** |
| 6 | P0 still fast-limb layered Ghost (baseline)? | **Yes** (C10-B; Side A unchanged) | **CONFIRMED** |
| 7 | P1 still motion-boundary Warp/Smear? | **Yes** on baseline; several R2/R3 frames Warp↑ | **CONFIRMED** (scores) |
| 8 | “ROI alone cannot solve”? | ROI localization enables Ghost↓ (**SUPPORTED**) but **does not** deliver dual-defect GO under tested local fills | Dual-defect fail under R1 = **CONFIRMED**; “ROI never helps any future method” = **HYPOTHESIS / overclaim — reject** |
| 9 | “Simple OF / Structure Restore cannot solve”? | Tested R2 OF+LSR **failed** dual-defect GO | This class fail = **CONFIRMED**; all possible OF/LSR forever = **HYPOTHESIS** |
| 10 | “Pose geometry still insufficient”? | Tested sparse MediaPipe bone-affine R3 **failed** GO | This implementation class fail = **CONFIRMED**; all pose/human-prior systems forever = **HYPOTHESIS** |

### Why three different routes all get Ghost↓ without Ghost↓+Smear↓?

**Allowed statement (outcome-level only):**

> 结果表现出稳定的 Ghost→Smear 形态转换（以及 R3 上部分帧的 Warp/artifact 替代），但其内部因果机制尚未被实验直接证明。

What is **CONFIRMED** as an **outcome pattern**:

1. Removing RIFE’s **layered / translucent extra limb** is achievable by several local interventions (matte replace, OF WTA clean, skeleton ribbon).  
2. On this clip’s P0 slots, that Ghost↓ repeatedly co-occurs with **worse or non-improved limb unity** (Smear↑ and/or Warp↑), so Overall is not credited under protocol.  
3. Adding an explicit Stage-B “structure restore” (R2) or sparse pose prior (R3) **did not** convert the morph into dual-defect GO.

What remains **HYPOTHESIS** (not proven here):

- That Ghost removal *necessarily* consumes limb structure under large motion.  
- That each route’s internal algorithm “works the same way.”  
- That no future paradigm can break the morph.

---

## CONFIRMED / SUPPORTED / HYPOTHESIS / UNKNOWN

| Claim | Grade |
|-------|-------|
| RIFE P0 layered Ghost real on #12/#21/#36/#39/#130 | **CONFIRMED** |
| R1, R2, R3 each lower Ghost mean 2.8→1.0 (5/5) | **CONFIRMED** |
| R1 & R2: Smear mean 2.0→3.0; morph 5/5; Overall flat; GO fail | **CONFIRMED** |
| R3: Smear mean 2.0→2.6; morph 3/5; Overall 2.8→2.6 (1/5↑); GO fail | **CONFIRMED** |
| Zero Human/Limb route reaches dual-defect GO | **CONFIRMED** |
| Ghost→Smear (or Ghost→artifact/Warp) is a stable **morphological** pattern across R1–R3 | **CONFIRMED** |
| C11 ordinary VFI + C12 Human/Limb heuristics both fail the same dual-defect bar | **CONFIRMED** |
| R3 is least-bad among R1–R3 on recorded means | **SUPPORTED** |
| Marginal EV of another similar ROI/OF/sparse-pose heuristic is low | **SUPPORTED** |
| Problem is fundamental to all mid-frame synthesis under fast human motion | **HYPOTHESIS** |
| Which untested paradigm would break Ghost∧Smear | **UNKNOWN** |
| Production must ship a P0 Ghost fix now | **UNKNOWN** (product choice; not decided by this research alone) |

---

## Technical interpretation

| Route | What was tested | What failed |
|-------|-----------------|-------------|
| **R1** | ROI/activity matte + simple local replacement (single-SRC half-translation) | Ghost↓ without structure; pure morph |
| **R2** | OF-based Ghost-clean + explicit LSR stage | Stage B non-inert but **did not** restore anatomy; Warp↑; morph remains |
| **R3** | Pose/skeleton geometry prior (MediaPipe + bone-affine ribbons) | Pose detectable; still Smear mean↑; morph 3/5; Overall gates fail |

**Bridge from C11-E:** changing from “swap whole VFI” to “keep RIFE + limb-aware post/hybrid” **did** localize intervention and **did** reduce Ghost — but **did not** solve dual-defect. That closes the C12-0 primary thesis as **GO-capable under tested instantiations**.

---

## Exit decision

Must choose **exactly one**:

### Options check

| Option | Condition | Fits? |
|--------|-----------|:-----:|
| **A. CONTINUE_LIMB_RESEARCH** | A route is **near GO** **and** a next mechanism is clearly **unlike** R1/R2/R3 | **No** — R3 is best but far from GO (Overall↓ 0.2≪0.6; Overall↑ 1/5≪3/5; Smear still↑; morph 3/5). Next “better matte / OF / denser keypoints” would still be the same heuristic family |
| **B. CHANGE_TECHNICAL_PARADIGM** | R1/R2/R3 all miss dual-defect GO; similar ROI/OF/Pose heuristics show diminishing returns | **Yes** |
| **C. HOLD_RIFE** | Product does not need P0 fix; research value insufficient | **Viable product posture**, but **not** selected as the research exit: P0 remains a documented shipping defect, and evidence now justifies a **paradigm change** if research continues — not silent abandonment without that product decision |

### Chosen

# **CHANGE_TECHNICAL_PARADIGM**

**Reasons (evidence-tied):**

1. **CONFIRMED:** three distinct Human/Limb instantiations → **zero GO**.  
2. **CONFIRMED:** Ghost↓ without dual-defect win repeats (C11 VFI + C12 limb).  
3. **SUPPORTED:** R3’s edge over R1/R2 is small vs GO distance → low EV for another similar heuristic.  
4. **CONTINUE_LIMB_RESEARCH** would require inventing a near-GO claim the scores do not support.

---

## Recommended future research class (discussion only — **not started**)

If later authorized, prefer paradigms **structurally unlike** R1/R2/R3 heuristics:

| Class | Why it differs from R1–R3 | Why it might matter |
|-------|---------------------------|---------------------|
| **Explicit visibility / occlusion reasoning** | Models who-sees-whom / z-order, not only ROI replace or bone ribbons | P0 Ghost often looks like multi-hypothesis translucency; P1 adjacent |
| **Bidirectional correspondence / explicit correspondence reconstruction** | Rebuild mid from consistent matches rather than local paste/WTA | Targets multi-contour vs single-instance geometrically |
| **Stronger human/limb reconstruction** (dense part geometry, not sparse 4-bone affine) | Goes beyond MediaPipe ribbon heuristics | R3 showed pose *helps a little* (#36) but sparse geometry was insufficient (**CONFIRMED** for that setup) |
| **Generative / inpainting-style intermediate synthesis** | Hallucinate single limb under mask with appearance prior, not OF/SRC WTA | Attacks smear by synthesis rather than warp mush — **untested**; license/product risk **UNKNOWN** |
| **Other fundamentally different midpoint generators** | Must state an explicit dual-defect thesis vs morph | Avoid another mid-blend cousin (C11-E) |

**Rules for any future work (binding reminders):**

- Do **not** auto-pick a model here.  
- Do **not** download / run without new auth.  
- Re-check: weight license · commercial redistribution · RTX 5060 · Windows · eng complexity.  
- Keep dual-defect GO; never credit Ghost↓ alone as Overall win.

---

## Production conclusion

| Lane | Status |
|------|--------|
| **Production** | **`backend_mode=cli`** · **RIFE=`rife-v4.6`** — **unchanged** |
| **Research VFI** | IFRNet / SGM-VFI / PerVFI / EMA-VFI — all **WEAK-GO** (C11-E) |
| **Human/Limb** | R1 / R2 / R3 — all **WEAK-GO** (C12-A/B/C) |
| Integrate any of the above? | **NO** |
| Replace production RIFE? | **NO** — no GO winner |

**WEAK-GO must not be rewritten as GO.**

---

## Stop condition

| Check | Result |
|-------|--------|
| New experiment / download / A/B | **No** |
| GVFI / VideoWorker / `backend_mode` / RIFE | **Unchanged** |
| Historical scores edited | **No** |
| C12-E started | **No** |
| New model research started | **No** |

**Stop after this document.** Await **new explicit authorization** before any further experiment, paradigm pilot, or production work.

---

## Source index (read, not re-run)

- `docs/c11-e-cross-candidate-failure-synthesis.md`  
- `docs/c12-a-r1-limb-roi-directed-ab.md` · `D:\GVFI-deps\c12a-r1-limb-roi-ab\metrics\scores.json`  
- `docs/c12-b-r2-structure-restore-directed-ab.md` · `D:\GVFI-deps\c12b-r2-structure-restore-ab\metrics\scores.json`  
- `docs/c12-c-r3-pose-skeleton-directed-ab.md` · `D:\GVFI-deps\c12c-r3-pose-ab\metrics\scores.json`  

---

## Final box (required)

| # | Item | Value |
|---|------|--------|
| 1 | **C12-D Verdict** | **CHANGE_TECHNICAL_PARADIGM** |
| 2 | Current phase | **C12-D complete** |
| 3 | R1/R2/R3 | All **WEAK-GO**; **zero GO** |
| 4 | Ghost↓ on all three? | **Yes — CONFIRMED** |
| 5 | Ghost→Smear (Human/Limb)? | **Yes — CONFIRMED morphological pattern** |
| 6 | Dual-defect GO anywhere? | **No — CONFIRMED** |
| 7 | Production | **`cli` + `rife-v4.6`** |
| 8 | Production modified | **NO** |
| 9 | New experiment started | **NO** |
| 10 | C12-E started | **NO** |
| 11 | Report path | `docs/c12-d-human-limb-route-synthesis.md` |
