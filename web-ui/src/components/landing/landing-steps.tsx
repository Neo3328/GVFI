import { Upload, Settings, PlayCircle } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "上传素材",
    description: "拖拽视频或填写本机路径",
  },
  {
    icon: Settings,
    title: "选择预设",
    description: "FPS、模型与超分参数",
  },
  {
    icon: PlayCircle,
    title: "开始渲染",
    description: "实时进度与日志反馈",
  },
];

export function LandingSteps() {
  return (
    <section id="workflow" className="bg-background py-10 sm:py-14">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-4 px-1">
          <h2 className="font-heading text-[28px] font-bold tracking-tight">
            工作流程
          </h2>
          <p className="mt-2 text-[17px] text-muted-foreground">
            三步完成，无需命令行
          </p>
        </div>
        <ol className="flex flex-col gap-3">
          {steps.map((item, index) => (
            <li key={item.title} className="ios-grouped flex items-start gap-4 p-4">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
                aria-hidden="true"
              >
                <item.icon className="size-5" />
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-medium text-muted-foreground">
                  步骤 {index + 1}
                </span>
                <h3 className="text-[17px] font-semibold">{item.title}</h3>
                <p className="text-[15px] text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
