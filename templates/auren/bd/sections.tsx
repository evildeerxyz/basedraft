import type { ReactNode } from "react";
import { Nav } from "@/components/sections/nav";
import { Hero } from "@/components/sections/hero";
import { Metrics } from "@/components/sections/metrics";
import { DitherBand } from "@/components/ui/primitives";
import { Features } from "@/components/sections/features/features";
import { Manifesto } from "@/components/sections/manifesto";
import { Specs } from "@/components/sections/specs";
import { Pricing } from "@/components/sections/pricing";
import { Changelog } from "@/components/sections/changelog";
import { FinalCta } from "@/components/sections/final-cta";
import { Footer } from "@/components/sections/footer";

/*
 * basedraft's index of this site's home page sections: the real components, drawn exactly as the
 * home page draws them. The names and kinds basedraft shows live in manifest.json beside this.
 */
const RENDER: Record<string, () => ReactNode> = {
  "nav": () => <Nav />,
  "hero": () => <Hero />,
  "metrics": () => <Metrics />,
  "band-down": () => <DitherBand from="var(--ink)" to="var(--paper)" />,
  "features": () => <Features />,
  "manifesto": () => <Manifesto />,
  "band-up": () => <DitherBand from="var(--paper)" to="var(--ink)" />,
  "specs": () => <Specs />,
  "pricing": () => <Pricing />,
  "changelog": () => <Changelog />,
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
