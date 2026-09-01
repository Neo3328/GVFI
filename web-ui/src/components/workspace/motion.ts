/**
 * Liquid Glass motion utilities — align with design-tokens/motion.css
 */

export const motionEasing ="var(--ease-standard)";

export const motionHover =
"transition-[transform,opacity,box-shadow,background-color,border-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] motion-reduce:transition-none";

export const motionControl =
"transition-[transform,opacity,background-color,border-color] duration-[var(--duration-control)] ease-[var(--ease-standard)] motion-reduce:transition-none";

export const motionPanel =
"transition-[transform,opacity,max-height] duration-[var(--duration-normal)] ease-[var(--ease-standard)] motion-reduce:transition-none";

export const motionPage =
"transition-[opacity,transform] duration-[var(--duration-page)] ease-[var(--ease-standard)] motion-reduce:transition-none";

export const motionToastEnter =
"animate-in fade-in slide-in-from-top-2 duration-[var(--duration-toast-enter)] motion-reduce:animate-none";

export const motionToastExit =
"animate-out fade-out slide-out-to-top-2 duration-[var(--duration-toast-exit)] motion-reduce:animate-none";

export const motionProgress =
"transition-[width] duration-300 ease-linear motion-reduce:transition-none";
