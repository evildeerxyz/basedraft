import type { Metadata } from "next";
import { DemoForm } from "@/components/home/cta";
import { Dithered } from "@/components/site/dither";
import { Band, Chip } from "@/components/site/ui";
import { STORIES } from "@/lib/customers";
import { customerPhoto } from "@/lib/photos";

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
    <Band inner="pb-24 pt-14 lg:pb-32 lg:pt-20">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          <h1 className="font-display text-[clamp(2.8rem,5.6vw,4.6rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-ink">Book a demo</h1>
          <p className="mt-5 max-w-[520px] text-[18px] leading-[1.55] text-mute">Tell us where to write, and how big your team is. We&apos;ll take it from there.</p>
          <div className="pl-card mt-8 rounded-[16px] p-5 sm:p-6">
            <DemoForm stacked />
          </div>
          <ol className="mt-10 grid gap-6">
            {NEXT.map((n, i) => (
              <li key={n.title} className="flex gap-4">
                <Chip className="shrink-0">0{i + 1}</Chip>
                <div>
                  <p className="text-[17px] font-semibold text-ink">{n.title}</p>
                  <p className="mt-1 text-[16px] leading-[1.55] text-mute">{n.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <figure className="pl-card self-start overflow-hidden rounded-[16px] lg:sticky lg:top-28">
          <Dithered src={customerPhoto(s.name)} alt={s.name} cell={3} focus={[0.5, 0.3]} className="aspect-[4/3]" />
          <div className="p-6 sm:p-8">
            <blockquote className="font-display text-[22px] font-semibold leading-[1.3] tracking-[-0.015em] text-ink">&ldquo;{s.quote}&rdquo;</blockquote>
            <figcaption className="mt-5 flex items-end justify-between gap-4">
              <span className="text-[15px] text-mute">
                {s.name}, {s.role} at {s.company}
              </span>
              <span className="shrink-0 whitespace-nowrap font-display text-[26px] font-semibold leading-none tracking-[-0.02em] text-accent">{s.result}</span>
            </figcaption>
          </div>
        </figure>
      </div>
    </Band>
  );
}
