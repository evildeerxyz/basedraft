"use client";

import { useState, type ComponentType } from "react";
import { Runway } from "../../pro-ui/runway";

/* Thirty days of credits for a storefront: a $100 top-up on the ninth, then a launch that spent faster. */
const SPEND = [7.2, 8.1, 9.4, 6.3, 4.1, 3.8, 8.8, 9.9, 10.6, 9.2, 7.7, 4.6, 4.2, 9.6, 15.8, 17.9, 13.1, 11.4, 6.2, 5.1, 10.2, 11.6, 12.4, 10.9, 9.8, 5.4, 4.9, 10.8, 12.1, 10.6];
const HISTORY = SPEND.reduceRight<number[]>((acc, _, i) => (i === SPEND.length - 1 ? [184.2] : [Math.round((acc[0] + SPEND[i + 1] - (i + 1 === 8 ? 100 : 0)) * 100) / 100, ...acc]), []);

export function Demo() {
  const [auto, setAuto] = useState(false);
  return (
    <div className="grid w-full max-w-[640px] gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-[22px] font-semibold tracking-[-0.02em]">
          $184.20 <span className="text-[var(--bd-subtle)]">{auto ? "tops itself up." : "lasts until about Dec 1."}</span>
        </p>
        <button type="button" onClick={() => setAuto((a) => !a)} className="rounded-full px-3 py-1.5 text-[12.5px] font-medium text-[var(--bd-muted)] shadow-[inset_0_0_0_1px_var(--bd-line-strong)] hover:text-[var(--bd-fg)]">
          {auto ? "Turn auto top-up off" : "Top up $100 under $20"}
        </button>
      </div>
      <Runway label="Credits" history={HISTORY} start="2026-10-14" burn={9.6} autoReload={auto ? { amount: 100, below: 20 } : null} events={[{ date: "2026-10-22", label: "+$100" }]} marks={[{ date: "2026-12-01", label: "Next bill" }]} />
    </div>
  );
}

function Auto() {
  return (
    <div className="w-full max-w-[560px]">
      <Runway label="Credits" history={HISTORY} start="2026-10-14" burn={9.6} autoReload={{ amount: 100, below: 20 }} height={180} />
    </div>
  );
}

export const examples: Record<string, ComponentType> = { auto: Auto };
