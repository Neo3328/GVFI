# CHANGELOG

All notable changes to GVFI are documented in this file.

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
