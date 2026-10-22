import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { AreaChart } from "@/components/basedraft/area-chart";

type Day = { date: Date; visitors: number; returning: number };

export function Visitors({ days }: { days: Day[] }) {
  return (
    <AreaChart
      data={days}
      x="date"
      series={[
        { key: "visitors", label: "Visitors" },
        { key: "returning", label: "Returning" },
      ]}
      format="compact"
      title="Visitors, last 90 days"
    />
  );
}`,
  use: [
    "For how something moves over time: visitors by day, revenue by month, page views across a year.",
    "With stacked when the series add up to a whole people care about, like revenue split by plan.",
    "Give it a title. It names the chart and starts the summary screen readers hear.",
  ],
  avoid: [
    "For comparing separate things, like countries or templates: use BarChart.",
    "For parts of one whole at a single moment: use DonutChart.",
    "For one number and its change: use Stat.",
  ],
  parts: [
    {
      name: "AreaChart",
      note: "Lines in the theme's data colors with a field of fine dots under them, drawn in from the left the first time they're seen. A crosshair follows the pointer or the arrow keys and snaps to the nearest point.",
      props: [
        { name: "data", type: "ChartDatum[]", note: "One object per point, in order along the bottom.", required: true },
        { name: "x", type: "string", note: "The field that holds each point's place along the bottom: a Date, a label or a number.", required: true },
        { name: "series", type: "{ key: string; label: string; color?: string }[]", note: "The fields to draw, each with its name for the legend and the card. Colors default to the theme's data colors (--bd-ui-viz-1 to 5), in order.", required: true },
        { name: "stacked", type: "boolean", default: "false", note: "Pile the series on each other, so the top edge is their total." },
        { name: "curve", type: '"smooth" | "linear"', default: '"smooth"', note: "Smooth curves that never overshoot a point, or straight lines between points." },
        { name: "height", type: "number", default: "260", note: "Height in pixels. The width follows the container." },
        { name: "format", type: '"number" | "compact" | "currency" | "percent"', default: '"number"', note: "How values read on the axis, in the card and to screen readers. Compact reads 12.4K." },
        { name: "currency", type: "string", default: '"USD"', note: "The currency, with format currency." },
        { name: "locale", type: "string", default: '"en-US"', note: "Whose way of writing numbers and dates." },
        { name: "decimals", type: "number", note: "The most digits after the point. By default none, or one when compact." },
        { name: "formatX", type: "(value, index) => string", note: 'How a point\'s place reads on the bottom axis and in the card. Dates read as "Oct 4" by default.' },
        { name: "ticks", type: "number", default: "4", note: "About how many lines across. They land on round numbers." },
        { name: "grid", type: "boolean", default: "true", note: "Faint lines across at each tick." },
        { name: "legend", type: "boolean", default: "on with two or more series", note: "The series above the chart. Pressing one hides it and the rest re-scale on a spring." },
        { name: "fill", type: "boolean", default: "true", note: "A field of fine dots under each line, fading to the baseline, over a faint wash of its color." },
        { name: "live", type: "boolean", default: "false", note: "A dot on each line's last point that pulses: for figures still coming in." },
        { name: "onActiveChange", type: "(index: number | null) => void", note: "Told which point is pointed at (or stepped to), and null when none is, so a figure above the chart can follow it." },
        { name: "animate", type: "boolean", default: "true", note: "Draw in from the left the first time it's seen, and again when the data changes, a new range say. Reduced motion skips it." },
        { name: "loading", type: "boolean", default: "false", note: "A placeholder wave with a dotted shimmer, while the numbers come." },
        { name: "empty", type: "ReactNode", default: '"No data yet"', note: "What to say when there's nothing to draw." },
        { name: "title", type: "string", note: "What the chart shows: its name, and the start of the summary screen readers hear." },
        { name: "dataTable", type: "boolean", default: "false", note: "A table of every value, hidden from sight and read by screen readers." },
        { name: "className", type: "string", note: "Added to the chart's box, to size or place it." },
      ],
    },
  ],
  examples: [
    {
      id: "single",
      title: "One series",
      note: "Monthly revenue as currency. Labels along the bottom come from x as they are.",
      code: `const revenue = [
  { month: "Nov", revenue: 8200 },
  { month: "Dec", revenue: 9100 },
  // ...one per month
  { month: "Oct", revenue: 18900 },
];

<AreaChart
  data={revenue}
  x="month"
  series={[{ key: "revenue", label: "Revenue" }]}
  format="currency"
  title="Revenue, last 12 months"
  className="max-w-[640px]"
/>`,
    },
    {
      id: "stacked",
      title: "Stacked",
      note: "The top edge is the total. Hide a plan in the legend and the others settle down to fill it.",
      code: `<AreaChart
  data={byPlan}
  x="month"
  series={[
    { key: "pro", label: "Pro" },
    { key: "team", label: "Team" },
    { key: "templates", label: "Templates" },
  ]}
  stacked
  format="currency"
  title="Revenue by plan"
  className="max-w-[640px]"
/>`,
    },
    {
      id: "year",
      title: "A whole year",
      note: "365 points. The crosshair snaps to the nearest day, and Shift with an arrow key jumps a tenth of the way.",
      code: `const year = Array.from({ length: 365 }, (_, i) => ({
  date: new Date(Date.UTC(2025, 9, 22 + i, 12)),
  views: pageViewsOn(i),
}));

<AreaChart
  data={year}
  x="date"
  series={[{ key: "views", label: "Page views" }]}
  format="compact"
  height={240}
  title="Page views this year"
  className="max-w-[720px]"
/>`,
    },
    {
      id: "loading",
      title: "Loading",
      note: "A placeholder wave with a dotted shimmer, so the page doesn't jump when the numbers arrive.",
      code: `<AreaChart
  data={[]}
  x="date"
  series={[{ key: "visitors", label: "Visitors" }]}
  loading
  title="Visitors"
  className="max-w-[640px]"
/>`,
    },
    {
      id: "empty",
      title: "Nothing yet",
      note: "Say what will fill it and how.",
      code: `<AreaChart
  data={[]}
  x="date"
  series={[{ key: "visitors", label: "Visitors" }]}
  empty="No visits yet. Share your draft and they'll show up here."
  title="Visitors"
  className="max-w-[640px]"
/>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Focuses the chart, then each legend entry." },
    { keys: "← / →", does: "Steps the crosshair to the previous or next point and says its values." },
    { keys: "Shift + ← / →", does: "Jumps a tenth of the way back or on." },
    { keys: "Page Down / Page Up", does: "Jumps a tenth of the way back or on." },
    { keys: "Home / End", does: "Goes to the first or last point." },
    { keys: "Esc", does: "Puts the crosshair away." },
    { keys: "Enter / Space", does: "On a legend entry, hides or shows its series." },
  ],
  a11y: [
    "The drawing has role img and a summary written from the data: how many points and over what span, then where each series starts, ends and peaks.",
    "The chart is one focusable group. The arrow keys move the crosshair, and a polite live region says the point's place and every value.",
    "Legend entries are buttons with aria-pressed, so hiding a series is said, not just seen.",
    "With dataTable, a hidden table holds every value for screen readers that read tables.",
    "Reduced motion skips the draw-in and makes every change instant.",
  ],
};
