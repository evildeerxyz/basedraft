import { PEOPLE, firstName, leadOf, personOf, type Person } from "./people";

/*
 * What pello does for Fieldwork in a day, one request at a time: the hero's feed and org graph
 * draw from this. Each one is worked out from its number, so the page renders the same on the
 * server and in the browser.
 */

export type Tone = "good" | "accent" | "wait" | "bad";

export interface Happening {
  id: number;
  person: Person;
  title: string;
  detail: string;
  tone: Tone;
  /** The word on it once it's done: Approved, Answered, Sent. */
  done: string;
  /** Still being worked on. */
  busy: boolean;
  at: string;
}

const TOPICS = [
  ["parental leave", "4.2"],
  ["the home office budget", "6.1"],
  ["sick days", "3.4"],
  ["the pension match", "8.3"],
  ["travel cover", "7.2"],
] as const;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const KINDS: Array<(p: Person, i: number) => Pick<Happening, "title" | "detail" | "tone" | "done">> = [
  (p, i) => {
    const d = Math.min((i % 4) + 1, p.daysLeft);
    return { title: `Approved ${plural(d, "day")} off`, detail: `${p.name} · ${plural(p.daysLeft - d, "day")} left`, tone: "good", done: "Approved" };
  },
  (p, i) => {
    const [topic, section] = TOPICS[i % TOPICS.length];
    return { title: `Answered a question on ${topic}`, detail: `${firstName(p.name)} · handbook ${section}`, tone: "accent", done: "Answered" };
  },
  (p) => ({ title: "Payslip sent", detail: `${p.name} · October payroll`, tone: "wait", done: "Sent" }),
  (p, i) => ({ title: `Expense approved, $${[86, 140, 280, 64][i % 4]}`, detail: `${p.name} · within budget`, tone: "good", done: "Approved" }),
  (p) => ({ title: "Accounts ready for day one", detail: `${p.name} · 12 of 12 tasks done`, tone: "good", done: "Ready" }),
  (p) => {
    let to = p.lead ? personOf("hannah") : leadOf(p.team);
    if (to.id === p.id) to = personOf("arjun");
    return { title: "Overtime above 48 hours", detail: `${p.name} · sent to ${firstName(to.name)}`, tone: "bad", done: "Flagged" };
  },
];

/** Who the i-th request of the day is for, if nobody picked someone. */
export const personFor = (i: number) => PEOPLE[(i * 7 + 4) % PEOPLE.length];

const clock = (i: number) => {
  const m = 9 * 60 + 12 + i * 3;
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

export function happening(i: number, person = personFor(i), busy = false): Happening {
  return { id: i, person, ...KINDS[i % KINDS.length](person, i), busy, at: clock(i) };
}
