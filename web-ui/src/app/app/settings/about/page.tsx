import type { Metadata } from "next";
import { AboutPage } from "@/components/about/about-page";

/** SSR defaults (English); client AboutPage sets document.title via useT. */
export const metadata: Metadata = {
  title: "About · GVFI",
  description: "GVFI software information and version",
};

export default function AboutRoutePage() {
  return <AboutPage />;
}
