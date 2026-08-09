import Link from "next/link";
import { Check } from "lucide-react";
import {
  cuteButtonClassName,
  cuteOutlineButtonClassName,
} from "@/components/cute-button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "免费体验",
    price: "¥0",
    period: "",
    description: "本地 GVFI，个人尝鲜",
    features: ["基础 RIFE 模型", "单任务队列", "iOS 风格控制台"],
    highlighted: false,
  },
  {
    name: "创作者",
    price: "¥49",
    period: "/月",
    description: "高频补帧与超分",
    features: ["全部模型", "批量队列", "优先 GPU", "导出历史"],
    highlighted: true,
  },
  {
    name: "团队版",
    price: "¥199",
    period: "/月",
    description: "多成员协作",
    features: ["5 个席位", "共享看板", "API 接入", "技术支持"],
    highlighted: false,
  },
];

export function LandingPricing() {
  return (
    <section
      id="pricing"
      className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14"
    >
      <div className="mb-4 px-1">
        <h2 className="font-heading text-[28px] font-bold tracking-tight">
          方案
        </h2>
        <p className="mt-2 text-[17px] text-muted-foreground">
          当前控制台已开放免费体验
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={cn(
              "ios-grouped p-4",
              plan.highlighted && "ring-2 ring-primary/30"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[17px] font-semibold">{plan.name}</h3>
                <p className="text-[15px] text-muted-foreground">
                  {plan.description}
                </p>
              </div>
              <div className="text-right">
                <span className="font-heading text-[28px] font-bold">
                  {plan.price}
                </span>
                <span className="text-[15px] text-muted-foreground">
                  {plan.period}
                </span>
              </div>
            </div>
            <ul className="mt-4 flex flex-col gap-2">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-[15px] text-muted-foreground"
                >
                  <Check
                    aria-hidden="true"
                    className="size-4 shrink-0 text-primary"
                  />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href="/app"
              className={cn(
                plan.highlighted
                  ? cuteButtonClassName
                  : cuteOutlineButtonClassName,
                "mt-4 w-full py-2.5 text-[17px]"
              )}
            >
              {plan.highlighted ? "选择创作者" : "开始使用"}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
