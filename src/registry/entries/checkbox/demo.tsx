"use client";

import { useState, type ComponentType } from "react";
import { Checkbox, CheckboxRow } from "../../ui/checkbox";

/* What goes in the download, a box each, with one over them all that's half on while only some are. */
const PARTS = [
  { id: "next", label: "Next.js project" },
  { id: "astro", label: "Astro project" },
  { id: "figma", label: "Figma file" },
];

export function Demo() {
  const [on, setOn] = useState<string[]>(["next", "figma"]);
  const all = on.length === PARTS.length;
  return (
    <div className="w-full max-w-[320px] rounded-[20px] bg-[var(--bd-surface)] p-1.5 shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]">
      <CheckboxRow label="Everything in the download" checked={all ? true : on.length ? "indeterminate" : false} onCheckedChange={(c) => setOn(c ? PARTS.map((p) => p.id) : [])} />
      <div className="mx-3 my-0.5 h-px bg-[var(--bd-line-subtle)]" />
      {PARTS.map((p) => (
        <CheckboxRow key={p.id} label={p.label} checked={on.includes(p.id)} onCheckedChange={(c) => setOn((o) => (c ? [...o, p.id] : o.filter((x) => x !== p.id)))} className="py-2 pl-7" />
      ))}
    </div>
  );
}

function Basic() {
  return (
    <label className="flex items-center gap-2.5 text-sm text-[var(--bd-fg)]">
      <Checkbox defaultChecked />
      Remember this device
    </label>
  );
}

function Row() {
  return <CheckboxRow defaultChecked label="Send a summary each week" description="A short email every Monday with what changed in your drafts." className="max-w-[340px]" />;
}

function HalfOn() {
  const [on, setOn] = useState(["next"]);
  const parts = ["next", "astro"];
  return (
    <div className="grid max-w-[300px]">
      <CheckboxRow label="Both frameworks" checked={on.length === parts.length ? true : on.length ? "indeterminate" : false} onCheckedChange={(c) => setOn(c ? parts : [])} />
      {parts.map((p) => (
        <CheckboxRow key={p} label={p === "next" ? "Next.js" : "Astro"} checked={on.includes(p)} onCheckedChange={(c) => setOn((o) => (c ? [...o, p] : o.filter((x) => x !== p)))} className="pl-7" />
      ))}
    </div>
  );
}

function Sizes() {
  return (
    <div className="flex items-center gap-6 text-sm text-[var(--bd-fg)]">
      <label className="flex items-center gap-2">
        <Checkbox size="sm" defaultChecked />
        Small
      </label>
      <label className="flex items-center gap-2.5">
        <Checkbox defaultChecked />
        Medium
      </label>
    </div>
  );
}

function Disabled() {
  return (
    <div className="grid max-w-[340px]">
      <CheckboxRow defaultChecked disabled label="Personal projects" description="Every license covers them." />
      <CheckboxRow disabled label="Client projects" description="Comes with a Team license." />
    </div>
  );
}

export const examples: Record<string, ComponentType> = { basic: Basic, row: Row, "half-on": HalfOn, sizes: Sizes, disabled: Disabled };
