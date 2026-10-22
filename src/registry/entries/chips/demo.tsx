"use client";

import { FileIcon, ImageIcon, SquaresFourIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { Chips } from "../../ui/chips";
import { hint } from "../_shared/kit";

/* Sections from the templates, and the tags each carries, to count what a filter leaves. */
const TAGS = [
  { value: "dark", label: "Dark" },
  { value: "animated", label: "Animated" },
  { value: "pricing", label: "Pricing" },
  { value: "stats", label: "Stats" },
  { value: "logos", label: "Logos" },
  { value: "faq", label: "FAQ" },
  { value: "form", label: "Form" },
  { value: "quotes", label: "Quotes" },
];
const SECTIONS: Array<{ name: string; tags: string[] }> = [
  { name: "Zuno pricing", tags: ["pricing", "dark", "animated"] },
  { name: "Zuno numbers", tags: ["stats", "dark", "animated"] },
  { name: "Zuno logos", tags: ["logos", "dark", "animated"] },
  { name: "Noma plans", tags: ["pricing"] },
  { name: "Noma questions", tags: ["faq"] },
  { name: "Noma contact", tags: ["form", "dark"] },
  { name: "Auren reviews", tags: ["quotes", "animated"] },
  { name: "Auren studio", tags: ["stats"] },
];

export function Demo() {
  const [on, setOn] = useState<string[]>(["dark"]);
  const left = SECTIONS.filter((t) => on.every((o) => t.tags.includes(o)));
  // Each chip counts what turning it on would leave; one that would leave nothing waits, unless it's on.
  const options = TAGS.map((t) => {
    const count = SECTIONS.filter((x) => x.tags.includes(t.value) && on.filter((o) => o !== t.value).every((o) => x.tags.includes(o))).length;
    return { ...t, count, disabled: count === 0 && !on.includes(t.value) };
  });
  return (
    <div className="grid w-full max-w-[440px] justify-items-center gap-4">
      <Chips label="Filter sections" value={on} onValueChange={setOn} options={options} max={5} className="justify-center" />
      <p className={`${hint} text-center`}>{left.length ? `${left.length} ${left.length === 1 ? "section" : "sections"}: ${left.map((t) => t.name).join(", ")}` : "No section has all of those. Take one off."}</p>
    </div>
  );
}

function Single() {
  return (
    <Chips
      label="Status"
      multiple={false}
      defaultValue={["live"]}
      options={[
        { value: "live", label: "Live", count: 8 },
        { value: "draft", label: "Draft", count: 3 },
        { value: "archived", label: "Archived", count: 12 },
      ]}
    />
  );
}

function Icons() {
  return (
    <Chips
      label="Show"
      size="sm"
      defaultValue={["pages"]}
      options={[
        { value: "pages", label: "Pages", icon: <FileIcon weight="duotone" /> },
        { value: "blocks", label: "Blocks", icon: <SquaresFourIcon weight="duotone" /> },
        { value: "images", label: "Images", icon: <ImageIcon weight="duotone" /> },
      ]}
    />
  );
}

export const examples: Record<string, ComponentType> = { single: Single, icons: Icons };
