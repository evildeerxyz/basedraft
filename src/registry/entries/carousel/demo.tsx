"use client";

import { type ComponentType } from "react";
import { Carousel, CarouselSlide } from "../../ui/carousel";

/* The released templates, as their home pages look, for the carousels to show. */
const TEMPLATES = [
  { slug: "zuno", name: "Zuno", line: "Fintech, on a pure black page" },
  { slug: "noma", name: "Noma", line: "AI and data, like a printed engraving" },
  { slug: "auren", name: "Auren", line: "A code editor, in ink and amber" },
];
const SHOTS = [...TEMPLATES.map((t) => ({ ...t, src: `/shots/${t.slug}.jpg` })), { slug: "studio", name: "Studio", line: "Make any of them yours", src: "/shots/studio-stage.jpg" }];

/** A template's shot on a white card, with its name and a line under it. */
function Shot({ s }: { s: (typeof SHOTS)[number] }) {
  return (
    <figure className="overflow-hidden rounded-[16px] bg-[var(--bd-surface)] shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={s.src} alt="" draggable={false} className="aspect-[16/10] w-full object-cover object-top" />
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
  { who: "Maya Okafor, Fieldwork", text: "We shipped our site in an afternoon." },
  { who: "Jonah Park, Northbeam", text: "Studio let our designer change the copy on the real page, then hand us the code without a single meeting about it." },
  { who: "Lea Moreau, Parcelworks", text: "The sections fit together however we arrange them." },
  { who: "Sami Ito, Quanta", text: "Copy to Figma saved us a week of rebuilding the landing page by hand." },
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
