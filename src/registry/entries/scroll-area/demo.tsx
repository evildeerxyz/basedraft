"use client";

import { useState, type ComponentType } from "react";
import { ScrollArea } from "../../ui/scroll-area";
import { Segmented } from "../../ui/segmented";
import { Placeholder, type Layout } from "../_shared/placeholder";

/* What's changed lately, a few lines each. */
const NOTES = [
  { date: "Oct 23", title: "Shared inboxes", body: "Give a team one inbox, with who's on what shown beside each thread." },
  { date: "Oct 22", title: "Faster search", body: "Results show as you type, and a search remembers the filters you used last." },
  { date: "Oct 21", title: "Charts in reports", body: "Every report can carry a chart: lines, bars or a donut, picked from a menu." },
  { date: "Oct 20", title: "A new home for your data", body: "Accounts and billing moved to a new database. Nothing changes for you." },
  { date: "Oct 18", title: "On your phone", body: "Reply, assign and close threads from a phone, with the layout fitted to its width." },
  { date: "Oct 15", title: "Saved views", body: "Keep a filtered list as a view, and share it with a link." },
  { date: "Oct 12", title: "Dark mode", body: "Every screen in dark, following your system or set by hand." },
];

export function Demo() {
  const [fade, setFade] = useState<"dither" | "gradient" | "none">("dither");
  return (
    <div className="grid w-full max-w-[400px] gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[var(--bd-fg)]">What&apos;s new</p>
        <Segmented
          label="Edges"
          size="sm"
          value={fade}
          onValueChange={(v) => setFade(v as typeof fade)}
          options={[
            { value: "dither", label: "Dither" },
            { value: "gradient", label: "Gradient" },
            { value: "none", label: "None" },
          ]}
        />
      </div>
      <div className="rounded-[20px] bg-[var(--bd-surface)] shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]">
        <ScrollArea fade={fade} label="What's new" className="h-[300px]" viewportClassName="px-5 py-2">
          {NOTES.map((n) => (
            <article key={n.date} className="border-b border-[var(--bd-line-subtle)] py-3.5 last:border-0">
              <p className="text-xs tabular-nums text-[var(--bd-subtle)]">{n.date}</p>
              <p className="mt-1 text-sm font-medium text-[var(--bd-fg)]">{n.title}</p>
              <p className="mt-1 text-[13px] leading-[1.55] text-[var(--bd-muted)]">{n.body}</p>
            </article>
          ))}
        </ScrollArea>
      </div>
    </div>
  );
}

const SHOTS: Array<{ name: string; layout: Layout }> = [
  { name: "Landing", layout: "landing" },
  { name: "Dashboard", layout: "dashboard" },
  { name: "Store", layout: "shop" },
  { name: "Journal", layout: "article" },
  { name: "Board", layout: "board" },
];

function Sideways() {
  return (
    <ScrollArea orientation="horizontal" label="Templates" className="w-full max-w-[460px]" viewportClassName="pb-4">
      <div className="flex gap-3">
        {SHOTS.map((s) => (
          <figure key={s.name} className="w-[180px] shrink-0">
            <Placeholder layout={s.layout} ratio={16 / 10} className="w-full rounded-[12px]" />
            <figcaption className="mt-2 text-[13px] font-medium text-[var(--bd-fg)]">{s.name}</figcaption>
          </figure>
        ))}
      </div>
    </ScrollArea>
  );
}

function Grow() {
  return (
    <div className="w-full max-w-[320px] rounded-[18px] bg-[var(--bd-surface)] p-1.5 shadow-[inset_0_0_0_1px_var(--bd-line)]">
      <ScrollArea maxHeight={180} fade="gradient" label="Countries">
        {["United States", "Germany", "United Kingdom", "Australia", "India", "Japan", "Brazil", "France", "Canada", "Kenya"].map((c) => (
          <p key={c} className="rounded-[10px] px-3 py-2 text-[13.5px] text-[var(--bd-fg)] hover:bg-[rgb(var(--bd-ink)/0.04)]">
            {c}
          </p>
        ))}
      </ScrollArea>
    </div>
  );
}

export const examples: Record<string, ComponentType> = { sideways: Sideways, grow: Grow };
