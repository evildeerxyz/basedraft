"use client";

import { AtomIcon, BookOpenTextIcon, CompassIcon, PackageIcon, SquaresFourIcon, SunHorizonIcon, type Icon } from "@phosphor-icons/react";
import type { ComponentType } from "react";
import { Marquee } from "../../ui/marquee";

/*
 * The teams in Noma's own story, drifting under its hero: Northbeam, Ledgerly and the rest, in
 * the quiet gray, with a few of their words passing below.
 */

const LOGOS: Array<{ name: string; icon: Icon }> = [
  { name: "Northbeam", icon: CompassIcon },
  { name: "Ledgerly", icon: BookOpenTextIcon },
  { name: "Parcelworks", icon: PackageIcon },
  { name: "Quanta", icon: AtomIcon },
  { name: "Helio", icon: SunHorizonIcon },
  { name: "Mosaic", icon: SquaresFourIcon },
];

const QUOTES = [
  { text: "Our analysts stopped filing SQL tickets in the first week.", name: "Priya Raman", team: "Ledgerly" },
  { text: "Read only by default is what won our security team over.", name: "Marcus Hale", team: "Parcelworks" },
  { text: "Every write waits for a person. That's the whole reason we said yes.", name: "Sofia Lindqvist", team: "Northbeam" },
  { text: "We retired three dashboards and nobody asked for them back.", name: "Tomás Ortega", team: "Quanta" },
];

const logos = LOGOS.map(({ name, icon: I }) => (
  <span key={name} className="flex items-center gap-2 text-[17px] font-semibold tracking-tight text-[var(--bd-muted)]">
    <I weight="duotone" className="size-5" /> {name}
  </span>
));

export function Demo() {
  return (
    <div className="grid w-full max-w-[560px] gap-3 py-2">
      <p className="text-center text-xs text-[var(--bd-subtle)]">Teams that build on Noma</p>
      <Marquee label="Teams that build on Noma" className="w-full">
        {logos}
      </Marquee>
    </div>
  );
}

export const examples: Record<string, ComponentType> = {
  logos: () => (
    <Marquee label="Teams that build on Noma" className="w-full max-w-[560px]">
      {logos}
    </Marquee>
  ),
  quotes: () => (
    <Marquee label="What teams say" speed={26} gap={14} className="w-full max-w-[640px]">
      {QUOTES.map((q) => (
        <figure key={q.name} className="w-[250px] rounded-[16px] bg-[var(--bd-surface)] p-4 shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.07)]">
          <blockquote className="text-sm leading-snug text-[var(--bd-fg)]">{q.text}</blockquote>
          <figcaption className="mt-3 text-xs text-[var(--bd-muted)]">
            {q.name}, {q.team}
          </figcaption>
        </figure>
      ))}
    </Marquee>
  ),
  rows: () => (
    <div className="grid w-full max-w-[560px] gap-4">
      <Marquee label="Teams that build on Noma">{logos}</Marquee>
      <Marquee reverse speed={52} aria-hidden>
        {logos}
      </Marquee>
    </div>
  ),
  "hard-edge": () => (
    <Marquee label="What's inside" fade={0} speed={60} gap={28} className="w-full max-w-[560px] rounded-full px-1 py-2.5 text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]">
      {["Next.js", "Astro", "Figma", "Studio", "GitHub", "Dark mode"].map((w) => (
        <span key={w} className="text-sm font-medium">
          {w}
        </span>
      ))}
    </Marquee>
  ),
};
