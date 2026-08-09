import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  cuteButtonClassName,
  cuteOutlineButtonClassName,
} from "@/components/cute-button";
import { cn } from "@/lib/utils";

export function LandingHero() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:flex-row lg:items-center lg:gap-12">
      <div className="flex flex-1 flex-col gap-5">
        <p className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
          AI 视频补帧
        </p>
        <h1 className="font-heading text-[40px] font-bold leading-[1.1] tracking-tight text-foreground sm:text-[48px]">
          让每一帧
          <br />
          都更丝滑
        </h1>
        <p className="max-w-xl text-[17px] leading-relaxed text-muted-foreground">
          GVFI 将 RIFE 封装为简洁的 iOS 风格体验。上传、预设、渲染——专业补帧与超分，触手可及。
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/app"
            className={cn(cuteButtonClassName, "gap-2 px-6 text-[17px]")}
          >
            开始使用
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <a
            href="#workflow"
            className={cn(
              cuteOutlineButtonClassName,
              "px-6 text-[17px] text-center"
            )}
          >
            了解流程
          </a>
        </div>
      </div>

      <div className="flex flex-1 justify-center lg:justify-end">
        <div
          className="ios-grouped w-full max-w-sm p-5"
          aria-hidden="true"
        >
          <p className="text-[13px] text-muted-foreground">控制台预览</p>
          <p className="mt-1 font-heading text-[22px] font-semibold">GVFI</p>
          <div className="mt-4 flex flex-col gap-3">
            <div className="rounded-xl bg-[var(--fill-tertiary)] px-4 py-8 text-center text-[15px] text-muted-foreground">
              拖拽视频到此处
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-secondary px-3 py-2.5 text-center text-[15px]">
                120 FPS
              </div>
              <div className="rounded-lg bg-secondary px-3 py-2.5 text-center text-[15px]">
                rife-anime
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-3/5 rounded-full bg-primary" />
            </div>
            <div className={cn(cuteButtonClassName, "py-2.5 text-[15px]")}>
              开始渲染
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
