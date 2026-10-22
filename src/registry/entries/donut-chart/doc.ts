import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { DonutChart } from "@/components/basedraft/donut-chart";

const sales = [
  { label: "Pro", value: 8940 },
  { label: "Team", value: 6380 },
  { label: "Zuno", value: 2840 },
  { label: "Noma", value: 1910 },
  { label: "Auren", value: 1170 },
];

export function SalesByProduct() {
  return (
    <DonutChart
      pattern="dither"
      data={sales}
      format="currency"
      centerLabel="Revenue"
      title="Sales by product, October 2026"
    />
  );
}`,
  use: [
    "For parts of one whole at a single moment: sales by product, users by plan, seats taken and open.",
    "With up to six or so parts. Past that, the small ones turn to slivers: use BarChart.",
    "Give it a title. It names the chart and starts the summary screen readers hear.",
  ],
  avoid: [
    "For how something changes over time: use AreaChart.",
    "For comparing things that don't add up to a whole: use BarChart.",
    "For one share of something, like storage used: use Meter.",
  ],
  parts: [
    {
      name: "DonutChart",
      note: "A ring whose parts sweep in around it the first time it's seen, with the total rolling up in the middle. Pointing at a part, or stepping to it, slides it out and puts its share in the middle.",
      props: [
        { name: "data", type: "{ label: string; value: number; color?: string }[]", note: "The parts, in order around the ring from the top. Colors default to the theme's data colors (--bd-ui-viz-1 to 5), in order.", required: true },
        { name: "size", type: "number", default: "220", note: "The ring's largest width in pixels. It shrinks to fit a narrow container." },
        { name: "thickness", type: "number", default: "26", note: "How thick the ring is." },
        { name: "gap", type: "number", default: "3", note: "The space between parts, in pixels." },
        { name: "format", type: '"number" | "compact" | "currency" | "percent"', default: '"number"', note: "How values read in the middle, the legend and to screen readers. Shares always read as percents." },
        { name: "currency", type: "string", default: '"USD"', note: "The currency, with format currency." },
        { name: "locale", type: "string", default: '"en-US"', note: "Whose way of writing numbers." },
        { name: "decimals", type: "number", note: "The most digits after the point. By default none, or one when compact." },
        { name: "centerLabel", type: "string", default: '"Total"', note: "What the middle says under its number." },
        { name: "centerValue", type: "number", default: "the sum of the shown parts", note: "The middle's number, when it isn't the sum, like 7 of 10 seats." },
        { name: "legend", type: '"auto" | "right" | "bottom" | false', default: '"auto"', note: "Beside the ring, under it, or none. Auto puts it beside when there's room." },
        { name: "pattern", type: '"solid" | "dither" | "dots" | "lines"', default: '"solid"', note: "How each part is filled: flat, an ordered pixel dither, halftone dots, or fine diagonal lines, over a faint wash of its color." },
        { name: "animate", type: "boolean", default: "true", note: "Sweep in and roll up the total the first time it's seen. Reduced motion skips it." },
        { name: "loading", type: "boolean", default: "false", note: "The empty ring with a dotted shimmer, while the numbers come." },
        { name: "empty", type: "ReactNode", default: '"No data yet"', note: "What the middle says when there's nothing to draw." },
        { name: "title", type: "string", note: "What the chart shows: its name, and the start of the summary screen readers hear." },
        { name: "dataTable", type: "boolean", default: "false", note: "A table of every part, its value and share, hidden from sight and read by screen readers." },
        { name: "className", type: "string", note: "Added to the chart's box, to size or place it." },
      ],
    },
  ],
  examples: [
    {
      id: "basic",
      title: "Users by plan",
      note: "Compact numbers in the middle and the legend. Point at a part to see its share.",
      code: `const users = [
  { label: "Free", value: 18420 },
  { label: "Pro", value: 2310 },
  { label: "Team", value: 860 },
];

<DonutChart
  pattern="dither"
  data={users}
  format="compact"
  centerLabel="Users"
  title="Users by plan"
  className="max-w-[520px]"
/>`,
    },
    {
      id: "legend-bottom",
      title: "Legend underneath",
      note: "For a narrow card or a phone. Press a row to leave that part out; the rest close the gap.",
      code: `<DonutChart
  pattern="dither"
  data={users}
  format="compact"
  size={180}
  legend="bottom"
  centerLabel="Users"
  title="Users by plan"
  className="max-w-[320px]"
/>`,
    },
    {
      id: "custom-center",
      title: "Your own middle",
      note: "centerValue and centerLabel say what the ring means. Here the open seats take the track's color, so they read as empty.",
      code: `const seats = [
  { label: "Designers", value: 4 },
  { label: "Engineers", value: 3 },
  { label: "Open", value: 3, color: "var(--bd-ui-track)" },
];

<DonutChart
  pattern="dither"
  data={seats}
  centerValue={7}
  centerLabel="of 10 seats"
  size={180}
  thickness={18}
  gap={4}
  title="Seats on your Team license"
  className="max-w-[480px]"
/>`,
    },
    {
      id: "loading",
      title: "Loading",
      note: "The empty ring with a dotted shimmer, so the page doesn't jump when the numbers arrive.",
      code: `<DonutChart
  pattern="dither"
  data={[]}
  loading
  title="Sales by product"
  className="max-w-[520px]"
/>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Focuses the ring, then each row of the legend." },
    { keys: "← / → or ↑ / ↓", does: "Moves to the previous or next part, slides it out and says its value and share." },
    { keys: "Home / End", does: "Goes to the first or last part." },
    { keys: "Esc", does: "Lets the part go back and shows the total again." },
    { keys: "Enter / Space", does: "On a legend row, leaves its part out or brings it back." },
  ],
  a11y: [
    "The ring has role img and a summary written from the data: the total, then every part's value and share.",
    "The ring is one focusable group. The arrow keys move through the parts, and a polite live region says each one's value and share.",
    "Legend rows are buttons with aria-pressed, and focusing one lights its part on the ring.",
    "With dataTable, a hidden table holds every part, its value and share, for screen readers that read tables.",
    "Reduced motion skips the sweep and the roll, and makes every change instant.",
  ],
};
