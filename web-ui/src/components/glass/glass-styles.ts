/** Shared Liquid Glass surface class fragments */

export const glassFocusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

export const glassMotion =
  "transition-[transform,opacity,box-shadow,background-color,border-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] motion-reduce:transition-none";

export const glassSurface1 =
  "lg-glass-1 rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--text-strong)_calc(var(--glass-border-opacity)*100%),transparent)] shadow-[var(--lg-shadow-glass)]";

export const glassSurface2 =
  "lg-glass-2 rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--text-strong)_calc(var(--glass-border-opacity)*100%),transparent)] shadow-[var(--lg-shadow-glass)] transition-[transform,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:-translate-y-px hover:shadow-[var(--glass-shadow-float,var(--lg-shadow-glass))] motion-reduce:hover:translate-y-0";

export const glassSurface3 =
  "lg-glass-3 rounded-[var(--radius-lg)] border border-[color-mix(in_srgb,var(--text-strong)_calc(var(--glass-border-opacity)*100%),transparent)] shadow-[var(--lg-shadow-glass)] transition-[transform,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:-translate-y-0.5 hover:shadow-[var(--glass-shadow-float,var(--lg-shadow-glass))] motion-reduce:hover:translate-y-0";

export const glassSurface4 =
  "rounded-[var(--radius-sm)] border border-[color-mix(in_srgb,var(--text-strong)_calc(var(--glass-border-opacity)*100%),transparent)] bg-[color-mix(in_srgb,var(--bg-2)_calc(var(--glass-opacity)*100%),transparent)] backdrop-blur-[8px]";

export const glassSurfaceChrome =
  "border-b border-[color-mix(in_srgb,var(--text-strong)_calc(var(--glass-border-opacity)*60%),transparent)] bg-[color-mix(in_srgb,var(--bg-1)_calc(var(--glass-opacity)*100%),transparent)] backdrop-blur-[var(--glass-blur)]";

export const glassTextBody = "text-[13px] leading-normal text-[var(--text-normal)]";
export const glassTextCaption = "text-[11px] leading-snug text-[var(--text-muted)]";
export const glassTextTitle = "text-[16px] font-semibold leading-snug tracking-tight text-[var(--text-strong)]";
