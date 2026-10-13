import { RELEASES, releaseId } from "@/lib/content/changelog";
import { SectionLabel } from "../ui/primitives";
import { FadeIn, RevealText } from "../ui/reveal";
import { SmartLink } from "../ui/smart-link";

export function Changelog() {
  return (
    <section id="changelog" className="bg-paper pb-28 text-ink md:pb-36">
      <div className="container-x">
        <SectionLabel index="05">Changelog</SectionLabel>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
          <h2 className="type-display text-[clamp(2.5rem,6vw,5.5rem)]">
            <RevealText lines={["Shipping, weekly."]} />
          </h2>
          <SmartLink
            href="/changelog"
            className="mb-2 text-[14px] text-ink/60 underline decoration-ink/20 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
          >
            Full changelog
          </SmartLink>
        </div>

        <ol className="mt-12 border-t border-ink/12">
          {RELEASES.slice(0, 4).map((e, i) => (
            <FadeIn as="li" key={e.version} delay={i * 0.06}>
              <SmartLink
                href={`/changelog#${releaseId(e.version)}`}
                className="group grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-2 border-b border-ink/12 py-6 transition-colors hover:bg-ink/[0.03] md:grid-cols-[9rem_5rem_minmax(0,1fr)] md:px-2"
              >
                <span className="font-mono text-[12px] text-ink/50">{e.date}</span>
                <span className="justify-self-end font-mono text-[12px] md:justify-self-start">
                  <span className="rounded-full border border-ink/15 px-2 py-0.5 transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-paper">
                    {e.version}
                  </span>
                </span>
                <span className="col-span-2 md:col-span-1">
                  <span className="type-title block text-[22px]">{e.title}</span>
                  <span className="mt-1.5 block max-w-[60ch] text-[15px] leading-snug text-ink/55">{e.summary}</span>
                </span>
              </SmartLink>
            </FadeIn>
          ))}
        </ol>
      </div>
    </section>
  );
}
