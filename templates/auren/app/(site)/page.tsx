import { Changelog } from "@/components/sections/changelog";
import { Features } from "@/components/sections/features/features";
import { FinalCta } from "@/components/sections/final-cta";
import { Hero } from "@/components/sections/hero";
import { Manifesto } from "@/components/sections/manifesto";
import { Metrics } from "@/components/sections/metrics";
import { Pricing } from "@/components/sections/pricing";
import { Specs } from "@/components/sections/specs";
import { DitherBand } from "@/components/ui/primitives";

export default function Home() {
  return (
    <>
      <Hero />
      <Metrics />
      <DitherBand from="var(--ink)" to="var(--paper)" />
      <Features />
      <Manifesto />
      <DitherBand from="var(--paper)" to="var(--ink)" />
      <Specs />
      <DitherBand from="var(--ink)" to="var(--paper)" />
      <Pricing />
      <Changelog />
      <DitherBand from="var(--paper)" to="var(--ink)" />
      <FinalCta />
    </>
  );
}
