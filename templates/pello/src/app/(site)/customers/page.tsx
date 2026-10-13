import type { Metadata } from "next";
import { Cta } from "@/components/home/cta";
import { Logos } from "@/components/home/logos";
import { PageHead } from "@/components/site/page";
import { Container } from "@/components/site/ui";
import { STORIES } from "@/lib/customers";

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
          <article className="grid gap-10 rounded-[32px] bg-night p-8 text-night-ink sm:p-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16 lg:p-16">
            <div>
              <p className="text-[17px] text-night-mute">
                {first.company} · {first.what} · {first.size.toLocaleString("en-US")} people
              </p>
              <p className="mt-10 text-[clamp(4rem,8vw,7rem)] font-semibold leading-[0.9] tracking-[-0.06em]">{first.result}</p>
              <p className="mt-3 text-[19px] text-night-mute">{first.resultLabel}</p>
            </div>
            <div>
              <blockquote className="text-[clamp(1.5rem,2.4vw,2rem)] font-medium leading-[1.3] tracking-[-0.025em]">{first.quote}</blockquote>
              <p className="mt-6 text-[17px] text-night-mute">
                {first.name}, {first.role}
              </p>
              <div className="mt-10 grid gap-4 text-[17px] leading-[1.6] text-night-mute">
                {first.story.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </div>
          </article>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {rest.map((s) => (
              <article key={s.slug} className="flex flex-col rounded-[28px] border border-line bg-surface p-8 sm:p-10">
                <p className="text-[16px] text-mute">
                  {s.company} · {s.what} · {s.size.toLocaleString("en-US")} people
                </p>
                <p className="mt-8 text-[56px] font-semibold leading-none tracking-[-0.055em] text-accent">{s.result}</p>
                <p className="mt-2 text-[17px] text-mute">{s.resultLabel}</p>
                <blockquote className="mt-8 text-[21px] leading-[1.45] tracking-[-0.015em] text-ink">{s.quote}</blockquote>
                <p className="mt-4 text-[16px] text-mute">
                  {s.name}, {s.role}
                </p>
                <div className="mt-8 grid gap-3 text-[17px] leading-[1.6] text-ink-2">
                  {s.story.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
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
