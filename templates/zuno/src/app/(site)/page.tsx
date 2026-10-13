import { IntroGate } from "@/components/Intro";
import { AppShowcase } from "@/components/sections/AppShowcase";
import { Copilot } from "@/components/sections/Copilot";
import { FAQ } from "@/components/sections/FAQ";
import { Features } from "@/components/sections/Features";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Manifesto } from "@/components/sections/Manifesto";
import { Pricing } from "@/components/sections/Pricing";
import { Security } from "@/components/sections/Security";
import { Simulator } from "@/components/sections/Simulator";
import { Testimonials } from "@/components/sections/Testimonials";
import { TickerTape } from "@/components/sections/TickerTape";

export default function Home() {
  return (
    <IntroGate>
      <main id="main">
        <Hero />
        <TickerTape />
        <Manifesto />
        <AppShowcase />
        <Features />
        <Copilot />
        <HowItWorks />
        <Simulator />
        <Testimonials />
        <Security />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
    </IntroGate>
  );
}
