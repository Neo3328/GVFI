"use client";

import { SectionCard } from "@/components/section-card";
import { GlassInput } from "@/components/glass/glass-input";

interface OutputPanelProps {
  outputDir: string;
  lastOutputPath: string;
}

export function OutputPanel({ outputDir, lastOutputPath }: OutputPanelProps) {
  return (
    <SectionCard
      title="输出"
      description="输出目录由 GVFI 服务管理；完成后会显示实际文件路径。"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="output-dir" className="glass-field-label">
          服务输出目录
        </label>
        <GlassInput
          id="output-dir"
          value={outputDir}
          readOnly
          aria-label="服务输出目录"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="last-output" className="glass-field-label">
          最近输出文件
        </label>
        <GlassInput
          id="last-output"
          value={lastOutputPath}
          readOnly
          placeholder="尚未生成"
          aria-label="最近输出文件"
        />
      </div>
    </SectionCard>
  );
}
