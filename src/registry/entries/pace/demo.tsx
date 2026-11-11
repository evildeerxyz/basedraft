"use client";

import { CloudArrowUpIcon, FunctionIcon, ImageSquareIcon, TimerIcon } from "@phosphor-icons/react";
import type { ComponentType } from "react";
import { Pace, type PaceItem } from "../../ui/pace";

/* Day 12 of a 30-day period: each allowance's pace carried to the end. */
const ITEMS: PaceItem[] = [
  { id: "minutes", label: "Build minutes", icon: <TimerIcon weight="duotone" />, used: 2380, limit: 6000, unit: "min" },
  { id: "bandwidth", label: "Bandwidth", icon: <CloudArrowUpIcon weight="duotone" />, used: 312, limit: 1000, unit: "GB" },
  { id: "images", label: "Image optimizations", icon: <ImageSquareIcon weight="duotone" />, used: 3140, limit: 5000 },
  { id: "functions", label: "Function invocations", icon: <FunctionIcon weight="duotone" />, used: 1_420_000, limit: 5_000_000 },
].map((i) => ({ ...i, projected: Math.round((i.used / 12) * 30) }));

export function Demo() {
  return (
    <div className="w-full max-w-[760px]">
      <Pace items={ITEMS} end="Nov 30" label="This period's allowances" />
    </div>
  );
}

function Narrow() {
  return (
    <div className="w-full max-w-[340px]">
      <Pace items={ITEMS.slice(0, 3)} end="Nov 30" />
    </div>
  );
}

export const examples: Record<string, ComponentType> = { narrow: Narrow };
