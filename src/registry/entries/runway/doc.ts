import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Runway } from "@/components/basedraft/runway";

export function Credits({ balances, burn }: { balances: number[]; burn: number }) {
  return (
    <Runway
      label="Credits"
      history={balances}
      start="2026-10-14"
      burn={burn}
      ahead={30}
      events={[{ date: "2026-10-22", label: "+$100" }]}
      marks={[{ date: "2026-12-01", label: "Next bill" }]}
    />
  );
}`,
  use: [
    "For a balance that's spent down: prepaid credits, a budget, an ad wallet, runway in the bank.",
    "Give it history ending today and the pace it's spent; it draws the rest and marks the day it runs out.",
    "Pass autoReload when a top-up runs by itself: the line ahead becomes a saw that never reaches zero.",
    "Put a figure and a sentence over it (\"$184.20, enough until about Dec 1\"); it has no y axis of its own.",
  ],
  avoid: ["For a figure that only goes up: use Area chart.", "For how much of a limit is used: use Allowance or Pace."],
  props: [
    { name: "history", type: "number[]", note: "The balance at the end of each day, oldest first, ending today.", required: true },
    { name: "start", type: "string", note: "The day the first of them is for, YYYY-MM-DD.", required: true },
    { name: "burn", type: "number", note: "What's spent in a day at the current pace.", required: true },
    { name: "ahead", type: "number", default: "30", note: "How many days ahead it looks." },
    { name: "autoReload", type: "{ amount: number; below: number } | null", note: "A top-up that runs by itself: this amount whenever the balance falls under that one." },
    { name: "events", type: "Array<{ date: string; label: string }>", note: "What happened, as dots on the line: a top-up, a refund." },
    { name: "marks", type: "Array<{ date: string; label: string }>", note: "Days to mark on the axis: the next bill, a renewal." },
    { name: "currency", type: "string", default: "\"USD\"", note: "The money it's in." },
    { name: "label", type: "string", default: "\"Balance\"", note: "What the balance is, for screen readers." },
    { name: "height", type: "number", default: "200", note: "How tall it is, in pixels." },
  ],
  parts: [{ name: "forecast", note: "The days ahead as Runway works them out, for a sentence of your own.", props: [{ name: "from, burn, days, autoReload", type: "number, number, number, object?", note: "Returns { days, runsOut }: each day's balance, and when it reaches zero, if it does.", required: true }] }],
  examples: [{ id: "auto", title: "With a top-up that runs by itself", note: "The line ahead falls to the line where it tops up and jumps back, so it never runs out.", code: `<Runway history={balances} start="2026-10-14" burn={9.6} autoReload={{ amount: 100, below: 20 }} />` }],
  keyboard: [{ keys: "None", does: "It's a picture; point at it for any day's figure. Put the actions beside it." }],
  a11y: ["Read as one sentence: today's balance, and the day it runs out at this pace, or that it tops itself up.", "The day it runs out is said in words on the axis, not by its red alone."],
};
