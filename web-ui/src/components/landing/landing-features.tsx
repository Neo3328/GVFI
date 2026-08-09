import { ChevronRight, Film, Gauge, Layers, Wand2 } from "lucide-react";

const features = [
  {
    icon: Film,
    title: "智能补帧",
    description: "RIFE 模型平滑提升至 120/240fps",
  },
  {
    icon: Layers,
    title: "超分增强",
    description: "RealCUGAN / RealESRGAN 可选",
  },
  {
    icon: Gauge,
    title: "GPU 加速",
    description: "Vulkan 本地加速渲染",
  },
  {
    icon: Wand2,
    title: "预设工作流",
    description: "动漫、电影等一键预设",
  },
];

export function LandingFeatures() {
  return (
    <section
      id="features"
      className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14"
    >
      <div className="mb-4 px-1">
        <h2 className="font-heading text-[28px] font-bold tracking-tight">
          功能
        </h2>
        <p className="mt-2 text-[17px] text-muted-foreground">
          为创作者设计的视频处理工具集
        </p>
      </div>
      <ul className="ios-grouped divide-y divide-[var(--separator)]">
        {features.map((feature) => (
          <li
            key={feature.title}
            className="flex cursor-default items-center gap-4 px-4 py-3.5 transition-colors duration-200"
          >
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
              aria-hidden="true"
            >
              <feature.icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-medium text-foreground">
                {feature.title}
              </p>
              <p className="text-[15px] text-muted-foreground">
                {feature.description}
              </p>
            </div>
            <ChevronRight
              aria-hidden="true"
              className="size-5 shrink-0 text-muted-foreground/50"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
