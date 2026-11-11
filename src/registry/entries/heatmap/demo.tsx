"use client";

import { useState, type ComponentType } from "react";
import { Heatmap, type HeatmapDay } from "../../ui/heatmap";
import { hint } from "../_shared/kit";

/* The demos' last day: fixed, so the page is the same for everyone and builds without a clock. */
const END = "2026-10-17";
const DAY = 86_400_000;

/** A seeded run of numbers, so the made-up year comes out the same every time. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A year of days: busy weekdays, quiet weekends, a holiday in August, and a launch week that ran hot. */
function year(seed: number, scale = 1): HeatmapDay[] {
  const rnd = seeded(seed);
  const end = Date.parse(`${END}T00:00:00Z`);
  const out: HeatmapDay[] = [];
  for (let i = 364; i >= 0; i--) {
    const t = end - i * DAY;
    const d = new Date(t);
    const dow = d.getUTCDay();
    const holiday = d.getUTCMonth() === 7 && d.getUTCDate() >= 4 && d.getUTCDate() <= 15;
    const launch = d.getUTCMonth() === 2 && d.getUTCDate() >= 9 && d.getUTCDate() <= 13;
    if (holiday) continue;
    const base = dow === 0 || dow === 6 ? 0.6 : 4.2;
    const value = Math.round((rnd() < (dow === 0 || dow === 6 ? 0.55 : 0.12) ? 0 : base * (0.3 + rnd() * 1.5) + (launch ? 9 : 0)) * scale);
    if (value > 0) out.push({ date: d.toISOString().slice(0, 10), value });
  }
  return out;
}

const DEPLOYS = year(7);
const SHORT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const POSTS = year(19, 0.6);
const SALES = year(31, 3);

export function Demo() {
  const [picked, setPicked] = useState<HeatmapDay | null>(null);
  const total = DEPLOYS.reduce((s, d) => s + d.value, 0);
  return (
    <div className="grid w-full max-w-[820px] gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm font-medium text-[var(--bd-fg)]">
          <span className="tabular-nums">{total.toLocaleString("en-US")}</span> deploys to zuno.site
        </p>
        <p className={`${hint} tabular-nums`}>{picked ? `${picked.value} on ${SHORT.format(Date.parse(`${picked.date}T00:00:00Z`))}` : "Point at a day, or click one"}</p>
      </div>
      <Heatmap label="Deploys to zuno.site" data={DEPLOYS} format={(n) => `${n} ${n === 1 ? "deploy" : "deploys"}`} onSelect={setPicked} />
    </div>
  );
}

function Year() {
  return (
    <div className="w-full max-w-[820px]">
      <Heatmap label="Deploys to zuno.site" data={DEPLOYS} format={(n) => `${n} deploys`} />
    </div>
  );
}

function Solid() {
  return (
    <div className="w-full max-w-[820px]">
      <Heatmap label="Posts" data={POSTS} pattern="solid" color="var(--bd-ui-viz-2)" weekStart={1} format={(n) => `${n} ${n === 1 ? "post" : "posts"}`} />
    </div>
  );
}

function Quarter() {
  return (
    <div className="w-fit">
      <Heatmap label="Sales by day" data={SALES} weeks={13} thresholds={[1, 5, 10, 20]} format={(n) => `${n} ${n === 1 ? "sale" : "sales"}`} />
    </div>
  );
}

export const examples: Record<string, ComponentType> = { year: Year, solid: Solid, quarter: Quarter };
