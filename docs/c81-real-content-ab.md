# C8 — Real-content controlled A/B (evidence experiment, not C8.2)

**Date:** 2026-08-12  
**Scope:** Controlled evidence only · black-box Steam SVFI · **no** GVFI production code changes · **no** `backend_mode` default change · **not** C8.2  
**Claim limits:** Pairwise VFI deltas ≠ reconstruction GT error. File size ≠ quality. Public RIFE names ≠ identical internals. Pixel/morphology DIFF ≠ “SVFI better”.

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## 1. 素材清单

| ID | Path | Notes |
|----|------|-------|
| Original upload | `ECCV2022-RIFE\user_data\uploads\fcfe6a1d…019d84.mp4` | Local user upload (Douyin watermark). Used only for internal A/B. |
| **Experiment input** | `D:\GVFI-deps\native-video-worker-ab\c81_real_content\input\L1L2_douyin_t3s.mp4` | First **3.0 s** trim; **no fps resample**; re-encode H.264 CRF18 for stable decode |

Work root: `D:\GVFI-deps\native-video-worker-ab\c81_real_content\`

### Local scan result (no downloads)

| Class | Status |
|-------|--------|
| L1 face/human | **Partial** — this night dance clip only |
| L2 fast motion | **Partial** — arm/body motion in same clip |
| L3 HF/text/texture (dedicated) | **UNKNOWN / missing** — only weak Douyin watermark text; no dedicated HF/architecture/fabric clip found under `D:\GVFI-deps` / project trees without pulling unknown sources |
| Clean dialogue face / sports / city HF | **UNKNOWN** — not present; not downloaded |

Prior synthetic `p0` OSD was **not** re-used as “real content” (already covered in C8.1).

---

## 2. 素材类型

| Clip | Types covered |
|------|----------------|
| `L1L2_douyin_t3s.mp4` | **L1** (face/body visible) + **L2** (fast arm motion) + **weak L3** (watermark UI text only) |

---

## 3. 输入参数

| Field | Value |
|-------|-------|
| Resolution | 720×1038 |
| Source FPS | **30** (native; not forced to 24) |
| Duration | 3.000 s |
| Source frames | 90 |
| Audio | AAC mono present |
| Target FPS (all arms) | **48** |
| Preprocess | Trim 0–3s only; timeline fps unchanged; CRF18 H.264 remux for decode stability |

---

## 4. 实验 A — SVFI-GmfSs vs GVFI-RIFE

| Arm | Product | Public VFI | Model | Target | SR |
|-----|---------|------------|-------|--------|-----|
| **A1** | Steam SVFI OLS | `vfi_algo=GmfSs` | `GmfSs_pg_104` | 48 | false |
| **A2** | GVFI CLI (one-off runner) | RIFE ncnn | `rife-v4.6` | 48 | false |

SVFI ini: `svfi_A_gmfss.ini`  
Load evidence: `GMF+SS model loaded` / `GmfSs_pg_104` (`svfi_A_run.err`)  
SVFI out: `svfi_out\L1L2_douyin_t3s-48.000fps.GmfSs_pg_104.DBG.000001.mp4` (144f, HEVC)

GVFI runner: `run_gvfi_cli.py` (**outside** production tree; sets `enable_dedup=False`, `enable_scdet=False` for isolation — production defaults untouched)  
GVFI out: `gvfi_cli\L1L2_douyin_t3s_enhanced.mp4` (144f, HEVC nvenc) · wall ~4.6 s

---

## 5. 实验 B — SVFI-RIFE vs GVFI-RIFE (control)

| Arm | Product | Public VFI | Model | Target | SR |
|-----|---------|------------|-------|--------|-----|
| **B1** | Steam SVFI OLS | `vfi_algo=ncnn_rife` | `rife-v4.6` | 48 | false |
| **B2** | Same GVFI CLI output as A2 | RIFE ncnn | `rife-v4.6` | 48 | false |

SVFI ini: `svfi_B_ncnn_rife.ini`  
First attempt `c81realB000001` **skipped** after Steam API fail (stale/skip warning) — **discarded**.  
Valid run: task `c81realB000002` · log `RIFE Anytime Model Loaded` · out `…rife-v4.6.DBG.000002.mp4` (144f)

**Naming only:** public-config RIFE v4.6 alignment — **not** claimed identical ncnn internals.

---

## 6. Frame alignment

**No burned OSD** on this clip.

Method:

1. Decode source + three outputs → PNG (`frames\`).
2. Downscale grayscale; for each output frame find nearest source frame by MAE → `n_star` ∈ `[0..89]`.
3. Pair by shared `n_star` (order within bucket).
4. Theoretical `t = out_index / 48` recorded implicitly via CFR 48 outputs (both products `nb_frames=144`, duration 3.0s).

| Arm | Pairing coverage | Same-out `dn≠0` count | Formal metric basis |
|-----|------------------|------------------------|---------------------|
| A | **86.8%** (125 pairs) | 19 | **time-aligned** |
| B | **84.7%** (122 pairs) | 22 | **time-aligned** |

Coverage ≥70% → time-align treated as **usable** (not UNKNOWN). Residual same-out `dn≠0` ⇒ index-aligned remains **[CONFOUNDED]**.

Artifacts: `metrics.json`, `metrics_full.json`, `visual\A\`, `visual\B\`.

---

## 7. [SAME] / [DIFF] / [UNKNOWN] 条件矩阵

| Item | A (GmfSs vs GVFI-RIFE) | B (SVFI-RIFE vs GVFI-RIFE) |
|------|------------------------|----------------------------|
| Input clip | [SAME] | [SAME] |
| Target 48 / out frames 144 | [SAME] | [SAME] |
| Resolution 720×1038 | [SAME] | [SAME] |
| SR off | [SAME] | [SAME] |
| Public algo family | [DIFF] GmfSs vs RIFE | [SAME] public RIFE name |
| Public model id | [DIFF] `GmfSs_pg_104` vs `rife-v4.6` | [SAME] `rife-v4.6` |
| Identical weights/graph | [UNKNOWN] | [UNKNOWN] |
| Encoder | [DIFF] libx265 vs hevc_nvenc | [DIFF] same |
| Bit depth intent 8-bit HEVC | [SAME] family | [SAME] |
| Color tags | [DIFF]/partial) SVFI mux attempts bt709; GVFI path not re-dumped here | same note |
| File size | [DIFF] ~0.50 MB vs ~1.45 MB (A) / ~0.46 MB vs ~1.45 MB (B) — **not quality** | [DIFF] |
| Dedup/scdet isolation intent | [SAME] intent (SVFI remove_dup=0 / no scdet; GVFI runner off) | [SAME] |
| Mapping (`n_star`) | mostly aligned; some `dn≠0` | mostly aligned; some `dn≠0` |

---

## 8. 数值结果（VFI↔VFI 差异，非 GT）

> These numbers describe **difference between two VFI outputs**. They do **not** prove which is closer to a true intermediate (no high-fps GT).

### A — time-aligned (formal)

| Metric | Mean | Min | Max |
|--------|------|-----|-----|
| MAE | 1.785 | 1.164 | 4.525 |
| PSNR | **37.27** | 25.61 | 43.97 |
| SSIM | **0.9894** | 0.9121 | 0.9992 |
| maxdiff | 126.7 | 17 | 218 |

Index-aligned [CONFOUNDED]: PSNR mean 38.54 / SSIM 0.9930 (do **not** use for quality ranking).

### B — time-aligned (formal)

| Metric | Mean | Min | Max |
|--------|------|-----|-----|
| MAE | 1.723 | (see JSON) | (see JSON) |
| PSNR | **37.50** | (see JSON) | (see JSON) |
| SSIM | **0.9894** | (see JSON) | (see JSON) |

Index-aligned [CONFOUNDED] available in `metrics.json` — reference only.

**Interpretation caution:** A and B pairwise PSNR means are **similar**. Encode/path residuals can dominate aggregate scores; visual morphology still required.

---

## 9. 视觉结果

Samples: `visual\A\side_idx_*.png`, `visual\B\side_idx_*.png` (incl. high-motion idx 21/25/26/36/39).

### Arm A (GmfSs vs GVFI-RIFE)

| Phenomenon | Tag | Evidence |
|------------|-----|----------|
| Face structure (sampled) | [SAME]/approx) | idx1 / general mid: face geometry similar under night noise |
| Eyes / mouth detail | [UNKNOWN]/limited) | Low light + motion; no clear one-sided failure |
| Fast arm motion / ghosting | **[DIFF]** (morphology) | High-motion idx39: GVFI-RIFE shows more **layered multi-exposure** ghosting; GmfSs shows more **continuous smear/soft blend** — record morphology, **not** “better” |
| Body silhouette | [SAME]/approx) | No large melt/tear observed on sampled frames |
| Motion edge | [DIFF]/mild) | White ground line: RIFE more stair-step; GmfSs slightly softer / minor waviness (idx39 note) |
| Warping | [DIFF]/mild/local) or [UNKNOWN] severity | Occasional soft edge vs aliasing; not p0-checkerboard-level warp |
| Fine text (watermark) | [SAME] | Douyin UI readable both sides |
| Texture / occlusion / camera | [UNKNOWN] | Night clip; dedicated HF / occlusion cases missing |
| Phase | mostly [SAME] | Endpoints align; some mid `dn≠0` |

### Arm B (SVFI-RIFE vs GVFI-RIFE)

| Phenomenon | Tag | Evidence |
|------------|-----|----------|
| Face / body | [SAME] | idx39 visually near-indistinguishable |
| Ghosting / motion blur | [SAME] | Same layered arm ghost pattern both sides |
| Watermark text | [SAME] | Aligned sharpness |
| Background texture | [SAME] | No clear one-sided warp |
| Residual encode grain/bitrate | [DIFF] possible | File size / encoder differ; not scored as VFI win |

---

## 10. 每类素材结论

| Class | Coverage | Conclusion |
|-------|----------|------------|
| L1 face | Partial (night dance) | **A:** no stable face-structure catastrophe; motion-limb morphology can [DIFF]. **B:** ≈ [SAME] on samples |
| L2 motion | Partial (arms) | **A:** repeatable **morphology** DIFF on fast limbs (layer vs smear). **B:** ≈ |
| L3 HF | Dedicated missing | **UNKNOWN** beyond watermark [SAME] |

---

## 11. 跨素材综合结论

Only **one** real clip was legally/locally available for this run.

### 问题 A — 真实内容上 GmfSs vs RIFE 是否稳定明显差异？

**轻微差异（局部、可重复的形态差），不是全面“明显更好/更差”。**  
Fast-limb ghosting morphology differs on multiple high-motion samples; face/watermark often similar; aggregate time-aligned PSNR close to the RIFE↔RIFE control (encode confound).

### 问题 B — 真实内容上 SVFI-RIFE ≈ GVFI-RIFE？

**基本相同（在本 clip 的公开配置 RIFE 对齐下）。**  
Supports prior p0 letter **A** conclusion for public-config RIFE alignment, now on real L1/L2-partial content. Internals still [UNKNOWN].

### 问题 C — 若 A 不同而 B 近似，能否强化“算法族”候选？

**可以升为更强候选解释，但不能写成最终因果证明。**  
Pattern matches design expectation: family switch (GmfSs) changes motion morphology more than public-RIFE↔public-RIFE. Still confounded by encode (nvenc vs libx265), single short night clip, weak L3, and imperfect `n_star` matching.

---

## 12. Confounders

- Encoder: GVFI `hevc_nvenc` vs SVFI `libx265` CRF18  
- Color mux tags differ in SVFI concat logs  
- `n_star` from template MAE (no OSD); ~15% unpaired  
- Single 3s night Douyin clip; watermark rights unclear for redistribution  
- No high-fps GT intermediates  
- First SVFI-B task skipped — only B000002 used  
- Steam API error lines still appear intermittently (runs completed after GUI warm)

---

## 13. 当前证据排序（update）

| Priority | Claim | Status after this experiment |
|----------|-------|------------------------------|
| P0 | Public VFI **family** (GmfSs vs RIFE) | **Strengthened as candidate** for motion-morphology gaps; **not** final root-cause proof |
| P0/P1 | Frame mapping / phase | On this clip mostly aligned; residual `dn≠0` remains — still monitor |
| P1 | Encode / color | Still material [DIFF]; can inflate pairwise metrics |
| P1 | SR / promote | Off here — not explanatory |
| P2 | File size | Explicitly **not** quality |

---

## 14. 是否支持继续研究 GmfSs？

**Yes, as a research direction — not as a production integration mandate.**

Support rationale:

- Real-content control **B ≈** while **A shows localized motion morphology DIFF** → family remains a leading hypothesis for “why SVFI can look different”.  
- Does **not** authorize copying Steam private weights, reversing SVFI, or entering C8.2.  
- Next evidence gaps: legal L3 + dialogue face + sports clips; encode-locked PNG path; optional legal open GmfSs arm (design-only until licensed).

---

## 十五、严格结果分类（required）

### A — GmfSs vs RIFE（真实素材）

**轻微差异**

### B — SVFI-RIFE vs GVFI-RIFE（真实素材）

**基本相同**

---

## Artifacts

| Item | Path |
|------|------|
| Report | `docs/c81-real-content-ab.md` |
| Metrics | `...\c81_real_content\metrics.json` |
| Visuals | `...\c81_real_content\visual\{A,B}\` |
| GVFI runner (one-off) | `...\c81_real_content\run_gvfi_cli.py` |
| SVFI inis | `svfi_A_gmfss.ini`, `svfi_B_ncnn_rife.ini` |

---

## Stop

Executable real-content arms completed with available local material.  
**No C8.2. No production code changes. No next round started.**
