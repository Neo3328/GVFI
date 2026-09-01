# Fix: Restore frontend ↔ backend parameter contract (P0-2)

## 1. Original problem

GUI `JobSettings` were sent correctly from Electron / Next.js (`createJob` → `/jobs`), but `gvfi_api._settings_to_worker_params` only mapped a subset (`fps`, `superResolution`+`resolution`→`scale`, `model`→`rife_model`) and **hard-coded** `codec` / `crf` / `encode_preset`.

Dropped on the API→Worker hop:

| Param | Frontend sent | API→Worker before fix |
|-------|---------------|------------------------|
| `quality` | yes (0–1) | discarded → always CRF 18 |
| `gpu` | yes (device index) | discarded → no `-g` on RIFE/ESRGAN |
| `precision` | yes | discarded |
| `srModel` | yes | discarded → always `ESRGAN_MODEL_DEFAULT` |
| `resolution` | yes | partially used for scale only; not kept on params |
| `codec` | not in GUI | hard-coded `H.265 (HEVC)` |

Result: UI choices looked active but the render core often ran defaults.

## 2. Parameter flow table

Chain: **Electron → Next.js → `gvfi_api.py` → `VideoWorker` → CLI (RIFE / Real-ESRGAN / FFmpeg)**

| Param | Frontend | API receive | Python / worker key | Worker use | Affects execution? |
|-------|----------|-------------|---------------------|------------|--------------------|
| `model` | `JobSettings.model` (`gvfi-types.ts`, process context) | `/jobs` settings JSON | `model` + derived `rife_model` path | RIFE `-m` | **Yes** |
| `fps` | `JobSettings.fps` | same | `fps` | target FPS / RIFE frame count | **Yes** |
| `superResolution` | `JobSettings.superResolution` | same | `superResolution` + derived `scale` | skip / run ESRGAN | **Yes** |
| `srModel` | `JobSettings.srModel` | same | `srModel` → `resolve_sr_model_name` → `-n` | ESRGAN model name | **Yes** (when SR on) |
| `resolution` | `JobSettings.resolution` | same | `resolution` + derived `scale` (`原始`/`2x`/`4x`) | SR scale factor | **Yes** (with SR) |
| `gpu` | `JobSettings.gpu` | same | `gpu` | RIFE/ESRGAN `-g` (`-1`=CPU) | **Yes** |
| `precision` | `JobSettings.precision` | same | `precision` | logged only | **No** (ncnn CLIs have no precision flag) |
| `quality` | `JobSettings.quality` (0–1 slider) | same | `quality` → derived `crf` | FFmpeg `-crf` | **Yes** |
| `codec` | not exposed in web GUI | optional `settings.codec` | `codec` (default `H.265 (HEVC)`) | encoder selection | **Yes** if set; default otherwise |
| `outputFormat` | not in contract | — | — | — | N/A |

Canonical names (no aliases): `model`, `fps`, `superResolution`, `srModel`, `resolution`, `gpu`, `precision`, `quality`, `codec`.

Derived-only (not alternate UI names): `scale`, `crf`, `encode_preset`, `rife_model`.

## 3. Lost params & fix

| Param | Fix |
|-------|-----|
| `quality` | `_quality_to_crf`: `[0,1]` → CRF 28…14; values `>1` treated as CRF |
| `gpu` | Pass through; `VideoWorker` adds `-g` to RIFE and Real-ESRGAN |
| `precision` | Pass through + job-start log (tool limitation: no CLI flag) |
| `srModel` | Pass through; `resolve_sr_model_name` maps to ncnn `-n` |
| `resolution` | Kept on params; still drives `scale` |
| `codec` | Default unchanged; honor `settings.codec` if provided |

Job-start log (API stdout + job logs + worker logs):

```
任务开始：
model=rife-v4.6
gpu=0
precision=fp16
quality=0.8
srModel=realesrgan
resolution=1080p
fps=120
codec=H.265 (HEVC)
crf=17
```

## 4. Modified files

- `ECCV2022-RIFE/gvfi_api.py` — full settings→params mapping + effective-config log
- `ECCV2022-RIFE/main.py` — consume `gpu` / `srModel`; log effective config at run start
- `ECCV2022-RIFE/tool_resolver.py` — `resolve_sr_model_name` / `SR_MODEL_TO_NCNN`
- `docs/fixes/parameter-contract-fix.md` — this document

No changes to RIFE weights, inference algorithm, FFmpeg color/encode recipe (beyond CRF from `quality`), GUI styles, or architecture.

## 5. Test results

Offline mapping checks (`QT_QPA_PLATFORM=offscreen`, import `_settings_to_worker_params`):

| Case | Key settings | Observed params |
|------|--------------|-----------------|
| Test 1 GPU on | `gpu=0`, `srModel=realesrgan`, `quality=0.8` | `gpu=0`, `srModel=realesrgan`, `crf=17`, ncnn `-n=realesr-animevideov3` |
| Test 2 GPU off | `gpu=-1` (same otherwise) | `gpu=-1` (differs from Test 1) |
| Test 3 SR switch | `srModel=realcugan`, `precision=fp32`, `quality=0.9` | `srModel=realcugan`, ncnn `-n=realesrgan-x4plus-anime`, `precision=fp32`, `crf=15` |

Asserts: `gpu` differs Test1/2; `srModel` / `precision` / `crf` differ Test1/3 — **passed**.
