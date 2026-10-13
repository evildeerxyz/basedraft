import type { ReactNode } from "react";
import { Nav } from "@/components/site/nav";
import { Hero } from "@/components/home/hero";
import { Logos } from "@/components/home/logos";
import { How } from "@/components/home/how";
import { Ask } from "@/components/home/ask";
import { TimeOff } from "@/components/home/time-off";
import { Payroll } from "@/components/home/payroll";
import { Features } from "@/components/home/features";
import { More } from "@/components/home/more";
import { Testimonials } from "@/components/home/testimonials";
import { Integrations } from "@/components/home/integrations";
import { Pricing } from "@/components/home/pricing";
import { Faq } from "@/components/home/faq";
import { Cta } from "@/components/home/cta";
import { Footer } from "@/components/site/footer";

/*
 * basedraft's index of this site's home page sections: the real components, drawn exactly as the
 * home page draws them. The names and kinds basedraft shows live in manifest.json beside this.
 */
const RENDER: Record<string, () => ReactNode> = {
  "nav": () => <Nav />,
  "hero": () => <Hero />,
  "logos": () => <Logos />,
  "how": () => <How />,
  "ask": () => <Ask />,
  "time-off": () => <TimeOff />,
  "payroll": () => <Payroll />,
  "features": () => <Features />,
  "more": () => <More />,
  "testimonials": () => <Testimonials />,
  "integrations": () => <Integrations />,
  "pricing": () => <Pricing />,
  "faq": () => <Faq />,
  "cta": () => <Cta />,
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
