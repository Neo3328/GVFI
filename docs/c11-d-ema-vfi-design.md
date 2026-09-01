# C11-D — EMA-VFI Design & Feasibility Audit

**Date:** 2026-08-13  
**Phase:** **Design / feasibility audit only** · **no download** · **no A/B** · **no production change**  
**Prior:** C10-B · C10-D IFRNet WEAK-GO · C11-A · C11-B SGM WEAK-GO · C11-C PerVFI **WEAK-GO**  

**Production preserved (binding):** `backend_mode=cli` · RIFE **`rife-v4.6`**  

**Forbidden this phase:** download weights · run EMA · modify GVFI · call VideoWorker · change `backend_mode` · replace RIFE · overwrite production outputs · auto-enter C11-D experiment  

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Status of this document

| Item | Value |
|------|--------|
| Document type | Design + feasibility audit |
| Experiment executed? | **No** |
| Models downloaded? | **No** |
| Production touched? | **No** |
| C11-D experiment authorized? | **No** (design ≠ auth) |

**C11-D 方案已经设计完成，但尚未执行。**

---

## Evidence rollup (why C11-D)

| Source | Finding |
|--------|---------|
| C10-B | RIFE P0 = stable fast-limb **layered Ghost** on #12/#21/#36/#39/#130 |
| C10-D IFRNet | Ghost↓ · Smear↑ · Overall flat → morph |
| C11-B SGM-VFI | Ghost↓ · Smear partial↑ · Overall partial↓ → **WEAK-GO** |
| C11-C PerVFI | Ghost **2.8→1.0** · Smear **2.0→2.6** · Overall **2.8→2.4** · Overall↑ **2/5** → **WEAK-GO** morph |
| Open GO candidates | **None** |

**Core question (unchanged):**

> 是否存在能**同时**降低高速真人肢体 **Ghost** 与 **Smear**，并使 **Overall** 明确下降的候选？

EMA-VFI is the next **authorized design target** (C11-A P1 after PerVFI). It is **not** assumed to win; it must clear the same dual-defect GO gates.

---

## 1. C11-D 目标

1. Offline A/B EMA-VFI vs `rife-v4.6` on the **same** C10-B/C11-C slots.  
2. Score Ghost / Smear / Occlusion / Warp / Overall (0–3).  
3. Decide **GO / WEAK-GO / NO-GO** under fixed dual-defect gates.  
4. **Never** treat technical GO as production switch.

Non-goals: production integration · VideoWorker · EMA as “Ghost-only” win · expanding to FILM/AMT/GIMM/GMFSS.

---

## 2. Candidate card — EMA-VFI

| Field | Record |
|-------|--------|
| Name | **EMA-VFI** (Extracting Motion and Appearance via Inter-Frame Attention) |
| Paper | CVPR 2023 · arXiv:2303.00440 |
| Repo | `MCG-NJU/EMA-VFI` |
| Thesis | Inter-frame attention for motion + appearance; hybrid CNN–Transformer; fixed & arbitrary-t |
| Why after PerVFI | Distinct from PerVFI blending / SGM sparse matching; large-motion attention cousin of SGM lineage |
| Dual-defect fit | **Possible** Ghost↓ via better correspondence; **not** explicitly anti-smear — morph risk remains high |
| Official ncnn/Vulkan | **No** |
| Product-shaped for GVFI native | **Weak** (PyTorch research path only) |

---

## 3. Host / stack feasibility (desk audit)

| Check | Finding |
|-------|---------|
| Needs CUDA / PyTorch? | **Yes** — `Model.device()` → CUDA; demos use `.cuda()` |
| Needs Vulkan / ncnn? | **No** for offline A/B |
| Official deps | torch (~1.8 listed), python 3.8 era, numpy, opencv, skimage, **timm**, tqdm, imageio |
| SoftSplat / CuPy? | **Not in official inference stack** — warp via `model/warplayer.py` (`grid_sample` backwarp) |
| This host precedent | C11-B/C11-C already ran **torch 2.11+cu128** on **RTX 5060 Laptop** successfully |
| EMA smoke on this host | **UNKNOWN** (not run — by design) |
| Expected blockers | (a) Drive/Baidu weight fetch; (b) `timm` / older code vs modern torch warnings; (c) VRAM at 720×1038 with TTA — likely OK on 8 GB class but unproven; (d) Windows native OK in principle (no WSL mandate unlike PerVFI README) |
| Vulkan path | Irrelevant for C11-D offline; do **not** require native DLL |

**Feasibility verdict (pre-smoke):** **Likely runnable** on current RTX 5060 + isolated PyTorch CUDA venv, **subject to** smoke on #21 after download. Not FILM-class host-blocked on paper.

---

## 4. Weight source & license

| Item | Status |
|------|--------|
| Code LICENSE | **Apache-2.0** (repo `LICENSE` + README) |
| Weight source | Google Drive folder + Baidu (`ckpt/*.pkl`: `ours`, `ours_small`, `ours_t`, `ours_small_t`) |
| Separate weight SPDX | **Not found** → **UNKNOWN** |
| HF license tag for weights | **Not** treated as sole grant (official path is Drive/Baidu) |
| Commercial redistrib of ckpt | **UNKNOWN** — research A/B allowed under isolation; **not** ship clearance |
| SoftSplat academic poison | **No** (unlike PerVFI / SGM SoftSplat path) |
| NC / R2 / Steam | **No** for EMA itself |
| Acknowledgement risk | README cites RIFE / PvT / IFRNet / Swin / HRFormer — follow their licenses for *code lineage*; does **not** auto-clear EMA **weight** redistrib |

**License class for C11-D:** research-OK · ship-blocked until weight redistrib cleared.

---

## 5. Commercial / product risk summary

| Risk | Level | Note |
|------|-------|------|
| SoftSplat | **Low (stack)** | Not used in official EMA warp |
| NC / R2 | **None known** | Not AMT/GIMM/GMFSS |
| Weight redistrib | **High for ship** | UNKNOWN → no bundling |
| SoftSplat-free but still research | — | Technical GO still ≠ installer clearance |
| Eng integrate cost | **High** | No official ncnn; VideoWorker dual-backend large |

---

## 6. Fairness: `t=0.5` & frame mapping

### Timestep

| API | Behavior | C11-D use |
|-----|----------|-----------|
| `Model.inference(..., timestep=0.5)` | Default **0.5** | **Primary** for fair mid |
| `demo_2x.py` | Calls `inference` without arg → **t=0.5** | Equivalent |
| `multi_inference(..., time_list=[0.5])` | Arbitrary-t models (`ours_t` / `ours_small_t`) | Optional alt if using `_t` ckpt |

**Fair lock:** force `timestep=0.5` (or `time_list=[0.5]`) on **same SRC pairs** as Side A.  
CLI `frac≠0.5` is context only — **never** score against mismatched phase.

### Recommended model variant (when executed)

| Preference | Variant | Reason |
|------------|---------|--------|
| **Default** | `ours` + `inference(..., timestep=0.5)` | Official 2× quality path |
| Fallback | `ours_small` | Lower VRAM / faster; TTA off in demo |
| Avoid as primary | Recursive multi-step without locked mid | Phase confound risk |

### Mandatory frames (reuse C11-C)

| out# | SRC n | SRC n+1 | CLI frac (ctx) | A/B t |
|-----:|------:|--------:|---------------:|------:|
| 12 | 7 | 8 | 0.875 | 0.5 |
| 21 | 13 | 14 | 0.500 | 0.5 |
| 36 | 22 | 23 | 0.875 | 0.5 |
| 39 | 24 | 25 | 0.750 | 0.5 |
| 130 | 81 | 82 | 0.625 | 0.5 |

**Exclude #25.**  
Reuse Side A RIFE mids from `D:\GVFI-deps\c10d-ifrnet-ab\rife\` or C11-C copies — **do not regenerate / overwrite production**.

### Mapping reuse

Yes — identical to C10-D / C11-C mapping table. No new content hunt.

---

## 7. Fair A/B protocol (for later auth)

| Item | Rule |
|------|------|
| Side A | `rife-v4.6` offline `t=0.5` (reuse existing PNGs) |
| Side B | EMA-VFI `ours` @ `timestep=0.5` |
| Resolution | **720×1038** |
| Work root | `D:\GVFI-deps\c11d-ema-ab\` |
| Isolation | New venv under work root; zero GVFI edits |
| VideoWorker | **Not called** |
| Production | `cli` + `rife-v4.6` unchanged |
| Sheets | `sheets/p0` · `sheets/p1` · `sheets/full` · `metrics/scores.json` |
| Report | `docs/c11-d-ema-vfi-directed-ab.md` (future) |

### GO gates (fixed — all must pass)

1. Ghost mean ↓  
2. Smear mean **not** worse (Δ ≤ 0)  
3. Overall mean ↓ ≥ **0.6**  
4. Overall improved on ≥ **3/5** frames  
5. Any fail → **not GO** (WEAK-GO or NO-GO)

Morph rule: Ghost↓ + Smear↑ ⇒ **Overall not credited** as improved on that frame.

---

## 8. Why worth testing / why caution

### Worth (research)

- Next open large-motion candidate after PerVFI WEAK-GO (C11-A order).  
- Mechanism ≠ PerVFI ASB / ≠ SGM sparse matching.  
- SoftSplat-free → cleaner **research→product counsel** path than PerVFI/SGM *if* quality ever GO’d.  
- Explicit `timestep=` → fair protocol easy.  
- Host class already proven for PyTorch CUDA VFI.

### Caution / unfit-as-ship-now

- Not dual-defect-specialized; morph probability high given IFRNet/SGM/PerVFI pattern.  
- Same lab lineage as SGM (already WEAK-GO) — correlated failure possible.  
- Weights **UNKNOWN**; no ncnn.  
- Smoke **UNKNOWN** until authorized run.

**Not excluded** by NC/R2/SoftSplat. **Not cleared** for production.

---

## 9. Planned experiment directory (not created this phase)

```text
D:\GVFI-deps\c11d-ema-ab\
├── EMA-VFI\              # git clone (later)
├── venv\
├── ab\rife\              # copies of C10-D/C11-C t=0.5
├── ab\ema\
├── sheets\p0|p1|full|diff\
├── metrics\scores.json
└── logs\
```

---

## 10. Next experiment plan (commands — **do not run now**)

Only after **new explicit user authorization**:

```text
1) mkdir D:\GVFI-deps\c11d-ema-ab
2) git clone https://github.com/MCG-NJU/EMA-VFI.git D:\GVFI-deps\c11d-ema-ab\EMA-VFI
3) Create isolated venv; pip install torch (cu128) + timm opencv numpy imageio tqdm
4) Download official ckpt into EMA-VFI\ckpt\  (Drive/Baidu) — record weight_license=UNKNOWN
5) Smoke: single pair SRC 13/14 → mid @ timestep=0.5, assert 720×1038 non-black
6) Full A/B: #12/#21/#36/#39/#130 vs reused RIFE t=0.5
7) Score dual-defect; write docs/c11-d-ema-vfi-directed-ab.md
8) Stop; no integration regardless of verdict without further auth
```

Pseudo-call (Side B):

```python
mid = model.inference(I0, I1, TTA=True, timestep=0.5, fast_TTA=True)  # ours
```

---

## 11. Decision answers (required)

| # | Question | Answer |
|---|----------|--------|
| 1 | EMA-VFI 是否值得进入定向 A/B？ | **Yes (research)** — next ranked open candidate; SoftSplat-free; fair `t=0.5` OK. **Not** assumed quality win. |
| 2 | 技术可行性 | **Likely** on RTX 5060 + PyTorch CUDA; smoke **UNKNOWN** until authorized. No Vulkan/ncnn required for A/B. |
| 3 | 权重/许可证 | Code **Apache-2.0**; weights **UNKNOWN** (Drive/Baidu, no separate SPDX). |
| 4 | 商业使用风险 | Weight redistrib **UNKNOWN** blocks ship; SoftSplat/NC/R2 **not** applicable to official EMA stack. |
| 5 | 若值得测试，下一步 | Isolated `c11d-ema-ab` · `ours` @ `timestep=0.5` · same 5 frames · dual-defect GO gates · report path above. |
| 6 | **当前是否允许进入 C11-D 实验？** | **No.** Design/audit only. Execution requires **new explicit authorization**. |

---

## Safety check (this design phase)

| Check | Result |
|-------|--------|
| Download / run EMA | **No** |
| GVFI / `backend_mode` / RIFE changed | **No** |
| VideoWorker | **No** |
| C11-D A/B started | **No** |
| Production | **`cli` + `rife-v4.6`** |

---

## Closing

**C11-D 方案已经设计完成，但尚未执行。**  
Keep production: **`backend_mode=cli` + `rife-v4.6`**.  
**Do not** auto-start C11-D experiment.
