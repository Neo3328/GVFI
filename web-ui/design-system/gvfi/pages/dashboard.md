# Dashboard Page Overrides

> **PROJECT:** GVFI  
> **Generated:** 2026-08-03 (manual — UI/UX Pro Max CLI pending Python)  
> **Page Type:** Data-Dense Dashboard / Real-Time Monitor

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/gvfi/MASTER.md`).
> Only deviations from the Master are documented here.

---

## Page-Specific Rules

### Layout Overrides

- **Structure:** Two-column on `lg+` — left: input/presets/params, right: output/logs/actions
- **Header:** App status badge (API health), link back to `/`
- **Max width:** Full workspace (`max-w-7xl`), not marketing `max-w-6xl`

### Spacing Overrides

- **Panel gap:** `gap-4` (dense, tool-focused)
- **Section padding:** `p-4 sm:p-6` inside cards

### Typography Overrides

- **Page title:** `text-2xl` (not landing hero scale)
- **Labels:** `text-sm` with `Label` component
- **Logs:** monospace-friendly `text-xs` in `Textarea`

### Color Overrides

- **Primary:** `#FFA0B5` (kawaii pink — overrides Master trust blue for `/app`)
- **Surface:** `#FFF1F5`
- **Status colors:** success green, warning amber, error red for job states

### Component Overrides

- Use existing `SectionCard`, `CuteButton`, shadcn `Progress`, `Select`, `Slider`
- Job progress: real API polling via `gvfi-api.ts` (no mocks)
- Action panel: primary CTA "开始渲染" with disabled state when API offline

### Page-Specific Components

| Component | Route | Notes |
|-----------|-------|-------|
| `KawaiiWorkspace` | `/app` | Main dashboard shell |
| `LogsPanel` | inline | Scrollable, live job logs |
| `ActionPanel` | inline | Submit / cancel job |
