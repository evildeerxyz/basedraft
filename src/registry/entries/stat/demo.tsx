"use client";

import { CheckerboardIcon, CurrencyDollarIcon, DotsNineIcon, EyeIcon, GradientIcon, LineSegmentsIcon, ProhibitIcon, ReceiptXIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { Stat, type ChartPattern } from "../../ui/stat";
import { Select } from "../../ui/select";

/* Two weeks of a store's revenue, a day a point, for the sparklines. */
const DAYS = ["Oct 8", "Oct 9", "Oct 10", "Oct 11", "Oct 12", "Oct 13", "Oct 14", "Oct 15", "Oct 16", "Oct 17", "Oct 18", "Oct 19", "Oct 20", "Oct 21"];
const REVENUE = [2840, 3120, 2960, 3480, 3310, 2790, 3020, 3640, 3910, 3720, 4180, 3990, 4420, 4210];
const VISITORS = [1120, 1240, 1180, 1390, 1310, 1020, 1090, 1420, 1510, 1460, 1610, 1540, 1720, 1690];
const REFUNDS = [0.019, 0.017, 0.018, 0.016, 0.017, 0.015, 0.016, 0.014, 0.015, 0.013, 0.014, 0.012, 0.013, 0.012];

/** A store's two figures side by side: revenue climbing, and refunds falling, which is the good news. */
/* The fills a visitor can try on the stage. */
const FILLS = [
  { value: "dither", label: "Dither", icon: <CheckerboardIcon weight="duotone" /> },
  { value: "dots", label: "Dots", icon: <DotsNineIcon weight="duotone" /> },
  { value: "lines", label: "Lines", icon: <LineSegmentsIcon weight="duotone" /> },
  { value: "gradient", label: "Gradient", icon: <GradientIcon weight="duotone" /> },
  { value: "none", label: "None", icon: <ProhibitIcon weight="duotone" /> },
];

export function Demo() {
  const [fill, setFill] = useState<ChartPattern>("dither");
  return (
    <div className="grid w-full max-w-[340px] gap-3 [[data-bd-stage]_&]:max-w-[640px]">
      {/* The fill switch shows on the component's own stage; a gallery tile shows the figure alone. */}
      <div className="hidden justify-end [[data-bd-stage]_&]:flex">
        <Select size="sm" label="Fill" options={FILLS} value={fill} onValueChange={(v) => setFill(v as ChartPattern)} className="w-[150px]!" />
      </div>
      <div className="grid gap-3 sm:[[data-bd-stage]_&]:grid-cols-2">
        <Stat label="Revenue" icon={<CurrencyDollarIcon weight="duotone" />} value={48210} format="currency" delta={0.124} deltaLabel="vs last month" data={REVENUE} points={DAYS} pattern={fill} />
        {/* The second figure shows on the component's own stage; a gallery tile has room for one. */}
        <div className="hidden [[data-bd-stage]_&]:block">
          <Stat label="Refund rate" icon={<ReceiptXIcon weight="duotone" />} value={0.012} format="percent" decimals={1} delta={-0.21} deltaLabel="vs last month" good="down" data={REFUNDS} points={DAYS} pattern={fill} />
        </div>
      </div>
    </div>
  );
}

function Basic() {
  return <Stat label="Visitors" value={18240} format="compact" delta={0.081} deltaLabel="this week" className="max-w-[280px]" />;
}

function Sparkline() {
  return <Stat label="Visitors" icon={<EyeIcon weight="duotone" />} value={18240} format="number" delta={0.081} deltaLabel="vs last week" data={VISITORS} points={DAYS} className="max-w-[340px]" />;
}

function GoodDown() {
  return <Stat label="Refund rate" icon={<ReceiptXIcon weight="duotone" />} value={0.012} format="percent" delta={-0.21} deltaLabel="vs last month" good="down" data={REFUNDS} points={DAYS} className="max-w-[340px]" />;
}

function Live() {
  const [sales, setSales] = useState(312);
  return (
    <div className="grid w-full max-w-[300px] gap-3">
      <Stat label="Templates sold" value={sales} delta={(sales - 280) / 280} deltaLabel="this month" live />
      <button type="button" onClick={() => setSales((s) => s + Math.ceil(Math.random() * 3))} className="h-9 rounded-full bg-[var(--bd-surface)] text-sm font-medium text-[var(--bd-fg)] shadow-[0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)] transition-[scale] active:scale-[0.97]">
        Record a sale
      </button>
    </div>
  );
}

function Row() {
  return (
    <div className="grid w-full max-w-[860px] gap-3 sm:grid-cols-3">
      <Stat label="Revenue" value={48210} format="currency" delta={0.124} deltaLabel="vs last month" data={REVENUE} points={DAYS} />
      <Stat label="Visitors" value={18240} format="compact" delta={0.081} deltaLabel="vs last month" data={VISITORS} points={DAYS} />
      <Stat label="Refund rate" value={0.012} format="percent" delta={-0.21} good="down" deltaLabel="vs last month" data={REFUNDS} points={DAYS} />
    </div>
  );
}

export const examples: Record<string, ComponentType> = {
  basic: Basic,
  sparkline: Sparkline,
  "good-down": GoodDown,
  live: Live,
  row: Row,
};
