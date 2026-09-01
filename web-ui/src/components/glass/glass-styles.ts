/** Shared Liquid Glass surface class fragments */

export const glassFocusRing =
"outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

export const glassMotion =
"transition-[transform,opacity,box-shadow,background-color,border-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] motion-reduce:transition-none";

export const glassSurface1 =
"lg-glass-1 overflow-hidden rounded-[var(--card-radius)] border border-[color-mix(in_srgb,var(--text-strong)_calc(var(--glass-border-opacity)*100%),transparent)] bg-clip-padding shadow-[var(--lg-shadow-glass)]";

export const glassSurface2 =
"lg-glass-2 overflow-hidden rounded-[var(--card-radius)] border border-[color-mix(in_srgb,var(--text-strong)_calc(var(--glass-border-opacity)*100%),transparent)] bg-clip-padding shadow-[var(--lg-shadow-glass)] transition-[transform,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:shadow-[var(--lg-shadow-glass)]";

export const glassSurface3 =
"lg-glass-3 overflow-hidden rounded-[var(--panel-radius)] border border-[color-mix(in_srgb,var(--text-strong)_calc(var(--glass-border-opacity)*100%),transparent)] bg-clip-padding shadow-[var(--lg-shadow-glass)] transition-[transform,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:shadow-[var(--lg-shadow-glass)]";

export const glassSurface4 =
"overflow-hidden rounded-[var(--control-radius)] border border-[color-mix(in_srgb,var(--text-strong)_calc(var(--glass-border-opacity)*100%),transparent)] bg-[var(--bg-3)] bg-clip-padding";

export const glassSurfaceChrome =
"border-b border-[color-mix(in_srgb,var(--text-strong)_calc(var(--glass-border-opacity)*60%),transparent)] bg-[var(--bg-2)]";

export const glassTextBody ="text-[13px] leading-normal text-[var(--text-normal)]";
export const glassTextCaption ="text-[11px] leading-snug text-[var(--text-muted)]";
export const glassTextTitle ="text-[16px] font-semibold leading-snug tracking-tight text-[var(--text-strong)]";
