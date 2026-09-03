/**
 * GVFI — Font & display settings (global, live-applied).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { RotateCcw } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassInput } from "@/components/glass/glass-input";
import { GlassSlider } from "@/components/glass/glass-slider";
import { GlassSwitch } from "@/components/glass/glass-switch";
import {
  GlassSelect,
  GlassSelectContent,
  GlassSelectItem,
  GlassSelectTrigger,
  GlassSelectValue,
} from "@/components/glass/glass-select";
import { useT } from "@/hooks/use-t";
import {
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  TEXT_SHADOW_MAX,
  TEXT_SHADOW_MIN,
  UI_SCALE_MAX,
  UI_SCALE_MIN,
  type FontColorMode,
  type FontFamilyPreset,
  type FontWeightOption,
} from "@/lib/display";
import { readSliderValue } from "@/lib/slider-value";
import { useAppearanceStore } from "@/stores/appearance-store";
import { useDisplayStore } from "@/stores/display-store";
import type { MessageKey } from "@/lib/i18n/types";

const FONT_PRESETS: { value: FontFamilyPreset; labelKey: MessageKey }[] = [
  { value: "youyuan", labelKey: "display.font.youyuan" },
  { value: "yahei", labelKey: "display.font.yahei" },
  { value: "system", labelKey: "display.font.system" },
  { value: "other", labelKey: "display.font.other" },
  { value: "custom", labelKey: "display.font.custom" },
];

const COLOR_MODES: { value: FontColorMode; labelKey: MessageKey }[] = [
  { value: "auto", labelKey: "display.color.auto" },
  { value: "white", labelKey: "display.color.white" },
  { value: "dark", labelKey: "display.color.dark" },
  { value: "custom", labelKey: "display.color.custom" },
];

const WEIGHTS: FontWeightOption[] = [400, 500, 600];

export function FontDisplayPanel() {
  const t = useT();
  const fontFamily = useDisplayStore((s) => s.fontFamily);
  const customFontName = useDisplayStore((s) => s.customFontName);
  const fontSizePx = useDisplayStore((s) => s.fontSizePx);
  const fontColorMode = useDisplayStore((s) => s.fontColorMode);
  const customFontColor = useDisplayStore((s) => s.customFontColor);
  const fontWeight = useDisplayStore((s) => s.fontWeight);
  const autoContrast = useDisplayStore((s) => s.autoContrast);
  const textShadowStrength = useDisplayStore((s) => s.textShadowStrength);
  const uiScale = useDisplayStore((s) => s.uiScale);
  const reduceMotion = useDisplayStore((s) => s.reduceMotion);
  const lowContrastWarning = useDisplayStore((s) => s.lowContrastWarning);
  const setFontFamily = useDisplayStore((s) => s.setFontFamily);
  const setCustomFontName = useDisplayStore((s) => s.setCustomFontName);
  const setFontSizePx = useDisplayStore((s) => s.setFontSizePx);
  const setFontColorMode = useDisplayStore((s) => s.setFontColorMode);
  const setCustomFontColor = useDisplayStore((s) => s.setCustomFontColor);
  const setFontWeight = useDisplayStore((s) => s.setFontWeight);
  const setAutoContrast = useDisplayStore((s) => s.setAutoContrast);
  const setTextShadowStrength = useDisplayStore((s) => s.setTextShadowStrength);
  const setUiScale = useDisplayStore((s) => s.setUiScale);
  const setReduceMotion = useDisplayStore((s) => s.setReduceMotion);
  const resetDisplay = useDisplayStore((s) => s.resetDisplay);

  const glass = useAppearanceStore((s) => s.glass);
  const setGlass = useAppearanceStore((s) => s.setGlass);

  return (
    <SectionCard
      title={t("display.cardTitle")}
      description={t("display.cardDesc")}
    >
      <div className="flex flex-col gap-2 py-1">
        <label htmlFor="display-font-family" className="glass-field-label">
          {t("display.fontFamily")}
        </label>
        <GlassSelect
          value={fontFamily}
          items={Object.fromEntries(
            FONT_PRESETS.map((item) => [item.value, t(item.labelKey)])
          )}
          onValueChange={(value) => {
            if (typeof value !== "string") return;
            setFontFamily(value as FontFamilyPreset);
          }}
        >
          <GlassSelectTrigger id="display-font-family" className="glass-select">
            {/* Bug#3 同源修复：children 回调确保 label 稳定渲染。*/}
            <GlassSelectValue>{(value) => {
              if (typeof value !== "string") return "";
              const item = FONT_PRESETS.find((i) => i.value === value);
              return item ? t(item.labelKey) : "";
            }}</GlassSelectValue>
          </GlassSelectTrigger>
          <GlassSelectContent>
            {FONT_PRESETS.map((item) => (
              <GlassSelectItem key={item.value} value={item.value}>
                {t(item.labelKey)}
              </GlassSelectItem>
            ))}
          </GlassSelectContent>
        </GlassSelect>
      </div>

      {fontFamily === "custom" ? (
        <div className="flex flex-col gap-2 py-1">
          <label htmlFor="display-custom-font" className="glass-field-label">
            {t("display.customFontName")}
          </label>
          <GlassInput
            id="display-custom-font"
            value={customFontName}
            placeholder={t("display.customFontPlaceholder")}
            onChange={(event) => setCustomFontName(event.target.value)}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-2 py-1">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="display-font-size" className="glass-field-label">
            {t("display.fontSize")}
          </label>
          <div className="flex items-center gap-2">
            <GlassInput
              type="number"
              className="h-8 w-16 text-center"
              min={FONT_SIZE_MIN}
              max={FONT_SIZE_MAX}
              value={fontSizePx}
              onChange={(event) =>
                setFontSizePx(Number(event.target.value) || fontSizePx)
              }
              aria-label={t("display.fontSize")}
            />
            <span className="text-[11px] text-[var(--text-muted)]">px</span>
          </div>
        </div>
        <GlassSlider
          id="display-font-size"
          min={FONT_SIZE_MIN}
          max={FONT_SIZE_MAX}
          step={1}
          value={fontSizePx}
          onValueChange={(value) =>
            setFontSizePx(readSliderValue(value, fontSizePx))
          }
          aria-label={t("display.fontSize")}
        />
      </div>

      <div className="flex flex-col gap-2 py-1">
        <label htmlFor="display-font-color" className="glass-field-label">
          {t("display.fontColor")}
        </label>
        <GlassSelect
          value={fontColorMode}
          items={Object.fromEntries(
            COLOR_MODES.map((item) => [item.value, t(item.labelKey)])
          )}
          onValueChange={(value) => {
            if (typeof value !== "string") return;
            setFontColorMode(value as FontColorMode);
          }}
        >
          <GlassSelectTrigger id="display-font-color" className="glass-select">
                      {/* Bug#3 同源修复：children 回调确保 label 稳定渲染。*/}
                      <GlassSelectValue>{(value) => {
                        if (typeof value !== "string") return "";
                        const item = COLOR_MODES.find((i) => i.value === value);
                        return item ? t(item.labelKey) : "";
                      }}</GlassSelectValue>
                    </GlassSelectTrigger>
          <GlassSelectContent>
            {COLOR_MODES.map((item) => (
              <GlassSelectItem key={item.value} value={item.value}>
                {t(item.labelKey)}
              </GlassSelectItem>
            ))}
          </GlassSelectContent>
        </GlassSelect>
        {fontColorMode === "custom" ? (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={customFontColor}
              onChange={(event) => setCustomFontColor(event.target.value)}
              aria-label={t("display.customColor")}
              className="h-9 w-12 cursor-pointer rounded-[var(--radius-control)] border border-[var(--lg-border)] bg-transparent"
            />
            <GlassInput
              value={customFontColor}
              onChange={(event) => setCustomFontColor(event.target.value)}
              className="flex-1 font-mono text-[12px]"
            />
          </div>
        ) : null}
        {lowContrastWarning ? (
          <p className="text-[11px] text-[var(--warning)]" role="status">
            {t("display.lowContrastHint")}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 py-1">
        <label htmlFor="display-font-weight" className="glass-field-label">
          {t("display.fontWeight")}
        </label>
        <GlassSelect
          value={String(fontWeight)}
          items={Object.fromEntries(
            WEIGHTS.map((w) => [String(w), t("display.weightValue", { weight: w })])
          )}
          onValueChange={(value) => {
            if (typeof value !== "string") return;
            setFontWeight(Number(value) as FontWeightOption);
          }}
        >
          <GlassSelectTrigger id="display-font-weight" className="glass-select">
                      {/* Bug#3 同源修复：children 回调确保 label 稳定渲染。*/}
                      <GlassSelectValue>{(value) => {
                        if (typeof value !== "string") return "";
                        const w = Number(value);
                        return WEIGHTS.includes(w as FontWeightOption)
                          ? t("display.weightValue", { weight: w })
                          : "";
                      }}</GlassSelectValue>
                    </GlassSelectTrigger>
          <GlassSelectContent>
            {WEIGHTS.map((w) => (
              <GlassSelectItem key={w} value={String(w)}>
                {t("display.weightValue", { weight: w })}
              </GlassSelectItem>
            ))}
          </GlassSelectContent>
        </GlassSelect>
      </div>

      <div className="flex items-center justify-between gap-3 py-1">
        <div>
          <p className="glass-field-label">{t("display.autoContrast")}</p>
          <p className="text-[11px] text-[var(--text-muted)]">
            {t("display.autoContrastHint")}
          </p>
        </div>
        <GlassSwitch
          checked={autoContrast}
          onCheckedChange={setAutoContrast}
          aria-label={t("display.autoContrast")}
        />
      </div>

      <div className="flex flex-col gap-2 py-1">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="display-text-shadow" className="glass-field-label">
            {t("display.textShadow")}
          </label>
          <span className="text-[11px] text-[var(--text-muted)]">
            {textShadowStrength}%
          </span>
        </div>
        <GlassSlider
          id="display-text-shadow"
          min={TEXT_SHADOW_MIN}
          max={TEXT_SHADOW_MAX}
          step={1}
          value={textShadowStrength}
          onValueChange={(value) =>
            setTextShadowStrength(readSliderValue(value, textShadowStrength))
          }
          aria-label={t("display.textShadow")}
        />
      </div>

      <div className="flex flex-col gap-2 py-1">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="display-glass-opacity" className="glass-field-label">
            {t("display.glassOpacity")}
          </label>
          <span className="text-[11px] text-[var(--text-muted)]">
            {glass.opacity}%
          </span>
        </div>
        <GlassSlider
          id="display-glass-opacity"
          min={20}
          max={90}
          step={1}
          value={glass.opacity}
          onValueChange={(value) =>
            setGlass({ opacity: readSliderValue(value, glass.opacity) })
          }
          aria-label={t("display.glassOpacity")}
        />
      </div>

      <div className="flex flex-col gap-2 py-1">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="display-glass-blur" className="glass-field-label">
            {t("display.glassBlur")}
          </label>
          <span className="text-[11px] text-[var(--text-muted)]">
            {glass.blur}px
          </span>
        </div>
        <GlassSlider
          id="display-glass-blur"
          min={4}
          max={32}
          step={1}
          value={glass.blur}
          onValueChange={(value) =>
            setGlass({ blur: readSliderValue(value, glass.blur) })
          }
          aria-label={t("display.glassBlur")}
        />
      </div>

      <div className="flex flex-col gap-2 py-1">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="display-ui-scale" className="glass-field-label">
            {t("display.uiScale")}
          </label>
          <span className="text-[11px] text-[var(--text-muted)]">{uiScale}%</span>
        </div>
        <GlassSlider
          id="display-ui-scale"
          min={UI_SCALE_MIN}
          max={UI_SCALE_MAX}
          step={1}
          value={uiScale}
          onValueChange={(value) =>
            setUiScale(readSliderValue(value, uiScale))
          }
          aria-label={t("display.uiScale")}
        />
      </div>

      <div className="flex items-center justify-between gap-3 py-1">
        <div>
          <p className="glass-field-label">{t("display.reduceMotion")}</p>
          <p className="text-[11px] text-[var(--text-muted)]">
            {t("display.reduceMotionHint")}
          </p>
        </div>
        <GlassSwitch
          checked={reduceMotion}
          onCheckedChange={setReduceMotion}
          aria-label={t("display.reduceMotion")}
        />
      </div>

      <div
        className="mt-2 rounded-[var(--radius-md)] border border-[var(--lg-border)] px-3 py-3"
        style={{
          background:
            "color-mix(in srgb, var(--lg-panel-bg) 70%, transparent)",
          backdropFilter: "blur(var(--glass-blur))",
        }}
      >
        <p className="text-[11px] font-medium text-[var(--text-muted)]">
          {t("display.previewTitle")}
        </p>
        <p
          className="mt-2"
          style={{
            fontFamily: "var(--app-font-family)",
            fontSize: "var(--app-font-size)",
            fontWeight: "var(--app-font-weight)" as unknown as number,
            color: "var(--app-text-color)",
            textShadow: "var(--app-text-shadow)",
          }}
        >
          {t("display.previewZh")}
        </p>
        <p
          className="mt-1"
          style={{
            fontFamily: "var(--app-font-family)",
            fontSize: "var(--app-font-size)",
            fontWeight: "var(--app-font-weight)" as unknown as number,
            color: "var(--app-text-color)",
            textShadow: "var(--app-text-shadow)",
          }}
        >
          {t("display.previewEn")}
        </p>
        <p
          className="mt-1 tabular-nums text-[var(--text-muted)]"
          style={{
            fontFamily: "var(--app-font-family)",
            fontSize: "var(--app-font-size)",
          }}
        >
          {t("display.previewNums")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <GlassButton type="button" variant="primary" className="h-8 px-3">
            {t("display.previewButton")}
          </GlassButton>
          <GlassInput
            className="h-8 max-w-[180px]"
            readOnly
            value={t("display.previewInput")}
            aria-label={t("display.previewInput")}
          />
        </div>
      </div>

      <GlassButton
        type="button"
        variant="ghost"
        className="mt-2 h-9 w-full"
        onClick={() => resetDisplay()}
      >
        <RotateCcw className="size-4" aria-hidden />
        {t("display.reset")}
      </GlassButton>
    </SectionCard>
  );
}
