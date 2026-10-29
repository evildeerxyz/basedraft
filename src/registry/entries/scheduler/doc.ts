import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Scheduler } from "@/components/basedraft/scheduler";

export function BookACall({ today }: { today: string }) {
  return (
    <Scheduler
      today={today}
      slots={(date, minutes) => freeTimes(date, minutes)}
      durations={[15, 30]}
      host={{ name: "Ava Robinson", avatar: "/ava.jpg" }}
      title="Intro call"
      location="Video call"
      onBook={async (b) => {
        await fetch("/api/book", { method: "POST", body: JSON.stringify(b) });
      }}
    />
  );
}`,
  use: [
    "For booking time with a person or a place: a sales call, a demo, office hours, a table.",
    "Pass today from the server, as YYYY-MM-DD in the zone you book in, so the month and the past days agree everywhere.",
    "Throw from onBook when the time was taken in the meantime; it says so under the times and lets them pick again.",
  ],
  avoid: [
    "For picking any date, with nothing to book: use Date picker.",
    "For a time of day alone: use Time picker.",
    "For seeing a week's events: it books one time, it isn't a calendar.",
  ],
  parts: [
    {
      name: "Scheduler",
      note: "The details, the month and the day's times; then the confirmation.",
      props: [
        { name: "slots", type: "Record<string, string[]> | (date, duration) => string[]", note: "The free times on a day, as HH:mm: by date, or worked out from the day and the length.", required: true },
        { name: "today", type: "string", note: "Today, YYYY-MM-DD. Days before it can't be picked, and it opens on its month.", required: true },
        { name: "defaultDate", type: "string", note: "A day to open with picked, YYYY-MM-DD, its times already showing." },
        { name: "durations", type: "number[]", default: "[30]", note: "The lengths on offer, in minutes. One shows as a line, more as chips." },
        { name: "defaultDuration", type: "number", note: "The length to start on." },
        { name: "onBook", type: "(booking) => void | Promise<void>", note: "Books { date, time, duration }. A promise shows a spinner on Confirm; throwing shows its message, or \"That time was just taken\"." },
        { name: "host", type: "{ name: string; avatar?: string }", note: "Who it's with: a photo, or their initials." },
        { name: "title", type: "string", default: '"Meeting"', note: "What it is." },
        { name: "location", type: "string", note: "Where: Video call, an address." },
        { name: "timeZone", type: "string", note: "The zone the times are in, shown with the details." },
        { name: "hourCycle", type: "12 | 24", default: "12", note: "The clock to start on; the switch over the times changes it." },
        { name: "className", type: "string", note: "Added to the card. Under 520px wide it stacks; from 720px it's three columns." },
      ],
    },
  ],
  examples: [
    {
      id: "compact",
      title: "Narrow, from a list",
      note: "slots as a map of dates to times, a 24-hour clock, no host, and a width that stacks it.",
      code: `<Scheduler
  today="2026-10-29"
  slots={{ "2026-11-09": ["14:00", "14:30"], "2026-11-10": ["13:30"] }}
  title="Office hours"
  location="Room 4, second floor"
  hourCycle={24}
/>`,
    },
  ],
  keyboard: [
    { keys: "← → ↑ ↓", does: "In the month, move a day or a week." },
    { keys: "Home End", does: "Go to the start or end of the week." },
    { keys: "Page Up Page Down", does: "Go a month back or on." },
    { keys: "Enter Space", does: "Pick the day, the time, or Confirm." },
  ],
  a11y: [
    "The month is a grid; each day says its full date, whether it's today, and when it has no times.",
    "Days without times can be reached but not picked, so the keys move through the month evenly.",
    "The times are a list of options, and a time taken in the meantime is announced.",
  ],
};
