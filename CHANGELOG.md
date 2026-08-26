# CHANGELOG

All notable changes to GVFI are documented in this file.

## [1.1.0] — 2026-08-26 · Native backend · Phase D engineering hardening

> Phase D: from "feature-complete" to "maintainable, verifiable, releasable". Native RIFE backend promoted to production-ready with CLI fallback; no GUI/IA changes.

### Native RIFE backend (production)

- **In-process ncnn/Vulkan backend**: `gvfi_native.dll` + `NativeInterpolatorBackend` replaces per-scene `rife-ncnn-vulkan.exe` subprocess. Model stays resident across frames; Vulkan compute pipeline reused.
- **Batch call boundary** (D3): Python→DLL calls reduced from 23/scene to **1/scene** (−96%); PNG reads 48→24 (−50%); GPU submit 23→1. A/B benchmark: Native ≈ CLI (0.95–1.00×) at 1080p; batch vs per-frame pixel-identical.
- **Backend interface abstraction**: `InterpolatorBackend`统一 CLI/Native 生命周期 (`initialize → load_model → process → release`); release is idempotent and thread-safe.
- **Structured CLI fallback**: Native init/model/forward failure logs `NATIVE BACKEND FAILED — FALLBACK TO CLI` with stage, error code, and reason; no silent fallback; `backend_mode=cli` behavior unchanged.

### Runtime configuration & error contract (D1)

- Immutable `RuntimeConfig` centralizes `backend_mode`, `pipeline_mode`, model, GPU, codec, SR, scene detection — no duplicated parameter interpretation across Worker/API/CLI/Native.
- Stable error codes: `CONFIG_ERROR` / `INPUT_ERROR` / `DECODE_ERROR` / `MODEL_ERROR` / `VULKAN_ERROR` / `BACKEND_ERROR` / `ENCODE_ERROR` / `CANCELLED` / `UNKNOWN_ERROR`.
- Per-task `task_id` with parameter snapshot, backend, model hash, GPU, stage timings, output path, error info, fallback status.

### VideoWorker lifecycle (D2)

- Thread-safe lifecycle state machine with cooperative cancellation; protected backend release; structured fallback records; final `TASK RESULT` log.
- Full fallback integration test: 10/10 pass.

### Memory frame pipeline (D4)

- `FrameQueue` with bounded capacity, timeout, sentinel shutdown, producer/consumer exception propagation; consumer failure never deadlocks producer.
- Memory decode path (ffmpeg stdout → Frame queue) validated: single-frame, corrupt input, pre-cancelled, processor failure all exit cleanly.
- Queue stats: current/peak length, wait time, discard count, close reason.

### Scene & media format contracts (D5)

- Scene scheduler validates output ranges before execution; failed scenes do not contaminate subsequent scenes; Native/CLI model-load counts tracked separately (no more `process_count == model_load_count` assumption).
- Media contract covers H.264/H.265/AV1, audio tracks, VFR/CFR, rotation metadata, HDR, 10-bit, alpha, odd-dimension padding policy; color matrix (BT.601/709) and range (limited/full) explicit.

### Task output safety (D7)

- Output path conflict protection (never overwrites existing file).
- Disk-space pre-check with explicit `INSUFFICIENT_DISK_SPACE` error.
- Post-encode output integrity validation (ffprobe metadata contract: resolution/fps/frames/colorspace/audio).
- Failed outputs quarantined; per-task JSON report (`task_report.json`) with success/failure, parameters, timings, output path.
- API returns real output path.

### Stability baseline (D6)

- 100× Native forward (1080p, persistent backend): 100/100 pass, 0 NaN/Inf, avg 45.9ms/frame (p95 49.2ms, p99 51.0ms) on RTX 5060 Laptop.
- 10× complete VideoWorker tasks (24→48fps, 1080p): 10/10 pass, 0 fallback, 0 Vulkan error, output contract 100% correct (bt709/AAC/48frames).
- Resource sampling: RSS/GPU-memory deltas recorded; GPU memory released after backend teardown.
- Test suite: 55 unit + 11 integration tests, all green.

### Repository hygiene

- `.gitignore`: exclude `web-ui/_asar-extract/`, coverage/test report folders, Playwright output, `scripts/release-artifacts/`, stray uploads, signing keys/certs (`.pfx`/`.p12`/`.key`/`.jks`), `.asar` build artifacts, and final Release attachments (`GVFI-Setup-*.exe`, `GVFI-Portable-*.zip`, `SHA256SUMS.txt`) so installers stay GitHub Release–only.
- `web-ui/.gitignore`: keep the secret-free `.env.example` trackable (`!.env.example`).
- Docs: add `SECURITY.md`; README now notes the proprietary `LICENSE` and legal hub route.
- Release naming: standardize on `GVFI-Setup-<version>-x64.exe` and `GVFI-Portable-<version>-x64.exe`, plus generated `SHA256SUMS.txt` (`scripts/release-checksums.ps1`).
- Packaging hardening: disable Next.js production browser source maps and exclude `*.map` / `.env*` from `extraResources`.
- CI: `.github/workflows/release.yml` — tag-triggered Windows build, locked `npm ci`, lint/type/test gates, artifact verification, SHA256SUMS generation, GitHub Release upload.

### Known limitations (not in 1.1.0)

- Multi-hour soak test not yet executed; memory-leak closure is evidence-based but not formally proven.
- PSNR/SSIM quality threshold not formally defined (CLI vs Native mapping difference = 24.52 dB; batch vs per-frame pixel-identical).
- Native backend remains opt-in (`backend_mode=native`); CLI is still default.
- Memory pipeline (`pipeline_mode=memory`) is validation-only, not yet wired to RIFE/encoder.
- Breakpoint resume, batch file queue deferred.

## [1.0.0] — 2026-08-09 · First public Windows release

### Release readiness
- Version bumped to **1.0.0** (`package.json`, `APP_VERSION`).
- Privacy/compliance: upload consent, log redaction, temp upload cleanup, CORS lockdown, in-app legal hub.
- Distribution docs: `docs/RELEASE.md`, `docs/USER_GUIDE.md`, `releases/1.0.0/*`.
- Packaging: `npm run dist:win:release` → NSIS Setup + Portable; checksum helper `scripts/release-checksums.ps1`.
- Code signing: documented via `CSC_LINK` / `CSC_KEY_PASSWORD` (recommended before public installers).
- Upgrade path: **manual** install for 1.0.0; auto-update reserved for a later release. Rollback via archived previous Setup + SHA-256.

### Notes for distributors
- Fill download URLs and SHA-256 in `releases/1.0.0/DOWNLOADS.md`.
- Set `FEEDBACK_EMAIL` / `FEEDBACK_URL` in `web-ui/src/lib/brand.ts` before shipping.

## [2026.08.09] — Hover/Press split · adaptive layout · error→AI

### Buttons
- Hover and Press are independent: hover `scale(0.975)` / press `scale(0.94)`; **no Y-axis translate**.
- Hover in 80ms / out 120ms spring; press keeps its own compression feedback.

### Layout & performance
- `workspace-layout.css` + AppShell constraints for DPI/resize/safe-area.
- `MotionQualityProvider` sets `data-motion-quality` (low/medium/high) to degrade or keep full glass motion.

### Error logs
- Logs panel: one-click copy raw errors; 「投喂 AI」 stashes formatted draft into AI chat.
- Video page docks compact error log panel.

## [2026.08.09] — macOS Liquid Glass visual language

### Appearance only (no feature / route changes)

- Tokens shifted to macOS system blue / graphite (`#0a84ff`), Weather-app frost blur/saturate, continuous control radii.
- Glass panels: soft specular top light, ambient+contact shadow stack, hover float feedback.
- Shell: floating sidebar + main stage glass on desktop; frosted mobile dock.
- Backgrounds: abstract graphite/soft-light sheets only — no sky/cloud/sun/landscape motifs.
- Typography stack prefers SF Pro / PingFang / system UI fonts.
- Docs: `web-ui/docs/design-system.md` updated for macOS material language.

## [2026.08.04] — Commercial architecture & connection upgrade

### Architecture

- **Extracted** `ECCV2022-RIFE/tool_resolver.py` from `main.py` so headless API resolves ffmpeg/RIFE/RealESRGAN without duplicating path logic.
- **Added** `AI_Tools` and common subfolders to tool candidate roots (fixes missing tools when binaries live under `AI_Tools/`).
- **Decoupled** `gvfi_api.py` health/tool lookup: imports `resolve_runtime_tools` from `tool_resolver` (VideoWorker still from `main`).
- **Wired** `api-client.ts` to `api-config-store` profiles (base URL + Bearer auth) — profiles no longer dead config.

### Features

- **API 连接配置** panel: edit base URL, timeout, concurrency, kind, API key; builtin `/api` + `:8765` profiles.
- **连接** nav (was 参数): settings hub = profiles + LLM only.
- **系统 → 开发者**: plugin registry list, client log buffer, active route diagnostics.
- **Appearance**: border / shadow / glow / background opacity / background blur sliders (tokens already existed; UI was incomplete).

### Performance & stability

- Electron **parallel boot**: UI readiness no longer blocked behind a serial API wait; API soft-fails independently; boot timings logged.
- Client structured log buffer (`lib/client-log.ts`) for UI-side diagnosis.

### Docs

- Added `web-ui/docs/api.md`, `motion.md`, `config.md`, root `CHANGELOG.md`.
- README routes/FAQ updated for 首页/任务/视频/AI/连接/系统 IA.

### Preserved

- `VideoWorker` / `svfi_pipeline` contracts unchanged.
- Primary IA routes: `/app/dashboard|tasks|video|ai|settings|system`.
