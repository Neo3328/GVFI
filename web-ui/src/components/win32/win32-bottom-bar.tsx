/**
 * GVFI — Bottom log pane (three startup entries) + status bar.
 */
"use client";

const STARTUP_LOGS = [
  { text: "已加载视频文件", active: true },
  { text: "模型初始化完成", active: false },
  { text: "等待开始处理", active: false },
];

export function WinLogPane() {
  return (
    <section className="mx-2.5 mb-1 h-[150px] shrink-0 overflow-y-auto rounded-[6px] border border-[#e2e6eb] bg-white">
      {STARTUP_LOGS.map((log) => (
        <div
          key={log.text}
          className={
            log.active
              ? "flex h-[42px] items-center border-b border-[#eef1f5] bg-[#eaf2fe] px-4 text-[13px] font-medium text-[#1a1a1a]"
              : "flex h-[42px] items-center border-b border-[#eef1f5] px-4 text-[13px] text-[#333] last:border-b-0"
          }
        >
          {log.text}
        </div>
      ))}
    </section>
  );
}

export function WinStatusBar() {
  return (
    <footer className="flex h-[28px] shrink-0 items-center justify-between border-t border-[#e4e7eb] bg-white px-3 text-[12px]">
      <div className="flex items-center gap-2">
        <span className="h-[9px] w-[9px] rounded-full bg-[#22c55e] shadow-[0_0_0_2px_rgba(34,197,94,0.18)]" />
        <span className="font-medium text-[#333]">就绪</span>
      </div>
      <div className="flex items-center gap-5 text-[#555]">
        <span>
          显卡负载 <span className="font-medium text-[#333]">23%</span>
        </span>
        <span>
          剩余时间 <span className="font-mono font-medium text-[#333]">00:08:30</span>
        </span>
      </div>
    </footer>
  );
}
