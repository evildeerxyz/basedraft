import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Stat } from "@basedraft/ui";

export function Revenue({ days }: { days: { day: string; total: number }[] }) {
  return (
    <Stat
      label="Revenue"
      value={48210}
      format="currency"
      delta={0.124}
      deltaLabel="vs last month"
      data={days.map((d) => d.total)}
      points={days.map((d) => d.day)}
    />
  );
}`,
  use: [
    "For the few numbers a dashboard opens with: revenue, visitors, sign-ups, a rate that should fall.",
    "With a sparkline when the shape of the last days says more than the total does, and a cursor to read any one of them.",
    "With live for a figure that changes while it's on screen, so its new value is read out.",
  ],
  avoid: [
    "For a number inside a sentence or a table cell: use Number, which rolls the same way without the card.",
    "For how far along a task is: use Meter.",
    "For a full chart with axes and several series: a Stat's sparkline shows a shape, not a scale.",
  ],
  parts: [
    {
      name: "Stat",
      props: [
        { name: "label", type: "ReactNode", required: true, note: "What the number is. Also names the sparkline for screen readers when it's a string." },
        { name: "value", type: "number", required: true, note: "The figure. It rolls up from zero the first time it's seen, then from its last value each time it changes." },
        { name: "format", type: '"number" | "currency" | "compact" | "percent"', default: '"number"', note: "18,240, $48,210, 18.2K, or 1.2% from 0.012." },
        { name: "currency", type: "string", default: '"USD"', note: "The ISO code, for currency." },
        { name: "decimals", type: "number", note: "Digits after the point, at most. Each format has its own default." },
        { name: "locale", type: "string", default: '"en-US"', note: "How the number and the change are written." },
        { name: "delta", type: "number", note: "How far it moved, as a fraction: 0.124 is up 12.4%. Leave it out for no change line." },
        { name: "deltaLabel", type: "ReactNode", note: 'What the change is against, after it: "vs last month".' },
        { name: "good", type: '"up" | "down"', default: '"up"', note: "Which way is good news. The change shows in the good or the bad tone accordingly; no change shows quiet." },
        { name: "data", type: "number[]", note: "The figures behind the sparkline, oldest first. Two or more draw it." },
        { name: "pattern", type: '"gradient" | "solid" | "dither" | "dots" | "lines" | "none"', default: '"gradient"', note: "How the color under the sparkline is drawn: a wash that fades to the card's edge, flat, an ordered pixel dither or halftone dots that thin toward the edge, fine diagonal lines, or nothing." },
        { name: "points", type: "string[]", note: "A name for each figure, shown beside it on the cursor: days, weeks." },
        { name: "icon", type: "ReactNode", note: "A small icon on a tile beside the label." },
        { name: "live", type: "boolean", default: "false", note: "Read each new value out to screen readers as it changes." },
        { name: "...props", type: "div props", note: "Everything a div takes. className sizes the card." },
      ],
    },
  ],
  examples: [
    {
      id: "basic",
      title: "A figure and its change",
      note: "Without data there's no sparkline: just the number and how it moved.",
      code: `<Stat
  label="Visitors"
  value={18240}
  format="compact"
  delta={0.081}
  deltaLabel="this week"
/>`,
    },
    {
      id: "sparkline",
      title: "With a sparkline",
      note: "The line draws itself in when it's first seen. Point along it, or focus it and use the arrow keys, to read a day.",
      code: `<Stat
  label="Visitors"
  icon={<EyeIcon weight="duotone" />}
  value={18240}
  delta={0.081}
  deltaLabel="vs last week"
  data={visitors}
  points={days}
/>`,
    },
    {
      id: "good-down",
      title: "When down is good",
      note: "A refund rate falling is good news, so good=\"down\" shows the drop in the good tone.",
      code: `<Stat
  label="Refund rate"
  icon={<ReceiptXIcon weight="duotone" />}
  value={0.012}
  format="percent"
  delta={-0.21}
  deltaLabel="vs last month"
  good="down"
  data={refunds}
  points={days}
/>`,
    },
    {
      id: "live",
      title: "A figure that updates",
      note: "Each new value rolls from the last one, and live reads it out.",
      code: `const [sales, setSales] = useState(312);

<Stat
  label="Templates sold"
  value={sales}
  delta={(sales - 280) / 280}
  deltaLabel="this month"
  live
/>
<button type="button" onClick={() => setSales((s) => s + 1)}>
  Record a sale
</button>`,
    },
    {
      id: "row",
      title: "A dashboard's first row",
      note: "Three side by side, each its own card.",
      code: `<div className="grid gap-3 sm:grid-cols-3">
  <Stat
    label="Revenue"
    value={48210}
    format="currency"
    delta={0.124}
    deltaLabel="vs last month"
    data={revenue}
    points={days}
  />
  <Stat
    label="Visitors"
    value={18240}
    format="compact"
    delta={0.081}
    deltaLabel="vs last month"
    data={visitors}
    points={days}
  />
  <Stat
    label="Refund rate"
    value={0.012}
    format="percent"
    delta={-0.21}
    good="down"
    deltaLabel="vs last month"
    data={refunds}
    points={days}
  />
</div>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Focuses the sparkline." },
    { keys: "ArrowLeft / ArrowRight", does: "Moves the cursor a point back or on, and reads its figure out." },
    { keys: "Home / End", does: "Moves the cursor to the first or the last point." },
    { keys: "Escape", does: "Hides the cursor." },
  ],
  a11y: [
    "The value is read as the whole formatted number; the rolling digits are hidden from screen readers.",
    "The sparkline is a focusable group named with its label, how many points it has, and its first and last figures.",
    "As the cursor moves, the point's name and figure are read out through a polite live region.",
    "With reduced motion the value and the line appear at once, and the cursor moves without a spring.",
  ],
};
