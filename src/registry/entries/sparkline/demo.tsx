"use client";

import type { ComponentType } from "react";
import { Sparkline } from "../../ui/sparkline";

/* A month of sales for each template, a value a day. */
const ZUNO = [24, 27, 28, 29, 30, 31, 33, 33, 33, 33, 36, 40, 44, 47, 49, 51, 54, 57, 58, 58, 58, 58, 60, 64, 67, 70, 72, 76, 80, 83];
const NOMA = [33, 32, 31, 32, 32, 31, 31, 31, 33, 36, 37, 37, 38, 39, 39, 38, 37, 37, 39, 40, 41, 42, 44, 46, 46, 45, 44, 44, 45, 46];
const AUREN = [43, 42, 41, 40, 39, 38, 36, 36, 37, 38, 39, 39, 38, 37, 36, 36, 35, 32, 30, 29, 29, 30, 30, 30, 30, 29, 30, 30, 29, 27];

const ROWS = [
  { name: "Zuno", data: ZUNO, total: 1284, change: 0.12 },
  { name: "Noma", data: NOMA, total: 906, change: 0.04 },
  { name: "Auren", data: AUREN, total: 512, change: -0.03 },
];

export function Demo() {
  return (
    <div className="w-full max-w-[420px] rounded-[20px] bg-[var(--bd-surface)] p-2 shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]">
      <p className="px-3 pb-1 pt-2 text-xs font-medium text-[var(--bd-muted)]">Sales, last 30 days</p>
      {ROWS.map((r) => (
        <div key={r.name} className="grid grid-cols-[72px_minmax(0,1fr)_64px_52px] items-center gap-3 rounded-[12px] px-3 py-2.5 hover:bg-[rgb(var(--bd-ink)/0.03)]">
          <span className="text-sm font-medium text-[var(--bd-fg)]">{r.name}</span>
          <Sparkline data={r.data} height={28} label={`${r.name} sales, last 30 days`} color={r.change < 0 ? "var(--bd-ui-viz-5)" : "var(--bd-ui-viz-1)"} />
          <span className="text-right text-sm tabular-nums text-[var(--bd-fg)]">{r.total.toLocaleString("en-US")}</span>
          <span className={`text-right text-xs tabular-nums ${r.change < 0 ? "text-[var(--bd-ui-stop)]" : "text-[var(--bd-ui-ok)]"}`}>
            {r.change < 0 ? "−" : "+"}
            {Math.abs(r.change * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function Dither() {
  return (
    <div className="grid w-full max-w-[360px] gap-6">
      <Sparkline data={ZUNO} height={56} dither label="Zuno sales, last 30 days" />
      <Sparkline data={NOMA} height={56} label="Noma sales, last 30 days" />
    </div>
  );
}

function Live() {
  return (
    <p className="max-w-[360px] text-sm leading-7 text-[var(--bd-muted)]">
      Visitors right now
      <span className="mx-2 inline-block w-24 align-middle">
        <Sparkline data={[12, 14, 13, 17, 16, 19, 22, 21, 24]} height={20} live label="Visitors, last ten minutes" />
      </span>
      <span className="font-medium tabular-nums text-[var(--bd-fg)]">24</span>
    </p>
  );
}

export const examples: Record<string, ComponentType> = { dither: Dither, live: Live };
