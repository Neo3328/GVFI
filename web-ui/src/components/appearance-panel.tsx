"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, RotateCcw } from "lucide-react";
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
import type { AppearanceTheme } from "@/lib/gvfi-types";
import { readSliderValue } from "@/lib/slider-value";
import { useAppearanceStore } from "@/stores/appearance-store";

interface AppearancePanelProps {
  onLog?: (message: string) => void;
}

const THEME_OPTIONS: { value: AppearanceTheme; label: string }[] = [
  { value: "dark", label: "Cinematic 深色" },
  { value: "ai", label: "AI 科技" },
  { value: "studio", label: "Studio 浅色" },
];

const BG_PRESETS = [
  { value: "nebula" as const, label: "石墨层叠" },
  { value: "aurora" as const, label: "柔光片层" },
  { value: "studio" as const, label: "Studio 浅色" },
];

export function AppearancePanel({ onLog }: AppearancePanelProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [backgroundLabel, setBackgroundLabel] = useState("主题默认背景");

  const theme = useAppearanceStore((s) => s.theme);
  const glass = useAppearanceStore((s) => s.glass);
  const background = useAppearanceStore((s) => s.background);
  const setTheme = useAppearanceStore((s) => s.setTheme);
  const setGlass = useAppearanceStore((s) => s.setGlass);
  const setBackground = useAppearanceStore((s) => s.setBackground);
  const setCustomBackgroundUrl = useAppearanceStore((s) => s.setCustomBackgroundUrl);
  const resetBackground = useAppearanceStore((s) => s.resetBackground);

  const log = (message: string) => onLog?.(message);

  return (
    <SectionCard title="外观" description="Liquid Glass · 主题 / 背景 / 玻璃材质">
      <div className="flex flex-col gap-2 py-1">
        <label htmlFor="theme-select" className="glass-field-label">
          主题
        </label>
        <GlassSelect
          value={theme}
          onValueChange={(value) => {
            if (typeof value !== "string") return;
            setTheme(value as AppearanceTheme);
            log(
              `外观：${THEME_OPTIONS.find((t) => t.value === value)?.label ?? value}`
            );
          }}
        >
          <GlassSelectTrigger id="theme-select" className="glass-select">
            <GlassSelectValue />
          </GlassSelectTrigger>
          <GlassSelectContent>
            {THEME_OPTIONS.map((item) => (
              <GlassSelectItem key={item.value} value={item.value}>
                {item.label}
              </GlassSelectItem>
            ))}
          </GlassSelectContent>
        </GlassSelect>
      </div>

      <div className="flex flex-col gap-2 py-1">
        <label htmlFor="bg-preset" className="glass-field-label">
          背景
        </label>
        <GlassSelect
          value={background.preset}
          onValueChange={(value) => {
            if (typeof value !== "string") return;
            setBackground({
              type: "preset",
              preset: value as "studio" | "aurora" | "nebula",
              customUrl: null,
              serverPath: null,
            });
            setBackgroundLabel(
              BG_PRESETS.find((p) => p.value === value)?.label ?? String(value)
            );
            log(`背景预设：${value}`);
          }}
        >
          <GlassSelectTrigger id="bg-preset" className="glass-select">
            <GlassSelectValue />
          </GlassSelectTrigger>
          <GlassSelectContent>
            {BG_PRESETS.map((item) => (
              <GlassSelectItem key={item.value} value={item.value}>
                {item.label}
              </GlassSelectItem>
            ))}
          </GlassSelectContent>
        </GlassSelect>
      </div>

      <div className="flex flex-col gap-2 py-1">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="panel-opacity" className="glass-field-label">
            玻璃透明度
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
          aria-label="玻璃透明度"
        />
      </div>

      <div className="flex flex-col gap-2 py-1">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="glass-blur" className="glass-field-label">
            Blur 强度
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
          aria-label="模糊强度"
        />
      </div>

      <div className="flex flex-col gap-2 py-1">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="glass-border" className="glass-field-label">
            边框亮度
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
          aria-label="边框亮度"
        />
      </div>

      <div className="flex flex-col gap-2 py-1">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="glass-shadow" className="glass-field-label">
            阴影强度
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
          aria-label="阴影强度"
        />
      </div>

      <div className="flex flex-col gap-2 py-1">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="glass-glow" className="glass-field-label">
            辉光强度
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
          aria-label="辉光强度"
        />
      </div>

      <div className="flex flex-col gap-2 py-1">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="bg-opacity" className="glass-field-label">
            背景不透明度
          </label>
          <span className="text-[11px] text-[var(--text-muted)]">
            {background.opacity}%
          </span>
        </div>
        <GlassSlider
          id="bg-opacity"
          min={20}
          max={100}
          step={1}
          value={background.opacity}
          onValueChange={(value) => {
            setBackground({
              opacity: readSliderValue(value, background.opacity),
            });
          }}
          aria-label="背景不透明度"
        />
      </div>

      <div className="flex flex-col gap-2 py-1">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="bg-blur" className="glass-field-label">
            背景模糊
          </label>
          <span className="text-[11px] text-[var(--text-muted)]">
            {background.blur}px
          </span>
        </div>
        <GlassSlider
          id="bg-blur"
          min={0}
          max={40}
          step={1}
          value={background.blur}
          onValueChange={(value) => {
            setBackground({ blur: readSliderValue(value, background.blur) });
          }}
          aria-label="背景模糊"
        />
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/bmp"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          if (!file) return;
          /* Persist as data URL — blob: URLs die after reload */
          if (file.size > 4 * 1024 * 1024) {
            log("背景图过大（请小于 4MB）");
            event.target.value = "";
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = typeof reader.result === "string" ? reader.result : null;
            if (!dataUrl) return;
            setCustomBackgroundUrl(dataUrl);
            setBackgroundLabel(file.name);
            log(`已切换背景图：${file.name}`);
          };
          reader.onerror = () => log("读取背景图失败");
          reader.readAsDataURL(file);
          event.target.value = "";
        }}
      />

      <div className="flex flex-col gap-2 py-1 sm:flex-row">
        <GlassButton
          type="button"
          variant="glass"
          className="h-9 flex-1"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-4" aria-hidden />
          自定义背景
        </GlassButton>
        <GlassButton
          type="button"
          variant="ghost"
          className="h-9 flex-1"
          onClick={() => {
            resetBackground();
            setBackgroundLabel("主题默认背景");
            log("已恢复主题默认背景");
          }}
        >
          <RotateCcw className="size-4" aria-hidden />
          清除
        </GlassButton>
      </div>
      <p className="pb-1 text-[11px] text-[var(--text-muted)]">{backgroundLabel}</p>
    </SectionCard>
  );
}
