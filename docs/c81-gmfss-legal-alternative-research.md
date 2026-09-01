# C8.1 — GMFSS / GmfSs legal alternative route research

**Date:** 2026-08-12  
**Scope:** Desk research only · **not** C8.2 · **no** GVFI changes · **no** installs · **no** Steam assets · **no** reverse · **no** production integration  

**Disclaimer:** This document reports **public license / source facts**. It is **not** legal advice and does **not** conclude patent validity or clearance.

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Direct answer

> **如果我们最终想让 GVFI 获得类似 GmfSs 的 VFI 能力，目前有没有合法、公开、可商业落地的路线？**

**没有“开箱即用、明确可商业落地的完整 GMFSS 类实现”（非 R0）。**  

存在一条**理论上可走的论文/组件重建路线**：用公开论文中的 GMFlow + Softmax Splatting **思想**，搭配 **Apache-2.0 GMFlow** 与 **MIT 的 Softmax Splatting 算子重实现（如 `hperrot/splatting`）**，并**自行训练**合成网络——但工程、权重、训练数据与潜在专利问题构成**重大障碍** → 分类 **R2**。

直接拿 `98mxr/GMFSS_Fortuna` / Steam `GmfSs_pg_104` 当 GVFI 商业后端：**不可行 / 未获证**（前者依赖链含学术限制风险；后者私有且禁止提取）。

---

## 1. Component decomposition (public GMFSS lineage)

Public GMFSS READMEs describe a pipeline roughly:

```text
I0, I1
  → feature extraction (CNN / backbone features)
  → optical flow (GMFlow family)
  → differentiable forward warping (Softmax Splatting / softsplat)
  → synthesis / refinement (GridNet / fusion / optional GAN / optional RIFE hint in “union”)
  → It
```

| Component | Public meaning in GMFSS family | Steam private? |
|-----------|--------------------------------|----------------|
| Flow estimation | **GMFlow** (and variants) | Do not use Steam |
| Warping / splatting | **Softmax Splatting** ops | Do not use Steam |
| Feature extraction | Task feature pyramid / CNN features (SoftSplat-style) | Do not use Steam |
| Synthesis / refinement | Fusion / GridNet / GAN (`train_pg.py` etc.) | Do not use Steam |
| Model weights | Fortuna Drive packs / Steam `GmfSs_pg_104` | Steam **forbidden** |
| Optional “union” extras | May blend RIFE-like hints (public union READMEs) | Separate from pure GMFSS |

---

## 2. Per-component license matrix

Tags relative to a **commercial-friendly baseline** (clear SPDX MIT/Apache/BSD allowing use + redistribute + modify, without “academic only”):

| Component | Paper | Official / primary code | LICENSE (code) | Weights source | Weights LICENSE | Commercial use (as stated publicly) | Redistribute / modify+distribute | vs baseline |
|-----------|-------|-------------------------|----------------|----------------|-----------------|-------------------------------------|----------------------------------|-------------|
| **GMFlow** | CVPR 2022 Oral, arXiv:2111.13680 | `haofeixu/gmflow` | **Apache-2.0** | Google Drive pretrained (README) | **No separate SPDX found** → treat as **UNKNOWN** beyond repo Apache for code | Apache text allows commercial use of **Work** | Allowed under Apache terms (NOTICE/attribution) | Code **[SAME]**; weights **[UNKNOWN]** |
| **Softmax Splatting (reference)** | CVPR 2020, arXiv:2003.05534 | `sniklaus/softmax-splatting` | No SPDX; README **academic only** | Demo/pretrained as shipped by authors | **UNKNOWN** / academic framing | **Contact authors for commercial** | Academic restriction stated | **[DIFF]** (restricted) |
| **Softsplat wrap (copy)** | cites SoftSplat | `ksimmo/pytorch_softsplat_wrap` | States academic only; contact Niklaus | n/a | n/a | Restricted | Restricted | **[DIFF]** |
| **SoftSplat-Full** | SoftSplat paper reimpl | `JHLew/SoftSplat-Full` | GitHub **license: null** | `SoftSplat_predefinedZ.pth` (in-repo mention) | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **[UNKNOWN]** |
| **Softmax op reimpl (MIT)** | SoftSplat paper | `hperrot/splatting` | **MIT** | Operator only (no full VFI weights) | n/a | MIT allows commercial | MIT allows | **[SAME]** for **operator code** |
| **GMFSS Fortuna (full stack)** | No dedicated GMFSS paper found | `98mxr/GMFSS_Fortuna` | **MIT** (repo LICENSE) | Google Drive (README links) | **UNKNOWN** (not inspected; not downloaded) | MIT for **Software**; SoftSplat dependency risk **UNKNOWN/DIFF** | MIT for Fortuna files; transitive risk | Top-level **[SAME]**; stack **[DIFF]/[UNKNOWN]** |
| **GMFSS legacy** | n/a | `routineLife1/GMFSS` | SPDX **null** | Points to Fortuna | **UNKNOWN** | **UNKNOWN** | **UNKNOWN** | **[UNKNOWN]** |
| **Steam GmfSs_pg_104** | n/a | Steam SVFI | Proprietary | Steam | Proprietary | Steam EULA / product | **Forbidden to extract** | **[DIFF]** |
| **ATD-12K (train/eval anime)** | AnimeInterp CVPR 2021 | Dataset from cartoon movies | Code MIT; **frames from copyrighted films** | Zenodo / author links | **UNKNOWN** / copyrighted sources | Commercial training **risky / UNKNOWN** | Redistribution of movie frames **problematic** | **[DIFF]** / **[UNKNOWN]** |

**Rule applied:** Fortuna being MIT does **not** clear SoftSplat reference code or Steam weights.

---

## 3. Alternative implementations (esp. Softmax Splatting)

| Repo | License | Same algorithm? | Restricted deps? | Public weights? | Commercial-usable (public text)? |
|------|---------|-----------------|------------------|-----------------|----------------------------------|
| `sniklaus/softmax-splatting` | Academic-only | Reference Softmax Splatting | CuPy/CUDA | Demo assets | **No** (without author grant) |
| `hperrot/splatting` | **MIT** | Stated **reimplementation** of softmax-splatting; supports average/softmax-style modes; CPU+CUDA extension | PyTorch | Operator only | **Yes for the published MIT code** (algorithm fidelity / patent separate **UNKNOWN**) |
| `ksimmo/pytorch_softsplat_wrap` | Academic-only | Close copy of official kernels (README admits) | CUDA | No full VFI | **No** |
| `JHLew/SoftSplat-Full` | SPDX null | Full SoftSplat VFI model | Likely softsplat ops | Checkpoint mentioned | **UNKNOWN** |
| Fortuna / union / GMFupSS | MIT (where filed) | GMFSS-class full systems | Historically SoftSplat-family ops | Drive packs | **Not proven commercial-clean end-to-end** |

**Finding:** There **is** a permissive **operator** alternative (`hperrot/splatting`). There is **no** surveyed **complete GMFSS-class VFI product** that is simultaneously (a) SoftSplat-clean, (b) weight-licensed clearly, (c) Steam-independent, (d) ncnn/Vulkan-ready.

---

## 4. Paper reimplementation route (A–E)

### A — 算法思想是否公开？
**Yes (partial).**  
- Softmax Splatting + GMFlow papers are public.  
- GMFSS as a **named system** is primarily GitHub engineering (Fortuna README), **not** a found standalone peer-reviewed “GMFSS” paper.  
- Enough public description exists to attempt a **GMFSS-like** pipeline (flow → softsplat → synthesis).

### B — 代码是否必须复制？
**No.**  
Algorithmic reimplementation from papers + clean-room coding is possible in principle.  
Must **avoid** copying Niklaus CuPy kernels / academic-only wrappers. Prefer independent code or MIT `hperrot/splatting`.

### C — 权重是否必须使用原作者权重？
**No for a from-scratch product path.**  
Must **not** use Steam `GmfSs_pg_104`.  
Fortuna Drive weights: public links exist, but **weight SPDX UNKNOWN** → not a clear commercial default.  
Practical path: **train own** synthesis (+ optional finetune flow) under clear data rights.

### D — 重新训练是否需要受限数据？
**Often yes / high risk if following anime GMFSS practice.**  
Fortuna points at **ATD-12K** (triplets from commercial cartoon movies). AnimeInterp code is MIT; **underlying frames are copyrighted works** → commercial training/redistribution of that dataset is **not clearly free**.  
Live-action self-collected / licensed data could avoid ATD-12K, but then “match Steam GmfSs anime bias” is **UNKNOWN**.

### E — 专利 / 其他明显限制？
**Public patent signal exists; clearance UNKNOWN.**  
- Adobe **US12283060B2** / application US20230326044A1 (“Splatting-based Digital Image Synthesis”), inventors include **Simon Niklaus**, cites Softmax Splatting paper.  
- This survey **does not** determine claim coverage vs a GMFSS-like VFI product.  
- SoftSplat academic-only README remains a **copyright** barrier separate from patents.

---

## 5. Engineering feasibility (architecture only — no bench)

| Target | Assessment |
|--------|------------|
| PyTorch / CUDA | **Feasible** path for research/prototype (Fortuna-like) |
| FP16 on RTX 5060 Laptop | **Plausible** in PyTorch; **not measured** |
| 1080p 24→48 | **Plausible** with memory/time tradeoffs; **not measured** |
| TensorRT / ONNX | Softsplat custom ops → **harder**; need TRT plugins or replace op |
| **ncnn / Vulkan** (GVFI production shape) | **Major rewrite**; no public GMFSS ncnn port found |
| Drop-in replace `backend_mode=cli` | **No** without new backend + packaging torch/CUDA |

---

## 6. Route options (decision aid)

| Route | Legal posture (public facts) | Engineering | Match Steam GmfSs look? |
|-------|------------------------------|-------------|-------------------------|
| Ship Fortuna + Drive weights in GVFI | SoftSplat transitive / weight SPDX **risk** | Heavy PyTorch ship | **UNKNOWN** (not Steam weights) |
| Extract Steam `GmfSs_pg_104` | **Forbidden** | n/a | n/a |
| MIT softsplat op + Apache GMFlow + **self-trained** synth | Best **copyright** story among surveyed; patent **UNKNOWN** | Large R&D | **UNKNOWN** |
| Stay on RIFE; treat GmfSs as competitor behavior | Already licensed path for GVFI | Current | Explains C8 control B ≈ |

---

## 7. Strict classification

| Code | Meaning | Selected |
|------|---------|----------|
| R0 | 存在明确合法商业可用的 GMFSS 类**完整**实现 | **No** |
| R1 | 核心组件可合法商业使用，但没有完整实现 | **Partially true** (GMFlow Apache + MIT softsplat **op**), but incomplete VFI system |
| **R2** | **可以依据公开论文重新实现，但工程/权重/训练存在重大障碍** | **Yes — primary** |
| R3 | 目前无法找到合法可商业落地路线 | **No** (R2 still exists as a long R&D path) |

### Primary letter: **R2**

---

## 8. Recommendation (research only)

1. **Do not** integrate Fortuna/Steam GmfSs into GVFI production.  
2. **Do not** enter C8.2 for GMFSS shipping.  
3. If pursuing “GmfSs-like capability” later: treat as **multi-year R&D** — clean-room synthesis + MIT/Apache components + owned/licensed training data + counsel on Adobe splatting patent + SoftSplat author commercial grant if any Niklaus code is unavoidable.  
4. Near-term product: keep **RIFE**; C8 evidence already shows public-config RIFE parity with Steam RIFE.

---

## 9. UNKNOWN checklist

- Exact softsplat source tree inside Fortuna vs Niklaus vs hperrot (not cloned this survey)  
- Fortuna Drive weight license text  
- Whether `hperrot/splatting` is bit-equivalent to Softmax Splatting paper / passes Fortuna  
- Adobe US12283060 claim scope vs independent softsplat VFI  
- Live-action quality of any public GMFSS weights vs Steam  

---

## Stop

Research complete. No install, no GVFI changes, no C8.2.
