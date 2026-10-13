import type { ReactNode } from "react";
import { DitherShader } from "../dither/dither-shader";
import { horizon } from "../dither/shaders";
import { CornerMarks, DitherBand, SectionLabel } from "../ui/primitives";
import { DitherReveal, FadeIn, RevealText } from "../ui/reveal";

/** Dark page header with a live sunrise figure; hands off to a paper page below. */
export function PageHero({
  label,
  title,
  intro,
  children,
  sun = 0.15,
  figure = true,
  index = "Auren",
}: {
  label: string;
  title: string[];
  intro?: ReactNode;
  children?: ReactNode;
  sun?: number;
  /** Set false to drop the sunrise and let the text run full width. */
  figure?: boolean;
  index?: string;
}) {
  return (
    <section className="relative bg-ink text-paper">
      <div className="container-x grid grid-cols-1 gap-12 pb-16 pt-[calc(var(--nav-h)+clamp(3rem,9vh,6rem))] lg:grid-cols-12 lg:items-end lg:pb-24">
        <div className={figure ? "lg:col-span-7" : "lg:col-span-10"}>
          <SectionLabel index={index}>{label}</SectionLabel>
          <h1 className="type-display mt-8 text-[clamp(2.75rem,6.4vw,6.25rem)]">
            <RevealText lines={title} lineClassNames={[undefined, "text-mute"]} />
          </h1>
          {intro && (
            <FadeIn delay={0.35}>
              <p className="mt-8 max-w-[52ch] text-[17px] leading-[1.55] text-fog md:text-[18px]">{intro}</p>
            </FadeIn>
          )}
          {children && (
            <FadeIn delay={0.45} className="mt-8">
              {children}
            </FadeIn>
          )}
        </div>
        {figure && (
          <DitherReveal scale={5} duration={1100} className="relative aspect-[4/3] border border-paper/10 lg:col-span-5">
            <DitherShader fragment={horizon(sun)} pixel={4} className="absolute inset-0" />
            <CornerMarks />
          </DitherReveal>
        )}
      </div>
      <DitherBand from="var(--ink)" to="var(--paper)" />
    </section>
  );
}
