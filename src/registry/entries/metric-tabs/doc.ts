import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { MetricTabs } from "@/components/basedraft/metric-tabs";
import { AreaChart } from "@/components/basedraft/area-chart";

export function Overview({ days }: { days: Day[] }) {
  return (
    <MetricTabs
      metrics={[
        { id: "revenue", label: "Revenue", value: 48210, format: "currency", delta: 0.124, note: "vs last month" },
        { id: "orders", label: "Orders", value: 1284, delta: 0.06 },
        { id: "refunds", label: "Refunds", value: 1.8, format: (v) => \`\${v}%\`, delta: -0.12, good: "down" },
      ]}
    >
      {(m) => <AreaChart data={days} x="date" series={[{ key: m.id, label: m.label }]} pattern="dither" />}
    </MetricTabs>
  );
}`,
  use: [
    "At the head of a dashboard, where a few figures summarize the page and one chart explains whichever is picked.",
    "Give each one a delta and say which way is good, so a fall in refunds or errors reads as good news.",
    "Pass a function as children to draw the chart for the chosen metric.",
  ],
  avoid: ["For one figure on its own: use Stat.", "For more than five figures: they get cramped; split them across sections."],
  parts: [
    {
      name: "MetricTabs",
      note: "A card with the metrics as tabs, and the chosen one's view under them.",
      props: [
        { name: "metrics", type: "Metric[]", note: "id, label, value, and optionally format, delta, good and note.", required: true },
        { name: "value", type: "string", note: "The chosen metric's id, when you control it." },
        { name: "defaultValue", type: "string", note: "The one chosen at first. The first metric by default." },
        { name: "onValueChange", type: "(id: string) => void", note: "Told when another is picked." },
        { name: "children", type: "ReactNode | (metric: Metric) => ReactNode", note: "What shows under the tabs; a function gets the chosen metric." },
        { name: "currency", type: "string", default: '"USD"', note: "For metrics formatted as currency." },
        { name: "label", type: "string", default: '"Metrics"', note: "What the tabs are, for a screen reader." },
      ],
    },
    {
      name: "Metric",
      props: [
        { name: "format", type: '"number" | "compact" | "currency" | "percent" | (value) => string', default: '"number"', note: "How its value reads." },
        { name: "delta", type: "number", note: "Its change as a share: 0.12 is up 12%." },
        { name: "good", type: '"up" | "down"', default: '"up"', note: "Which way is good news: green that way, red the other." },
        { name: "note", type: "ReactNode", note: "A short line under it, like vs last week." },
      ],
    },
  ],
  examples: [{ id: "plain", title: "Without a chart", note: "Leave out children and it's a row of figures that still picks one.", code: `<MetricTabs metrics={metrics} onValueChange={setMetric} />` }],
  keyboard: [
    { keys: "Left Right", does: "Moves to the metric before or after, and picks it." },
    { keys: "Tab", does: "Leaves for the view under them." },
  ],
  a11y: ["The metrics are tabs and what's under them their panel, so a screen reader hears which one it's showing.", "Good and bad news is said in color and with an arrow, never color alone."],
};
