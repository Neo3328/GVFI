# G0 Gate — Steam SVFI public RIFE option check

**Date:** 2026-08-12  
**Scope:** G0 only · no A/B · no reverse · no GVFI changes · not C8.2

Developed by Mr. Gong  
Copyright © 2026 Mr. Gong. All Rights Reserved.

---

## Verdict

# G0 = PASS

Steam SVFI **does** expose RIFE as a selectable VFI algorithm in **public configuration** (product `Configs\` templates and saved task inis).

---

## 1. Public evidence

Checked (allowed methods only):

| Source | Result |
|--------|--------|
| `D:\Steam\steamapps\common\SVFI\SVFI.ini` | Current selection = `vfi_algo=GmfSs` / `vfi_model=GmfSs_pg_104` (not RIFE; does not negate availability) |
| `Configs\SVFI_Config_*.ini` distinct `vfi_algo` | **`GmfSs`**, **`ncnn_rife`**, **`Tariff`** |
| Product template with RIFE | `SVFI_Config_Template_纯补帧率高A超.ini` (and `…英特尔快补min.ini`): `vfi_algo=ncnn_rife`, `vfi_model=rife-v4.6` |
| Saved task configs | e.g. `SVFI_Config_339_29a08d.ini`: `vfi_algo=ncnn_rife`, `vfi_model=rife-v4.6`; also `rife-v2.3` in `SVFI_Config_91c_c425d5.ini` |
| GUI screenshot | **Not obtained** this session (`steam -applaunch 1692080` stopped at Steam login UI; no SVFI main window) |
| `models\vfi\` folder names | Observed `ncnn_rife` / `rife` directories — **not used as G0 proof** (filename inference forbidden) |

Evidence copies: `D:\GVFI-deps\native-video-worker-ab\c81_ab\g0_evidence\`

---

## 2. Does RIFE appear in public GUI / config?

| Channel | Status |
|---------|--------|
| Public config keys | **YES** — explicit `vfi_algo=ncnn_rife` and `vfi_model=rife-v4.6` / `rife-v2.3` |
| Public GUI dropdown screenshot | **Not captured** (Steam login blocked window) |
| Private binary / unpacked code | **Not inspected** (forbidden) |

---

## 3. Accurate public names (PASS detail)

| Config key | Public value(s) observed |
|------------|--------------------------|
| `vfi_algo` | **`ncnn_rife`** (alongside `GmfSs`, `Tariff`) |
| `vfi_model` | **`rife-v4.6`**, **`rife-v2.3`** |
| Related keys present in same inis | `rife_exp`, `use_ncnn`, other `rife_*` knobs (shared schema; not themselves proof of family) |

**Note:** The public algorithm id is **`ncnn_rife`**, not the bare token `RIFE`. Model ids are **`rife-v4.6`** / **`rife-v2.3`**.

---

## 4–5. FAIL / UNKNOWN N/A

Not FAIL: RIFE is explicitly present in public configs/templates.  
Not UNKNOWN: config evidence is sufficient under allowed method “公开配置文件中明确暴露的算法选项”.

Residual gap (optional follow-up, not required to overturn PASS): GUI dropdown screenshot once Steam is logged in.

---

## 6. Next-step suggestion

- For design arm **B2/B3** (SVFI-RIFE vs GVFI-RIFE): use public settings  
  `vfi_algo=ncnn_rife` + `vfi_model=rife-v4.6` (closest public name to GVFI’s v4.6 path).  
- Still require time-aligned pairing (strong P1).  
- Do **not** assume `ncnn_rife`/`rife-v4.6` ≡ GVFI `rife-ncnn-vulkan` + `rife-v4.6` weights.  
- Optional: after Steam login, one GUI screenshot of the VFI algorithm list for the evidence pack.  
- **Stop here** — do not run A/B, do not enter C8.2.

---

## Stop

G0 complete.
