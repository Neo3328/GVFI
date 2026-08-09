# Liquid Glass — GVFI Design Override

> Overrides `MASTER.md` and legacy `ios.md` for the commercial UI refactor.
> Default theme: **Studio 浅色** (`data-theme="studio"`).

## Visual Direction

- Liquid Glass + professional post-production workstation density
- Compact controls (32–36px height), icon-first, generous whitespace
- Avoid heavy Windows-style filled blocks

## Themes

| ID | Label | Use |
|----|-------|-----|
| `studio` | Studio 浅色 | Default — neutral gray gradient |
| `dark` | 深色专业 | Editing suite dark |
| `ai` | AI 科技 | Cyan accent + subtle pulse |

## Glass Utilities (CSS)

| Class | Layer | Blur |
|-------|-------|------|
| `.lg-glass-1` | Chrome / Sidebar | 24px |
| `.lg-glass-2` | Panel / Card | 16px (configurable) |
| `.lg-glass-3` | Dialog / Dropdown | 12px |
| `.lg-glass-chrome` | Header / Tab bar | 24px |

## Token Source

Runtime tokens: `web-ui/src/design-tokens/`

## PyQt Bridge

Web reads `user_data/settings.json` via `GET /api/settings/appearance` on first load.
Web appearance persists independently in `localStorage` key `gvfi-appearance-v1`.

## Implementation Phases

1. ✅ Tokens + theme + appearance store
2. Glass component library
3. Layout + navigation (`/app` alias preserved)
4. **Video Processing** (priority before Dashboard)
5. Render Center (local + cloud stub)
6. Dashboard
7–10. Models, API Settings, Appearance page, polish
