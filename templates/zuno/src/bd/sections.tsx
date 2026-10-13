import type { ReactNode } from "react";
import { Nav } from "@/components/sections/Nav";
import { Hero } from "@/components/sections/Hero";
import { TickerTape } from "@/components/sections/TickerTape";
import { Manifesto } from "@/components/sections/Manifesto";
import { AppShowcase } from "@/components/sections/AppShowcase";
import { Features } from "@/components/sections/Features";
import { Copilot } from "@/components/sections/Copilot";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Simulator } from "@/components/sections/Simulator";
import { Testimonials } from "@/components/sections/Testimonials";
import { Security } from "@/components/sections/Security";
import { Pricing } from "@/components/sections/Pricing";
import { FAQ } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/sections/Footer";

/*
 * basedraft's index of this site's home page sections: the real components, drawn exactly as the
 * home page draws them. The names and kinds basedraft shows live in manifest.json beside this.
 */
const RENDER: Record<string, () => ReactNode> = {
  "nav": () => <Nav />,
  "hero": () => <Hero />,
  "ticker": () => <TickerTape />,
  "manifesto": () => <Manifesto />,
  "showcase": () => <AppShowcase />,
  "features": () => <Features />,
  "copilot": () => <Copilot />,
  "how": () => <HowItWorks />,
  "simulator": () => <Simulator />,
  "testimonials": () => <Testimonials />,
  "security": () => <Security />,
  "pricing": () => <Pricing />,
  "faq": () => <FAQ />,
  "cta": () => <FinalCTA />,
  "footer": () => <Footer />,
};

/**
 * One section, marked so basedraft can find it on the page. The wrapper has no box of its own
 * (display: contents), so sticky navs, spacing and every other bit of layout stay as they were.
 */
export function Section({ id, instance }: { id: string; instance?: string }) {
  const render = RENDER[id];
  if (!render) return null;
  return (
    <div data-bd-section={id} data-bd-key={instance ?? id} style={{ display: "contents" }}>
      {render()}
    </div>
  );
}
