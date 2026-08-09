import { LandingCta } from "@/components/landing/landing-cta";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingPricing } from "@/components/landing/landing-pricing";
import { LandingSteps } from "@/components/landing/landing-steps";

export function LandingPage() {
  return (
    <>
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingSteps />
        <LandingPricing />
        <LandingCta />
      </main>
      <LandingFooter />
    </>
  );
}
