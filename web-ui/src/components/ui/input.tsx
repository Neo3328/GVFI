import * as React from"react"
import { Input as InputPrimitive } from"@base-ui/react/input"

import { cn } from"@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
 return (
 <InputPrimitive
 type={type}
 data-slot="input"
 className={cn(
"h-9 w-full min-w-0 rounded-[var(--radius-sm)] border border-[color-mix(in_srgb,var(--text-strong)_14%,transparent)] bg-[color-mix(in_srgb,var(--bg-2)_calc(var(--glass-opacity)*100%),transparent)] px-2.5 py-1 text-[13px] text-[var(--text-strong)] transition-colors outline-none placeholder:text-[var(--text-muted)] focus-visible:border-[color-mix(in_srgb,var(--accent-cyan)_72%,transparent)] focus-visible:ring-3 focus-visible:ring-[color-mix(in_srgb,var(--accent-cyan)_14%,transparent)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 read-only:cursor-default md:text-sm",
 className
 )}
 {...props}
 />
 )
}

export { Input }
