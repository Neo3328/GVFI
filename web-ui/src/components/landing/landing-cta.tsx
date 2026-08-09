import Link from "next/link";
import { cuteButtonClassName } from "@/components/cute-button";
import { cn } from "@/lib/utils";

export function LandingCta() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="ios-grouped flex flex-col items-center gap-4 px-6 py-10 text-center">
        <h2 className="max-w-md font-heading text-[28px] font-bold tracking-tight">
          准备好开始了吗？
        </h2>
        <p className="max-w-sm text-[17px] leading-relaxed text-muted-foreground">
          启动 GVFI，打开控制台，几分钟内完成第一次补帧。
        </p>
        <Link
          href="/app"
          className={cn(cuteButtonClassName, "w-full max-w-xs py-3 text-[17px] sm:w-auto sm:px-8")}
        >
          打开控制台
        </Link>
      </div>
    </section>
  );
}
