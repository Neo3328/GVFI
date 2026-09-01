# C9-Final — VFI Candidate Decision (C8 → C9.3 Evidence Rollup)

**Date:** 2026-08-12  
**Phase:** Evidence consolidation only · **not** C10 · **no** new experiment / download / install / GVFI change  

**Production (unchanged throughout C8–C9.3):**  
`backend_mode=cli` · RIFE CLI **`rife-v4.6`**

**Disclaimer:** Not legal advice. License tags reflect public text only.

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## 1. Executive decision

### Is there enough evidence to **replace** RIFE in GVFI production?

# **No.**

| Requirement to replace RIFE | Status |
|-----------------------------|--------|
| Clear overall quality win on target real content (time-aligned) | **Not met** |
| Runnable alternate on this host (RTX 5060 / Windows) | FILM **FAIL**; IFRNet smoke **PASS** but quality not superior |
| Commercial weight redistrib cleared for product bundling | IFRNet / FILM weights **UNKNOWN** |
| Engineering fit without breaking CLI / scene / ordering | IFRNet closer; still not authorized to ship |

**Keep production:** RIFE **`rife-v4.6`** + **`backend_mode=cli`**.

---

## 2. Final classification

| Candidate | Class | One-line reason |
|-----------|-------|-----------------|
| **RIFE `rife-v4.6`** | **Production** | Shipping baseline; C8.1 alignment with SVFI-RIFE; no replacement winner |
| **IFRNet** (ncnn/Vulkan) | **Research** | Runs on this GPU; local limb morph **[DIFF]** vs RIFE; **no** overall quality win; weight redistrib **UNKNOWN** |
| **FILM** | **Rejected** *(this host / near-term)* | C9.1-A readiness soft-pass; C9.1-B GPU smoke **FAIL** (TF/CUDA stack vs RTX 5060) |
| **GMFSS / GmfSs** | **Rejected** *(product path)* | C8 quality interest **[DIFF]**; commercial stack **R2**; Steam weights forbidden |
| **AMT** | **Rejected** | **CC BY-NC 4.0** (**R3**) |
| **GIMM-VFI** | **Rejected** | S-Lab NC (**R3**) |
| **FLAVR / VFIformer** | **Rejected** *(near-term)* | Survey backup only; not executed; weaker pipeline fit |

**Class definitions used here**

| Class | Meaning |
|-------|---------|
| **Production** | Keep or ship as default VFI path |
| **Research** | May revisit offline under explicit auth; **not** production default |
| **Rejected** | Stop near-term product pursuit (host-block, license NC, or commercial R2/R3) |

---

## 3. Evidence timeline (existing docs only)

| Phase | Doc | Gate / verdict | Role in decision |
|-------|-----|----------------|------------------|
| **C8** real A/B | `docs/c81-real-content-ab.md` | GmfSs↔RIFE limb morph **[DIFF]**; SVFI-RIFE↔GVFI-RIFE ≈ **[SAME]** | Establishes quality gap thesis vs non-RIFE; RIFE parity baseline |
| **C8.1** RIFE align | `docs/c81-rife-alignment-ab.md` | Letter **A**; mapping **[SAME]** on p0 OSD | Confirms public `rife-v4.6` alignment class |
| **C8.1** design | `docs/c81-algorithm-alignment-ab-design.md` | Time-align protocol (`n*`/`t*`) | Binding method for later A/B |
| **C9** survey | `docs/c9-commercial-vfi-candidate-survey.md` | FILM TOP offline; IFRNet TOP product-shaped; no full NO-GO | Candidate shortlist |
| **C9.1-A** FILM ready | `docs/c91-film-readiness-check.md` | **G-FILM = PASS-WITH-UNKNOWN** | Offline A/B eligible on paper; weights **UNKNOWN** |
| **C9.1-B** FILM smoke | `docs/c91-film-ab.md` | **F0 FAIL** · **NO-GO** | FILM unusable on this TF/CUDA/GPU host |
| **C9.2-A** IFRNet ready | `docs/c92-ifrnet-readiness-check.md` | **G-IFRNET = PASS-WITH-UNKNOWN** | ncnn/Vulkan Windows path clear; weights **UNKNOWN** |
| **C9.2-B** IFRNet smoke | `docs/c92-ifrnet-smoke.md` | **F0 PASS** · **GO** (smoke) | RTX 5060 GPU mid-frame works |
| **C9.2-C** IFRNet A/B | `docs/c92-ifrnet-ab.md` | **WEAK-GO** | Local **[DIFF]**; no overall IFRNet win |
| **C9.3-A** weight license | `docs/c93-ifrnet-weight-license.md` | Weight redistrib **UNKNOWN** | Blocks product bundling clearance |

---

## 4. Quality evidence rollup

### RIFE baseline (must keep)

- C8.1 B / real: SVFI-RIFE ≈ GVFI-RIFE → treat RIFE path as **validated production quality class**.  
- Encode path differences (e.g. nvenc vs libx265) remain **confounders**, not algorithm replacement signals.

### Non-RIFE signals

| Pair | Observable | Enough to replace RIFE? |
|------|------------|-------------------------|
| GmfSs vs RIFE (C8) | Fast-limb morph **[DIFF]** (ghost vs smear) | **No** — commercial **R2** / Steam forbidden |
| FILM vs RIFE | **Not measured** (smoke FAIL) | **No** |
| IFRNet vs RIFE (C9.2-C) | Index pixels near-identical (PSNR ≫ 60 class); local limb **[DIFF]** without clear IFRNet superiority; mapping mild phase **[DIFF]** | **No** |

**Time-aligned rule:** Quality ranking only from time-aligned (or explicitly unpaired) evidence — followed in C8.1 / C9.2-C reports.

---

## 5. Engineering / host evidence

| Stack | This laptop (RTX 5060 · driver 610 · Vulkan OK) |
|-------|--------------------------------------------------|
| RIFE ncnn/Vulkan | **Production / proven** |
| IFRNet ncnn/Vulkan | **Smoke PASS**; offline 2× A/B completed |
| FILM TF2 + CUDA 11 era | **Smoke FAIL** (no CUDA 11 runtime; no WSL2; Blackwell mismatch) |

FILM remains a **paper-quality** candidate, **Rejected** for near-term work **on this machine** without a new env strategy.

---

## 6. License / commercial evidence

| Candidate | Code | Weights redistrib | Product ship? |
|-----------|------|-------------------|---------------|
| RIFE (shipping) | MIT path / in-use baseline | Treated as existing product path (counsel still advised for third-party redistrib) | **Production** |
| IFRNet | MIT code + MIT port | **UNKNOWN** (C9.3-A) | **Not cleared** |
| FILM | Apache-2.0 code | **UNKNOWN** (C9.1-A) | **Not cleared**; also host FAIL |
| AMT / GIMM | NC | NC | **Rejected** |
| GMFSS | R2 stack | Steam proprietary / SoftSplat risk | **Rejected** product path |

**Hard rule retained:** Repo MIT/Apache ≠ automatic commercial redistrib of Dropbox/Drive/converted ncnn weights.

---

## 7. Decision matrix (replace-RIFE test)

| # | Test | Result |
|---|------|--------|
| Q1 | Does any non-RIFE candidate clearly beat RIFE on real motion (time-aligned)? | **No** |
| Q2 | Is that candidate runnable here without reshaping production env? | IFRNet yes; FILM no |
| Q3 | Are weights cleared for commercial product redistrib? | IFRNet/FILM **UNKNOWN** |
| Q4 | Is GMFSS a legal/public complete ship path? | **No** (R2) |
| **Replace RIFE now?** | | **No** |

---

## 8. Recommended posture (stop here — not C10)

1. **Production:** Keep **`backend_mode=cli`** + **`rife-v4.6`**.  
2. **Research (optional, future auth only):** IFRNet remains the only executed non-RIFE path that both **runs** and shows **local** morph differences — still **Research**, not Production.  
3. **Rejected near-term:** FILM (host), AMT/GIMM (NC), GMFSS product shortcut (R2/Steam).  
4. **Do not** auto-enter C10, do not change defaults, do not bundle IFRNet weights as cleared.

---

## 9. Source index

- `docs/c81-real-content-ab.md`  
- `docs/c81-rife-alignment-ab.md`  
- `docs/c81-algorithm-alignment-ab-design.md`  
- `docs/c81-gmfss-public-feasibility.md` / `docs/c81-gmfss-legal-alternative-research.md`  
- `docs/c9-commercial-vfi-candidate-survey.md`  
- `docs/c91-film-readiness-check.md` · `docs/c91-film-ab.md`  
- `docs/c92-ifrnet-readiness-check.md` · `docs/c92-ifrnet-smoke.md` · `docs/c92-ifrnet-ab.md`  
- `docs/c93-ifrnet-weight-license.md`  

---

## Decision box (required)

| Question | Answer |
|----------|--------|
| Enough evidence to replace RIFE? | **No** |
| Production VFI | **RIFE `rife-v4.6`** (`backend_mode=cli`) |
| Research | **IFRNet** (ncnn/Vulkan; quality not superior; weights UNKNOWN) |
| Rejected (near-term) | **FILM** (host), **GMFSS product path**, **AMT**, **GIMM**, survey backups not pursued |
| Enter C10? | **No** — stop after this document |

**Report path:** `docs/c9-final-decision.md`
