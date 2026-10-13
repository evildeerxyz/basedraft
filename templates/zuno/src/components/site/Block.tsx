import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SectionTitle } from "../ui/Section";

/** A page section: two-tone title, optional intro, then content. The headline carries the section; no eyebrow labels. */
export function Block({
  lead,
  tail,
  intro,
  children,
  id,
  className,
  side,
}: {
  lead?: string;
  tail?: string;
  intro?: ReactNode;
  children?: ReactNode;
  id?: string;
  className?: string;
  /** Put the intro beside the title instead of under it. */
  side?: boolean;
}) {
  return (
    <section id={id} className={cn("relative mx-auto max-w-[1280px] scroll-mt-20 px-5 py-24 lg:px-8 lg:py-36", className)}>
      {lead && (
        <div className={cn(side && "grid gap-8 lg:grid-cols-12 lg:items-end")}>
          <SectionTitle className={cn(side && "lg:col-span-7")} lead={lead} tail={tail} />
          {intro && (
            <div className={cn("text-[19px] leading-relaxed text-white/70 sm:text-[20px]", side ? "max-w-[460px] lg:col-span-5 lg:col-start-8" : "mt-7 max-w-[620px]")}>
              {intro}
            </div>
          )}
        </div>
      )}
      {children && <div className={lead ? "mt-16 lg:mt-20" : undefined}>{children}</div>}
    </section>
  );
}
