/**
 * GVFI — Local SVG icon registry.
 *
 * Constraints enforced here:
 *  - 全部图标内联为 React 组件，不依赖 CDN、不依赖在线字体、不使用 emoji。
 *  - 所有图标暴露统一的 `size` / `color` / `onError` 接口（onError 兜底：加载失败隐藏）。
 *  - 图标统一带固定 viewBox，使用 currentColor 让父级按钮控制颜色。
 *  - 图标不绑定 onClick；点击事件永远由外层 button 容器提供（满足"按钮结构"约束）。
 *
 * New home page icons only — other in-page components continue using lucide-react
 * (本地 npm 包，不存在 CDN 依赖)。
 */
import * as React from "react";

export interface IconProps {
  /** Rendered box edge length in px; keeps layout stable. */
  size?: number;
  className?: string;
  /** Accessible label; if omitted, icon is aria-hidden. */
  title?: string;
  /** Forwarded style hook (mainly for color tweaks). */
  style?: React.CSSProperties;
}

/**
 * Common renderer for all locally-authored SVG icons. Provides:
 *  - fixed square box via width/height = size
 *  - currentColor stroke so a wrapping button controls color
 *  - onError handler: hides the icon but never throws / breaks layout
 */
function renderGlyph(
  path: React.ReactNode,
  props: IconProps & { strokeWidth?: number; fill?: string }
) {
  const {
    size = 18,
    className,
    title,
    style,
    strokeWidth = 1.75,
    fill = "none",
  } = props;
  // 内联 SVG 不产生网络加载；onError 采用命令式隐藏兜底（不使用 React state，
  // 因为 renderGlyph 是普通渲染函数而非组件，不能在此调用 Hook）。
  const hideOnError = (event: React.SyntheticEvent<SVGSVGElement>) => {
    event.currentTarget.style.visibility = "hidden";
  };

  const accessibleProps = title
    ? ({ role: "img", "aria-label": title } as const)
    : ({ "aria-hidden": true, focusable: false } as const);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      onError={hideOnError}
      {...accessibleProps}
    >
      {title ? <title>{title}</title> : null}
      {path}
    </svg>
  );
}

/* ----- 侧栏（workspace-nav） ----- */

export function HomeIcon(props: IconProps) {
  return renderGlyph(
    <>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10.5V20a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9.5" />
    </>,
    props
  );
}

export function ListTodoIcon(props: IconProps) {
  return renderGlyph(
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 9h6M7 13h6M7 17h4" />
      <circle cx="17" cy="16.5" r="1.2" fill="currentColor" stroke="none" />
    </>,
    props
  );
}

export function ClapperboardIcon(props: IconProps) {
  return renderGlyph(
    <>
      <path d="M3 10h18v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M3 10V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2" />
      <path d="M8 6l-1 4M12 6l-1 4M16 6l-1 4" />
    </>,
    props
  );
}

export function SparklesIcon(props: IconProps) {
  return renderGlyph(
    <>
      <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z" />
      <path d="M18 14l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9z" />
    </>,
    props
  );
}

export function SettingsSlidersIcon(props: IconProps) {
  return renderGlyph(
    <>
      <line x1="4" y1="6" x2="20" y2="6" />
      <circle cx="10" cy="6" r="2" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <circle cx="15" cy="12" r="2" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="8" cy="18" r="2" />
    </>,
    props
  );
}

export function SystemSettingsIcon(props: IconProps) {
  return renderGlyph(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>,
    props
  );
}

export function ZapIcon(props: IconProps) {
  return renderGlyph(
    <path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="currentColor" fillOpacity="0.18" />,
    { ...props, fill: "none", strokeWidth: 1.5 }
  );
}

/* ----- 顶部 FRAME / UPSCALE / ANALYZE 三个 tab 图标 ----- */

export function FrameIcon(props: IconProps) {
  return renderGlyph(
    <>
      <rect x="3" y="6" width="18" height="12" rx="1.5" />
      <path d="M7 6V3M12 6V3M17 6V3M7 21v-3M12 21v-3M17 21v-3" />
    </>,
    props
  );
}

export function UpscaleIcon(props: IconProps) {
  return renderGlyph(
    <>
      <path d="M4 9V5a1 1 0 0 1 1-1h4" />
      <path d="M20 9V5a1 1 0 0 0-1-1h-4" />
      <path d="M4 15v4a1 1 0 0 0 1 1h4" />
      <path d="M20 15v4a1 1 0 0 1-1 1h-4" />
      <path d="M9 12h6M12 9v6" />
    </>,
    props
  );
}

export function AnalyzeIcon(props: IconProps) {
  return renderGlyph(
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-3.5-3.5" />
      <path d="M8 11h6" />
    </>,
    props
  );
}

/* ----- 新主页内部按钮图标 ----- */

export function SlidersIcon(props: IconProps) {
  return renderGlyph(
    <>
      <line x1="6" y1="4" x2="6" y2="20" />
      <circle cx="6" cy="9" r="1.5" fill="currentColor" stroke="none" />
      <line x1="12" y1="4" x2="12" y2="20" />
      <circle cx="12" cy="15" r="1.5" fill="currentColor" stroke="none" />
      <line x1="18" y1="4" x2="18" y2="20" />
      <circle cx="18" cy="6" r="1.5" fill="currentColor" stroke="none" />
    </>,
    props
  );
}

export function UploadIcon(props: IconProps) {
  return renderGlyph(
    <>
      <path d="M12 4v12" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
    </>,
    props
  );
}

export function PlayIcon(props: IconProps) {
  return renderGlyph(
    <path d="M7 4v16l13-8z" fill="currentColor" />,
    { ...props, strokeWidth: 0, fill: "none" }
  );
}

export function StopIcon(props: IconProps) {
  return renderGlyph(
    <rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" />,
    { ...props, strokeWidth: 0, fill: "none" }
  );
}

export function ChevronDownIcon(props: IconProps) {
  return renderGlyph(
    <path d="m6 9 6 6 6-6" />,
    props
  );
}

/* ----- 窗口 chrome（title bar 控件） ----- */

export function MinusWindowIcon(props: IconProps) {
  return renderGlyph(
    <line x1="5" y1="12" x2="19" y2="12" />,
    props
  );
}

export function SquareWindowIcon(props: IconProps) {
  return renderGlyph(
    <rect x="6" y="6" width="12" height="12" rx="1.5" />,
    props
  );
}

export function CopyWindowIcon(props: IconProps) {
  return renderGlyph(
    <>
      <rect x="8" y="3" width="13" height="13" rx="2" />
      <path d="M16 21H5a2 2 0 0 1-2-2V8" />
    </>,
    props
  );
}

export function XWindowIcon(props: IconProps) {
  return renderGlyph(
    <>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </>,
    props
  );
}

export function ChevronRightIcon(props: IconProps) {
  return renderGlyph(
    <path d="m9 6 6 6-6 6" />,
    props
  );
}

/* ----- Workbench（深色三栏主页）导航 / 控件图标，全部本地内联 SVG ----- */

export function FileInputIcon(props: IconProps) {
  return renderGlyph(
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M12 12v6" />
      <path d="m9.5 15.5 2.5 2.5 2.5-2.5" />
    </>,
    props
  );
}

export function ParamsTuneIcon(props: IconProps) {
  return renderGlyph(
    <>
      <path d="M4 7h10" />
      <path d="M18 7h2" />
      <circle cx="16" cy="7" r="2" />
      <path d="M4 17h4" />
      <path d="M12 17h8" />
      <circle cx="10" cy="17" r="2" />
      <path d="M4 12h2" />
      <path d="M10 12h10" />
      <circle cx="8" cy="12" r="2" />
    </>,
    props
  );
}

export function ModelChipIcon(props: IconProps) {
  return renderGlyph(
    <>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4" />
    </>,
    props
  );
}

export function OutFolderIcon(props: IconProps) {
  return renderGlyph(
    <>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 13h6" />
      <path d="m12.5 10.5 2.5 2.5-2.5 2.5" />
    </>,
    props
  );
}

export function LogInfoIcon(props: IconProps) {
  return renderGlyph(
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>,
    props
  );
}

export function StepBackIcon(props: IconProps) {
  return renderGlyph(
    <>
      <path d="M18 6 9 12l9 6z" fill="currentColor" stroke="none" />
      <line x1="6" y1="6" x2="6" y2="18" />
    </>,
    { ...props, strokeWidth: 1.75 }
  );
}

export function RewindIcon(props: IconProps) {
  return renderGlyph(
    <>
      <path d="M11 7 4 12l7 5z" fill="currentColor" stroke="none" />
      <path d="M20 7l-7 5 7 5z" fill="currentColor" stroke="none" />
    </>,
    { ...props, strokeWidth: 1.5 }
  );
}

export function PauseIcon(props: IconProps) {
  return renderGlyph(
    <>
      <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
    </>,
    { ...props, strokeWidth: 0, fill: "none" }
  );
}

export function ForwardIcon(props: IconProps) {
  return renderGlyph(
    <>
      <path d="M13 7l7 5-7 5z" fill="currentColor" stroke="none" />
      <path d="M4 7l7 5-7 5z" fill="currentColor" stroke="none" />
    </>,
    { ...props, strokeWidth: 1.5 }
  );
}

export function StepForwardIcon(props: IconProps) {
  return renderGlyph(
    <>
      <path d="M6 6l9 6-9 6z" fill="currentColor" stroke="none" />
      <line x1="18" y1="6" x2="18" y2="18" />
    </>,
    { ...props, strokeWidth: 1.75 }
  );
}

export function FolderOpenIcon(props: IconProps) {
  return renderGlyph(
    <>
      <path d="M3 8a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1" />
      <path d="m3 8 1.6 9.2A2 2 0 0 0 6.56 19H20a1 1 0 0 0 .96-1.28L19 12H5" />
    </>,
    props
  );
}

export function ChevronUpIcon(props: IconProps) {
  return renderGlyph(<path d="m6 15 6-6 6 6" />, props);
}

export function GaugeIcon(props: IconProps) {
  return renderGlyph(
    <>
      <path d="M4 18a8 8 0 1 1 16 0" />
      <path d="m12 14 4-4" />
      <circle cx="12" cy="14" r="1.4" fill="currentColor" stroke="none" />
    </>,
    props
  );
}

export function FilmIcon(props: IconProps) {
  return renderGlyph(
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M3 15h18M8 4v16M16 4v16" />
    </>,
    props
  );
}

/* ----- 通用图标字典（按名称索引） ----- */
export const ICONS = {
  fileInput: FileInputIcon,
  paramsTune: ParamsTuneIcon,
  modelChip: ModelChipIcon,
  outFolder: OutFolderIcon,
  logInfo: LogInfoIcon,
  stepBack: StepBackIcon,
  rewind: RewindIcon,
  pause: PauseIcon,
  forward: ForwardIcon,
  stepForward: StepForwardIcon,
  folderOpen: FolderOpenIcon,
  chevronUp: ChevronUpIcon,
  gauge: GaugeIcon,
  film: FilmIcon,
  home: HomeIcon,
  listTodo: ListTodoIcon,
  clapperboard: ClapperboardIcon,
  sparkles: SparklesIcon,
  settingsSliders: SettingsSlidersIcon,
  systemSettings: SystemSettingsIcon,
  zap: ZapIcon,
  frame: FrameIcon,
  upscale: UpscaleIcon,
  analyze: AnalyzeIcon,
  sliders: SlidersIcon,
  upload: UploadIcon,
  play: PlayIcon,
  stop: StopIcon,
  chevronDown: ChevronDownIcon,
  chevronRight: ChevronRightIcon,
  minusWindow: MinusWindowIcon,
  squareWindow: SquareWindowIcon,
  copyWindow: CopyWindowIcon,
  xWindow: XWindowIcon,
};

export type IconName = keyof typeof ICONS;