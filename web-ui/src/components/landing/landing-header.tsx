import Link from "next/link";
import { cuteButtonClassName } from "@/components/cute-button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#features", label: "功能" },
  { href: "#workflow", label: "流程" },
  { href: "#pricing", label: "方案" },
];

export function LandingHeader() {
  return (
    <header className="ios-blur-bar sticky top-0 z-50">
      <div className="ios-safe-top mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="font-heading text-[17px] font-semibold text-foreground"
        >
          GVFI
        </Link>

        <nav aria-label="主导航" className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="cursor-pointer text-[15px] text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <Link
          href="/app"
          className={cn(cuteButtonClassName, "px-4 py-2 text-[15px]")}
        >
          打开 App
        </Link>
      </div>
    </header>
  );
}
