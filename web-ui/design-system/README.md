# Design System (UI/UX Pro Max)

Generated with the **Master + Overrides** pattern from [ui-ux-pro-max](.cursor/skills/ui-ux-pro-max/SKILL.md).

```
design-system/
└── gvfi/
    ├── MASTER.md          ← global tokens & rules
    └── pages/
        ├── dashboard.md   ← overrides for /app
        └── landing.md     ← overrides for /
```

## Regenerate with Python CLI

**Prerequisite:** Python 3 on PATH (`python --version`).

From `web-ui/`:

```powershell
# 1) Master file
python .cursor/skills/ui-ux-pro-max/scripts/search.py "SaaS dashboard video interpolation" --design-system --persist --output-dir "." -p "GVFI" --force

# 2) Page override (dashboard)
python .cursor/skills/ui-ux-pro-max/scripts/search.py "SaaS dashboard video interpolation" --design-system --persist --output-dir "." -p "GVFI" --page "dashboard" --force
```

### Notes

| Your example | Correct for this repo |
|--------------|----------------------|
| `.claude/skills/...` | `.cursor/skills/ui-ux-pro-max/scripts/search.py` |
| `python3` | `python` (Windows) |
| `-p "MyApp"` | `-p "GVFI"` → writes to `design-system/gvfi/` |
| Missing `--output-dir` | Add `--output-dir "."` |
| Re-run without overwrite | Add `--force` if MASTER.md exists |

### Example (generic MyApp)

```powershell
python .cursor/skills/ui-ux-pro-max/scripts/search.py "SaaS dashboard" --design-system --persist --output-dir "." -p "MyApp" --force
python .cursor/skills/ui-ux-pro-max/scripts/search.py "SaaS dashboard" --design-system --persist --output-dir "." -p "MyApp" --page "dashboard" --force
```

Creates `design-system/myapp/MASTER.md` and `design-system/myapp/pages/dashboard.md`.
