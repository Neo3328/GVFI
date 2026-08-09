import Link from "next/link";
import { CopyrightFooter } from "@/components/brand/copyright-footer";

const footerLinks = [
  { href: "#features", label: "功能" },
  { href: "#workflow", label: "流程" },
  { href: "#pricing", label: "方案" },
  { href: "/app", label: "控制台", internal: true },
  { href: "/app/settings/about", label: "关于", internal: true },
];

export function LandingFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--separator)] bg-transparent">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-heading text-[17px] font-semibold text-[var(--text-strong)]">
            GVFI
          </span>
          <nav aria-label="页脚导航" className="flex flex-wrap gap-4">
            {footerLinks.map((link) =>
              link.internal ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className="cursor-pointer text-[15px] text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="cursor-pointer text-[15px] text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>
        </div>
        <CopyrightFooter variant="stacked" align="left" className="opacity-90" />
      </div>
    </footer>
  );
}
