/*
 * The day the home page tells: Friday, October 30 at Fieldwork, from nine to six. The hero draws
 * the whole day as a strip, six minutes to a bar, and each section below it is one moment from it.
 * Every number is worked out from its position, so the server and the browser draw the same day.
 */

export const DAY = { date: "Friday, October 30", from: 9 * 60, to: 18 * 60, step: 6 };

/** When the page opens: five past five, with most of the day done. */
export const NOW = 17 * 60 + 5;

export const MOMENTS = [
  { id: "time-off", at: "09:12", label: "Time off" },
  { id: "ask", at: "10:05", label: "Handbook" },
  { id: "payroll", at: "11:30", label: "Payroll" },
  { id: "day-one", at: "13:20", label: "Day one" },
  { id: "overtime", at: "14:40", label: "Overtime" },
  { id: "privacy", at: "15:55", label: "Privacy" },
  { id: "week", at: "16:40", label: "Hannah" },
] as const;

export type MomentId = (typeof MOMENTS)[number]["id"];
export const momentOf = (id: MomentId) => MOMENTS.find((m) => m.id === id)!;

export const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
export const clockOf = (minutes: number) => `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** A number from 0 to 1 for each position, the same everywhere: integer math only. */
const rand = (i: number, salt = 0) => {
  let t = Math.imul(i + 1 + salt * 7919, 0x9e3779b1);
  t ^= t >>> 15;
  t = Math.imul(t, 0x85ebca6b);
  t ^= t >>> 13;
  return (t >>> 0) / 4294967296;
};

/* Requests in each half hour: a rush at ten, a quiet lunch, a busy afternoon, a slow last hour. */
const HALF_HOURS = [14, 22, 26, 24, 20, 17, 15, 14, 9, 7, 10, 15, 19, 21, 20, 16, 12, 8];

export interface Bar {
  /** Minutes since midnight that the six minutes start at. */
  start: number;
  count: number;
  /** How many of them went to a person instead. */
  flagged: number;
}

export const BARS: Bar[] = Array.from({ length: (DAY.to - DAY.from) / DAY.step }, (_, i) => {
  const base = HALF_HOURS[Math.floor(i / 5)];
  return { start: DAY.from + i * DAY.step, count: Math.max(2, base + Math.floor(rand(i) * 7) - 3), flagged: rand(i, 1) < 0.13 ? 1 : 0 };
});

export const MOST = Math.max(...BARS.map((b) => b.count));

/** How much of a bar has happened by a given minute, from 0 to 1. */
export const doneOf = (b: Bar, now: number) => Math.max(0, Math.min(1, (now - b.start) / DAY.step));

/** Requests handled, and sent to a person, by a given minute. */
export function tally(now: number) {
  let handled = 0;
  let flagged = 0;
  for (const b of BARS) {
    const k = doneOf(b, now);
    handled += b.count * k;
    flagged += k === 1 ? b.flagged : 0;
  }
  return { handled: Math.round(handled), flagged };
}
