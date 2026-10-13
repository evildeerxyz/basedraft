import { pageMeta } from "@/lib/metadata";
import { PageHero } from "@/components/site/page-hero";
import { SubscribeForm } from "@/components/site/subscribe-form";
import { FadeIn } from "@/components/ui/reveal";
import { RELEASES, releaseId } from "@/lib/content/changelog";
import { cn } from "@/lib/site";

export const metadata = pageMeta("Changelog", "Every Auren release, newest first.");

export default function ChangelogPage() {
  return (
    <>
      <PageHero
        index="Auren"
        label="Changelog"
        title={["Shipping,", "weekly."]}
        intro="Every release, newest first. Auren updates itself in the background; this is what changed."
        sun={0.3}
      >
        <SubscribeForm />
      </PageHero>

      <section className="bg-paper pb-24 pt-12 text-ink md:pb-32">
        <div className="container-x">
          <ol>
            {RELEASES.map((r, i) => (
              <li
                key={r.version}
                id={releaseId(r.version)}
                className="grid grid-cols-1 scroll-mt-24 gap-6 border-t border-ink/12 py-14 lg:grid-cols-12 lg:gap-10"
              >
                <div className="lg:col-span-3">
                  <div className="lg:sticky lg:top-24">
                    <div className="font-dot text-[56px] font-[800] leading-none">{r.version}</div>
                    <div className="mt-4 font-mono text-[12px] text-ink/50">{r.date}</div>
                    <span
                      className={cn(
                        "type-label mt-3 inline-block rounded-full border px-2.5 py-0.5",
                        r.kind === "Major" ? "border-ink bg-ink text-paper" : "border-ink/15 text-ink/60",
                      )}
                    >
                      {r.kind}
                    </span>
                  </div>
                </div>
                <FadeIn className="lg:col-span-8 lg:col-start-5" delay={i === 0 ? 0.1 : 0}>
                  <h2 className="type-title text-[clamp(1.75rem,3vw,2.5rem)]">{r.title}</h2>
                  <p className="mt-4 max-w-[60ch] text-[17px] leading-[1.6] text-ink/65">{r.summary}</p>
                  <div className="mt-10 space-y-8">
                    {r.notes.map((n) => (
                      <div key={n.heading}>
                        <div className="type-label text-ink/45">{n.heading}</div>
                        <ul className="mt-3 space-y-2.5 text-[15.5px] leading-[1.6] text-ink/75">
                          {n.items.map((item) => (
                            <li key={item} className="flex gap-3.5">
                              <span
                                className={cn(
                                  "mt-[0.62em] size-1.5 shrink-0",
                                  n.heading === "New" ? "bg-accent" : n.heading === "Improved" ? "bg-ink/50" : "bg-ink/20",
                                )}
                              />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </FadeIn>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
