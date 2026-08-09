import { SectionCard } from "@/components/section-card";
import { GlassLogViewer } from "@/components/glass/glass-log-viewer";

interface LogsPanelProps {
  taskLogs: string[];
  errorLogs: string[];
}

export function LogsPanel({ taskLogs, errorLogs }: LogsPanelProps) {
  return (
    <SectionCard title="日志">
      <div className="flex flex-col gap-3 py-2">
        <div>
          <h3 className="mb-1 text-[13px] font-medium text-foreground">任务反馈</h3>
          <GlassLogViewer lines={taskLogs} variant="task" maxHeight={160} />
        </div>
        <div>
          <h3 className="mb-1 text-[13px] font-medium text-destructive">错误</h3>
          <GlassLogViewer lines={errorLogs} variant="error" maxHeight={120} />
        </div>
      </div>
    </SectionCard>
  );
}
