/**
 * GVFI — Landing features section.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { ChevronRight, Film, Gauge, Layers, Wand2 } from "lucide-react";
import { useT } from "@/hooks/use-t";
import type { MessageKey } from "@/lib/i18n/types";

const FEATURE_KEYS: {
  icon: typeof Film;
  titleKey: MessageKey;
  descKey: MessageKey;
}[] = [
  {
    icon: Film,
    titleKey: "landing.features.interpolate.title",
    descKey: "landing.features.interpolate.desc",
  },
  {
    icon: Layers,
    titleKey: "landing.features.upscale.title",
    descKey: "landing.features.upscale.desc",
  },
  {
    icon: Gauge,
    titleKey: "landing.features.gpu.title",
    descKey: "landing.features.gpu.desc",
  },
  {
    icon: Wand2,
    titleKey: "landing.features.presets.title",
    descKey: "landing.features.presets.desc",
  },
];

export function LandingFeatures() {
  const t = useT();

  return (
    <section
      id="features"
      className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14"
    >
      <div className="mb-4 px-1">
        <h2 className="font-heading text-[28px] font-bold tracking-tight">
          {t("landing.features.title")}
        </h2>
        <p className="mt-2 text-[17px] text-muted-foreground">
          {t("landing.features.subtitle")}
        </p>
      </div>
      <ul className="ios-grouped divide-y divide-[var(--separator)]">
        {FEATURE_KEYS.map((feature) => (
          <li
            key={feature.titleKey}
            className="flex cursor-default items-center gap-4 px-4 py-3.5 transition-colors duration-200"
          >
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
              aria-hidden="true"
            >
              <feature.icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-medium text-foreground">
                {t(feature.titleKey)}
              </p>
              <p className="text-[15px] text-muted-foreground">
                {t(feature.descKey)}
              </p>
            </div>
            <ChevronRight
              aria-hidden="true"
              className="size-5 shrink-0 text-muted-foreground/50"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
