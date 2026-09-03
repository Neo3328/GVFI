/**
 * GVFI — Appearance settings panel (theme + custom background).
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, RotateCcw, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassSlider } from "@/components/glass/glass-slider";
import {
  GlassSelect,
  GlassSelectContent,
  GlassSelectItem,
  GlassSelectTrigger,
  GlassSelectValue,
} from "@/components/glass/glass-select";
import { useT } from "@/hooks/use-t";
import type { AppearanceTheme } from "@/lib/gvfi-types";
import {
  BackgroundImageLoadError,
  IMAGE_FILE_ACCEPT,
  loadBackgroundImageFile,
} from "@/lib/image-file";
import type { MessageKey } from "@/lib/i18n/types";
import { isLocale, type Locale } from "@/lib/i18n/types";
import { readSliderValue } from "@/lib/slider-value";
import { useAppearanceStore } from "@/stores/appearance-store";
import { useLocaleStore } from "@/stores/locale-store";

interface AppearancePanelProps {
  onLog?: (message: string) => void;
}

const THEME_KEYS: { value: AppearanceTheme; labelKey: MessageKey }[] = [
  { value: "light", labelKey: "appearance.theme.light" },
  { value: "dark", labelKey: "appearance.theme.dark" },
  { value: "image", labelKey: "appearance.theme.image" },
];

export function AppearancePanel({ onLog }: AppearancePanelProps) {
  const t = useT();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  const theme = useAppearanceStore((s) => s.theme);
  const glass = useAppearanceStore((s) => s.glass);
  const background = useAppearanceStore((s) => s.background);
  const setTheme = useAppearanceStore((s) => s.setTheme);
  const setGlass = useAppearanceStore((s) => s.setGlass);
  const setCustomBackgroundUrl = useAppearanceStore(
    (s) => s.setCustomBackgroundUrl
  );
  const resetBackground = useAppearanceStore((s) => s.resetBackground);
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const log = (message: string) => onLog?.(message);
  const hasImage = Boolean(background.customUrl);
  const usingImageTheme = theme === "image" && hasImage;

  const mapLoadError = (code: string): MessageKey => {
    switch (code) {
      case "unsupported":
        return "appearance.bg.unsupported";
      case "tooLarge":
        return "appearance.bg.tooLarge";
      case "decodeFail":
        return "appearance.bg.decodeFail";
      case "persistFail":
        return "appearance.bg.persistFail";
      default:
        return "appearance.bg.readFail";
    }
  };

  return (
    <SectionCard title={t("appearance.cardTitle")} description={t("appearance.cardDesc")}>
      <div className="flex flex-col gap-2 py-1">
        <label htmlFor="locale-select" className="glass-field-label">
          {t("locale.label")}
        </label>
        <GlassSelect
                  value={locale}
                  items={{
                    "zh-CN": t("locale.zhCN"),
                    en: t("locale.en"),
                  }}
                  onValueChange={(value) => {
                    if (typeof value !== "string" || !isLocale(value)) return;
                    setLocale(value as Locale);
                  }}
                >
                  <GlassSelectTrigger id="locale-select" className="glass-select">
                    {/* Bug#3 修复：原版 <GlassSelectValue /> 不传 children，依赖 base-ui 内部 items 查找。
                        在打开 popup 前后状态切换时偶尔渲染空白（ui-white2.png）。改为显式回调，
                        直接从 items 字典取出 label，避免双源合并失败。*/}
                    <GlassSelectValue>
                      {(value) =>
                        value === "zh-CN"
                          ? t("locale.zhCN")
                          : value === "en"
                            ? t("locale.en")
                            : t("locale.label")
                      }
                    </GlassSelectValue>
                  </GlassSelectTrigger>
                  <GlassSelectContent>
                    <GlassSelectItem value="zh-CN">{t("locale.zhCN")}</GlassSelectItem>
                    <GlassSelectItem value="en">{t("locale.en")}</GlassSelectItem>
                  </GlassSelectContent>
                </GlassSelect>
      </div>

      <div className="flex flex-col gap-2 py-1">
        <label htmlFor="theme-select" className="glass-field-label">
          {t("appearance.theme")}
        </label>
        <GlassSelect
          value={theme}
          items={Object.fromEntries(
            THEME_KEYS.map((item) => [item.value, t(item.labelKey)])
          )}
          onValueChange={(value) => {
            if (typeof value !== "string") return;
            const next = value as AppearanceTheme;
            const result = setTheme(next);
            if (!result.ok) {
              setErrorKey("appearance.theme.needImage");
              log(t("appearance.theme.needImage"));
              return;
            }
            setErrorKey(null);
            const labelKey = THEME_KEYS.find((item) => item.value === next)?.labelKey;
            log(t("appearance.themeLog", { name: labelKey ? t(labelKey) : next }));
          }}
        >
          <GlassSelectTrigger id="theme-select" className="glass-select">
            {/* Bug#3 修复（同语言下拉框原因）：用 children 回调显式返回 label，避免 base-ui 在 popup 关闭后渲染空白。*/}
            <GlassSelectValue>
              {(value) =>
                value === "light"
                  ? t("appearance.theme.light")
                  : value === "dark"
                    ? t("appearance.theme.dark")
                    : value === "image"
                      ? t("appearance.theme.image")
                      : t("appearance.theme")
              }
            </GlassSelectValue>
          </GlassSelectTrigger>
          <GlassSelectContent>
            {THEME_KEYS.map((item) => (
              <GlassSelectItem key={item.value} value={item.value}>
                {t(item.labelKey)}
              </GlassSelectItem>
            ))}
          </GlassSelectContent>
        </GlassSelect>
      </div>

      <div className="flex flex-col gap-3 py-1">
        <div className="glass-field-label">{t("appearance.background")}</div>
        <p className="text-[12px] text-[var(--text-muted)]">
          {t("appearance.bg.hint")}
        </p>

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={IMAGE_FILE_ACCEPT}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            event.target.value = "";
            if (!file) return;
            setBusy(true);
            setErrorKey(null);
            void loadBackgroundImageFile(file)
              .then((loaded) => {
                const result = setCustomBackgroundUrl(loaded.dataUrl, {
                  fileName: loaded.fileName,
                  width: loaded.width,
                  height: loaded.height,
                });
                if (!result.ok) {
                  setErrorKey("appearance.bg.persistFail");
                  log(t("appearance.bg.persistFail"));
                  return;
                }
                log(t("appearance.bg.switched", { name: loaded.fileName }));
              })
              .catch((error: unknown) => {
                const code =
                  error instanceof BackgroundImageLoadError
                    ? error.code
                    : "readFail";
                const key = mapLoadError(code);
                setErrorKey(key);
                log(t(key));
              })
              .finally(() => setBusy(false));
          }}
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <GlassButton
            type="button"
            variant="glass"
            className="h-9 flex-1"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="size-4" aria-hidden />
            {t("appearance.bg.upload")}
          </GlassButton>
          <GlassButton
            type="button"
            variant="ghost"
            className="h-9 flex-1"
            disabled={!hasImage || busy}
            onClick={() => {
              resetBackground();
              setErrorKey(null);
              log(t("appearance.bg.resetLog"));
            }}
          >
            <Trash2 className="size-4" aria-hidden />
            {t("appearance.bg.remove")}
          </GlassButton>
          <GlassButton
            type="button"
            variant="ghost"
            className="h-9 flex-1"
            disabled={busy}
            onClick={() => {
              resetBackground();
              setTheme("dark");
              setErrorKey(null);
              log(t("appearance.bg.resetLog"));
            }}
          >
            <RotateCcw className="size-4" aria-hidden />
            {t("appearance.bg.restoreDefault")}
          </GlassButton>
        </div>

        {errorKey ? (
          <p className="text-[12px] text-[color-mix(in_srgb,var(--danger)_80%,white)]" role="alert">
            {t(errorKey)}
          </p>
        ) : null}

        {hasImage ? (
          <div className="flex gap-3 rounded-[var(--card-radius)] border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--bg-2)_40%,transparent)] bg-clip-padding p-3">
            <div
              className="size-16 shrink-0 overflow-hidden rounded-[var(--control-radius)] border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--bg-0)_55%,transparent)] bg-clip-padding"
              style={{
                backgroundImage: background.customUrl
                  ? `url(${JSON.stringify(background.customUrl)})`
                  : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              aria-hidden
            />
            <div className="min-w-0 flex-1 text-[12px] text-[var(--text-normal)]">
              <p className="truncate font-medium text-[var(--text-strong)]">
                {background.fileName || t("appearance.bg.unnamed")}
              </p>
              <p className="mt-1 text-[var(--text-muted)]">
                {background.width && background.height
                  ? t("appearance.bg.dimensions", {
                      width: background.width,
                      height: background.height,
                    })
                  : t("appearance.bg.dimensionsUnknown")}
              </p>
              <p className="mt-1 text-[var(--text-muted)]">
                {usingImageTheme
                  ? t("appearance.bg.inUse")
                  : t("appearance.bg.uploadedIdle")}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-[12px] text-[var(--text-muted)]">
            {t("appearance.bg.none")}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 py-1">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="panel-opacity" className="glass-field-label">
            {t("appearance.glassOpacity")}
          </label>
          <span className="text-[11px] text-[var(--text-muted)]" aria-live="polite">
            {glass.opacity}%
          </span>
        </div>
        <GlassSlider
          id="panel-opacity"
          min={20}
          max={90}
          step={1}
          value={glass.opacity}
          onValueChange={(value) => {
            setGlass({ opacity: readSliderValue(value, glass.opacity) });
          }}
          aria-label={t("appearance.glassOpacity")}
        />
      </div>

      <div className="flex flex-col gap-2 py-1">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="glass-blur" className="glass-field-label">
            {t("appearance.glassBlur")}
          </label>
          <span className="text-[11px] text-[var(--text-muted)]">{glass.blur}px</span>
        </div>
        <GlassSlider
          id="glass-blur"
          min={4}
          max={32}
          step={1}
          value={glass.blur}
          onValueChange={(value) => {
            setGlass({ blur: readSliderValue(value, glass.blur) });
          }}
          aria-label={t("appearance.glassBlur")}
        />
      </div>

      <div className="flex flex-col gap-2 py-1">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="glass-border" className="glass-field-label">
            {t("appearance.borderBrightness")}
          </label>
          <span className="text-[11px] text-[var(--text-muted)]">
            {glass.borderBrightness}%
          </span>
        </div>
        <GlassSlider
          id="glass-border"
          min={0}
          max={100}
          step={1}
          value={glass.borderBrightness}
          onValueChange={(value) => {
            setGlass({
              borderBrightness: readSliderValue(value, glass.borderBrightness),
            });
          }}
          aria-label={t("appearance.borderBrightness")}
        />
      </div>

      <div className="flex flex-col gap-2 py-1">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="glass-shadow" className="glass-field-label">
            {t("appearance.shadowStrength")}
          </label>
          <span className="text-[11px] text-[var(--text-muted)]">
            {glass.shadowStrength}%
          </span>
        </div>
        <GlassSlider
          id="glass-shadow"
          min={0}
          max={100}
          step={1}
          value={glass.shadowStrength}
          onValueChange={(value) => {
            setGlass({
              shadowStrength: readSliderValue(value, glass.shadowStrength),
            });
          }}
          aria-label={t("appearance.shadowStrength")}
        />
      </div>

      <div className="flex flex-col gap-2 py-1">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="glass-glow" className="glass-field-label">
            {t("appearance.glowStrength")}
          </label>
          <span className="text-[11px] text-[var(--text-muted)]">
            {glass.glowStrength}%
          </span>
        </div>
        <GlassSlider
          id="glass-glow"
          min={0}
          max={100}
          step={1}
          value={glass.glowStrength}
          onValueChange={(value) => {
            setGlass({
              glowStrength: readSliderValue(value, glass.glowStrength),
            });
          }}
          aria-label={t("appearance.glowStrength")}
        />
      </div>
    </SectionCard>
  );
}
