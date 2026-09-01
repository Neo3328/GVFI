# C9.1-A — FILM Readiness Check (License · Weights · Runtime)

**Date:** 2026-08-12  
**Phase:** Pre-experiment verification only · **not** C9.1-B · **not** A/B · **not** C10  
**Scope:** Official public sources + static local environment observation  
**Forbidden performed:** none of download / install / compile / run / GVFI code change  

**Disclaimer:** Not legal advice. Weight redistribute clearance may still need counsel.

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## 1. Executive Summary

| Question | Answer |
|----------|--------|
| Does FILM qualify for a **controlled offline A/B** vs RIFE? | **G-FILM = PASS-WITH-UNKNOWN** |
| Why not plain PASS? | Pretrained **weights** lack a **separate explicit SPDX / redistrib statement**; cannot treat Drive/TF Hub assets as proven commercial-redistributable solely because repo code is Apache-2.0 |
| Why not FAIL? | Official LICENSE/README show **no** Non-Commercial / Research-Only / Academic-Only / No-Redistribution ban; public inference + 2× mid-frame path + Windows CUDA docs exist |
| Product ship? | **Not cleared** in this gate. This gate is only offline A/B eligibility |
| Enter C9.1-B? | **Yes, allowed** under isolation rules (no production / no `backend_mode` change), with env caveats below |

**Largest blocker (for product, not for A/B gate):** weight commercial **redistribution** remains **[UNKNOWN]**.  
**Largest soft risk (for actually running A/B later):** official stack is **TensorFlow 2.6 + CUDA 11.2.1 + Python 3.9** on an **RTX 5060 Laptop** machine that currently has **driver 610 / CUDA UMD 13.3**, **no CUDA 11.2 toolkit path**, **no TensorFlow installed**, host **Python 3.12**.

---

## 2. Official Sources

| # | Source | Role | Status |
|---|--------|------|--------|
| 1 | Paper arXiv:2202.04901 / ECCV 2022 | Algorithm | **[CONFIRMED]** |
| 2 | https://github.com/google-research/frame-interpolation | Official code | **[CONFIRMED]** · SPDX Apache-2.0 · **archived** |
| 3 | Repo `LICENSE` | Code license text | **[CONFIRMED]** Apache-2.0 |
| 4 | Repo `README.md` | Inference, weights URL, deps | **[CONFIRMED]** |
| 5 | `WINDOWS_INSTALLATION.md` | Windows/CUDA install | **[CONFIRMED]** |
| 6 | Google Drive pretrained folder (README link) | Weights host | **[CONFIRMED]** URL published; contents **not downloaded** |
| 7 | TF Hub tutorial `tf_hub_film_example` | Alternate inference + `time` API | **[CONFIRMED]** |
| 8 | `eval/interpolator_test.py`, `eval/interpolator_cli.py`, `eval/interpolator.py` | Inference API | **[CONFIRMED]** |
| 9 | Repo `NOTICE` | Attribution file | **[CONFIRMED]** absent (HTTP 404) |
| 10 | Latest public commit on `main` | Pin | **[CONFIRMED]** `69f8708f08e62c2edf46a27616a4bfcf083e2076` (2023-01-14) |

Third-party forks/Colabs were **not** used to replace official license conclusions.

---

## 3. Code License

| Item | Finding | Tag |
|------|---------|-----|
| SPDX / text | Apache License 2.0 in repo root `LICENSE` | **[CONFIRMED]** |
| Copyright headers | Google LLC Apache headers on eval scripts | **[CONFIRMED]** |
| GitHub license field | `Apache-2.0` | **[CONFIRMED]** |
| Non-Commercial / Research Only / Academic Only | **Not present** in `LICENSE` or README disclaimer beyond “not an officially supported Google product” | **[CONFIRMED]** no NC clause |
| Commercial use of **code** | Apache-2.0 permits use/reproduce/distribute/derivative under its conditions | **[CONFIRMED]** for **source/object code of the Work** |
| CLA | CONTRIBUTING.md requires CLA for contributions only | **[CONFIRMED]** irrelevant to offline use |

**Code vs weights:** Code Apache-2.0 **does not automatically** prove Drive SavedModels are the same “Work” under that LICENSE without an explicit weights statement.

---

## 4. Weight License

| Question | Answer | Tag |
|----------|--------|-----|
| Official pretrained weights? | **Yes** — README “Pre-trained Models” | **[CONFIRMED]** |
| Where? | Google Drive folder linked from README: `https://drive.google.com/drive/folders/1q8110-qp225asX3DQvZnfLfJPkCHmDpy` · also TF Hub handle referenced as `https://tfhub.dev/google/film/1` in TF tutorial | **[CONFIRMED]** |
| Pack layout (README) | `film_net/{L1,Style,VGG}/` + `vgg/imagenet-vgg-verydeep-19.mat` | **[CONFIRMED]** documented |
| Separate weights LICENSE / SPDX? | **Not found** in repo; Drive contents not inspected (no download) | **[UNKNOWN]** |
| Explicit commercial use grant for weights? | **Not found** as a dedicated weights clause | **[UNKNOWN]** |
| Explicit commercial ban (NC / academic-only / no redistrib)? | **Not found** in official LICENSE/README | **[CONFIRMED]** no hard ban text found |
| Extra acceptance terms beyond Drive access? | **Not documented** in README | **[UNKNOWN]** |
| Redistribution of checkpoints in a commercial product? | Cannot assert from public text | **[UNKNOWN]** |
| Inference-only local use for internal A/B | No official NC ban found; still not a counsel clearance | **[INFERENCE]** allowable for readiness gate under PASS-WITH-UNKNOWN |

**Hard rule applied:** “Google published” / “publicly downloadable” ≠ commercial redistributable.

---

## 5. Dependency Licenses

Official `requirements.txt` pins (inference-relevant subset):

| Component | Version (official pin) | Typical license class | Note |
|-----------|------------------------|------------------------|------|
| TensorFlow | `==2.6.2` | Apache-2.0 | Core runtime |
| tensorflow-addons | `==0.15.0` | Apache-2.0 | |
| tensorflow-datasets | `==4.4.0` | Apache-2.0 | Eval/train oriented |
| absl-py | `==0.12.0` | Apache-2.0 | |
| gin-config | `==0.5.0` | Apache-2.0 | |
| mediapy | `==1.0.3` | Apache-2.0 | Video write helpers |
| scikit-image | `==0.19.1` | BSD-style | |
| apache-beam | `==2.34.0` | Apache-2.0 | Used by `interpolator_cli` DirectRunner |
| natsort / gdown / tqdm | pinned | Permissive common OSS | gdown used for Drive fetch tools |
| ffmpeg | via apt/conda in docs | LGPL/GPL depending on build | Needed for `--output_video` |

| Extra asset | Role | License |
|-------------|------|---------|
| `imagenet-vgg-verydeep-19.mat` | Bundled next to Style/VGG training/eval pack | **[UNKNOWN]** third-party VGG; **not** proven Apache |
| SoftSplat | Paper mentions TF SoftSplat **reimplementation for comparison** | Official FILM inference path is **single SavedModel**; SoftSplat is **not** required for FILM inference scripts **[CONFIRMED]** from README inference commands |

**Inference recommendation for A/B (desk only):** prefer **`film_net/L1/saved_model`** to avoid depending on Style/VGG loss-time VGG `.mat` packaging questions. Style is still documented as a quality-oriented variant; using it later would re-open the VGG asset license **[UNKNOWN]**.

---

## 6. Weight Availability

| Item | Status |
|------|--------|
| Public download instructions | **[CONFIRMED]** README |
| Local copy on this machine | **Not found** in quick static search; TensorFlow **not** installed | **[CONFIRMED]** absent now |
| Download performed in C9.1-A | **No** |
| Variants | L1 / Style / VGG SavedModels documented | **[CONFIRMED]** |

---

## 7. Inference Capability

| Capability | Finding | Tag |
|------------|---------|-----|
| Public inference scripts | `python -m eval.interpolator_test` (one mid-frame); `python -m eval.interpolator_cli` (recursive multi-frame + optional video) | **[CONFIRMED]** |
| Mid-frame | `interpolator_test` forces `batch_dt = 0.5` | **[CONFIRMED]** |
| Arbitrary timestep API | `Interpolator.interpolate(..., dt)` with `dt ∈ [0,1]` | **[CONFIRMED]** |
| Official multi-frame path | Recursive **midpoint** via `--times_to_interpolate` (not free-form schedule in CLI) | **[CONFIRMED]** |
| Video input as MP4 to model | **No** direct MP4→model; frames are PNG/JPG directories; optional `mediapy` writes `interpolated.mp4` | **[CONFIRMED]** |
| Continuous video (many pairs) | CLI: each contiguous frame pair in a directory | **[CONFIRMED]** |
| Input format | RGB images `png`/`jpg`/`jpeg`; float32 [0,1] internally | **[CONFIRMED]** |
| Output format | PNG sequence `frame_XXX.png`; optional MP4 | **[CONFIRMED]** |
| High-res | `--block_height` / `--block_width` patching | **[CONFIRMED]** |

PyTorch: **not used** by official FILM (TensorFlow 2).

---

## 8. 24→48 Feasibility

| C8-aligned requirement | FILM design | Tag |
|------------------------|-------------|-----|
| Input 1920×1080 | Supported via full-frame or patch blocks | **[CONFIRMED]** API; runtime success **[UNKNOWN]** (not run) |
| Input 24fps | Extract frames externally (ffmpeg) | **[INFERENCE]** standard |
| VFI 2× | Per pair: mid-frame at `t=0.5` **or** `times_to_interpolate=1` → output count `2^1+1=3` including endpoints for a 2-frame folder; for N video frames → interleaved mid-frames → **2N−1** stills then encode @48 | **[CONFIRMED]** math from CLI docstring |
| Output 48fps | Re-mux/encode interpolated sequence at 48 | **[INFERENCE]** outside model |
| SR OFF | Official scripts have no SR | **[CONFIRMED]** |
| No extra enhancement | Use L1 or Style only; disable unrelated post | **[INFERENCE]** controllable in offline harness |
| Same timeline vs RIFE | Both produce one mid per adjacent pair → comparable index mapping if decode/encode matched | **[INFERENCE]** fair design possible |

**Fair experiment (design only, not executed):**

1. Same source clip as C8 (e.g. p0 1080p24 and/or real-content clip).  
2. Decode to frames.  
3. For each adjacent pair `(Fi, Fi+1)` run FILM mid-frame `t=0.5`.  
4. Emit `F0, M0, F1, M1, …, Fn`.  
5. Encode 48fps, SR off, no denoise/scdet extras (match C8 isolation).  
6. Compare to GVFI CLI RIFE `rife-v4.6` under same frame map.

---

## 9. Windows / CUDA Feasibility

### Official docs

| Item | Official statement | Tag |
|------|--------------------|-----|
| Windows support | Dedicated `WINDOWS_INSTALLATION.md` (changelog Mar 12, 2022) | **[CONFIRMED]** **not** Linux-only |
| Python | Anaconda **Python 3.9** env `frame_interpolation` | **[CONFIRMED]** |
| CUDA | Toolkit **11.2.1** | **[CONFIRMED]** |
| cuDNN | **v8.1.0** for CUDA 11.0–11.2 | **[CONFIRMED]** |
| TensorFlow | `tensorflow==2.6.0` smoke in Windows doc; `requirements.txt` pins `2.6.2` | **[CONFIRMED]** |
| GPU | NVIDIA GPU assumed for practical speed | **[CONFIRMED]** |
| Linux-only blocker | **Not stated**; Windows guide exists | **[CONFIRMED]** |

### Static local observation (this machine)

| Item | Observed | vs official | Tag |
|------|----------|-------------|-----|
| GPU | NVIDIA GeForce **RTX 5060** Laptop, 8151 MiB | New architecture vs TF 2.6 era | **[CONFIRMED]** present |
| Driver | 610.88 · CUDA UMD **13.3** | **[DIFF]** vs CUDA 11.2 pin | **[CONFIRMED]** |
| CUDA Toolkit 11.2 path | Default `CUDA\v11.2` **missing**; `CUDA_PATH` empty | **[DIFF]** | **[CONFIRMED]** |
| Host Python | **3.12.1** | **[DIFF]** vs 3.9 | **[CONFIRMED]** |
| TensorFlow installed | **No** | Expected pre-C9.1-B | **[CONFIRMED]** |

**Windows support = supported in docs** (not UNKNOWN).  
**Runnable on this GPU with pinned TF 2.6 = UNKNOWN** until an isolated env is attempted in C9.1-B (compatibility risk is real but not a license FAIL).

---

## 10. GVFI Integration Difficulty

| Aspect | Assessment |
|--------|------------|
| Relation to production | Must stay **outside** `backend_mode=cli` / RIFE default |
| Stack mismatch | FILM = **TF2 SavedModel**; GVFI prod = **RIFE ncnn/Vulkan** → **[DIFF]** |
| Offline A/B harness | Separate venv + frame I/O + encode · no GVFI adapter required for readiness | **E1** |
| Production-native FILM | Would need new TF/native path · **E2** (out of scope) |
| RTX 5060 + TF 2.6 | Env adaptation likely | **E1** with risk → escalate to **E2** if TF 2.6 cannot see GPU |

**C9.1-A engineering class for offline A/B: E1**  
**Not E3** — worth continuing under isolation.

---

## 11. Commercial Readiness

| Layer | Class | Note |
|-------|-------|------|
| Source code | Clear Apache-2.0 commercial-capable | **[CONFIRMED]** |
| Pretrained weights use (internal offline) | No NC ban found | **[UNKNOWN]** formal grant |
| Pretrained weights redistribute in GVFI product | **Not cleared** | **[UNKNOWN]** |
| VGG `.mat` | Avoid for first A/B (prefer L1) | **[UNKNOWN]** if Style used |
| Dependencies (TF etc.) | Generally commercial-friendly OSS | **[CONFIRMED]** typical SPDX; pin audit deferred |
| Product integration readiness | **Not ready** | Separate from A/B gate |

Aligned with C9 matrix: FILM remains **R1**, not R0.

---

## 12. PASS / FAIL / UNKNOWN

### Gate checklist

| # | Condition | Result |
|---|-----------|--------|
| 1 | Public implementation exists | **PASS** **[CONFIRMED]** |
| 2 | Inference path explicit | **PASS** **[CONFIRMED]** |
| 3 | 2× path explicit (`t=0.5` / `times_to_interpolate=1`) | **PASS** **[CONFIRMED]** |
| 4 | No hard Windows/CUDA documentation blocker | **PASS** (Windows docs exist); local pin mismatch = soft risk |
| 5 | Weights commercial use **not explicitly forbidden** | **PASS** on “no hard ban”; formal grant **UNKNOWN** |

### Final

# G-FILM = PASS-WITH-UNKNOWN

| Alternate labels | Not used because |
|------------------|------------------|
| PASS | Would imply weight commercial terms are confirmed |
| FAIL | Would require explicit commercial prohibition — **not found** |

---

## 13. Blocking Issues

| Severity | Issue | Blocks |
|----------|-------|--------|
| **Hard (product redistribute)** | Weights SPDX / redistrib statement missing | Product ship / bundling |
| **Soft (A/B runtime)** | Official TF 2.6 + CUDA 11.2 vs RTX 5060 / driver 610 / no toolkit / Python 3.12 | May block C9.1-B smoke until isolated env solved |
| **Soft (quality variant)** | Style path tied to VGG `.mat` pack | Prefer L1 for first A/B |
| **Process** | Repo archived | Maintenance risk only |
| **Non-blocker** | No SoftSplat dependency for official FILM inference | — |

**Largest blocker for this gate’s commercial column:** weight license **[UNKNOWN]** (not a hard ban).  
**Largest blocker for actually executing the next experiment:** TF/CUDA/GPU pin mismatch on local host.

---

## 14. Next-step Recommendation

**Allow C9.1-B** (environment bring-up / smoke only), when explicitly instructed, with:

1. Isolated conda/venv (prefer Python 3.9 per official doc) — **do not** modify GVFI `requirements` or production env.  
2. Do **not** change `backend_mode` or RIFE.  
3. Prefer **`film_net/L1`** for first smoke.  
4. Still **no** production adapter; still **no** formal A/B until smoke proves GPU inference.  
5. Keep weight redistrib as **UNKNOWN** — A/B may proceed for internal evaluation; product bundling stays blocked pending counsel.

**Do not enter C10** from this document.

---

## 15. Source URLs

- Paper: https://arxiv.org/abs/2202.04901  
- Project: https://film-net.github.io/  
- Official repo: https://github.com/google-research/frame-interpolation  
- LICENSE: https://github.com/google-research/frame-interpolation/blob/main/LICENSE  
- README: https://github.com/google-research/frame-interpolation/blob/main/README.md  
- Windows: https://github.com/google-research/frame-interpolation/blob/main/WINDOWS_INSTALLATION.md  
- requirements: https://github.com/google-research/frame-interpolation/blob/main/requirements.txt  
- Weights Drive (README): https://drive.google.com/drive/folders/1q8110-qp225asX3DQvZnfLfJPkCHmDpy?usp=sharing  
- TF Hub tutorial: https://www.tensorflow.org/hub/tutorials/tf_hub_film_example  
- Commit pin: `69f8708f08e62c2edf46a27616a4bfcf083e2076`  
- Prior survey: `docs/c9-commercial-vfi-candidate-survey.md`

---

## Decision box (required outputs)

1. **G-FILM:** `PASS-WITH-UNKNOWN`  
2. **Weight commercial license:** formal grant **UNKNOWN**; **no** explicit NC/hard ban found  
3. **Largest blocker:** weight redistrib SPDX **UNKNOWN** (product); runtime soft-risk = TF 2.6 / CUDA 11.2 vs RTX 5060 host  
4. **Enter C9.1-B?** **Yes** (isolated smoke only; wait for explicit instruction)  
5. **Report path:** `docs/c91-film-readiness-check.md`
