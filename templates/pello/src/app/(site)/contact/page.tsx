import type { Metadata } from "next";
import { DemoForm } from "@/components/home/cta";
import { Dithered } from "@/components/site/dither";
import { Band } from "@/components/site/ui";
import { STORIES } from "@/lib/customers";
import { customerPhoto } from "@/lib/photos";

export const metadata: Metadata = {
  title: "Book a demo",
  description: "A 30 minute call, set up on a handbook like yours. Then 30 days free, with your own team.",
};

const NEXT = [
  { when: "Today", title: "We write back today", body: "Someone from our team suggests a time that works for you." },
  { when: "This week", title: "A demo on a handbook like yours", body: "Send us your handbook, or we'll use one from a company your size. You'll see pello answer your own questions." },
  { when: "30 days", title: "30 days with your team", body: "Free, with your own data, and we do the import with you." },
];

export default function ContactPage() {
  const s = STORIES[1];
  return (
    <Band inner="pb-24 pt-14 lg:pb-32 lg:pt-20">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          <h1 className="text-[clamp(2.8rem,5.8vw,4.8rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-ink">Book a demo.</h1>
          <p className="mt-6 max-w-[520px] text-[19px] leading-[1.5] text-mute">Tell us where to write, and how big your team is. We&apos;ll take it from there.</p>
          <DemoForm stacked className="mt-10 max-w-[560px]" />
          <ol className="mt-14 border-t border-ink">
            {NEXT.map((n) => (
              <li key={n.title} className="grid gap-1 border-b border-line py-5 sm:grid-cols-[110px_minmax(0,1fr)] sm:gap-6">
                <span className="tabular font-mono text-[15px] text-accent">{n.when}</span>
                <div>
                  <p className="text-[17px] font-semibold tracking-[-0.02em] text-ink">{n.title}</p>
                  <p className="mt-1 text-[16px] leading-[1.55] text-mute">{n.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <figure className="self-start lg:sticky lg:top-28">
          <Dithered src={customerPhoto(s.name)} alt={s.name} cell={3} focus={[0.5, 0.3]} className="aspect-[4/3] w-full rounded-[14px]" />
          <div className="pt-6">
            <blockquote className="text-[24px] font-medium leading-[1.3] tracking-[-0.03em] text-ink">&ldquo;{s.quote}&rdquo;</blockquote>
            <figcaption className="mt-5 flex items-end justify-between gap-4">
              <span className="text-[15px] text-mute">
                {s.name}, {s.role} at {s.company}
              </span>
              <span className="tabular shrink-0 whitespace-nowrap font-mono text-[28px] font-medium leading-none tracking-[-0.05em] text-ink">{s.result}</span>
            </figcaption>
          </div>
        </figure>
      </div>
    </Band>
  );
}
