"use client";

import { cn } from"@/lib/utils";

export interface LineChartPoint {
 label: string;
 actual: number;
 max: number;
}

export interface DashboardLineChartProps {
 title: string;
 subtitle: string;
 points: LineChartPoint[];
 avgLabel: string;
 avgValue: string;
 peakLabel: string;
 peakValue: string;
 efficiencyLabel: string;
 efficiencyValue: string;
 insights: { label: string; value: string }[];
 className?: string;
}

export function DashboardLineChart({
 title,
 subtitle,
 points,
 avgLabel,
 avgValue,
 peakLabel,
 peakValue,
 efficiencyLabel,
 efficiencyValue,
 insights,
 className,
}: DashboardLineChartProps) {
 const width = 560;
 const height = 220;
 const padX = 36;
 const padY = 24;
 const maxY = Math.max(...points.map((p) => Math.max(p.actual, p.max)), 1);

 const toX = (index: number) =>
 padX + (index / Math.max(points.length - 1, 1)) * (width - padX * 2);
 const toY = (value: number) =>
 height - padY - (value / maxY) * (height - padY * 2);

 const actualPath = points
 .map((point, index) => `${index === 0 ?"M" :"L"} ${toX(index)} ${toY(point.actual)}`)
 .join("");

 const maxPath = points
 .map((point, index) => `${index === 0 ?"M" :"L"} ${toX(index)} ${toY(point.max)}`)
 .join("");

 return (
 <section className={cn("flex flex-col gap-[var(--space-4)]", className)}>
 <div>
 <h3 className="text-[15px] font-semibold text-[var(--text-strong)]">{title}</h3>
 <p className="text-[12px] text-[var(--text-muted)]">{subtitle}</p>
 </div>

 <div className="grid grid-cols-3 gap-3">
 {[
 { label: avgLabel, value: avgValue },
 { label: peakLabel, value: peakValue },
 { label: efficiencyLabel, value: efficiencyValue },
 ].map((item) => (
 <div
 key={item.label}
 className="rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--bg-2)_55%,transparent)] px-3 py-2"
 >
 <p className="text-[11px] text-[var(--text-muted)]">{item.label}</p>
 <p className="text-[15px] font-semibold text-[var(--text-strong)]">{item.value}</p>
 </div>
 ))}
 </div>

 <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--bg-2)_40%,transparent)] p-3">
 <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full min-w-[480px]">
 {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
 const y = padY + ratio * (height - padY * 2);
 return (
 <line
 key={ratio}
 x1={padX}
 x2={width - padX}
 y1={y}
 y2={y}
 stroke="rgba(255,255,255,0.08)"
 strokeWidth="1"
 />
 );
 })}
 <path
 d={maxPath}
 fill="none"
 stroke="var(--danger)"
 strokeWidth="2"
 strokeDasharray="6 4"
 opacity="0.75"
 />
 <path
 d={actualPath}
 fill="none"
 stroke="var(--accent-cyan)"
 strokeWidth="2.5"
 />
 {points.map((point, index) => (
 <circle
 key={point.label}
 cx={toX(index)}
 cy={toY(point.actual)}
 r="4"
 fill="var(--accent-cyan)"
 />
 ))}
 </svg>
 <div className="mt-2 flex justify-between px-2 text-[10px] text-[var(--text-muted)]">
 {points.map((point) => (
 <span key={point.label}>{point.label}</span>
 ))}
 </div>
 </div>

 <div className="grid gap-2">
 {insights.map((item) => (
 <div
 key={item.label}
 className="rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--bg-2)_55%,transparent)] px-3 py-2.5 text-[12px]"
 >
 <span className="text-[var(--text-muted)]">{item.label}: </span>
 <span className="font-medium text-[var(--text-strong)]">{item.value}</span>
 </div>
 ))}
 </div>
 </section>
 );
}
