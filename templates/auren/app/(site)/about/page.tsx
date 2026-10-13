import { pageMeta } from "@/lib/metadata";
import { PageHero } from "@/components/site/page-hero";
import { SectionLabel, buttonClass } from "@/components/ui/primitives";
import { CountUp, FadeIn, RevealText } from "@/components/ui/reveal";
import { SmartLink } from "@/components/ui/smart-link";

export const metadata = pageMeta("About", "Auren Labs builds a code editor for people who would rather review than type.");

const PRINCIPLES = [
  {
    title: "The diff is the product.",
    body: "An agent is only as good as the change you can read and trust. We design review first and generation second.",
  },
  {
    title: "Local by default.",
    body: "Your index, your predictions and your settings live on your machine. Anything that leaves it has to earn the trip.",
  },
  {
    title: "Fast is a feature.",
    body: "We hold every release to a latency budget. If a change makes typing slower, it does not ship, however clever it is.",
  },
  {
    title: "Respect the reader.",
    body: "In the editor, in the docs and on this page. Plain words, real numbers, no theatre.",
  },
];

const NUMBERS = [
  { value: 2023, label: "Founded" },
  { value: 34, label: "People" },
  { value: 19, label: "Countries" },
  { value: 0, label: "Offices" },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        label="About"
        title={["We build tools for", "people who read code."]}
        intro="Auren Labs is a small, remote company making one product: a code editor that does the reading, so you can do the deciding."
        sun={0.05}
      />

      <section className="bg-paper py-20 text-ink md:py-28">
        <div className="container-x grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionLabel index="01">Story</SectionLabel>
          </div>
          <FadeIn className="space-y-6 text-[clamp(1.2rem,1.8vw,1.45rem)] leading-[1.5] text-ink/75 lg:col-span-8">
            <p>
              We started Auren after a decade of building developer tools and noticing the same thing everywhere: the
              hard part of programming is not typing. It is reading. Understanding a codebase well enough to change it
              without breaking something you did not know existed.
            </p>
            <p>
              Language models are very good at reading. So we built an editor around that idea. It reads your whole
              repository before you ask, proposes changes as diffs you can judge, and stays out of the way while it
              works.
            </p>
            <p className="text-ink">
              We are funded by people who write software, we answer support email ourselves, and we would rather ship
              one excellent thing than ten adequate ones.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="bg-paper pb-20 text-ink md:pb-28">
        <div className="container-x">
          <SectionLabel index="02">Principles</SectionLabel>
          <ol className="mt-10 grid grid-cols-1 border-t border-ink/12 md:grid-cols-2">
            {PRINCIPLES.map((p, i) => (
              <FadeIn
                as="li"
                key={p.title}
                delay={(i % 2) * 0.08}
                className="border-b border-ink/12 py-10 md:odd:border-r md:odd:pr-10 md:even:pl-10"
              >
                <span className="font-dot text-[44px] font-[800] leading-none text-ink/25">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="type-title mt-6 text-[clamp(1.6rem,2.6vw,2.2rem)]">{p.title}</h2>
                <p className="mt-3 max-w-[44ch] text-[16px] leading-[1.6] text-ink/60">{p.body}</p>
              </FadeIn>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-ink py-20 text-paper md:py-28">
        <div className="container-x">
          <dl className="grid grid-cols-2 border-t border-paper/10 lg:grid-cols-4">
            {NUMBERS.map((n, i) => (
              <FadeIn
                key={n.label}
                delay={i * 0.08}
                className="border-b border-paper/10 py-7 pr-6 odd:border-r lg:border-b-0 lg:border-r lg:pl-6 lg:first:pl-0 lg:last:border-r-0"
              >
                <dt className="type-label text-mute">{n.label}</dt>
                <dd className="mt-4 font-dot text-[clamp(3rem,6vw,5rem)] font-[800] leading-none">
                  <CountUp to={n.value} duration={n.value > 1000 ? 1.2 : 1.6} />
                </dd>
              </FadeIn>
            ))}
          </dl>
          <div className="mt-20 flex flex-wrap items-end justify-between gap-8">
            <h2 className="type-display max-w-[14ch] text-[clamp(2.25rem,4.6vw,4rem)]">
              <RevealText lines={["Want to build", "it with us?"]} lineClassNames={[undefined, "text-mute"]} />
            </h2>
            <SmartLink href="/careers" className={buttonClass("light", "lg")}>
              See open roles
            </SmartLink>
          </div>
        </div>
      </section>
    </>
  );
}
