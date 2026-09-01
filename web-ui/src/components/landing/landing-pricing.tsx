/**
 * GVFI — Landing pricing section.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import Link from"next/link";
import { Check } from"lucide-react";
import {
 cuteButtonClassName,
 cuteOutlineButtonClassName,
} from"@/components/cute-button";
import { useT } from"@/hooks/use-t";
import type { MessageKey } from"@/lib/i18n/types";
import { cn } from"@/lib/utils";

type PlanDef = {
 nameKey: MessageKey;
 descKey: MessageKey;
 featureKeys: MessageKey[];
 price: string;
 periodKey?: MessageKey;
 highlighted: boolean;
};

const PLANS: PlanDef[] = [
 {
 nameKey:"landing.pricing.free.name",
 descKey:"landing.pricing.free.desc",
 featureKeys: [
"landing.pricing.free.f1",
"landing.pricing.free.f2",
"landing.pricing.free.f3",
 ],
 price:"¥0",
 highlighted: false,
 },
 {
 nameKey:"landing.pricing.creator.name",
 descKey:"landing.pricing.creator.desc",
 featureKeys: [
"landing.pricing.creator.f1",
"landing.pricing.creator.f2",
"landing.pricing.creator.f3",
"landing.pricing.creator.f4",
 ],
 price:"¥49",
 periodKey:"landing.pricing.perMonth",
 highlighted: true,
 },
 {
 nameKey:"landing.pricing.team.name",
 descKey:"landing.pricing.team.desc",
 featureKeys: [
"landing.pricing.team.f1",
"landing.pricing.team.f2",
"landing.pricing.team.f3",
"landing.pricing.team.f4",
 ],
 price:"¥199",
 periodKey:"landing.pricing.perMonth",
 highlighted: false,
 },
];

export function LandingPricing() {
 const t = useT();

 return (
 <section
 id="pricing"
 className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14"
 >
 <div className="mb-4 px-1">
 <h2 className="font-heading text-[28px] font-bold tracking-tight">
 {t("landing.pricing.title")}
 </h2>
 <p className="mt-2 text-[17px] text-muted-foreground">
 {t("landing.pricing.subtitle")}
 </p>
 </div>
 <div className="flex flex-col gap-3">
 {PLANS.map((plan) => (
 <article
 key={plan.nameKey}
 className={cn(
"ios-grouped p-4",
 plan.highlighted &&"ring-2 ring-primary/30"
 )}
 >
 <div className="flex items-start justify-between gap-4">
 <div>
 <h3 className="text-[17px] font-semibold">
 {t(plan.nameKey)}
 </h3>
 <p className="text-[15px] text-muted-foreground">
 {t(plan.descKey)}
 </p>
 </div>
 <div className="text-right">
 <span className="font-heading text-[28px] font-bold">
 {plan.price}
 </span>
 {plan.periodKey ? (
 <span className="text-[15px] text-muted-foreground">
 {t(plan.periodKey)}
 </span>
 ) : null}
 </div>
 </div>
 <ul className="mt-4 flex flex-col gap-2">
 {plan.featureKeys.map((featureKey) => (
 <li
 key={featureKey}
 className="flex items-center gap-2 text-[15px] text-muted-foreground"
 >
 <Check
 aria-hidden="true"
 className="size-4 shrink-0 text-primary"
 />
 {t(featureKey)}
 </li>
 ))}
 </ul>
 <Link
 href="/app"
 className={cn(
 plan.highlighted
 ? cuteButtonClassName
 : cuteOutlineButtonClassName,
"mt-4 w-full py-2.5 text-[17px]"
 )}
 >
 {plan.highlighted
 ? t("landing.pricing.chooseCreator")
 : t("landing.pricing.start")}
 </Link>
 </article>
 ))}
 </div>
 </section>
 );
}
