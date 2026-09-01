# C11-A — RIFE P0 Fix Route Screening (Desk Research Only)

**Date:** 2026-08-12  
**Phase:** Public-source candidate **route screening** only  
**Forbidden performed:** no model download · no install · no run · no GVFI / `backend_mode` / RIFE / VideoWorker change · **no C11-B** · no new experiment  

**Production preserved:** `backend_mode=cli` · RIFE **`rife-v4.6`**

**Disclaimer:** Not legal advice. Code SPDX ≠ weight commercial redistrib. Hugging Face third-party tags are **not** author grants. Absence of NC ≠ PASS.

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Decision

# C11-A Verdict = **WEAK-GO**

| Label | Meaning here | Applies? |
|-------|--------------|----------|
| **GO** | ≥1 candidate clears P0 thesis **and** host/product/license bar enough to authorize C11-B immediately | **No** |
| **WEAK-GO** | Public screening finds **technically plausible** P0/P1 routes, but each is blocked by host fail, SoftSplat academic risk, NC, weight **UNKNOWN**, or missing product-shaped path | **Yes** |
| **NO-GO** | No useful technical direction left | **No** |
| **UNKNOWN** | Insufficient public material to screen | **No** (enough to rank; not enough to clear GO) |

### Binding stop rule

**没有候选达到 GO，不进入 C11-B。**

Do **not** auto-start C11-B. Production remains **`backend_mode=cli` + `rife-v4.6`**.

---

## 1. Evidence baseline (C8 → C10-D, not re-run)

| Fact | Source |
|------|--------|
| RIFE P0 = stable fast-limb **layered ghost** | C10-B · YES on reliable mids #21/#39/#130 (+#12/#36) |
| IFRNet vs RIFE @ `t=0.5` | C10-D · Ghost **2.8→1.0** · Smear **2.0→2.8** · Overall **2.8→2.8** (0/5 Overall↑) |
| IFRNet role | **Research-only** · runnable · **not** P0 net fix · weight redistrib **UNKNOWN** · not production |
| FILM | Large-motion thesis · this-host GPU smoke **FAIL** (C9.1-B) |
| GMFSS / AMT / GIMM | Commercial **R2** / **NC** — excluded |
| FLAVR / VFIformer | Survey **UNKNOWN** / deferred — **not run** this phase |

**Implication for C11-A:** Next route must aim for **Overall↓** on C10-B slots, not another ghost→smear morph swap. Prefer **occlusion-aware / large-motion / perception** methods over “another efficient IFRNet-class blender.”

---

## 2. Screening criteria

| Priority | Target |
|----------|--------|
| **P1** | Explicit **occlusion-aware / human / large / fast motion** VFI |
| **P2** | Better **motion boundary + limb structure** (not smear-only) |
| **P3** | General high-quality VFI (lower urgency) |

Required card fields filled for each candidate below.  
License rule applied: no weight SPDX / no author redistrib clause → **UNKNOWN** (not inferred PASS).

---

## 3. Candidate cards

### 3.1 SGM-VFI — **top technical P0 thesis · license pause for weights**

| Field | Record |
|-------|--------|
| 候选名称 | **SGM-VFI** (Sparse Global Matching for VFI) |
| 论文 | CVPR 2024 · arXiv:2404.06913 |
| 代码仓库 | `MCG-NJU/SGM-VFI` |
| 发布时间 | 2024 |
| 主要技术路线 | Local intermediate flow + **sparse global matching** compensation for large-motion flow errors → refine mid frame |
| 是否针对大运动 | **Yes** (paper focus; curated large-motion subsets) |
| 是否针对遮挡 | Indirect (better flow under large motion helps occlusion); not a dedicated human-limb module |
| 是否可能改善 limb ghost | **Yes (theory)** — P0 ghosts often = bad mid-flow / blend of two arm poses; global matching targets large displacement |
| 是否可能改善 motion boundary | **Yes (theory)** — better flow residuals can reduce halo/pull |
| 官方代码 License | **Apache-2.0** (README) |
| 预训练权重 License | Drive checkpoints · **no separate weight SPDX found** → **UNKNOWN** |
| 商业使用 | Code: Apache allows · Weights: **UNKNOWN** |
| 商业产品再分发 | Weights: **UNKNOWN** |
| 当前许可证状态 | Code OK · **weights UNKNOWN** (pause ship; research A/B only if later authorized) |
| 技术可行性 | PyTorch · depends GMFlow/RAFT lineage · **no first-party ncnn/Vulkan** · RTX 5060 smoke **UNKNOWN** (not tested) |
| 与 RIFE-v4.6 预期差异 | Stronger large-motion correspondence vs RIFE local IFE; may still smear if fusion weak |
| 是否值得进入离线 A/B | **Conditional later** — highest P0 thesis among open 2024 methods; **not GO now** (weights UNKNOWN + eng E2 + no smoke) |

---

### 3.2 PerVFI — **P0 morph-aware thesis · SoftSplat training risk · weights claimed Apache**

| Field | Record |
|-------|--------|
| 候选名称 | **PerVFI** (Perception-Oriented VFI via Asymmetric Blending) |
| 论文 | CVPR 2024 |
| 代码仓库 | `mulns/PerVFI` |
| 发布时间 | 2024 |
| 主要技术路线 | **Asymmetric synergistic blending** to reduce blur/ghost from motion error; generative / multi-scale decoder variants |
| 是否针对大运动 | Partially (perception under motion error) |
| 是否针对遮挡 | Indirect via blending redesign |
| 是否可能改善 limb ghost | **Yes (theory)** — paper explicitly targets **ghosting/blur** from motion error; relevant to C10-D ghost↔smear question |
| 是否可能改善 motion boundary | **Possible** — perception-oriented; risk of generative softness |
| 官方代码 License | **Apache-2.0** |
| 预训练权重 License | README: “code **and model**” under Apache-2.0 (**author claim**) · HF mirror not used as sole grant |
| 商业使用 | Code+claimed model: Apache terms · **counsel still advised** for product |
| 商业产品再分发 | Under Apache **if** author claim holds · SoftSplat **training** dep is **academic-only** (see SoftSplat card) — product stack risk |
| 当前许可证状态 | Code Apache · model **CLAIMED Apache** · SoftSplat-dep **risk** → treat product as **caution / not clear GO** |
| 技术可行性 | PyTorch · heavy OFE deps (RAFT/GMA/GMFlow) · README leans Linux/WSL for Windows · **no ncnn** · host smoke **UNKNOWN** |
| 与 RIFE-v4.6 预期差异 | Different blend policy vs RIFE linear-ish mid fusion; could change ghost **or** over-smooth limbs |
| 是否值得进入离线 A/B | **Conditional later** (perception thesis strongest vs C10-D morph) · **not GO now** |

---

### 3.3 EMA-VFI — **efficient large-motion relative · weights UNKNOWN**

| Field | Record |
|-------|--------|
| 候选名称 | **EMA-VFI** |
| 论文 | CVPR 2023 · arXiv:2303.00440 |
| 代码仓库 | `MCG-NJU/EMA-VFI` |
| 发布时间 | 2023 |
| 主要技术路线 | Inter-frame attention for motion+appearance; hybrid CNN–Transformer; fixed & arbitrary-t |
| 是否针对大运动 | **Yes** (demos vs extreme motion / scene change; X4K/Xiph benchmarks) |
| 是否针对遮挡 | Indirect |
| 是否可能改善 limb ghost | **Possible** — better motion/appearance coupling than pure IFE blend |
| 是否可能改善 motion boundary | **Possible** |
| 官方代码 License | **Apache-2.0** |
| 预训练权重 License | Google Drive / Baidu ckpt · **no separate weight SPDX** → **UNKNOWN** |
| 商业使用 / 再分发 | Weights **UNKNOWN** |
| 当前许可证状态 | Code OK · weights **UNKNOWN** |
| 技术可行性 | PyTorch · public demos/WebUI community · **no official ncnn** · host smoke **UNKNOWN** · lighter than BiFormer |
| 与 RIFE-v4.6 预期差异 | Attention-based mid vs RIFE IFE; SGM builds on related lineage |
| 是否值得进入离线 A/B | **Conditional later** (after/with SGM priority) · **not GO now** |

---

### 3.4 FILM — **best classic large-motion thesis · host NO-GO**

| Field | Record |
|-------|--------|
| 候选名称 | **FILM** |
| 论文 | ECCV 2022 |
| 代码仓库 | `google-research/frame-interpolation` |
| 发布时间 | 2022 (archived) |
| 主要技术路线 | Shared-weight multi-scale features for **large motion** |
| 大运动 / 遮挡 | Large motion **Yes** · occlusion not human-specific |
| limb ghost / boundary | **High theory** for P0/P1 |
| 代码 License | Apache-2.0 |
| 权重 License | **UNKNOWN** (C9.1-A) |
| 许可证状态 | Weights UNKNOWN |
| 技术可行性 | **This host smoke FAIL** (TF2.10 / missing CUDA 11 · C9.1-B) |
| 预期差异 | Unmeasured on dance (no inference) |
| 离线 A/B? | **No on current host** until new env strategy authorized · **exclude near-term host path** |

---

### 3.5 SoftSplat / Softmax Splatting — **boundary theory · commercial exclude**

| Field | Record |
|-------|--------|
| 候选名称 | **Softmax Splatting (SoftSplat)** |
| 论文 | CVPR 2020 · Niklaus & Liu |
| 代码仓库 | `sniklaus/softmax-splatting` |
| 发布时间 | 2020 |
| 主要技术路线 | Differentiable **forward warping** with softmax conflict resolution |
| 大运动 / 遮挡 | Forward-warp occlusion handling **Yes** |
| limb ghost / boundary | **Yes (theory)** for cleaner warp vs naive blend |
| 代码 License | **Academic only** (README: commercial requires contact) |
| 权重 / 再分发 | Academic · commercial **blocked** without grant |
| 许可证状态 | **R3/R4 commercial exclude** |
| 技术可行性 | N/A for product |
| 离线 A/B? | **Exclude** for GVFI product path (also poisons SoftSplat-dependent stacks) |

---

### 3.6 UPR-Net / EBME — **large-motion recursive · SoftSplat-adjacent pause**

| Field | Record |
|-------|--------|
| 候选名称 | **UPR-Net** · **EBME** |
| 论文 | CVPR 2023 · WACV 2023 |
| 代码仓库 | `srcn-ivl/upr-net` · `srcn-ivl/EBME` |
| 发布时间 | 2023 |
| 主要技术路线 | Pyramid recurrent bi-dir flow + iterative synthesis; claims large-motion robustness |
| 大运动 / 遮挡 | Large motion **Yes** · occlusion via warp/fusion |
| limb ghost / boundary | **Possible** |
| 代码 License | Apache-2.0 (reported) |
| 权重 License | Checkpoints in-repo / README · **no clear independent weight SPDX** → **UNKNOWN** |
| SoftSplat risk | READMEs warn to follow **softmax-splatting** license → **academic SoftSplat** dependency |
| 许可证状态 | Weights UNKNOWN + SoftSplat **commercial risk** |
| 技术可行性 | Lightweight UPR interesting · still PyTorch · no ncnn |
| 离线 A/B? | **Pause** (SoftSplat) unless SoftSplat-free inference path proven |

---

### 3.7 ABME / BiFormer — **bilateral motion · eng heavy · weights UNKNOWN**

| Field | Record |
|-------|--------|
| 候选名称 | **ABME** · **BiFormer** |
| 论文 | ICCV 2021 · CVPR 2023 |
| 代码仓库 | `JunHeum/ABME` (MIT) · `JunHeum/BiFormer` (Apache-2.0) |
| 发布时间 | 2021 / 2023 |
| 主要技术路线 | Asymmetric / bilateral motion estimation (+ transformer for 4K) |
| 大运动 / 遮挡 | Large / complex motion **Yes** |
| limb ghost / boundary | **Possible** |
| 权重 License | Drive zips · **UNKNOWN** |
| 技术可行性 | BiFormer 4K-oriented · high VRAM · CuPy/CUDA pins · **no ncnn** · host **UNKNOWN** |
| 离线 A/B? | **Defer** (eng cost high; not first vs SGM/PerVFI) |

---

### 3.8 XVFI — **extreme motion · commercial permission required**

| Field | Record |
|-------|--------|
| 候选名称 | **XVFI** |
| 论文 | ICCV 2021 Oral |
| 代码仓库 | `JihyongOh/XVFI` |
| 发布时间 | 2021 |
| 主要技术路线 | Multi-scale extreme VFI (X4K1000FPS) |
| 大运动 | **Yes (extreme)** |
| limb ghost / boundary | **Possible** |
| 官方 License | README: **research & education only**; **commercial use needs formal permission** |
| 许可证状态 | **Product NO-GO** without grant |
| 离线 A/B? | **Exclude** for product screening (research-only grant) |

---

### 3.9 Already decided (rollup — no re-run)

| 候选 | 许可证 / 主机 | P0 相关性 | C11-A 动作 |
|------|---------------|-----------|------------|
| **IFRNet** | Code MIT · weights **UNKNOWN** · runs | Ghost↓ Smear↑ Overall flat (C10-D) | **Research-only; not a fix route** |
| **GMFSS** | Commercial **R2** | Limb morph [DIFF] in C8 | **Exclude** |
| **AMT** | **CC BY-NC** | Strong modern VFI | **Exclude** |
| **GIMM-VFI** | S-Lab NC | High-profile | **Exclude** |
| **FLAVR** | Code Apache · weights **UNKNOWN** | Multi-frame; weak pair fit | **Pause (UNKNOWN)** |
| **VFIformer** | Code MIT · weights **UNKNOWN** | Transformer heavy | **Pause (UNKNOWN)** |
| **CAIN ncnn** | Port exists | Older; not occlusion/large-motion leader | **Low priority / defer** |
| **M2M-VFI** | SoftSplat-adjacent | — | **Exclude** (SoftSplat) |

---

### 3.10 Intra-family note (not a replacement algorithm)

| Field | Record |
|-------|--------|
| 候选名称 | **Practical-RIFE newer checkpoints** (e.g. community v4.15–v4.26 lineage) |
| 说明 | Same family as production `rife-v4.6`; author site claims MIT for linked content |
| P0 修复潜力 | **UNKNOWN** without A/B — may or may not reduce layered ghost |
| 与本阶段约束 | Production must stay **`rife-v4.6`**; this is **not** authorization to bump production |
| 离线 A/B? | Optional **later research** only under explicit auth · **not** C11-A GO |

---

## 4. Ranking matrices

### 4.1 P0 修复潜力（理论，未跑）

| Rank | Candidate | Why |
|-----:|-----------|-----|
| 1 | **SGM-VFI** | Explicit large-motion global matching |
| 2 | **PerVFI** | Explicit anti-ghost/blur asymmetric blending (matches C10-D failure mode) |
| 3 | **FILM** | Classic large-motion (host blocked) |
| 4 | **EMA-VFI** | Large-motion / attention; SGM lineage cousin |
| 5 | **XVFI / ABME / BiFormer** | Extreme / bilateral motion |
| 6 | SoftSplat / UPR / EBME | Warp theory strong but license-blocked |
| — | **IFRNet** | Measured: morph only, Overall flat |

### 4.2 P1 修复潜力（理论）

| Rank | Candidate | Why |
|-----:|-----------|-----|
| 1 | SoftSplat-class forward warp | Boundary/occlusion theory — **commercial exclude** |
| 2 | **SGM-VFI** / **EMA-VFI** | Better flow → less halo |
| 3 | **PerVFI** | Perception blend; risk of softness |
| 4 | FILM | Large motion edges — host blocked |
| 5 | IFRNet | Measured Warp ≈ flat (C10-D) |

### 4.3 商业许可确定性

| Rank | Candidate | Status |
|-----:|-----------|--------|
| — | SoftSplat / XVFI / AMT / GIMM / GMFSS product | **Clear exclude / NC / R2** |
| Mid | PerVFI | Code+**claimed** model Apache — still SoftSplat train caution |
| Low | SGM / EMA / FILM / FLAVR / VFIformer / ABME / BiFormer / IFRNet | Weights **UNKNOWN** or host fail |
| Baseline | Shipping RIFE-v4.6 | Existing production path (unchanged) |

### 4.4 工程可行性（GVFI-shaped）

| Rank | Candidate | Notes |
|-----:|-----------|-------|
| Best known non-RIFE | **IFRNet ncnn** | Already smoke/A/B — quality not a fix |
| Host blocked | **FILM** | TF/CUDA FAIL |
| Research PyTorch | SGM / EMA / PerVFI / ABME / BiFormer | No official ncnn · VideoWorker cost **high** |
| Product poisoned | SoftSplat-dependent | Do not integrate |

---

## 5. Disposition lists

### Worth considering for a **later** authorized offline A/B (not started)

1. **SGM-VFI** — highest open large-motion P0 thesis  
2. **PerVFI** — strongest paper match to ghost/blur morph problem  
3. **EMA-VFI** — lighter cousin / precursor path  

**Gates before any A/B:** isolated env · no GVFI edits · weight redistrib remains tracked · must score C10-B rubric (Overall must move, not only Ghost) · expect ghost→smear failure mode.

### Direct exclude (product / license / measured dead-end)

- **GMFSS** (R2) · **AMT** (NC) · **GIMM** (NC) · **XVFI** (research/education only) · **SoftSplat** (academic-only) · **M2M / SoftSplat-dependent product stacks** · **IFRNet as production fix** (C10-D Overall flat) · **FILM on current host** (smoke FAIL)

### Pause (weights UNKNOWN / eng / SoftSplat caution)

- **FLAVR** · **VFIformer** · **ABME** · **BiFormer** · **UPR-Net** · **EBME** · **SGM/EMA/FILM weights** for shipping · **Practical-RIFE newer ckpt** until explicitly authorized research A/B  

---

## 6. Why no GO / why not C11-B

| GO requirement | Gap |
|----------------|-----|
| Clear P0/P1 net-fix candidate | None measured this phase; IFRNet already fails Overall |
| Runnable on this host without new env | FILM fail; SGM/PerVFI/EMA smoke **UNKNOWN** (not run — by design) |
| Product path (ncnn/Vulkan or clear ship) | No new official ncnn ports for top P0 theses |
| Weight commercial redistrib clear | Top theses mostly **UNKNOWN**; SoftSplat academic blocks warp-class |

Therefore:

# 没有候选达到 GO，不进入 C11-B。

---

## 7. Safety check

| Check | Result |
|-------|--------|
| Download / install / run models | **No** |
| GVFI / `backend_mode` / RIFE / VideoWorker modified | **No** |
| C11-B started | **No** |
| Production | **`backend_mode=cli` + `rife-v4.6`** |
| Report | This file |

---

## 8. Next Action

**Stop at C11-A.**

- Keep production: **`backend_mode=cli` + `rife-v4.6`**.  
- Keep IFRNet research-only.  
- **Do not** auto-enter C11-B.  
- Any future offline A/B (e.g. SGM-VFI / PerVFI / EMA-VFI) requires **new explicit authorization**, isolated deps, and C10-B-style Overall scoring — not Ghost-only wins.
