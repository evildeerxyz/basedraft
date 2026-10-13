import { PEOPLE, firstName, leadOf, personOf, type Person } from "./people";

/*
 * What pello does for Fieldwork in a day, one request at a time: the hero's inbox draws from this.
 * Each request says what was asked, what pello checked, and what it did. Each one is worked out
 * from its number, so the page renders the same on the server and in the browser.
 */

export type Tone = "good" | "accent" | "wait" | "bad";

export interface Happening {
  id: number;
  person: Person;
  /** What they asked, in their words. */
  ask: string;
  /** What pello did, as a line for a list. */
  title: string;
  detail: string;
  /** What pello checked before it acted. */
  checks: Array<{ text: string; ok: boolean }>;
  /** What happened, in a sentence. */
  result: string;
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

/** Who hears about it: the person's lead, or Hannah for the leads themselves. */
const leadFor = (p: Person) => {
  const to = p.lead ? personOf("hannah") : leadOf(p.team);
  return to.id === p.id ? personOf("arjun") : to;
};

type Kind = Omit<Happening, "id" | "person" | "busy" | "at">;
const KINDS: Array<(p: Person, i: number) => Kind> = [
  (p, i) => {
    const d = Math.min((i % 4) + 1, p.daysLeft);
    return {
      ask: `Can I take ${plural(d, "day")} off at the end of next month?`,
      title: `Approved ${plural(d, "day")} off`,
      detail: `${plural(p.daysLeft - d, "day")} left after this`,
      checks: [
        { text: `${plural(p.daysLeft, "day")} left, ${d} asked for`, ok: true },
        { text: "Asked 5 weeks ahead, the rule is 2", ok: true },
        { text: "Nobody else on the team is out", ok: true },
      ],
      result: `Approved inside the rules. ${firstName(leadFor(p).name)} has been told.`,
      tone: "good",
      done: "Approved",
    };
  },
  (p, i) => {
    const [topic, section] = TOPICS[i % TOPICS.length];
    return {
      ask: `What's our policy on ${topic}?`,
      title: `Answered: ${topic}`,
      detail: `From handbook section ${section}`,
      checks: [
        { text: `Found in the handbook, section ${section}`, ok: true },
        { text: "Matches their contract", ok: true },
        { text: "Policy hasn't changed this year", ok: true },
      ],
      result: "Answered in Slack, with the passage linked.",
      tone: "accent",
      done: "Answered",
    };
  },
  () => ({
    ask: "Where's my October payslip?",
    title: "Sent the October payslip",
    detail: "October payroll",
    checks: [
      { text: "October payroll is approved", ok: true },
      { text: "Payslip is published", ok: true },
      { text: "Bank details unchanged", ok: true },
    ],
    result: "Sent. It's in the app, and the amount matches September.",
    tone: "wait",
    done: "Sent",
  }),
  (p, i) => {
    const amount = [86, 140, 280, 64][i % 4];
    return {
      ask: `Can I expense $${amount} for a monitor arm?`,
      title: `Expense approved, $${amount}`,
      detail: "Inside the home office budget",
      checks: [
        { text: `$${amount} of the $400 budget left`, ok: true },
        { text: "Receipt attached", ok: true },
        { text: "First claim this quarter", ok: true },
      ],
      result: "Approved. It's paid back with the next salary.",
      tone: "good",
      done: "Approved",
    };
  },
  () => ({
    ask: "Is everything ready for my first day?",
    title: "Ready for day one",
    detail: "12 of 12 tasks done",
    checks: [
      { text: "Laptop delivered on Friday", ok: true },
      { text: "Accounts for Google, Slack and GitHub", ok: true },
      { text: "A buddy is picked", ok: true },
    ],
    result: "Ready. The first week is in the calendar.",
    tone: "good",
    done: "Ready",
  }),
  (p) => ({
    ask: "Logged 52 hours this week",
    title: "Overtime above 48 hours",
    detail: `Sent to ${firstName(leadFor(p).name)}`,
    checks: [
      { text: "52 hours, the limit is 48", ok: false },
      { text: "Second week in a row", ok: false },
      { text: "Overtime was approved last week", ok: true },
    ],
    result: `Sent to ${leadFor(p).name}, with the hours and what changed.`,
    tone: "bad",
    done: "Flagged",
  }),
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
