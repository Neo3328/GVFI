"use client";

import { SectionCard } from"@/components/section-card";
import { GlassInput } from"@/components/glass/glass-input";
import { useT } from"@/hooks/use-t";

interface OutputPanelProps {
 outputDir: string;
 lastOutputPath: string;
}

export function OutputPanel({ outputDir, lastOutputPath }: OutputPanelProps) {
 const t = useT();

 return (
 <SectionCard
 title={t("video.outputPanel.title")}
 description={t("video.outputPanel.desc")}
 >
 <div className="flex flex-col gap-2">
 <label htmlFor="output-dir" className="glass-field-label">
 {t("video.outputPanel.dirLabel")}
 </label>
 <GlassInput
 id="output-dir"
 value={outputDir}
 readOnly
 aria-label={t("video.outputPanel.dirLabel")}
 />
 </div>
 <div className="flex flex-col gap-2">
 <label htmlFor="last-output" className="glass-field-label">
 {t("video.outputPanel.lastLabel")}
 </label>
 <GlassInput
 id="last-output"
 value={lastOutputPath}
 readOnly
 placeholder={t("video.outputPanel.placeholder")}
 aria-label={t("video.outputPanel.lastLabel")}
 />
 </div>
 </SectionCard>
 );
}
