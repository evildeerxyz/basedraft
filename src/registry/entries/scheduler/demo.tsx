"use client";

import type { ComponentType } from "react";
import { Scheduler } from "../../ui/scheduler";

/* The demos' today: fixed, so every visitor sees the same month. */
const TODAY = "2026-11-02";

/** Weekdays from today, 9 to 5, with a few times already taken; the same ones every time. */
function free(date: string, duration: number) {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  if (day === 0 || day === 6) return [];
  const seed = Number(date.slice(8)) * 7 + Number(date.slice(5, 7));
  if (seed % 9 === 0) return [];
  const out: string[] = [];
  for (let m = 9 * 60; m + duration <= 17 * 60; m += 30) {
    if ((m / 30 + seed) % 5 === 0 || (m >= 12 * 60 && m < 13 * 60)) continue;
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
}

const book = () => new Promise<void>((r) => setTimeout(r, 900));

export function Demo() {
  return (
    <Scheduler
      today={TODAY}
      defaultDate="2026-11-03"
      slots={free}
      durations={[15, 30, 45]}
      defaultDuration={30}
      host={{ name: "Ava Robinson", avatar: "/demo/people/ava-robinson.jpg" }}
      title="Intro call"
      location="Video call"
      timeZone="Europe/London"
      onBook={book}
      className="w-full max-w-[820px]"
    />
  );
}

/* Afternoons only, the week after next. */
const OFFICE: Record<string, string[]> = {
  "2026-11-09": ["14:00", "14:30", "15:00", "16:30"],
  "2026-11-10": ["13:30", "15:30"],
  "2026-11-12": ["14:00", "14:30", "15:00", "15:30", "16:00"],
  "2026-11-13": ["16:00"],
};

function Compact() {
  return <Scheduler today={TODAY} slots={OFFICE} title="Office hours" location="Room 4, second floor" hourCycle={24} onBook={book} className="w-full max-w-[380px]" />;
}

export const examples: Record<string, ComponentType> = { compact: Compact };
