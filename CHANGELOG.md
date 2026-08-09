# CHANGELOG

All notable changes to GVFI are documented in this file.

## [Unreleased] — Repository hygiene

- `.gitignore`: exclude `web-ui/_asar-extract/`, coverage/test report folders, Playwright output, `scripts/release-artifacts/`, stray uploads, signing keys/certs (`.pfx`/`.p12`/`.key`/`.jks`), `.asar` build artifacts, and final Release attachments (`GVFI-Setup-*.exe`, `GVFI-Portable-*.zip`, `SHA256SUMS.txt`) so installers stay GitHub Release–only.
- `web-ui/.gitignore`: keep the secret-free `.env.example` trackable (`!.env.example`).
- Docs: add `SECURITY.md`; README now notes the proprietary `LICENSE` and legal hub route.
- Release naming: standardize on `GVFI-Setup-<version>-x64.exe` and `GVFI-Portable-<version>-x64.exe` (electron-builder `portable` target produces a single-file EXE regardless of extension), plus a generated `SHA256SUMS.txt` (`scripts/release-checksums.ps1`).
- Packaging hardening: disable Next.js production browser source maps and exclude `*.map` / `.env*` from `extraResources` so installers do not ship development files.
- Git index: stop tracking `web-ui/_asar-extract/**` (extracted Electron artifacts); files remain on disk, ignored going forward.
- CI: add `.github/workflows/release.yml` — tag-triggered Windows build, locked `npm ci`, lint/type/test gates, artifact verification, SHA256SUMS generation, and GitHub Release upload. Signing secrets are read exclusively from GitHub Actions Secrets (`CSC_LINK`, `CSC_KEY_PASSWORD`).

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
