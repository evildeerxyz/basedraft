"use client";

import { useState, type ComponentType } from "react";
import { DitherImage } from "../../ui/dither-image";
import { Segmented } from "../../ui/segmented";
import { hint } from "../_shared/kit";

const PEOPLE = {
  ava: { src: "/demo/people/ava-robinson.jpg", alt: "Ava Robinson, smiling" },
  priya: { src: "/demo/people/priya-raman.jpg", alt: "Megan Turner, in front of a purple wall" },
  sofia: { src: "/demo/people/sofia-lindqvist.jpg", alt: "Rachel Foster, in a floral shirt" },
};

const LOOKS = [
  { value: "ink", label: "Ink" },
  { value: "halftone", label: "Halftone" },
  { value: "color", label: "Color" },
];

export function Demo() {
  const [look, setLook] = useState("ink");
  return (
    <div className="grid justify-items-center gap-4">
      <div className="relative">
        {look === "ink" && <DitherImage key="ink" {...PEOPLE.priya} ratio={1} cell={3} className="w-[260px] rounded-[28px] text-[var(--bd-fg)]" />}
        {look === "halftone" && <DitherImage key="halftone" {...PEOPLE.priya} ratio={1} shape="round" cell={5} matrix={8} ink="var(--bd-ui-viz-1)" className="w-[260px] rounded-[28px]" />}
        {look === "color" && <DitherImage key="color" {...PEOPLE.priya} ratio={1} palette="color" levels={3} cell={3} className="w-[260px] rounded-[28px]" />}
      </div>
      <Segmented label="Look" size="sm" options={LOOKS} value={look} onValueChange={setLook} />
      <p className={hint}>Point at her to see the photo.</p>
    </div>
  );
}

function Inks() {
  return (
    <div className="grid w-full max-w-[480px] grid-cols-3 gap-3">
      <DitherImage {...PEOPLE.ava} ratio={1} cell={2} className="rounded-2xl" />
      <DitherImage {...PEOPLE.priya} ratio={1} cell={2} ink="var(--bd-ui-viz-1)" className="rounded-2xl" />
      <DitherImage {...PEOPLE.sofia} ratio={1} cell={2} ink="white" paper="oklch(19% 0.004 265)" className="rounded-2xl" />
    </div>
  );
}

function Halftone() {
  return <DitherImage {...PEOPLE.ava} ratio={1} shape="round" cell={5} matrix={8} className="w-64 rounded-3xl" />;
}

function Colors() {
  return (
    <div className="grid w-full max-w-[480px] grid-cols-3 gap-3">
      {[2, 3, 5].map((n) => (
        <figure key={n} className="grid gap-2">
          <DitherImage {...PEOPLE.priya} ratio={1} cell={2} palette="color" levels={n} className="rounded-2xl" />
          <figcaption className={`${hint} text-center`}>levels={n}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function Matrices() {
  return (
    <div className="grid w-full max-w-[480px] grid-cols-3 gap-3">
      {([2, 4, 8] as const).map((m) => (
        <figure key={m} className="grid gap-2">
          <DitherImage {...PEOPLE.ava} ratio={1} cell={2} matrix={m} className="rounded-2xl" />
          <figcaption className={`${hint} text-center`}>matrix={m}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export const examples: Record<string, ComponentType> = { inks: Inks, halftone: Halftone, color: Colors, matrix: Matrices };
