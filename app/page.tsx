import { DemoCasesStrip } from "@/components/landing/demo-cases-strip";
import { DirectoryGrid } from "@/components/landing/directory-grid";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingCta } from "@/components/landing/landing-cta";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <DirectoryGrid />
      <DemoCasesStrip />
      <LandingCta />
    </>
  );
}
