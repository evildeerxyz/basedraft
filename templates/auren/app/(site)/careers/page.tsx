import { pageMeta } from "@/lib/metadata";
import { PageHero } from "@/components/site/page-hero";
import { Roles } from "@/components/site/roles";
import { SectionLabel } from "@/components/ui/primitives";
import { FadeIn, RevealText } from "@/components/ui/reveal";

export const metadata = pageMeta("Careers", "Open roles at Auren Labs. Remote, small, and serious about craft.");

const HOW = [
  { title: "Remote, with overlap", body: "We work across Europe and the Americas, with four shared hours a day for the conversations that need them." },
  { title: "Six-week cycles", body: "Five weeks to build, one to polish, fix and write. Nobody is on call for a feature they did not ship." },
  { title: "Writing first", body: "Decisions start as short documents. Meetings are for disagreements, not status." },
  { title: "Everyone uses Auren", body: "We build the editor in the editor. If something annoys us, it gets fixed." },
];

const BENEFITS = [
  "Salary in the top quartile for your location, published in every listing",
  "Meaningful equity with a ten-year exercise window",
  "Health cover for you and your dependents",
  "A hardware budget refreshed every three years",
  "Four weeks off plus local holidays, and we check that you take them",
  "Two team weeks a year somewhere with good coffee",
];

export default function CareersPage() {
  return (
    <>
      <PageHero
        label="Careers"
        title={["Come build", "the instrument."]}
        intro="We are 34 people in 19 countries making one tool very well. If you care about the last millisecond and the last word on the page, we would like to meet you."
        sun={-0.05}
      />

      <section className="bg-paper py-20 text-ink md:py-28">
        <div className="container-x">
          <SectionLabel index="01">Open roles</SectionLabel>
          <h2 className="type-display mt-8 text-[clamp(2.25rem,4.6vw,4rem)]">
            <RevealText lines={["Six seats", "at the table."]} />
          </h2>
          <div className="mt-12">
            <Roles />
          </div>
        </div>
      </section>

      <section className="bg-paper pb-24 text-ink md:pb-32">
        <div className="container-x grid grid-cols-1 gap-16 lg:grid-cols-2">
          <div>
            <SectionLabel index="02">How we work</SectionLabel>
            <dl className="mt-10 border-t border-ink/12">
              {HOW.map((h, i) => (
                <FadeIn key={h.title} delay={i * 0.06} className="border-b border-ink/12 py-6">
                  <dt className="type-title text-[22px]">{h.title}</dt>
                  <dd className="mt-2 max-w-[48ch] text-[15.5px] leading-[1.6] text-ink/60">{h.body}</dd>
                </FadeIn>
              ))}
            </dl>
          </div>
          <div>
            <SectionLabel index="03">What you get</SectionLabel>
            <ul className="mt-10 border-t border-ink/12">
              {BENEFITS.map((b, i) => (
                <FadeIn as="li" key={b} delay={i * 0.05} className="flex gap-4 border-b border-ink/12 py-5 text-[16px] text-ink/75">
                  <span className="font-mono text-[12px] leading-[1.6] text-ink/35">{String(i + 1).padStart(2, "0")}</span>
                  {b}
                </FadeIn>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
