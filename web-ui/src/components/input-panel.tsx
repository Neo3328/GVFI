"use client";

import { useId, useRef, useState } from "react";
import { FileVideo, Upload } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { GlassButton } from "@/components/glass/glass-button";
import { GlassInput, GlassTextarea } from "@/components/glass/glass-input";
import { cn } from "@/lib/utils";

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
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const acceptFile = (list: FileList | File[] | null) => {
    if (!list) return;
    const next = Array.from(list).find((file) => file.type.startsWith("video/"));
    onFileSelected(next ?? null);
  };

  return (
    <SectionCard
      title="输入"
      description="上传视频文件，或填写本机绝对路径供 GVFI 读取。"
    >
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
          event.target.value = "";
        }}
      />
      <button
        type="button"
        aria-controls={inputId}
        aria-label="选择或拖拽视频文件"
        onClick={() => inputRef.current?.click()}
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
          acceptFile(event.dataTransfer.files);
        }}
        className={cn(
          "glass-card flex min-h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 px-4 py-6 text-center transition-colors",
          "border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--bg-2)_70%,transparent)]",
          dragging && "border-[var(--accent-cyan)] bg-[color-mix(in_srgb,var(--accent-cyan)_10%,var(--bg-2))]"
        )}
      >
        <Upload className="size-5 text-[var(--accent-cyan)]" aria-hidden />
        <span className="text-sm font-medium text-[var(--text-strong)]">
          拖拽视频到此处
        </span>
        <span className="text-sm text-[var(--text-muted)]">或点击选择</span>
      </button>

      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <FileVideo className="size-4 text-[var(--accent)]" aria-hidden />
        <span>当前文件：{fileName || "未选择"}</span>
      </div>
      <GlassTextarea
        readOnly
        value={fileName}
        placeholder="暂无上传文件..."
        aria-label="已选文件"
        className="min-h-20"
      />

      <div className="flex flex-col gap-2">
        <label htmlFor="input-path" className="glass-field-label">
          本机输入路径（可选）
        </label>
        <GlassInput
          id="input-path"
          value={inputPath}
          onChange={(event) => onInputPathChange(event.target.value)}
          placeholder="例如 D:\Videos\demo.mp4"
        />
      </div>
      <GlassButton
        type="button"
        variant="glass"
        size="sm"
        className="w-full"
        onClick={() => inputRef.current?.click()}
      >
        选择视频文件
      </GlassButton>
    </SectionCard>
  );
}
