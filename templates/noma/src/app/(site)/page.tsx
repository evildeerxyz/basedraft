import { Hero } from "@/components/home/hero";
import { ArchitectureSection, FinalCta, HowItWorks, Insights, Integrations, NomadAi, Security, Stats, Testimonials } from "@/components/home/sections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <NomadAi />
      <Security />
      <Insights />
      <ArchitectureSection />
      <Stats />
      <Testimonials />
      <Integrations />
      <FinalCta />
    </>
  );
}
