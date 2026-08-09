/** Workspace layout & composite components */

export { WorkspaceShell } from "./workspace-shell";
export {
  WORKSPACE_NAV,
  getWorkspaceNav,
  pageTitleForPath,
} from "./workspace-nav";
export {
  WorkspaceChromeProvider,
  useWorkspaceChrome,
  useWorkspaceChromeOptional,
} from "./workspace-chrome-context";
export { PhasePlaceholder } from "./phase-placeholder";
export { AppShell } from "./app-shell";
export type { AppShellProps } from "./app-shell";

export { Sidebar, sidebarVariants } from "./sidebar";
export type { SidebarProps, SidebarNavItem } from "./sidebar";

export { TopBar } from "./top-bar";
export type { TopBarProps, TopBarBreadcrumb } from "./top-bar";

export { StatusIndicator } from "./status-indicator";
export type { StatusIndicatorProps } from "./status-indicator";

export { ProgressBar, ProgressBarLabel } from "./progress-bar";
export type { ProgressBarProps } from "./progress-bar";

export { VideoComparisonViewer, videoComparisonVariants } from "./video-comparison-viewer";
export type { VideoComparisonViewerProps } from "./video-comparison-viewer";

export { ResourceMonitor, resourceMonitorVariants } from "./resource-monitor";
export type { ResourceMonitorProps } from "./resource-monitor";

export * from "./motion";

/* Aliases — canonical names map to glass/* implementations */
export {
  GlassButton,
  GlassIconButton as IconButton,
  glassButtonVariants,
  GlassPanel,
  glassPanelVariants,
  GlassTaskCard as TaskCard,
  GlassLogViewer as LogViewer,
  GlassDialog as Dialog,
  GlassDialogActions as DialogActions,
  GlassToaster,
  toast,
  GlassEmptyState as EmptyState,
  GlassLoadingState as LoadingState,
  GlassErrorState as ErrorState,
  GlassStatusIndicator,
} from "@/components/glass";

export type {
  GlassButtonProps,
  GlassIconButtonProps as IconButtonProps,
  GlassTaskCardProps as TaskCardProps,
} from "@/components/glass";
