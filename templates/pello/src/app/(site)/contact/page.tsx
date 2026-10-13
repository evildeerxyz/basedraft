import type { Metadata } from "next";
import { DemoForm } from "@/components/home/cta";
import { Container } from "@/components/site/ui";
import { STORIES } from "@/lib/customers";

export const metadata: Metadata = {
  title: "Book a demo",
  description: "A 30 minute call, set up on a handbook like yours. Then 30 days free, with your own team.",
};

const NEXT = [
  { title: "We write back today", body: "Someone from our team suggests a time that works for you." },
  { title: "A demo on a handbook like yours", body: "Send us your handbook, or we'll use one from a company your size. You'll see pello answer your own questions." },
  { title: "30 days with your team", body: "Free, with your own data, and we do the import with you." },
];

export default function ContactPage() {
  const s = STORIES[1];
  return (
    <section className="pb-28 pt-14 lg:pb-36 lg:pt-20">
      <Container className="grid gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
        <div>
          <h1 className="text-[clamp(3rem,7vw,6rem)] font-semibold leading-[0.94] tracking-[-0.055em] text-ink">Book a demo.</h1>
          <p className="mt-8 max-w-[560px] text-[clamp(1.18rem,1.6vw,1.32rem)] leading-[1.5] text-ink-2">Tell us where to write, and how big your team is. We&apos;ll take it from there.</p>
          <DemoForm stacked className="mt-10 max-w-[620px]" />
          <ol className="mt-16 grid gap-8">
            {NEXT.map((n, i) => (
              <li key={n.title} className="flex gap-5">
                <span className="tabular grid size-10 shrink-0 place-items-center rounded-full bg-ink font-mono text-[15px] text-page">{i + 1}</span>
                <div>
                  <p className="text-[21px] font-semibold tracking-[-0.02em] text-ink">{n.title}</p>
                  <p className="mt-1 text-[17px] leading-[1.55] text-ink-2">{n.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <figure className="self-start rounded-[32px] bg-night p-8 text-night-ink sm:p-10 lg:sticky lg:top-24">
          <p className="text-[64px] font-semibold leading-none tracking-[-0.055em]">{s.result}</p>
          <p className="mt-2 text-[17px] text-night-mute">{s.resultLabel}</p>
          <blockquote className="mt-10 text-[24px] font-medium leading-[1.4] tracking-[-0.02em]">{s.quote}</blockquote>
          <figcaption className="mt-6 text-[17px] text-night-mute">
            {s.name}, {s.role} at {s.company}
          </figcaption>
        </figure>
      </Container>
    </section>
  );
}
