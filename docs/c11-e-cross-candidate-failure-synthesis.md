# C11-E — Cross-Candidate Failure Synthesis

**Date:** 2026-08-13  
**Phase:** Evidence synthesis only · **no new model** · **no new A/B** · **no production change**  
**Sources (disk):** C10-B · C10-D · C11-B · C11-C · C11-D reports + `scores.json` / manifests  

**Production preserved:** `backend_mode=cli` · RIFE **`rife-v4.6`**  

**Forbidden performed:** no download · no new VFI run · no GVFI / VideoWorker / `backend_mode` / RIFE change · no integration · no C11-F · no re-scoring of prior results  

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Decision

# C11-E Verdict = **CHANGE_APPROACH**

| Option | Chosen? | Why |
|--------|:-------:|-----|
| **CONTINUE_VFI** (blind more ordinary VFI) | **No** | Four distinct open families already show the same Ghost→Smear morph; zero GO |
| **CHANGE_APPROACH** | **Yes** | Stop “next ordinary VFI A/B” as default; redirect effort (see §6) |
| **HOLD** | **No** | Evidence is sufficient to reject blind CONTINUE_VFI; not sufficient to pick one new technical fix |

**Production remains:** `backend_mode=cli` · **`rife-v4.6`**  
**Production modified:** **NO**  
**Integration:** **NO**

---

## Scope & comparability notes

| Item | Fact |
|------|------|
| Shared material | Same dance clip SRC; offline fair **`t=0.5`**; **720×1038** |
| Shared slots (full set) | **#12 / #21 / #36 / #39 / #130** (#25 excluded) |
| C11-B subset | SGM scored **n=4** (#21/#36/#39/#130) — **#12 not in C11-B** |
| Rubric | 0–3; Ghost = extra layered/translucent limb only; Ghost↓+Smear↑ ⇒ morph |
| RIFE Side A | Offline `rife-v4.6` mids (C10-D lineage), not CLI `frac≠0.5` slots as primary |

**No original scores were altered.** Numbers below are copied from disk metrics / reports.

---

## 1. Cross-candidate master table

| Candidate | Ghost (RIFE→cand) | Smear | Overall | Overall↑ frames | Morph pattern | P0 conclusion | P1 conclusion | License | Production eligibility |
|-----------|-------------------|-------|---------|-----------------|---------------|---------------|---------------|---------|------------------------|
| **RIFE-v4.6** | Baseline (offline n=5: Ghost **2.8**, Overall **2.8**) | Smear **2.0** | **2.8** | — | Layered limb Ghost on reliable mids (**C10-B**) | P0 Ghost stable | P1 Warp/Smear present | Shipping path | **Production** |
| **IFRNet** (C10-D) | **2.8→1.0** | **2.0→2.8** | **2.8→2.8** | **0/5** | Ghost→Smear on **4/5** Smear↑ | Ghost↓ only | Warp mild/−0.2; not fix | Code MIT · weights **UNKNOWN** | **No** |
| **SGM-VFI** (C11-B) | **3.0→1.0** (n=4) | **2.0→2.5** | **3.0→2.5** | **2/4** | Morph on #21/#36; partial Overall | Ghost↓ | Soft limb remains | Code Apache · weights **UNKNOWN** · SoftSplat academic | **No** |
| **PerVFI** (C11-C) | **2.8→1.0** | **2.0→2.6** | **2.8→2.4** | **2/5** | Morph on #21/#36/#130 | Ghost↓ | Not dual-defect | CLAIMED Apache · SoftSplat in inference | **No** |
| **EMA-VFI** (C11-D) | **2.8→1.0** | **2.0→3.0** | **2.8→2.8** | **0/5** | Morph on **5/5** | Ghost↓ | Worst Smear↑ among four | Code Apache · weights **UNKNOWN** | **No** |

**GO status:** all four candidates **WEAK-GO**; **zero GO**.

---

## 2. RIFE failure mode (C10-B) — CONFIRMED baseline

| Finding | Grade |
|---------|-------|
| Reliable-mid fast-limb **layered Ghost** is stable on #12/#21/#36/#39/#130 | **CONFIRMED** (C10-B; Ghost≥2 on 5/5 reliable mids) |
| #25 is not a mid sample (`frac=0`) — correctly excluded from A/B | **CONFIRMED** |
| P1 motion-boundary Warp/Smear present on several mids | **CONFIRMED** (scores ≥2 on multiple frames) |
| Exact geometric ghost area / displacement | **UNKNOWN** (C10-B: no reliable limb mask) |

---

## 3. Common-pattern Q&A

| # | Question | Answer | Grade |
|---|----------|--------|-------|
| 1 | All candidates lower Ghost? | **Yes** — IFRNet/PerVFI/EMA 5/5; SGM 4/4 | **CONFIRMED** |
| 2 | Smear also rises? | **Yes in mean** for all four; frame-level Smear↑: IFRNet 4/5, SGM 2/4, PerVFI 3/5, EMA **5/5** | **CONFIRMED** |
| 3 | Ghost→Smear cross-model repeatable? | **Yes** — same morphology: layered double → unified/heavy smear | **CONFIRMED** (result pattern) |
| 4 | Any candidate lowers Ghost **and** Smear? | **No** (means: none with Smear Δ≤0 and Ghost↓) | **CONFIRMED** |
| 5 | Any candidate hits Overall GO gates? | **No** | **CONFIRMED** |
| 6 | Closest to GO? | **PerVFI** on n=5 dual-defect gates (Overall −0.4, 2/5↑) — still **fails** Smear + Overall thresholds. SGM shows −0.5 Overall on **n=4** subset only — not a dual-defect GO | **SUPPORTED** (ranking among WEAK-GOs) |
| 7 | Worst on P0/P1? | **EMA-VFI** — Smear **+1.0**, Overall↑ **0/5**, morph **5/5**. IFRNet also Overall↑ **0/5** | **SUPPORTED** |
| 8 | Support blind more ordinary VFI? | **No** — four families already morph | **SUPPORTED** |
| 9 | Structural mid-frame difficulty for fast limbs? | Plausible that ordinary mid-fusion converts double-contour into smear under large limb motion | **HYPOTHESIS** |
| 10 | Mechanism (how each kills Ghost) | Different papers claim different mechanisms; this campaign measured **outcomes**, not internal mechanisms | Mechanism claims → **HYPOTHESIS**; outcome morph → **CONFIRMED** |

---

## 4. Ghost → Smear analysis

### What is CONFIRMED

On the same dance P0 slots at locked `t=0.5`:

1. RIFE’s dominant visible P0 defect is **layered / translucent extra limb contours**.  
2. IFRNet, SGM-VFI, PerVFI, and EMA-VFI **reduce that Ghost score**.  
3. The replacement appearance is typically a **more unified, heavier blur / smear** of the moving limb (often darker or mushier mass).  
4. When Smear rises, Overall is **not** treated as a net win (protocol + observed scores).  
5. This tradeoff repeats across **IFE-class (IFRNet)**, **attention VFI (EMA)**, **sparse global matching (SGM)**, and **perception/asymmetric blend (PerVFI)**.

### What is only HYPOTHESIS

- That each model “kills Ghost by a distinct internal mechanism but always sacrifices limb structure.”  
- That the morph is inevitable for **all** possible VFI (including untested classes: generative video, human-prior, occlusion-oracle, etc.).  
- Causal proof that smear is *necessary* to remove layered ghost.

**Allowed phrasing:**

> 结果表现出稳定的形态转换（layered Ghost → unified Smear），但机制尚未被实验直接证明。

---

## 5. Evidence grades rollup

| Claim | Grade |
|-------|-------|
| RIFE P0 layered Ghost is real & repeatable on this clip | **CONFIRMED** |
| Four candidates lower Ghost vs offline RIFE | **CONFIRMED** |
| Mean Smear worsens for all four | **CONFIRMED** |
| No dual-defect GO | **CONFIRMED** |
| Ghost→Smear is a stable **morphological** cross-candidate pattern | **CONFIRMED** |
| Blind hunting more *ordinary* open VFI is low EV | **SUPPORTED** |
| Problem is structural to mid-frame VFI under large human motion | **HYPOTHESIS** |
| Which untested class would break the morph | **UNKNOWN** |
| Exact SoftSplat / weight legal clearance for ship | **UNKNOWN** / blocked as recorded |

---

## 6. Next-direction analysis (no execution)

| Option | Recommendation | Basis |
|--------|----------------|-------|
| **A. Continue ordinary VFI hunt** | **Reject as default** | Four WEAK-GO morphs; diminishing signal |
| **B. Different-mechanism VFI** | **Conditional later** only if mechanism is *not* another mid-blend/large-motion IFE cousin | Unproven; needs explicit thesis vs morph |
| **C. Fast-human / region-specialized handling** | **Priority research thesis** | Defect is localized to fast limbs (diff energy on arms repeatedly noted) — still **HYPOTHESIS** that specialization helps |
| **D. Accept RIFE baseline; other GVFI work** | **Viable product posture** | No GO replacement exists; production already `cli`+`rife-v4.6` |

**C11-E Decision = CHANGE_APPROACH** means: do **not** auto-queue another C11-style ordinary-candidate A/B. Any next VFI work needs a **new explicit authorization** with a thesis that addresses dual-defect (Ghost∧Smear), not Ghost-only.

---

## 7. Production conclusion

| Item | Value |
|------|--------|
| Production | **`backend_mode=cli`** · **RIFE=`rife-v4.6`** |
| Production modified | **NO** |
| Candidate integration | **NO** |
| Replace RIFE? | **NO** — no GO winner |

---

## 8. Source index (read, not re-run)

- `docs/c10-b-rife-fast-limb-quantification.md`  
- `docs/c10-d-ifrnet-p0p1-ab.md` · `D:\GVFI-deps\c10d-ifrnet-ab\metrics\scores.json`  
- `docs/c11-b-sgm-vfi-directed-ab.md` · `D:\GVFI-deps\c11b-sgm-ab\ab\metrics\scores.json`  
- `docs/c11-c-pervfi-directed-ab.md` · `D:\GVFI-deps\c11c-pervfi-ab\metrics\scores.json`  
- `docs/c11-d-ema-vfi-directed-ab.md` · `D:\GVFI-deps\c11d-ema-ab\metrics\scores.json`  

---

## 9. Safety check

| Check | Result |
|-------|--------|
| New model download / A/B | **No** |
| GVFI / VideoWorker / `backend_mode` / RIFE | **Unchanged** |
| Scores re-edited | **No** |
| C11-F started | **No** |
| Integration | **No** |

---

## 10. Stop

**Stop after this document.**  
Await **new explicit authorization** before any further VFI experiment or production work.

---

## Final box (required)

| # | Item | Value |
|---|------|--------|
| 1 | **C11-E Verdict** | **CHANGE_APPROACH** |
| 2 | Current stage | C11-E synthesis **complete** · stopped |
| 3 | Four-candidate compare | All **WEAK-GO**; Ghost↓; Smear mean↑; no dual-defect GO |
| 4 | Ghost→Smear cross-model? | **Yes — CONFIRMED morphological pattern** |
| 5 | Keep hunting ordinary VFI? | **No (as default)** |
| 6 | Recommended next tech posture | Change approach: human/limb-aware or accept RIFE & other GVFI priorities; any new VFI needs new auth + dual-defect thesis |
| 7 | Production | **Fully kept `cli` + `rife-v4.6`** |
| 8 | Report path | `docs/c11-e-cross-candidate-failure-synthesis.md` |
