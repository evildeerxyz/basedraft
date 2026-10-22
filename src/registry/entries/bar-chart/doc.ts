import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { BarChart } from "@/components/basedraft/bar-chart";

type Month = { month: string; zuno: number; noma: number; auren: number };

export function SalesByTemplate({ months }: { months: Month[] }) {
  return (
    <BarChart
      pattern="dither"
      data={months}
      x="month"
      series={[
        { key: "zuno", label: "Zuno" },
        { key: "noma", label: "Noma" },
        { key: "auren", label: "Auren" },
      ]}
      title="Sales by template, last 6 months"
    />
  );
}`,
  use: [
    "For comparing separate things side by side: sales by template, signups by country, revenue by plan.",
    'With layout="horizontal" for long names or more than about eight categories.',
    "With stacked when the series add up to a whole, or to show gains and losses on either side of zero.",
  ],
  avoid: [
    "For a trend over many points in time: use AreaChart.",
    "For parts of one whole at a single moment: use DonutChart.",
    "For a handful of exact numbers people need to read and copy: use DataTable.",
  ],
  parts: [
    {
      name: "BarChart",
      note: "Bars that grow in one after another the first time they're seen. A soft band follows the pointer or the arrow keys from category to category, with a card of its values.",
      props: [
        { name: "data", type: "ChartDatum[]", note: "One object per category, in the order to show them.", required: true },
        { name: "x", type: "string", note: "The field that names each category.", required: true },
        { name: "series", type: "{ key: string; label: string; color?: string }[]", note: "The fields to draw, each with its name for the legend and the card. Colors default to the theme's data colors (--bd-ui-viz-1 to 5), in order.", required: true },
        { name: "layout", type: '"vertical" | "horizontal"', default: '"vertical"', note: "Bars standing up, or lying down for long names and many rows." },
        { name: "stacked", type: "boolean", default: "false", note: "Pile the series into one bar per category. Negative values stack below zero." },
        { name: "height", type: "number", default: "260 standing, rows lying down", note: "Height in pixels. Lying down, it follows the number of rows unless you set it." },
        { name: "rowHeight", type: "number", default: "34", note: "Each row's height, lying down." },
        { name: "format", type: '"number" | "compact" | "currency" | "percent"', default: '"number"', note: "How values read on the axis, on the bars, in the card and to screen readers." },
        { name: "currency", type: "string", default: '"USD"', note: "The currency, with format currency." },
        { name: "locale", type: "string", default: '"en-US"', note: "Whose way of writing numbers." },
        { name: "decimals", type: "number", note: "The most digits after the point. By default none, or one when compact." },
        { name: "formatX", type: "(value, index) => string", note: "How a category's name reads." },
        { name: "ticks", type: "number", default: "4", note: "About how many lines along the value axis. They land on round numbers." },
        { name: "grid", type: "boolean", default: "true", note: "Faint lines at each tick." },
        { name: "legend", type: "boolean", default: "on with two or more series", note: "The series above the chart. Pressing one hides it; the others widen or re-scale on a spring." },
        { name: "valueLabels", type: "boolean", default: "false", note: "Each bar's value at its end, or each stack's total when stacked." },
        { name: "radius", type: "number", default: "6", note: "How round each bar's corners are." },
        { name: "track", type: "boolean", default: "false", note: "A faint full-length track behind each bar, so each one reads against the whole scale." },
        { name: "pattern", type: '"gradient" | "solid" | "dither" | "dots" | "lines"', default: '"gradient"', note: "How each bar is filled: lit toward its end, flat, an ordered pixel dither or halftone dots that thin toward its base, or fine diagonal lines. Patterns sit on a faint wash of the color, so each bar keeps its shape." },
        { name: "yAxis", type: "boolean", default: "true", note: "The values along the value axis. Turn it off when a figure above the chart already says the number." },
        { name: "animate", type: "boolean", default: "true", note: "Grow in one after another the first time they're seen. Reduced motion skips it." },
        { name: "loading", type: "boolean", default: "false", note: "Placeholder bars with a dotted shimmer, while the numbers come." },
        { name: "empty", type: "ReactNode", default: '"No data yet"', note: "What to say when there's nothing to draw." },
        { name: "title", type: "string", note: "What the chart shows: its name, and the start of the summary screen readers hear." },
        { name: "dataTable", type: "boolean", default: "false", note: "A table of every value, hidden from sight and read by screen readers." },
        { name: "className", type: "string", note: "Added to the chart's box, to size or place it." },
      ],
    },
  ],
  examples: [
    {
      id: "grouped",
      title: "Grouped",
      note: "Several series side by side, each in its own data color, with a legend that turns them off and on.",
      code: `<BarChart
  pattern="dither"
  data={sales}
  x="month"
  series={[
    { key: "zuno", label: "Zuno" },
    { key: "noma", label: "Noma" },
    { key: "auren", label: "Auren" },
  ]}
/>`,
    },
    {
      id: "horizontal",
      title: "Lying down, with values",
      note: "Long names get room to read, and each bar says its number.",
      code: `const signups = [
  { country: "United States", signups: 1284 },
  { country: "United Kingdom", signups: 612 },
  { country: "Germany", signups: 488 },
  // ...
];

<BarChart
  pattern="dither"
  data={signups}
  x="country"
  series={[{ key: "signups", label: "Signups" }]}
  layout="horizontal"
  valueLabels
  title="Signups by country"
  className="max-w-[560px]"
/>`,
    },
    {
      id: "stacked",
      title: "Stacked",
      note: "One bar per month, its total on top. Hide a plan in the legend and the rest re-scale.",
      code: `<BarChart
  pattern="dither"
  data={byPlan}
  x="month"
  series={[
    { key: "pro", label: "Pro" },
    { key: "team", label: "Team" },
    { key: "templates", label: "Templates" },
  ]}
  stacked
  valueLabels
  format="currency"
  title="Revenue by plan"
  className="max-w-[640px]"
/>`,
    },
    {
      id: "negative",
      title: "Above and below zero",
      note: "Negative values grow down from the line, so gains and losses read at a glance.",
      code: `const seats = [
  { week: "Sep 1", added: 18, removed: -4 },
  { week: "Sep 8", added: 22, removed: -7 },
  // ...
];

<BarChart
  pattern="dither"
  data={seats}
  x="week"
  series={[
    { key: "added", label: "Added" },
    { key: "removed", label: "Removed", color: "oklch(70% 0.012 265)" },
  ]}
  stacked
  title="Team seats added and removed"
  className="max-w-[640px]"
/>`,
    },
    {
      id: "loading",
      title: "Loading",
      note: "Placeholder bars with a dotted shimmer, so the page doesn't jump when the numbers arrive.",
      code: `<BarChart
  pattern="dither"
  data={[]}
  x="month"
  series={[{ key: "sales", label: "Sales" }]}
  loading
  title="Sales"
  className="max-w-[640px]"
/>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Focuses the chart, then each legend entry." },
    { keys: "← / → or ↑ / ↓", does: "Moves to the previous or next category and says its values." },
    { keys: "Home / End", does: "Goes to the first or last category." },
    { keys: "Esc", does: "Puts the band away." },
    { keys: "Enter / Space", does: "On a legend entry, hides or shows its series." },
  ],
  a11y: [
    "The drawing has role img and a summary written from the data: how many categories, and where each series peaks.",
    "The chart is one focusable group. The arrow keys move through the categories, and a polite live region says each one's values.",
    "Legend entries are buttons with aria-pressed, so hiding a series is said, not just seen.",
    "With dataTable, a hidden table holds every value for screen readers that read tables.",
    "Reduced motion skips the grow-in and makes every change instant.",
  ],
};
