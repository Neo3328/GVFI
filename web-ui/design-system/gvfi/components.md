# GVFI Liquid Glass — Component Library

> Canonical tokens: `src/design-tokens/tokens.css`  
> CSS Glass: `src/components/glass/*`  
> Workspace composites: `src/components/workspace/*`

## Import

```tsx
import {
  AppShell,
  Sidebar,
  TopBar,
  GlassPanel,
  GlassButton,
  IconButton,
  StatusIndicator,
  ProgressBar,
  TaskCard,
  VideoComparisonViewer,
  ResourceMonitor,
  LogViewer,
  Dialog,
  toast,
  EmptyState,
  LoadingState,
  ErrorState,
} from "@/components/workspace";
```

---

## Variant / Size Matrix

| Component | Variants | Sizes | States |
|-----------|----------|-------|--------|
| **GlassButton** | primary, ghost, glass, destructive, ai | xs, sm, md, lg | hover, active, disabled, focus-visible |
| **IconButton** | default, glass, primary | sm, md, lg | hover, active, disabled, focus-visible |
| **GlassPanel** | default, elevated, inset, chrome | padding: none/sm/md/lg | — |
| **GlassCard** | — | — | interactive, aiActive |
| **StatusIndicator** | status mapping | sm, md, lg | pulse (running) |
| **ProgressBar** | ai gradient | sm, md, lg | linear width transition |
| **TaskCard** | compact, expanded | — | running pulse, cancel |
| **VideoComparisonViewer** | aspect: video/cinema/square; size: sm–full | slider / toggle compare | keyboard on range |
| **ResourceMonitor** | layout: grid/stack | sm, md, lg | online/offline |
| **Dialog** | — | max-w-md | Escape close, backdrop |
| **Toast** | default, success, error, ai | — | enter 180ms / exit 130ms |
| **Empty/Loading/Error** | — | — | retry on error |

---

## Motion Spec

| Token | Value | Use |
|-------|-------|-----|
| `--duration-fast` | 140ms | Hover |
| `--duration-control` | 160ms | Control state |
| `--duration-normal` | 220ms | Panel expand |
| `--duration-page` | 260ms | Page switch |
| `--duration-toast-enter` | 180ms | Toast in |
| `--duration-toast-exit` | 130ms | Toast out |
| Progress | linear 300ms | Width only |

Utilities: `src/components/workspace/motion.ts`

**Avoid:** infinite spin on main progress; large persistent blur on video; hover-only actions.

---

## Accessibility

- All icon-only controls require `aria-label`
- `StatusIndicator` uses `role="status"` + label
- `Dialog`: `role="dialog"`, `aria-modal`, Escape to close
- `Sidebar`: `aria-current="page"` on active link
- `VideoComparisonViewer`: labeled videos + range `aria-valuetext`
- Focus: `focus-visible:ring-2 ring-[var(--accent)]`
- `prefers-reduced-motion`: transitions/animations disabled via `motion-reduce:`

---

## Themes

Components read `data-theme` on `<html>`: `studio` | `dark` | `ai`.  
Semantic colors from `--bg-*`, `--text-*`, `--accent`, `--glass-*`.

---

## AppShell Usage

```tsx
<AppShell
  sidebar={<Sidebar items={navItems} brand={<span>GVFI</span>} />}
  topBar={<TopBar title="视频处理" status="online" statusLabel="API 就绪" />}
>
  {children}
</AppShell>
```

---

## Deferred

| Item | Reason |
|------|--------|
| Full `/app` AppShell integration | Phase 3 routing — export ready, no break to monolith |
| WebGL on VideoComparisonViewer | Spec: CSS chrome only around video |
| Real CPU/GPU metrics API | ResourceMonitor is props-driven until backend exposes metrics |
