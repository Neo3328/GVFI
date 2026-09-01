/**
 * GVFI — Landing workflow steps.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { Upload, Settings, PlayCircle } from"lucide-react";
import { useT } from"@/hooks/use-t";
import type { MessageKey } from"@/lib/i18n/types";

const STEP_KEYS: {
 icon: typeof Upload;
 titleKey: MessageKey;
 descKey: MessageKey;
}[] = [
 {
 icon: Upload,
 titleKey:"landing.steps.upload.title",
 descKey:"landing.steps.upload.desc",
 },
 {
 icon: Settings,
 titleKey:"landing.steps.preset.title",
 descKey:"landing.steps.preset.desc",
 },
 {
 icon: PlayCircle,
 titleKey:"landing.steps.render.title",
 descKey:"landing.steps.render.desc",
 },
];

export function LandingSteps() {
 const t = useT();

 return (
 <section id="workflow" className="bg-transparent py-10 sm:py-14">
 <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
 <div className="mb-4 px-1">
 <h2 className="font-heading text-[28px] font-bold tracking-tight">
 {t("landing.steps.title")}
 </h2>
 <p className="mt-2 text-[17px] text-muted-foreground">
 {t("landing.steps.subtitle")}
 </p>
 </div>
 <ol className="flex flex-col gap-3">
 {STEP_KEYS.map((item, index) => (
 <li
 key={item.titleKey}
 className="ios-grouped flex items-start gap-4 p-4"
 >
 <span
 className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
 aria-hidden="true"
 >
 <item.icon className="size-5" />
 </span>
 <div className="flex flex-col gap-1">
 <span className="text-[13px] font-medium text-muted-foreground">
 {t("landing.steps.stepLabel", { n: index + 1 })}
 </span>
 <h3 className="text-[17px] font-semibold">
 {t(item.titleKey)}
 </h3>
 <p className="text-[15px] text-muted-foreground">
 {t(item.descKey)}
 </p>
 </div>
 </li>
 ))}
 </ol>
 </div>
 </section>
 );
}
