/**
 * GVFI — Video input / drop zone panel.
 * Developed by Mr. Gong
 * Copyright © 2026 Mr. Gong. All Rights Reserved.
 */

"use client";

import { useId, useRef, useState } from"react";
import { FileVideo, Upload } from"lucide-react";
import { SectionCard } from"@/components/section-card";
import { GlassButton } from"@/components/glass/glass-button";
import { GlassDialog } from"@/components/glass/glass-dialog";
import { GlassInput, GlassTextarea } from"@/components/glass/glass-input";
import { useT } from"@/hooks/use-t";
import { cn } from"@/lib/utils";

interface InputPanelProps {
 fileName: string;
 inputPath: string;
 onFileSelected: (file: File | null) => void;
 onInputPathChange: (value: string) => void;
}

export function InputPanel({
 fileName,
 inputPath,
 onFileSelected,
 onInputPathChange,
}: InputPanelProps) {
 const t = useT();
 const inputId = useId();
 const inputRef = useRef<HTMLInputElement>(null);
 const [dragging, setDragging] = useState(false);
 const [consentOpen, setConsentOpen] = useState(false);
 const pendingFiles = useRef<FileList | File[] | null>(null);

 const acceptFile = (list: FileList | File[] | null) => {
 if (!list) return;
 const next = Array.from(list).find((file) => file.type.startsWith("video/"));
 onFileSelected(next ?? null);
 };

 const requestSelect = (list?: FileList | File[] | null) => {
 pendingFiles.current = list ?? null;
 setConsentOpen(true);
 };

 const confirmConsent = () => {
 setConsentOpen(false);
 if (pendingFiles.current) {
 acceptFile(pendingFiles.current);
 pendingFiles.current = null;
 return;
 }
 inputRef.current?.click();
 };

 return (
 <SectionCard
 title={t("video.input.title")}
 description={t("video.input.desc")}
 >
 <p
 className="rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] px-3 py-2 text-[12px] leading-relaxed text-[var(--text-muted)]"
 role="note"
 >
 {t("video.input.privacyNotice")}
 </p>

 <input
 ref={inputRef}
 id={inputId}
 type="file"
 accept="video/*"
 tabIndex={-1}
 aria-hidden="true"
 className="sr-only"
 onChange={(event) => {
 acceptFile(event.target.files);
 event.target.value ="";
 }}
 />
 <button
 type="button"
 aria-controls={inputId}
 aria-label={t("video.input.dropAria")}
 onClick={() => requestSelect()}
 onDragEnter={(event) => {
 event.preventDefault();
 setDragging(true);
 }}
 onDragOver={(event) => {
 event.preventDefault();
 setDragging(true);
 }}
 onDragLeave={(event) => {
 event.preventDefault();
 setDragging(false);
 }}
 onDrop={(event) => {
 event.preventDefault();
 setDragging(false);
 requestSelect(event.dataTransfer.files);
 }}
 className={cn(
"glass-card flex min-h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 px-4 py-6 text-center transition-colors",
"border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--bg-2)_70%,transparent)]",
 dragging &&
"border-[var(--accent-cyan)] bg-[color-mix(in_srgb,var(--accent-cyan)_10%,var(--bg-2))]"
 )}
 >
 <Upload className="size-5 text-[var(--accent-cyan)]" aria-hidden />
 <span className="text-sm font-medium text-[var(--text-strong)]">
 {t("video.input.drop")}
 </span>
 <span className="text-sm text-[var(--text-muted)]">
 {t("video.input.orClick")}
 </span>
 </button>

 <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
 <FileVideo className="size-4 text-[var(--accent)]" aria-hidden />
 <span>
 {t("video.input.current", {
 name: fileName || t("video.input.none"),
 })}
 </span>
 </div>
 <GlassTextarea
 readOnly
 value={fileName}
 placeholder={t("video.input.placeholder")}
 aria-label={t("video.input.selectedAria")}
 className="min-h-20"
 />

 <div className="flex flex-col gap-2">
 <label htmlFor="input-path" className="glass-field-label">
 {t("video.input.pathLabel")}
 </label>
 <GlassInput
 id="input-path"
 value={inputPath}
 onChange={(event) => onInputPathChange(event.target.value)}
 placeholder={t("video.input.pathPlaceholder")}
 />
 </div>
 <GlassButton
 type="button"
 variant="glass"
 size="sm"
 className="w-full"
 onClick={() => requestSelect()}
 >
 {t("video.input.choose")}
 </GlassButton>

 <GlassDialog
 open={consentOpen}
 onOpenChange={setConsentOpen}
 title={t("video.input.consentTitle")}
 description={t("video.input.consentBody")}
 footer={
 <div className="flex justify-end gap-2">
 <GlassButton
 type="button"
 variant="ghost"
 size="sm"
 onClick={() => {
 pendingFiles.current = null;
 setConsentOpen(false);
 }}
 >
 {t("common.cancel")}
 </GlassButton>
 <GlassButton
 type="button"
 variant="primary"
 size="sm"
 onClick={confirmConsent}
 >
 {t("video.input.consentConfirm")}
 </GlassButton>
 </div>
 }
 />
 </SectionCard>
 );
}
