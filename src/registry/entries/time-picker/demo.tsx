"use client";

import { useState, type ComponentType } from "react";
import { TimePicker } from "../../ui/time-picker";
import { hint } from "../_shared/kit";

/** Minutes between two "HH:mm" times. */
const minutes = (a: string, b: string) => {
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  return bh * 60 + bm - (ah * 60 + am);
};

/** A call with Lea: when it starts, and when it ends, the end's list counting from the start. */
export function Demo() {
  const [start, setStart] = useState("09:30");
  const [end, setEnd] = useState("10:00");
  const pickStart = (v: string) => {
    // Moving the start keeps the call as long as it was.
    const length = Math.max(15, minutes(start, end));
    const [h, m] = v.split(":").map(Number);
    const e = Math.min(23 * 60 + 45, h * 60 + m + length);
    setStart(v);
    setEnd(`${String(Math.floor(e / 60)).padStart(2, "0")}:${String(e % 60).padStart(2, "0")}`);
  };
  return (
    <div className="grid w-full max-w-[420px] gap-3">
      <p className="text-sm font-medium text-[var(--bd-fg)]">Call with Lea Moreau, Thursday</p>
      <div className="grid grid-cols-2 gap-3">
        <TimePicker label="Starts" value={start} onValueChange={pickStart} step={15} />
        <TimePicker label="Ends" value={end} onValueChange={setEnd} from={start} step={15} />
      </div>
      <p className={hint}>Type a time like 2p or 1430, or pick one. Moving the start keeps the length.</p>
    </div>
  );
}

function Hours() {
  return (
    <div className="w-full max-w-[220px]">
      <TimePicker label="Opens at" defaultValue="08:00" hourCycle={24} step={15} />
    </div>
  );
}

function Range() {
  return (
    <div className="grid w-full max-w-[240px] gap-2">
      <TimePicker label="Delivery slot" defaultValue="13:00" min="09:00" max="17:00" step={60} />
      <p className={hint}>Only nine to five, on the hour.</p>
    </div>
  );
}

export const examples: Record<string, ComponentType> = { hours: Hours, range: Range };
