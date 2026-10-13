import { pageMeta } from "@/lib/metadata";
import { MarkDownloads, Swatch } from "@/components/site/brand-kit";
import { PageHero } from "@/components/site/page-hero";
import { DitherWordmark } from "@/components/dither/dither-wordmark";
import { SectionLabel } from "@/components/ui/primitives";
import { FadeIn, RevealText } from "@/components/ui/reveal";
import { ditherTile } from "@/lib/dither";

export const metadata = pageMeta("Brand", "The Auren mark, colours, type and dither patterns.");

const COLOURS = [
  { name: "Ink", value: "#0a0a09", token: "--ink", dark: true },
  { name: "Ink 2", value: "#121211", token: "--ink-2", dark: true },
  { name: "Paper", value: "#efebe2", token: "--paper" },
  { name: "Paper 2", value: "#e6e1d6", token: "--paper-2" },
  { name: "Aurum", value: "#f2a23a", token: "--accent" },
  { name: "Aurora", value: "#7ddba4", token: "--accent" },
  { name: "Ember", value: "#ff6b3d", token: "--accent" },
  { name: "Fog", value: "#a7a297", token: "--fog" },
];

const TYPE = [
  { family: "Mona Sans", use: "Display and text", sample: "Write the intent.", className: "type-display text-[clamp(2.5rem,5vw,4.5rem)]" },
  { family: "Geist Mono", use: "Code, labels, data", sample: "const diff = await agent.run(task);", className: "font-mono text-[clamp(1rem,1.6vw,1.35rem)]" },
  { family: "Doto", use: "Numbers, sparingly", sample: "3.8 ms", className: "font-dot text-[clamp(3rem,6vw,5rem)] font-[800] leading-none" },
];

const LEVELS = Array.from({ length: 17 }, (_, i) => i * 4);

export default function BrandPage() {
  return (
    <>
      <PageHero
        label="Brand"
        title={["The mark, the type,", "the dots."]}
        intro="A sun on the horizon over a dithered reflection, drawn on an eleven pixel grid. Everything else follows from it."
        sun={0}
      />

      <section className="bg-paper py-20 text-ink md:py-28">
        <div className="container-x">
          <SectionLabel index="01">Mark</SectionLabel>
          <h2 className="type-display mt-8 text-[clamp(2.25rem,4.6vw,4rem)]">
            <RevealText lines={["Eleven pixels", "of sunrise."]} />
          </h2>
          <div className="mt-12">
            <MarkDownloads />
          </div>
          <div className="mt-6 rounded-[10px] bg-ink px-6 py-10 md:px-10">
            <DitherWordmark />
          </div>
        </div>
      </section>

      <section className="bg-paper pb-20 text-ink md:pb-28">
        <div className="container-x">
          <SectionLabel index="02">Colour</SectionLabel>
          <p className="mt-6 max-w-[56ch] text-[16px] leading-[1.6] text-ink/60">
            Two neutrals carry everything. One accent at a time, never more. Click a swatch to copy its value.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {COLOURS.map((c, i) => (
              <FadeIn key={c.name} delay={(i % 4) * 0.05}>
                <Swatch {...c} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper pb-20 text-ink md:pb-28">
        <div className="container-x">
          <SectionLabel index="03">Type</SectionLabel>
          <ul className="mt-10 border-t border-ink/12">
            {TYPE.map((t) => (
              <li key={t.family} className="grid grid-cols-1 gap-6 border-b border-ink/12 py-10 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-3">
                  <div className="type-title text-[22px]">{t.family}</div>
                  <div className="mt-1 font-mono text-[12px] text-ink/50">{t.use}</div>
                </div>
                <div className={`lg:col-span-9 ${t.className}`}>{t.sample}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-paper pb-24 text-ink md:pb-32">
        <div className="container-x">
          <SectionLabel index="04">Dither</SectionLabel>
          <p className="mt-6 max-w-[60ch] text-[16px] leading-[1.6] text-ink/60">
            Every gradient on this site is an 8×8 ordered dither. These are the seventeen levels we use, from empty to
            solid. Never blur them, never anti-alias them.
          </p>
          <div className="mt-10 grid grid-cols-6 gap-3 sm:grid-cols-9 lg:grid-cols-[repeat(17,minmax(0,1fr))]">
            {LEVELS.map((level) => (
              <div key={level}>
                <div
                  className="aspect-square rounded-[4px] border border-ink/10 bg-paper-2"
                  style={{ backgroundImage: ditherTile(level, 1, "#0a0a09"), backgroundSize: "8px 8px" }}
                />
                <div className="mt-2 text-center font-mono text-[10.5px] text-ink/45">{level}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
