"use client";

import type { ComponentType } from "react";
import { Lightbox, type LightboxImage } from "../../ui/lightbox";
import { hint } from "../_shared/kit";
import { placeholderSrc } from "../_shared/placeholder";

const WORK: LightboxImage[] = [
  { src: placeholderSrc("landing", 4 / 3), alt: "The home page", caption: "The home page." },
  { src: placeholderSrc("photo", 4 / 3), alt: "A photo for the header", caption: "A photo for the header." },
  { src: placeholderSrc("article", 4 / 3), alt: "An article", caption: "An article, with a picture." },
  { src: placeholderSrc("dashboard", 4 / 3), alt: "The dashboard", caption: "The dashboard, with the sidebar open." },
  { src: placeholderSrc("shop", 4 / 3), alt: "The store", caption: "The store, in a grid." },
];

export function Demo() {
  return (
    <div className="grid w-full max-w-[560px] gap-3">
      {/* A large one down the left, four small beside it: two even rows. */}
      <Lightbox images={WORK} className="grid grid-cols-4 grid-rows-2 gap-2.5 [&>*:first-child]:col-span-2 [&>*:first-child]:row-span-2 [&>*:first-child]:aspect-auto" thumbClassName="aspect-[4/3] rounded-[14px] shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08)]" />
      <p className={`${hint} text-center`}>Open one, then use the arrows, a swipe, or ← and →.</p>
    </div>
  );
}

const PEOPLE: LightboxImage[] = [
  { src: "/demo/people/ava-robinson.jpg", alt: "Ava Robinson", caption: "Ava Robinson, designer" },
  { src: "/demo/people/priya-raman.jpg", alt: "Megan Turner", caption: "Megan Turner, engineer" },
  { src: "/demo/people/sofia-lindqvist.jpg", alt: "Rachel Foster", caption: "Rachel Foster, writer" },
];

function Team() {
  return <Lightbox images={PEOPLE} className="flex gap-3" thumbClassName="size-24 rounded-full" />;
}

export const examples: Record<string, ComponentType> = { team: Team };
