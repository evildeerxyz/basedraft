"use client";

import { useState, useSyncExternalStore, type ComponentType, type ReactNode } from "react";
import { Calendar, DatePicker, type DateRange } from "../../ui/date-picker";

/* Today, and a day so many from it, without the hours. */
const fromToday = (n: number) => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
};
const weekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

/* These count from today, which only the browser knows: each one comes in once it's running there, in a space its own size. */
const noop = () => () => {};
function Later({ children, className }: { children: ReactNode; className: string }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  return mounted ? children : <div aria-hidden className={className} />;
}

export function Demo() {
  return (
    <Later className="h-[68px] w-full max-w-[280px]">
      <PublishOn />
    </Later>
  );
}

function PublishOn() {
  const [on, setOn] = useState<Date | null>(() => fromToday(3));
  return (
    <div className="grid w-full max-w-[280px] gap-2">
      <p className="px-1 text-xs font-medium text-[var(--bd-muted)]">Publish the site on</p>
      <DatePicker label="Publish the site on" value={on} onValueChange={setOn} min={fromToday(0)} />
    </div>
  );
}

function Single() {
  return (
    <Later className="h-11 w-full max-w-[260px]">
      <DatePicker label="Publish on" placeholder="Pick a day" min={fromToday(0)} className="max-w-[260px]" />
    </Later>
  );
}

function Range() {
  return (
    <Later className="h-11 w-full max-w-[300px]">
      <Trial />
    </Later>
  );
}

function Trial() {
  const [trial, setTrial] = useState<DateRange | null>(() => ({ from: fromToday(0), to: fromToday(13) }));
  return <DatePicker mode="range" label="Free trial" value={trial} onValueChange={setTrial} min={fromToday(0)} className="max-w-[300px]" />;
}

function Limits() {
  return (
    <Later className="h-11 w-full max-w-[300px]">
      <DatePicker label="Book a call" placeholder="A weekday in the next two weeks" min={fromToday(1)} max={fromToday(14)} isDisabled={weekend} weekStartsOn={1} className="max-w-[300px]" />
    </Later>
  );
}

function Inline() {
  return (
    <Later className="h-[330px] w-[304px]">
      <div className="rounded-[20px] bg-[var(--bd-surface)] p-3 shadow-[0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]">
        <Calendar mode="range" defaultValue={{ from: fromToday(2), to: fromToday(6) }} />
      </div>
    </Later>
  );
}

function Small() {
  return (
    <Later className="h-9 w-full max-w-[220px]">
      <DatePicker size="sm" label="Due" placeholder="Due date" defaultValue={fromToday(7)} className="max-w-[220px]" />
    </Later>
  );
}

export const examples: Record<string, ComponentType> = { single: Single, range: Range, limits: Limits, calendar: Inline, small: Small };
