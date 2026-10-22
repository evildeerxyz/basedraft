import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Uptime, type UptimeDay } from "@/components/basedraft/uptime";

export function ApiStatus({ days }: { days: UptimeDay[] }) {
  return <Uptime name="API" days={days} status="up" />;
}`,
  use: [
    "On a status page, or a service's settings, to show how it's held up day by day.",
    "Stack one per service in a card, each with its own name and status, for a whole system at a glance.",
    "Give each day its incidents, so a bad bar opens to what went wrong and for how long.",
  ],
  avoid: [
    "For a live reading right now, like CPU: use Gauge.",
    "For how busy each day was: use Heatmap.",
    "For one service's response times over a day: use Area chart.",
  ],
  parts: [
    {
      name: "Uptime",
      note: "A service's name and status, its uptime, and a bar for each day.",
      props: [
        { name: "name", type: "string", note: "The service: API, Dashboard, Builds.", required: true },
        { name: "days", type: "UptimeDay[]", note: "Its days, oldest first.", required: true },
        { name: "status", type: '"up" | "degraded" | "down"', default: '"up"', note: "How it is right now: Operational, Degraded or Down, with a dot that pulses." },
        { name: "span", type: "number", note: "How many days. As many as fit its width by default, the latest ones." },
        { name: "onSelect", type: "(day: UptimeDay) => void", note: "Runs when a day is clicked, or chosen with Enter." },
        { name: "dither", type: "boolean", default: "true", note: "A bad day mixes amber or red dots into its green by how much went wrong; false paints it in its worst state." },
        { name: "className", type: "string", note: "Added to its box." },
      ],
    },
    {
      name: "UptimeDay",
      note: "One day, as an object in days.",
      props: [
        { name: "date", type: "string", note: "YYYY-MM-DD.", required: true },
        { name: "up", type: "number", note: "The share of the day it was up and well, from 0 to 1. Leave it out for a day with no data." },
        { name: "degraded", type: "number", note: "The share it was up but slow, from 0 to 1. Whatever's left was down." },
        { name: "incidents", type: "{ title: string; minutes: number; tone?: \"warn\" | \"stop\" }[]", note: "What went wrong, for the day's card: slow in amber, down in red." },
      ],
    },
  ],
  examples: [
    {
      id: "system",
      title: "A whole system",
      note: "One per service in a card. Bars mix amber or red dots into the green by how much of the day went wrong.",
      code: `<div className="grid gap-6 rounded-3xl bg-[var(--bd-surface)] p-6">
  <Uptime name="Website" days={website} />
  <Uptime name="API" days={api} status="degraded" />
  <Uptime name="Builds" days={builds} />
</div>`,
    },
    {
      id: "month",
      title: "A month, without dither",
      note: "span fixes how many days, here thirty, and the bars stretch to fill the width. With dither={false}, a bad day is painted in its worst state.",
      code: `<Uptime name="Dashboard" days={days} span={30} dither={false} />`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves onto the days, starting at today." },
    { keys: "← →", does: "Moves a day back or ahead, opening its card." },
    { keys: "Home End", does: "Moves to the first or last day." },
    { keys: "Enter", does: "Chooses the day, running onSelect." },
    { keys: "Escape", does: "Closes the day's card." },
  ],
  a11y: [
    "Each day is a button named with its date, its uptime and how many incidents it had, in one Tab stop that the arrow keys move within.",
    "Status is said in words beside its dot: Operational, Degraded or Down.",
    "Color is never the only sign: a bad day's uptime and incidents are in its name and its card.",
    "With reduced motion, the bars stand at once rather than rising in a wave.",
  ],
};
