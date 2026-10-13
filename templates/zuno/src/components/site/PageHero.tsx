import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SectionTitle } from "../ui/Section";

/** Top of every subpage: two-tone headline, intro, actions and an optional visual. */
export function PageHero({
  lead,
  tail,
  intro,
  actions,
  aside,
  children,
}: {
  lead: string;
  tail?: string;
  intro?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative mx-auto max-w-[1280px] px-5 pb-20 pt-32 lg:px-8 lg:pb-28 lg:pt-44">
      <div className={cn("grid gap-14", Boolean(aside) && "lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16")}>
        <div>
          <SectionTitle as="h1" lead={lead} tail={tail} className={cn("leading-[0.94]", aside ? "text-[clamp(3rem,6.4vw,5.75rem)]" : "text-[clamp(3.2rem,8vw,7.5rem)]")} />
          {intro && <div className="mt-8 max-w-[600px] text-[19px] leading-relaxed text-white/70 sm:text-[21px]">{intro}</div>}
          {actions && <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">{actions}</div>}
        </div>
        {aside && <div className="relative min-w-0">{aside}</div>}
      </div>
      {children}
    </section>
  );
}
