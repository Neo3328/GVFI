# C8.1 — GmfSs / GMFSS public & legal feasibility survey

**Date:** 2026-08-12  
**Scope:** Research / evidence only · **not** C8.2 · **no** GVFI code changes · **no** install/integration · **no** Steam reverse / weight extraction  

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## 1. Executive Summary

Steam SVFI publicly names its algorithm **GmfSs** / model **`GmfSs_pg_104`**. Public OLS logs also print a load banner pointing at **GMF+SoftSplat** and the public URL `https://github.com/hyw-dev/GMFSS` (same family as `routineLife1/GMFSS`).

On the open internet there **is** a publicly documented GMFSS lineage (**GMFlow + SoftSplat-style anime VFI**) with:

- Public GitHub source (current recommended: **`98mxr/GMFSS_Fortuna`**, MIT on GitHub)
- Public Google Drive weight packs referenced by that README
- A runnable `inference_video.py` with `--multi=2` (suitable for 2× / 24→48-style use)

However:

- Softmax Splatting’s **reference** implementation states it is **academic-only**; commercial use requires contacting authors.
- GMFSS itself appears to be a **GitHub engineering project**, not a dedicated peer-reviewed “GMFSS paper.”
- Steam’s **`GmfSs_pg_104` must not be treated as** those public Drive weights (identity **unverified**; extraction forbidden).
- Runtime is **PyTorch + CUDA + CuPy**, not GVFI’s production **ncnn/Vulkan CLI** path.

### Strict letter

# **D** — 发现来源但存在明显许可/再分发限制

(Research-only reproduction of Fortuna is closer to “publicly reproducible,” but **commercial product reuse** is blocked/uncertain mainly by SoftSplat academic-only terms + weight-license ambiguity + Steam-model non-identity.)

---

## 2. GmfSs identity

| Item | Public finding | Confidence |
|------|----------------|------------|
| Expansion | **GMFSS** ≈ **GMFlow-based SoftSplat** anime VFI (README wording: “GMFlow based anime video frame interpolation”) | High |
| Steam UI/config id | `vfi_algo=GmfSs`, `vfi_model=GmfSs_pg_104` | High (C8.1 black-box) |
| OLS public banner | “Loading GMF+SoftSplat Model” + link `https://github.com/hyw-dev/GMFSS` | High (log text only; not used to open Steam binaries) |
| Canonical open repos | `routineLife1/GMFSS` (legacy) → points to **`98mxr/GMFSS_Fortuna`** as current basis; also `GMFSS_union`, `GMFupSS` | High |
| “pg” in `GmfSs_pg_104` | Fortuna exposes `train_pg.py` (“Train gmfss with gan optimization”) — **naming coincidence only**; **does not prove** Steam weights ≡ public `train_pg` checkpoint | Low / do not equate |
| Dedicated GMFSS academic paper | **NOT FOUND** as a standalone peer-reviewed GMFSS paper | High for “not found” |
| Component papers | **GMFlow** (CVPR 2022 Oral); **Softmax Splatting** (CVPR 2020) | High |

**Authors / maintainers (public GitHub accounts, not Steam):**

- Legacy GMFSS: `routineLife1` / `hyw-dev` namespace used in links  
- Fortuna / union: `98mxr`  
- Flow backbone: Haofei Xu et al. (`haofeixu/gmflow`)  
- Softmax splatting: Simon Niklaus & Feng Liu  

READMEs **acknowledge SVFI sponsorship**; that is **not** a license to use Steam private assets.

---

## 3. Primary public sources

| Source | URL / ID | Role |
|--------|----------|------|
| Legacy GMFSS | https://github.com/routineLife1/GMFSS | Original public project; redirects users to Fortuna |
| Linked from SVFI log | https://github.com/hyw-dev/GMFSS | Same public project family |
| **Current recommended** | https://github.com/98mxr/GMFSS_Fortuna | “All-in-one” anime GMFSS; MIT; inference + train scripts |
| Related | https://github.com/98mxr/GMFSS_union · https://github.com/98mxr/GMFupSS | Variants / speed / union |
| GMFlow | https://github.com/haofeixu/gmflow · CVPR 2022 | Optical-flow backbone paper/code |
| Softmax Splatting | https://arxiv.org/abs/2003.05534 · https://github.com/sniklaus/softmax-splatting | Forward-warping paper + reference CUDA/CuPy ops |
| SoftSplat-Full | https://github.com/JHLew/SoftSplat-Full | Full SoftSplat model reimplementation (public) |
| Third-party wrappers | ComfyUI-Frame-Interpolation “GMFSS Fortuna VFI”; `vs-gmfss_fortuna` | Indicate community reuse of Fortuna — **not** audited here for license compliance |

---

## 4. Source / license status

| Artifact | License (public) | Notes |
|----------|------------------|-------|
| `98mxr/GMFSS_Fortuna` code | **MIT** (GitHub `LICENSE`, SPDX MIT) | Copyright (c) 2023 98mxr |
| `98mxr/GMFSS_union` | **MIT** (GitHub API) | |
| `routineLife1/GMFSS` | **license: null** on GitHub API | No SPDX filed; treat carefully |
| `haofeixu/gmflow` | **Apache-2.0** | |
| `sniklaus/softmax-splatting` | **No SPDX**; README: **“strictly for academic purposes only”**; commercial use → contact authors | **Primary commercial red flag** |
| Steam SVFI / `GmfSs_pg_104` | Proprietary Steam product | **Out of scope**; do not extract |

---

## 5. Model availability

| Question | Answer |
|----------|--------|
| Public weights for Fortuna? | **Yes (as linked):** Google Drive packs in Fortuna README (“GMFSS model”, “union model”, anime-run fine-tune, pretrain) |
| Hosted in-git? | No — external Drive links (availability can change) |
| Separate weight license file? | **NOT FOUND** beyond repo MIT for “Software” — weight terms **UNKNOWN** if not stated in Drive package |
| Is Steam `GmfSs_pg_104` those weights? | **UNKNOWN / must assume NO** without legal proof; **forbidden** to hash/extract from Steam |
| NCNN / Vulkan exports public? | **NOT FOUND** in surveyed repos |

---

## 6. Runtime / framework

| Item | Public Fortuna stack |
|------|----------------------|
| Language | Python |
| DL framework | **PyTorch** (+ torchvision) |
| GPU | **NVIDIA CUDA** (README: developed on PyTorch 1.13.1 / CUDA 11.8 / Python 3.9) |
| Extra | **CuPy** CUDA kernels (softsplat-style ops); moviepy/opencv |
| Vulkan | **NOT** listed |
| NCNN | **NOT** listed |
| CPU-only path | **NOT** documented as first-class |

Inference entry (public README):

```text
python3 inference_video.py --img=demo/ --scale=1.0 --multi=2
python3 inference_video.py --img=demo/ --scale=1.0 --multi=2 --union
```

---

## 7. Technical requirements

| Topic | Finding |
|-------|---------|
| Input | Image sequence / video via public scripts (OpenCV / moviepy style pipelines) |
| Output | Interpolated frames / video under project conventions |
| 24→48 / 2× | **`--multi=2`** is explicitly documented → **suitable in principle** for 2× VFI |
| Arbitrary FPS | SoftSplat family conceptually supports intermediate `t`; Fortuna CLI emphasizes multiplier — exact arbitrary-FPS API **partially documented** |
| Domain bias | READMEs: **Dedicated for Anime**; live-action quality vs Steam GmfSs on dance clip **UNKNOWN** for public weights |
| VRAM / speed | **UNKNOWN** (not measured this survey; no install performed) |

---

## 8. GVFI compatibility assessment

| GVFI production trait | GMFSS Fortuna public | Fit |
|-----------------------|----------------------|-----|
| Default `backend_mode=cli` RIFE ncnn Vulkan | PyTorch CUDA CuPy | **Poor drop-in** |
| Native `gvfi_native.dll` ncnn path | No public ncnn GMFSS | **Poor** |
| Disk PNG scene pipeline | Possible via external process wrapper | **Possible but new backend** |
| Scene isolation / ordering contracts | Would need a new adapter | **Non-trivial** |
| Packaging (Electron desktop) | Ships torch+CUDA+cupy is heavy vs ncnn exe | **High product cost** |
| Legal for commercial GVFI | SoftSplat academic-only + weight ambiguity | **Blocked / needs counsel + author contact** |

**Conclusion:** Technically interesting as a **separate research backend**, **not** a low-friction swap for current RIFE CLI/Native.

---

## 9. Legal / reuse constraints

1. **Do not use Steam `GmfSs_pg_104` or any Steam-extracted asset.**  
2. Fortuna **MIT** covers the **GitHub software** as published.  
3. Softmax Splatting reference code: **academic-only**; commercial GVFI distribution likely needs **explicit permission**.  
4. GMFlow: Apache-2.0 (attribution / patent termination terms apply).  
5. Weight files: public Drive links exist; **exact redistribution rights UNKNOWN** unless stated inside packages.  
6. SVFI sponsorship note ≠ license grant.  
7. Patents covering SoftSplat / GMFlow / GMFSS as product features: **UNKNOWN** (no patent search performed).  
8. Third-party ComfyUI/VS wrappers: popularity ≠ clearance for GVFI commercial shipping.

---

## 10. Evidence confidence

| Claim | Confidence |
|-------|------------|
| Public GMFSS lineage exists and matches Steam’s “GMF+SoftSplat” naming | **High** |
| Fortuna is current public code+weights entrypoint | **High** |
| SoftSplat commercial restriction is real (README) | **High** |
| Steam `GmfSs_pg_104` ≡ public Drive checkpoint | **Not evidenced** (treat as false until proven legally) |
| GMFSS has its own conference paper | **Low / not found** |
| Patent risk level | **UNKNOWN** |

---

## 11. UNKNOWN / NOT FOUND

- Peer-reviewed paper titled/authored specifically as “GMFSS”  
- SPDX license on `routineLife1/GMFSS`  
- Explicit model-weight license text for Drive zips (not opened/downloaded in this survey)  
- Public ncnn / Vulkan / TensorRT official GMFSS ports from authors  
- Proof that Steam `GmfSs_pg_104` equals any public `train_pg` / Fortuna pack  
- Patent clearance  
- Live-action quality parity of public anime-oriented weights vs Steam on C8 dance clip  

---

## 12. Recommendation

| Path | Recommendation |
|------|----------------|
| Extract / mirror Steam GmfSs | **Forbidden** |
| Drop public Fortuna into GVFI production now | **No** (license + architecture mismatch) |
| Research-only A/B: public Fortuna vs GVFI-RIFE on legal clips | **Conditionally OK** after counsel review of SoftSplat academic terms + weight terms; still **not C8.2** |
| Product strategy | Keep RIFE as production; treat GMFSS as **hypothesis family** until a **clearly redistributable** stack exists (reimplemented ops with commercial-safe license, or written SoftSplat commercial grant) |
| Next evidence (if ever authorized) | Counsel memo; SoftSplat author contact; weight license readme from Drive; optional research harness **outside** production defaults |

---

## Strict classification (required)

| Letter | Meaning | Selected |
|--------|---------|----------|
| A | 存在公开、合法、可复现实现 | No (commercial legality incomplete) |
| B | 有论文/技术资料，但没有可直接复现的公开实现 | No (Fortuna **is** reproducible for research) |
| C | 无法确认公开实现 | No |
| **D** | **发现来源但存在明显许可/再分发限制** | **Yes** |

**One-line:** Public GMFSS/Fortuna exists and is research-reproducible under MIT + Drive weights, but **SoftSplat academic-only terms** (and weight/Steam-identity unknowns) create **clear redistribution/commercial constraints** for GVFI → **D**.

---

## Stop

Survey complete. No install, no GVFI changes, no C8.2.
