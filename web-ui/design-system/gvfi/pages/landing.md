# Landing Page Overrides

> **PROJECT:** GVFI  
> **Page Type:** Marketing / SaaS Landing

> ⚠️ Overrides `design-system/gvfi/MASTER.md` for `/` only.

---

## Page-Specific Rules

### Color Overrides

- **Primary:** `#FFA0B5` (kawaii pink, not Master `#2563EB`)
- **Primary hover:** `#FFB3C6`
- **Surface band:** `#FFF1F5` for workflow section

### Layout Overrides

- **Pattern:** Product Demo + Features (hero mockup + 4 feature cards)
- **Sections:** Hero → Features → Workflow → Pricing → CTA → Footer
- **Max width:** `max-w-6xl`

### Component Overrides

- CTAs use `cuteButtonClassName` + `Link` to `/app`
- Sticky header with anchor nav `#features`, `#workflow`, `#pricing`
- No lead-capture form (no backend yet)
