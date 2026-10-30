"use client";

import { type ComponentType } from "react";
import { Carousel, CarouselSlide } from "../../ui/carousel";
import { Placeholder, type Layout } from "../_shared/placeholder";

/* Kinds of page, as gray boxes, for the carousels to show. */
const SHOTS: Array<{ slug: string; name: string; line: string; layout: Layout }> = [
  { slug: "landing", name: "Landing", line: "A product's home page", layout: "landing" },
  { slug: "dashboard", name: "Dashboard", line: "The numbers at a glance", layout: "dashboard" },
  { slug: "store", name: "Store", line: "A grid of products", layout: "shop" },
  { slug: "journal", name: "Journal", line: "Long reads, with pictures", layout: "article" },
];

/** A page on a white card, with its name and a line under it. */
function Shot({ s }: { s: (typeof SHOTS)[number] }) {
  return (
    <figure className="overflow-hidden rounded-[16px] bg-[var(--bd-surface)] shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]">
      <Placeholder layout={s.layout} ratio={16 / 10} className="w-full" />
      <figcaption className="flex items-baseline justify-between gap-3 px-3.5 py-2.5 text-[13px]">
        <span className="font-medium">{s.name}</span>
        <span className="truncate text-[12px] text-[var(--bd-subtle)]">{s.line}</span>
      </figcaption>
    </figure>
  );
}

export function Demo() {
  return (
    <Carousel label="Templates" gap={12} className="max-w-[520px]">
      {SHOTS.map((s) => (
        <CarouselSlide key={s.slug} label={s.name} className="w-[82%]">
          <Shot s={s} />
        </CarouselSlide>
      ))}
    </Carousel>
  );
}

function Dots() {
  return (
    <Carousel label="Templates" gap={12} className="max-w-[560px]">
      {SHOTS.map((s) => (
        <CarouselSlide key={s.slug} label={s.name} className="w-[82%]">
          <Shot s={s} />
        </CarouselSlide>
      ))}
    </Carousel>
  );
}

function Progress() {
  return (
    <Carousel label="Templates" indicator="progress" gap={12} className="max-w-[640px]">
      {[...SHOTS, ...SHOTS.slice(0, 3).map((s) => ({ ...s, slug: `${s.slug}-again` }))].map((s) => (
        <CarouselSlide key={s.slug} label={s.name} className="w-[240px]">
          <Shot s={s} />
        </CarouselSlide>
      ))}
    </Carousel>
  );
}

/* What people say, each as long as it is, so the slides come in different widths. */
const QUOTES = [
  { who: "Emily Carter, Larkspur", text: "We shipped our site in an afternoon." },
  { who: "Jake Morrison, Northbeam", text: "Studio let our designer change the copy on the real page, then hand us the code without a single meeting about it." },
  { who: "Sarah Mitchell, Parcelworks", text: "The sections fit together however we arrange them." },
  { who: "Ryan Brooks, Quanta", text: "Copy to Figma saved us a week of rebuilding the landing page by hand." },
];

function Widths() {
  return (
    <Carousel label="What people say" gap={12} className="max-w-[640px]">
      {QUOTES.map((q) => (
        <CarouselSlide key={q.who} label={q.who} className={q.text.length > 80 ? "w-[420px] max-w-[88%]" : "w-[260px] max-w-[70%]"}>
          <blockquote className="flex h-full flex-col justify-between gap-4 rounded-[16px] bg-[var(--bd-surface)] p-5 shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]">
            <p className="text-[15px] leading-snug">&ldquo;{q.text}&rdquo;</p>
            <footer className="text-[12px] text-[var(--bd-subtle)]">{q.who}</footer>
          </blockquote>
        </CarouselSlide>
      ))}
    </Carousel>
  );
}

function AutoPlay() {
  return (
    <Carousel label="Templates" loop autoPlay={3200} gap={12} className="max-w-[520px]">
      {SHOTS.map((s) => (
        <CarouselSlide key={s.slug} label={s.name} className="w-full">
          <Shot s={s} />
        </CarouselSlide>
      ))}
    </Carousel>
  );
}

export const examples: Record<string, ComponentType> = {
  dots: Dots,
  progress: Progress,
  widths: Widths,
  autoplay: AutoPlay,
};
