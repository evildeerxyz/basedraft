"use client";

import { useState, type ComponentType } from "react";
import { Slider } from "../../ui/slider";

export function Demo() {
  return <Slider label="Space between sections" min={0} max={160} step={8} defaultValue={96} format={(v) => `${v} px`} ticks={[0, 40, 80, 120, 160]} className="max-w-[330px]" />;
}

function Basic() {
  return <Slider label="Corner radius" min={0} max={32} defaultValue={14} format={(v) => `${v} px`} className="max-w-[320px]" />;
}

function Ticks() {
  return <Slider label="Columns" min={1} max={6} defaultValue={3} ticks={[1, 2, 3, 4, 5, 6]} className="max-w-[320px]" />;
}

function Darken() {
  const [dim, setDim] = useState(40);
  return (
    <div className="grid w-full max-w-[320px] gap-3">
      <Slider label="Darken the hero image" value={dim} onValueChange={setDim} format={(v) => `${v}%`} />
      <div className="h-16 rounded-[14px] bg-[linear-gradient(135deg,#c8ff3e,#1f6b4a)]" style={{ boxShadow: `inset 0 0 0 999px rgb(0 0 0 / ${dim / 100})` }} />
    </div>
  );
}

function Unlabeled() {
  return <Slider aria-label="Zoom" min={25} max={200} step={25} defaultValue={100} format={(v) => `${v}%`} className="max-w-[320px]" />;
}

function Disabled() {
  return <Slider label="Section spacing" max={160} defaultValue={64} format={(v) => `${v} px`} disabled className="max-w-[320px]" />;
}

export const examples: Record<string, ComponentType> = { basic: Basic, ticks: Ticks, controlled: Darken, unlabeled: Unlabeled, disabled: Disabled };
