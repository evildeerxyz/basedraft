import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Heatmap } from "@/components/basedraft/heatmap";

export function Deploys({ days }: { days: { date: string; value: number }[] }) {
  return (
    <Heatmap
      label="Deploys to zuno.site"
      data={days}
      format={(n) => \`\${n} \${n === 1 ? "deploy" : "deploys"}\`}
    />
  );
}`,
  use: [
    "For a habit or a rhythm over months: deploys, commits, posts, sales by day, a team's activity.",
    "Give it format so a day's card says what was counted: 14 deploys, not 14.",
    "Leave weeks out and it fits as many as its width holds, the latest ones; set weeks for a fixed span, like a quarter.",
  ],
  avoid: [
    "For how much, more than when: use Bar chart, which reads values exactly.",
    "For a trend you want to follow day to day: use Area chart.",
    "For whether a service was up each day: use Uptime.",
  ],
  parts: [
    {
      name: "Heatmap",
      note: "A grid of days in columns of weeks, one stop for Tab.",
      props: [
        { name: "data", type: "{ date: string; value: number }[]", note: "The days that had anything, as YYYY-MM-DD. Days left out count as zero.", required: true },
        { name: "label", type: "string", note: "What it shows, for a screen reader.", required: true },
        { name: "end", type: "string", note: "The last day shown, as YYYY-MM-DD. The latest day in data by default." },
        { name: "weeks", type: "number", note: "How many weeks. As many as fit its width by default, up to a year." },
        { name: "weekStart", type: "0 | 1", default: "0", note: "The day a week starts on: 0 for Sunday, 1 for Monday." },
        { name: "levels", type: "number", default: "4", note: "How many shades past an empty day." },
        { name: "thresholds", type: "number[]", note: "Where each shade starts, lowest first. By default the active days split evenly, so each shade holds about as many." },
        { name: "pattern", type: '"dither" | "solid"', default: '"dither"', note: "Each shade as an ordered dither, or as solid steps." },
        { name: "color", type: "string", default: '"var(--bd-ui-viz-1)"', note: "The cells' color: any CSS color." },
        { name: "format", type: "(value: number) => string", note: "A day's count as its card and a screen reader say it." },
        { name: "onSelect", type: "(day: { date: string; value: number }) => void", note: "Runs when a day is clicked, or chosen with Enter." },
        { name: "legend", type: "boolean", default: "true", note: "Shows Less, the shades, More, under it." },
        { name: "className", type: "string", note: "Added to its box." },
      ],
    },
  ],
  examples: [
    {
      id: "year",
      title: "A year",
      note: "As many weeks as fit, each day dithered by how busy it was.",
      code: `<Heatmap label="Deploys to zuno.site" data={deploys} format={(n) => \`\${n} deploys\`} />`,
    },
    {
      id: "solid",
      title: "Solid shades",
      note: "pattern=\"solid\" steps the color's strength instead, in another color and starting weeks on Monday.",
      code: `<Heatmap
  label="Posts"
  data={posts}
  pattern="solid"
  color="var(--bd-ui-viz-2)"
  weekStart={1}
  format={(n) => \`\${n} posts\`}
/>`,
    },
    {
      id: "quarter",
      title: "A quarter",
      note: "weeks fixes the span; thresholds set where each shade starts.",
      code: `<Heatmap
  label="Sales by day"
  data={sales}
  weeks={13}
  thresholds={[1, 5, 10, 20]}
  format={(n) => \`\${n} sales\`}
/>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves onto the heatmap, starting at the last day." },
    { keys: "← →", does: "Moves a week back or ahead." },
    { keys: "↑ ↓", does: "Moves a day back or ahead." },
    { keys: "Home End", does: "Moves to the first or last day." },
    { keys: "Enter", does: "Chooses the day, running onSelect." },
    { keys: "Escape", does: "Closes the day's card." },
  ],
  a11y: [
    "A group named by label, with a picture that sums it up: the total, how many weeks, and the last day.",
    "Moving with the keys says each day and its count aloud, from format.",
    "Shade is never the only sign: every day's count is in its card and read out by the keys.",
    "With reduced motion, the cells appear at once rather than a column at a time.",
  ],
};
