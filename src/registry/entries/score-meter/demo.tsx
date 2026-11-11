"use client";

import { useState, type ComponentType } from "react";
import { ScoreMeter } from "../../ui/score-meter";

/* Four accounts by how well they fit, as a sales team would scan them. */
const ACCOUNTS = [
  { name: "Northwind Freight", note: "Logistics · 1,200 people", fit: 91 },
  { name: "Harbor & Pine", note: "Retail · 340 people", fit: 74 },
  { name: "Cobalt Health", note: "Healthcare · 2,800 people", fit: 56 },
  { name: "Greyline Studio", note: "Agency · 18 people", fit: 22 },
];

export function Demo() {
  const [boost, setBoost] = useState(false);
  return (
    <div className="grid w-full max-w-[460px] gap-4">
      <ul className="grid rounded-[20px] bg-[var(--bd-surface)] p-1.5 shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.07),0_1px_2px_rgb(var(--bd-shade)/0.04)]">
        {ACCOUNTS.map((a) => (
          <li key={a.name} className="flex items-center gap-3 rounded-[14px] px-3 py-2.5 hover:bg-[rgb(var(--bd-ink)/0.03)]">
            <span className="grid size-8 shrink-0 place-items-center rounded-[9px] text-[13px] font-semibold text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14)]">
              {a.name[0]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-medium">{a.name}</span>
              <span className="block truncate text-[12.5px] text-[var(--bd-muted)]">{a.note}</span>
            </span>
            <ScoreMeter label={`${a.name} fit`} value={boost ? Math.min(100, a.fit + 14) : a.fit} />
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setBoost((b) => !b)} className="justify-self-start rounded-full px-3 py-1.5 text-[12.5px] font-medium text-[var(--bd-muted)] shadow-[inset_0_0_0_1px_var(--bd-line-strong)] hover:text-[var(--bd-fg)]">
        {boost ? "Undo the new signals" : "They all visited pricing this week"}
      </button>
    </div>
  );
}

function Bands() {
  return (
    <div className="grid gap-3">
      <ScoreMeter value={24} show="word" />
      <ScoreMeter value={58} show="word" />
      <ScoreMeter value={86} show="word" />
    </div>
  );
}

function Sizes() {
  return (
    <div className="grid gap-4">
      <ScoreMeter size="sm" value={72} />
      <ScoreMeter size="md" value={72} />
      <ScoreMeter size="lg" value={72} show="word" />
    </div>
  );
}

export const examples: Record<string, ComponentType> = { bands: Bands, sizes: Sizes };
