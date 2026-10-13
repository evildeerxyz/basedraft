import type { Metadata } from "next";
import { Cta } from "@/components/home/cta";
import { Logos } from "@/components/home/logos";
import { Dithered } from "@/components/site/dither";
import { PageHead } from "@/components/site/page";
import { Band } from "@/components/site/ui";
import { STORIES } from "@/lib/customers";
import { customerPhoto } from "@/lib/photos";

export const metadata: Metadata = {
  title: "Customers",
  description: "How Halden, Brightwater, Kestrel and 1,200 other People teams use pello, in their own words.",
};

export default function CustomersPage() {
  const [first, ...rest] = STORIES;
  return (
    <>
      <PageHead title="1,200 People teams, and what they stopped doing" lead="Six of them, in their own words: what took up their week before pello, and what does now." />
      <Logos />
      <Band rule inner="py-16 lg:py-24">
        <article className="pl-card grid overflow-hidden rounded-[16px] lg:grid-cols-[0.8fr_1.2fr]">
          <Dithered src={customerPhoto(first.name)} alt={first.name} cell={3} focus={[0.5, 0.3]} className="min-h-[380px]" />
          <div className="p-7 sm:p-10 lg:p-12">
            <p className="text-[15px] text-mute">
              {first.company} · {first.what} · <span className="tabular font-mono">{first.size.toLocaleString("en-US")}</span> people
            </p>
            <blockquote className="mt-6 font-display text-[clamp(1.6rem,2.4vw,2.1rem)] font-semibold leading-[1.2] tracking-[-0.02em] text-ink">&ldquo;{first.quote}&rdquo;</blockquote>
            <p className="mt-5 text-[15px] text-mute">
              {first.name}, {first.role}
            </p>
            <div className="mt-8 flex items-baseline gap-3 rounded-[12px] bg-sunken p-4">
              <span className="font-display text-[36px] font-semibold leading-none tracking-[-0.03em] text-accent">{first.result}</span>
              <span className="text-[15px] text-ink-2">{first.resultLabel}</span>
            </div>
            <div className="mt-6 grid gap-3 text-[16px] leading-[1.65] text-ink-2">
              {first.story.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
        </article>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {rest.map((s) => (
            <article key={s.slug} className="pl-card flex flex-col rounded-[16px] p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <Dithered src={customerPhoto(s.name)} alt={s.name} cell={1} focus={[0.5, 0.3]} develop={false} className="size-12 rounded-full" />
                <div>
                  <p className="text-[15px] font-semibold text-ink">{s.name}</p>
                  <p className="text-[15px] text-mute">
                    {s.role}, {s.company}
                  </p>
                </div>
              </div>
              <blockquote className="mt-5 text-[18px] leading-[1.5] text-ink">&ldquo;{s.quote}&rdquo;</blockquote>
              <div className="mt-5 grid gap-3 text-[15px] leading-[1.6] text-mute">
                {s.story.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              <p className="mt-auto flex items-baseline gap-2 pt-6">
                <span className="font-display text-[30px] font-semibold leading-none tracking-[-0.02em] text-accent">{s.result}</span>
                <span className="text-[15px] text-mute">{s.resultLabel}</span>
              </p>
            </article>
          ))}
        </div>
      </Band>
      <Cta />
    </>
  );
}
