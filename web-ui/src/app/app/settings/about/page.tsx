import type { Metadata } from "next";
import { AboutPage } from "@/components/about/about-page";

export const metadata: Metadata = {
  title: "关于 · GVFI",
  description: "GVFI 软件信息与版权",
};

export default function AboutRoutePage() {
  return <AboutPage />;
}
