import type { Metadata } from "next";
import { Cta } from "@/components/home/cta";
import { Logos } from "@/components/home/logos";
import { Dithered } from "@/components/site/dither";
import { PageHead } from "@/components/site/page";
import { Container } from "@/components/site/ui";
import { STORIES } from "@/lib/customers";
import { customerPhoto } from "@/lib/photos";

export const metadata: Metadata = {
  title: "Customers",
  description: "How Halden, Brightwater, Kestrel and 1,200 other people teams use pello, in their own words.",
};

export default function CustomersPage() {
  const [first, ...rest] = STORIES;
  return (
    <>
      <PageHead title="1,200 people teams, and what they stopped doing." lead="Six of them, in their own words: what took up their week before pello, and what does now." />
      <Logos />
      <section className="py-20 lg:py-28">
        <Container>
          <article className="grid overflow-hidden rounded-[4px] bg-ink text-page lg:grid-cols-[0.9fr_1.1fr]">
            <Dithered src={customerPhoto(first.name)} alt={first.name} inks={["accent", "ink"]} cell={3} focus={[0.5, 0.3]} className="min-h-[420px] bg-ink" />
            <div className="p-8 sm:p-12 lg:p-14">
              <p className="text-[17px] text-night-mute">
                {first.company} · {first.what} · <span className="tabular font-mono">{first.size.toLocaleString("en-US")}</span> people
              </p>
              <p className="mt-8 font-display text-[clamp(4.6rem,9vw,8rem)] font-extrabold leading-[0.82] text-accent">{first.result}</p>
              <p className="mt-3 text-[19px] text-night-mute">{first.resultLabel}</p>
              <blockquote className="mt-10 font-display text-[clamp(1.8rem,2.8vw,2.5rem)] font-bold leading-[1.1]">{first.quote}</blockquote>
              <p className="mt-6 text-[17px] text-night-mute">
                {first.name}, {first.role}
              </p>
              <div className="mt-8 grid gap-4 text-[18px] leading-[1.6] text-night-mute">
                {first.story.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </div>
          </article>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {rest.map((s) => (
              <article key={s.slug} className="grid overflow-hidden rounded-[4px] bg-surface sm:grid-cols-[200px_1fr]">
                <Dithered src={customerPhoto(s.name)} alt={s.name} cell={2} focus={[0.5, 0.3]} className="aspect-[4/3] sm:aspect-auto sm:h-full" />
                <div className="flex flex-col p-7 sm:p-8">
                  <p className="text-[16px] text-mute">
                    {s.company} · {s.what}
                  </p>
                  <p className="mt-5 font-display text-[64px] font-extrabold leading-[0.85] text-accent">{s.result}</p>
                  <p className="mt-2 text-[17px] text-mute">{s.resultLabel}</p>
                  <blockquote className="mt-6 text-[20px] leading-[1.45] text-ink">{s.quote}</blockquote>
                  <p className="mt-4 text-[16px] text-mute">
                    {s.name}, {s.role}
                  </p>
                  <div className="mt-6 grid gap-3 text-[17px] leading-[1.6] text-ink-2">
                    {s.story.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>
      <Cta />
    </>
  );
}
