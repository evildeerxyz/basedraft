import type { ReactNode } from "react";
import { Nav } from "@/components/site/nav";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/sections";
import { NomadAi } from "@/components/home/sections";
import { Security } from "@/components/home/sections";
import { Insights } from "@/components/home/sections";
import { ArchitectureSection } from "@/components/home/sections";
import { Stats } from "@/components/home/sections";
import { Testimonials } from "@/components/home/sections";
import { Integrations } from "@/components/home/sections";
import { FinalCta } from "@/components/home/sections";
import { Footer } from "@/components/site/footer";

/*
 * basedraft's index of this site's home page sections: the real components, drawn exactly as the
 * home page draws them. The names and kinds basedraft shows live in manifest.json beside this.
 */
const RENDER: Record<string, () => ReactNode> = {
  "nav": () => <Nav />,
  "hero": () => <Hero />,
  "how": () => <HowItWorks />,
  "nomad": () => <NomadAi />,
  "security": () => <Security />,
  "insights": () => <Insights />,
  "architecture": () => <ArchitectureSection />,
  "stats": () => <Stats />,
  "testimonials": () => <Testimonials />,
  "integrations": () => <Integrations />,
  "cta": () => <FinalCta />,
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
