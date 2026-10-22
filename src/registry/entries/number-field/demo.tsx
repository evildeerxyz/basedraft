"use client";

import { useState, type ComponentType } from "react";
import { NumberField } from "../../ui/number-field";
import { hint } from "../_shared/kit";

export function Demo() {
  const [seats, setSeats] = useState(3);
  return (
    <div className="grid w-full max-w-[300px] justify-items-center gap-3">
      <NumberField label="Seats" unit={seats === 1 ? "person" : "people"} min={1} max={10} value={seats} onValueChange={setSeats} />
      <NumberField label="Gap" unit="px" min={0} max={160} step={4} bigStep={16} defaultValue={96} />
      <p className={hint}>Hold − or +, or drag a label sideways.</p>
    </div>
  );
}

function Seats() {
  return <NumberField label="Seats" unit="people" min={1} max={10} defaultValue={3} />;
}

function Currency() {
  return <NumberField label="Price" min={0} step={1} bigStep={10} defaultValue={79} format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} />;
}

function Percent() {
  return <NumberField label="Opacity" min={0} max={1} step={0.05} bigStep={0.1} defaultValue={0.85} format={{ style: "percent" }} />;
}

function Small() {
  return <NumberField size="sm" label="Columns" min={1} max={6} defaultValue={3} />;
}

function Disabled() {
  return <NumberField disabled label="Seats" unit="people" defaultValue={10} />;
}

export const examples: Record<string, ComponentType> = { seats: Seats, currency: Currency, percent: Percent, small: Small, disabled: Disabled };
