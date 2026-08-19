# C11-C — Dual-Defect (Ghost ∧ Smear) Candidate Design

**Date:** 2026-08-13  
**Phase:** **Design only** · **no experiment** · **no download** · **no production change**  
**Prior:** C8 → C10-B/D · C11-A screening · C11-B SGM-VFI **WEAK-GO**  

**Production preserved (binding):** `backend_mode=cli` · RIFE **`rife-v4.6`**  

**Forbidden in this design phase (and until new explicit auth):**  
modify GVFI / `backend_mode` / production RIFE · call VideoWorker · download or run new models · start A/B · auto production integration  

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Status of this document

| Item | Value |
|------|--------|
| Document type | Experiment **protocol / design** |
| Experiment executed? | **No** |
| Models downloaded? | **No** |
| Production touched? | **No** |

**C11-C 方案已经设计完成，但尚未执行。**

---

## Evidence rollup (why C11-C exists)

| Source | Finding | Implication for C11-C |
|--------|---------|------------------------|
| C10-B | RIFE P0 = stable fast-limb **layered Ghost** on reliable mids | Baseline defect is real and repeatable |
| C10-D IFRNet | Ghost **2.8→1.0** · Smear **2.0→2.8** · Overall **2.8→2.8** (0/5 Overall↑) | Ghost-only win = **morph**, not fix |
| C11-B SGM-VFI | Ghost **3.0→1.0** (4/4) · Smear **+0.5** · Overall **3.0→2.5** (2/4 Overall↑) | Large-motion matching helps Ghost; **Overall not production-grade** |
| C11-A | PerVFI / EMA-VFI / FILM ranked; SoftSplat / NC / R2 excluded | Next candidates must target **anti-morph**, not another Ghost↓ blender |

**Core question C11-C must answer (not “who has lower Ghost”):**

> 是否存在能够**同时**降低高速肢体 **Ghost** 与 **Smear**，并使 **Overall severity 明确下降** 的候选？

---

## 1. C11-C 目标

### Primary

在与 C10-D / C11-B **同一公平协议**下，对下一候选做离线 A/B，判定其是否相对 `rife-v4.6` 在 C10-B / C11-B P0 帧上满足：

1. **Ghost↓**（高速肢体分层双影减轻）  
2. **Smear 不恶化，且优先 Smear↓**（不得用统一糊斑换掉双影）  
3. **Overall severity 明确↓**（见 §9 GO 门槛）  

三者缺一，不得称“生产级净改善”。

### Secondary (non-goals)

| Non-goal | Reason |
|----------|--------|
| 继续猎“Ghost 更低”的模型 | C10-D / C11-B 已证明 Ghost↓ 可与 Overall 脱钩 |
| 替换生产 RIFE / 改 `backend_mode` | 明确禁止 |
| VideoWorker / 产品集成 | 技术结果 ≠ 集成授权 |
| 把 weight license UNKNOWN 当成可发货 | 见 §10 |

### Success definition (research)

仅当 §9 **GO** 成立时，才可在**后续独立授权**下讨论工程可行性；本阶段即便 GO，也**不**自动进入生产集成。

---

## 2. 候选模型筛选原则

| # | Principle | Rationale |
|---|-----------|-----------|
| **S1** | **Dual-defect thesis** | Paper / method must plausibly reduce **ghosting and blur/smear together**, not only large-motion correspondence |
| **S2** | **Overall-first ranking** | Ghost↓ alone is **insufficient**; morph swap → max **WEAK-GO** |
| **S3** | **Reuse C10-B / C11-B slots** | Same SRC pairs · same `t=0.5` · same rubric — no new content hunt |
| **S4** | **Host runnable path** | Prefer Windows + RTX 5060 CUDA/PyTorch or existing Vulkan; FILM-class host FAIL stays blocked unless new env auth |
| **S5** | **License gate before ship, not before research** | NC / academic-only / R2 → **exclude**; UNKNOWN weights → research-only with §10 rules |
| **S6** | **No SoftSplat product stack** | SoftSplat academic-only poisons commercial path; SoftSplat-**dependent product integration** excluded |
| **S7** | **Do not re-test measured dead-ends as “fix”** | IFRNet = research morph only; SGM = WEAK-GO signal, not re-baseline unless control reuse |
| **S8** | **Isolation** | All work under `D:\GVFI-deps\c11c-*\` · zero GVFI tree edits |

---

## 3. 候选优先级

| Priority | Candidate | Role in C11-C | Enter A/B when? |
|---------:|-----------|---------------|-----------------|
| **P0** | **PerVFI** | Primary dual-defect thesis (anti-ghost / anti-blur asymmetric blending) | First authorized C11-C A/B |
| **P1** | **EMA-VFI** | Secondary large-motion / attention path (distinct from SGM global matching) | Only if PerVFI **NO-GO** / host FAIL / or explicit dual-candidate auth |
| **P2** | **Practical-RIFE newer ckpt** (e.g. v4.15–v4.26 lineage) | Intra-family control: “same algorithm, newer weights” | Optional research only; **never** bump production `rife-v4.6` from this alone |
| **P3** | **FILM** | Classic large-motion | **Blocked** on current host (C9.1-B FAIL) until new env strategy authorized |
| **Ctrl** | RIFE `rife-v4.6` | Side A baseline | Always |
| **Ref** | IFRNet / SGM-VFI prior outs | Morph reference sheets only | Reuse existing PNGs; **do not** re-run as new hunt |

**Binding order:** PerVFI → (gate) → EMA-VFI → optional RIFE-ckpt.  
Do **not** parallel-hunt multiple new families without explicit auth.

---

## 4. 每个候选为什么值得测试

### 4.1 PerVFI (P0) — **why first**

| Field | Record |
|-------|--------|
| Thesis | Perception-oriented **asymmetric synergistic blending** aimed at **ghosting + blur** from motion error |
| Fit to failure mode | C10-D / C11-B failure = Ghost↓ converted to **Smear↑**; PerVFI paper targets that morph class |
| Vs SGM | SGM improves large-motion correspondence but still unified smear on #21/#36; PerVFI attacks **fusion policy**, not only flow |
| Host | PyTorch; Windows may need WSL — smoke gate before full A/B |
| License | Code Apache-2.0; model **claimed** Apache — still SoftSplat **training** caution; product not cleared |
| Expected risk | Generative softness / over-smooth limbs (must score Smear honestly) |

### 4.2 EMA-VFI (P1) — **why second**

| Field | Record |
|-------|--------|
| Thesis | Inter-frame attention coupling motion + appearance; strong large-motion benchmarks |
| Fit | May reduce layered ghost via better appearance consistency; **not** proven dual-defect |
| Vs SGM | Same lab lineage cousin; different mechanism (attention vs sparse global matching) — avoids pure SGM retest |
| License | Code Apache-2.0; weights **UNKNOWN** |
| Risk | Another Ghost→Smear morph (must apply same dual gate) |

### 4.3 Practical-RIFE newer ckpt (P2) — **why optional**

| Field | Record |
|-------|--------|
| Thesis | Same IFE family; newer community weights might reduce P0 ghost without morph |
| Fit | Low engineering surprise; fair `t=0.5` easy |
| Why low priority | Does **not** answer “new algorithm class”; production must remain **v4.6** regardless of outcome |
| Risk | Same family → correlated failure; false hope of “swap ckpt = fix” |

### 4.4 FILM (P3) — **why parked**

Strong large-motion thesis; **this host GPU smoke FAIL** (C9.1-B). Not worth C11-C cycles until env auth.

### 4.5 Already measured — **not primary C11-C targets**

| Candidate | Prior | Use in C11-C |
|-----------|-------|--------------|
| IFRNet | C10-D WEAK-GO morph | Reference crops only |
| SGM-VFI | C11-B WEAK-GO | Reference / optional Side-C sheet; not “new hope” |

---

## 5. 哪些候选因为许可证直接排除

| Candidate | License barrier | Disposition |
|-----------|-----------------|-------------|
| **AMT** | **CC BY-NC 4.0** | **Exclude** (R3) |
| **GIMM-VFI** | S-Lab **NC** | **Exclude** (R3) |
| **GMFSS / GmfSs** (product / Steam weights) | Commercial **R2** / proprietary | **Exclude** product path |
| **SoftSplat** (standalone) | Academic-only commercial | **Exclude** |
| **M2M-VFI / SoftSplat-dependent product stacks** | SoftSplat academic | **Exclude** for product |
| **XVFI** | Research & education only; commercial needs grant | **Exclude** without grant |
| **UPR-Net / EBME** (as ship) | SoftSplat-adjacent README warnings | **Pause / exclude product** |
| **IFRNet / SGM / EMA / FILM / FLAVR / VFIformer / ABME / BiFormer weights for shipping** | Weight redistrib **UNKNOWN** | **Not “license exclude from research”** — **exclude from ship** until cleared (§10) |

**Hard rule:** NC / academic-only / R2 → do not download for C11-C product hunt.  
UNKNOWN ≠ exclude from **authorized offline research**, but **≠ ship**.

---

## 6. 公平 A/B protocol

### 6.1 Configuration (when later authorized)

| Side | Implementation | Model |
|------|----------------|-------|
| **A** | `rife-ncnn-vulkan` offline mid | **`rife-v4.6`** (prefer reuse C10-D / C11-B `out*_t05.png` if bit-identical path) |
| **B** | Official candidate inference @ mid | PerVFI (then EMA if gated) |

| Item | Rule |
|------|------|
| Source stills | `D:\GVFI-deps\rife-defect-audit\src\` (same dance MP4 lineage) |
| Resolution | **720×1038** both sides |
| Timestep | **`t=0.5` both** — no phase confound |
| GPU | RTX 5060 Laptop · isolated venv under `D:\GVFI-deps\` |
| Work root | `D:\GVFI-deps\c11c-<candidate>-ab\` |
| GVFI / VideoWorker | **Not called** |
| Production outputs | **Not overwritten** |

### 6.2 Fairness locks

1. Same SRC pair `(n, n+1)` for A and B.  
2. Same forced `t=0.5` (CLI `frac≠0.5` is **context only**, never score against mismatched phase).  
3. Same crop ROIs as C11-B P0 arm / P1 edge when possible.  
4. No VFI↔VFI PSNR/SSIM as quality ranker (MAE only for localization / similarity aid).  
5. Bridge: out#21 offline RIFE vs existing CLI `frame_0021.png` optional sanity (as C10-D).  
6. Score **Side A and Side B independently** with §8 rubric; then compute Δ.

### 6.3 Execution gates (before any download)

| Gate | Must pass |
|------|-----------|
| G0 | User **explicitly authorizes** C11-C execution (this design ≠ auth) |
| G1 | Isolated deps root created; no GVFI edits |
| G2 | Candidate smoke: exit 0 · non-black · correct resolution on **one** pair (#21) |
| G3 | Weight license recorded (PASS / CLAIMED / UNKNOWN / FAIL) before scoring |
| G4 | Full A/B only after G2–G3 |

### 6.4 What not to do

- Do not compare candidate `t=0.5` to CLI outs at `frac≠0.5` as primary.  
- Do not declare win from Ghost alone.  
- Do not start EMA while PerVFI unfinished (unless PerVFI host-blocked).  
- Do not “fix” production from research GO.

---

## 7. 必须使用的 C10-B / C11-B P0 帧

### 7.1 Mandatory scored set (n=5)

Align with **C10-D** full reliable-mid set; includes all **C11-B** frames:

| Label out# | SRC n | SRC n+1 | CLI frac (context) | A/B t | Source |
|-----------:|------:|--------:|-------------------:|------:|--------|
| **12** | 7 | 8 | 0.875 | 0.5 | C10-B / C10-D |
| **21** | 13 | 14 | **0.500** | 0.5 | C10-B / C10-D / **C11-B** |
| **36** | 22 | 23 | 0.875 | 0.5 | C10-B / C10-D / **C11-B** |
| **39** | 24 | 25 | 0.750 | 0.5 | C10-B / C10-D / **C11-B** |
| **130** | 81 | 82 | 0.625 | 0.5 | C10-B / C10-D / **C11-B** |

### 7.2 Explicit exclusions

| Out# | Why exclude |
|-----:|-------------|
| **25** | C10-B `frac=0` near_src — **not** a mid sample |

### 7.3 Reporting subsets

| Subset | Frames | Use |
|--------|--------|-----|
| **Full C11-C** | 12, 21, 36, 39, 130 | Primary GO / NO-GO |
| **C11-B-comparable** | 21, 36, 39, 130 | Secondary table vs SGM means |
| **Fair CLI mid** | 21 only | Bridge / narrative |

---

## 8. Ghost / Smear / Occlusion / Warp / Overall 评分规则

Scale **0–3** (integer). Same spirit as C10-B / C10-D / C11-B.

### 8.1 Dimension definitions

| Metric | 0 | 1 | 2 | 3 | Count Ghost / Smear as… |
|--------|---|---|---|---|-------------------------|
| **Ghost** | No extra layered / translucent limb contour | Mild soft double, easy to miss | Clear double / translucent layer | Severe multi-layer or non-physical limb stack | **Only** morphology **absent as discrete doubles in both SRC frames**. Native camera blur alone ≠ Ghost |
| **Smear** | Sharp limb vs motion expectation | Mild edge streak | Obvious fan / unified blur replacing structure | Heavy blob; anatomy lost | Unified blur / drag **without** discrete second contour |
| **Occlusion** | Clean arm/torso separation | Mild fusion | Clear pixel merge at cross | Severe translucent limb-over-torso | Arm-over-chest etc. |
| **Warp** | Clean motion boundary | Mild halo | Clear stretch / pull / halo | Severe geometric tear | Boundary geometry, not just blur |
| **Overall** | Acceptable mid | Mild defect | Distracting | Severe / unusable mid | **Holistic severity** — not max(Ghost), not “Ghost fixed so Overall ok” |

### 8.2 Dual-defect scoring discipline (C11-C specific)

1. If Side B removes double contour but leaves a **heavy single smear**, Ghost may fall **and** Smear must rise — **do not** under-score Smear.  
2. Overall may stay flat or worsen under morph — **do not** reward Ghost↓ into Overall↓ automatically.  
3. Prefer arm P0 crops for Ghost/Smear; P1 edge crops for Warp; full frame for Overall sanity.  
4. Two raters or dual-pass recommended if scores near thresholds; record `scores.json` with notes.  
5. Geometry extras (ghost area ratio, etc.) remain **UNKNOWN** unless a reliable mask exists — do not invent.

### 8.3 Required aggregates

For each side: mean Ghost / Smear / Occlusion / Warp / Overall (n=5).  
Counts:

- Ghost improved (B < A)  
- Smear worsened (B > A) / improved (B < A) / tied  
- Overall improved / unchanged / worsened  

---

## 9. GO / WEAK-GO / NO-GO 判定门槛

Apply to **mandatory n=5** set vs RIFE Side A. Stricter than C11-B because morph failure is now known.

### 9.1 GO (research dual-defect win)

**All** must hold:

| # | Criterion |
|---|-----------|
| G1 | Mean **Ghost** ↓ by **≥ 1.0** **or** Ghost improved on **≥ 4/5** frames |
| G2 | Mean **Smear** **≤** RIFE mean (Δ ≤ 0); **and** Smear worsened on **≤ 1/5** frames |
| G3 | Mean **Overall** ↓ by **≥ 0.6** **and** Overall improved on **≥ 3/5** frames |
| G4 | No new major defect class (e.g. severe face melt / hard limb tear) on ≥2 frames |
| G5 | Occlusion + Warp means not worse by **> 0.5** each |

**GO ≠ ship.** Weight / SoftSplat / eng gates still apply (§10).

### 9.2 WEAK-GO

Any of:

- Ghost↓ clear, but **Smear↑** on ≥2/5 **or** mean Smear ↑  
- Overall mean ↓ but **< 0.6**, or Overall improved on only **1–2/5**  
- Dual metrics mixed: Ghost↓ and Smear flat, but Overall not stably↓  

→ Research signal only; **same class as C10-D / C11-B**. **Do not integrate.**

### 9.3 NO-GO

Any of:

- Ghost not improved (mean Δ ≥ 0 and improved frames ≤ 1/5)  
- Overall mean **↑** or Overall worsened on ≥3/5  
- Smoke / host FAIL  
- License **FAIL** for even research use (NC download attempted, etc.)

### 9.4 Decision matrix (quick)

| Pattern | Verdict |
|---------|---------|
| Ghost↓ · Smear≤ · Overall clear↓ | **GO** (research) |
| Ghost↓ · Smear↑ · Overall flat/partial | **WEAK-GO** |
| Ghost↓ · Smear≤ · Overall flat | **WEAK-GO** |
| No Ghost help / Overall worse | **NO-GO** |

### 9.5 Post-verdict actions (binding)

| Verdict | Action |
|---------|--------|
| GO | Stop; write report; **await new auth** for eng/license — **no** auto integration |
| WEAK-GO | Stop; keep `cli` + `rife-v4.6`; optional EMA only with **new** auth |
| NO-GO | Stop or gate to next priority only with **new** auth |

---

## 10. 权重 license UNKNOWN 时如何处理

| Rule | Detail |
|------|--------|
| **R1** | Code SPDX ≠ weight commercial redistrib. No SPDX / no author redistrib clause → **UNKNOWN** |
| **R2** | UNKNOWN **allows** authorized **offline research A/B** if isolated and non-redistributed |
| **R3** | UNKNOWN **forbids** treating technical GO as product clearance |
| **R4** | Report must state: `weight_license = UNKNOWN` · `technical_result ≠ production_authorization` |
| **R5** | Do **not** copy weights into GVFI repo / installer / VideoWorker bundles |
| **R6** | CLAIMED Apache (e.g. PerVFI README) → record as **CLAIMED**, still counsel for ship; SoftSplat train-dep → **product caution** |
| **R7** | If author later publishes clear commercial grant → re-open license card; do **not** silently upgrade UNKNOWN→PASS |
| **R8** | NC / academic-only discovered mid-run → **abort**, delete local research copies if policy requires, mark **NO-GO (license)** |

---

## 11. 预期实验目录结构

When later authorized (not created in this design phase):

```text
D:\GVFI-deps\c11c-pervfi-ab\                 # P0 primary
├── env\                                     # isolated venv / notes
├── src_pairs\                               # optional copies of SRC n / n+1
├── ab\
│   ├── rife\                                # Side A: out{012,021,036,039,130}_t05.png
│   ├── pervfi\                              # Side B: same labels
│   ├── sheets\
│   │   ├── p0\                              # arm crops
│   │   ├── p1\                              # motion-edge crops
│   │   ├── full\
│   │   ├── diff\                            # optional |diff| arm
│   │   └── bridge\                          # out021 only
│   └── metrics\
│       ├── run_manifest.json
│       └── scores.json
├── logs\
└── README.txt                               # license UNKNOWN note + isolation

D:\GVFI-deps\c11c-emavfi-ab\                 # P1 only if gated
└── (same layout, emavfi/ instead of pervfi/)

D:\GVFI-deps\c11c-rife-ckpt-ab\              # P2 optional
└── (rife-v4.6 vs newer ckpt; production untouched)
```

**Reuse (read-only references, do not overwrite):**

- `D:\GVFI-deps\c10d-ifrnet-ab\`  
- `D:\GVFI-deps\c11b-sgm-ab\`  
- `D:\GVFI-deps\rife-defect-audit\c10b\`  
- `D:\GVFI-deps\rife-defect-audit\src\`

---

## 12. 最终报告路径

| Artifact | Path |
|----------|------|
| **This design (C11-C plan)** | `docs/c11-c-dual-defect-ab-design.md` |
| **Future execution report (not written yet)** | `docs/c11-c-pervfi-directed-ab.md` |
| **If EMA authorized later** | `docs/c11-c-emavfi-directed-ab.md` |
| **Scores (runtime)** | `D:\GVFI-deps\c11c-pervfi-ab\ab\metrics\scores.json` |

Execution report must include: config · frame map · per-frame scores · aggregates · dual-defect answers · license · safety check · **GO/WEAK-GO/NO-GO** · explicit “do not integrate / do not change production”.

---

## Safety check (this design phase)

| Check | Result |
|-------|--------|
| Experiment executed | **No** |
| Model downloaded / run | **No** |
| GVFI production modified | **No** |
| `backend_mode` | **cli** (unchanged) |
| Production RIFE | **`rife-v4.6`** (unchanged) |
| VideoWorker called | **No** |
| New A/B started | **No** |
| Production integration | **No** |

---

## Next Action

**Stop after this design document.**

- Keep production: **`backend_mode=cli` + `rife-v4.6`**.  
- **Do not** download PerVFI / EMA / FILM / other weights.  
- **Do not** auto-enter C11-C execution or any integration.  
- Entering execution requires a **new explicit user authorization**.

---

## Closing line (required)

**C11-C 方案已经设计完成，但尚未执行。**
