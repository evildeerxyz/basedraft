import type { ReactNode } from "react";
import { Nav } from "@/components/site/nav";
import { Hero } from "@/components/home/hero";
import { TimeOff } from "@/components/home/time-off";
import { Ask } from "@/components/home/ask";
import { Payroll } from "@/components/home/payroll";
import { DayOne } from "@/components/home/day-one";
import { Overtime } from "@/components/home/overtime";
import { Privacy } from "@/components/home/privacy";
import { Week } from "@/components/home/week";
import { Stories } from "@/components/home/stories";
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
  "time-off": () => <TimeOff />,
  "ask": () => <Ask />,
  "payroll": () => <Payroll />,
  "day-one": () => <DayOne />,
  "overtime": () => <Overtime />,
  "privacy": () => <Privacy />,
  "week": () => <Week />,
  "stories": () => <Stories />,
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
