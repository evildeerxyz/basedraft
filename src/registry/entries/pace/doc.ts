import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Pace, type PaceItem } from "@/components/basedraft/pace";

const items: PaceItem[] = [
  { id: "minutes", label: "Build minutes", used: 2380, limit: 6000, projected: 5950, unit: "min" },
  { id: "images", label: "Image optimizations", used: 3140, limit: 5000, projected: 7850 },
];

export function ThisPeriod() {
  return <Pace items={items} end="Nov 30" label="This period's allowances" />;
}`,
  use: [
    "For a plan's allowances partway through a period: will any of them go past it by the end?",
    "Work out projected yourself (used so far, over the days gone, times the days in the period), or pass your own forecast.",
    "Lead it with a sentence that answers the question, and let the chart show why.",
  ],
  avoid: ["For one allowance on its own: use Allowance.", "For a balance spent down over time: use Runway."],
  props: [
    { name: "items", type: "PaceItem[]", note: "Each allowance: id, label, used, limit and projected, with an icon and unit if you like.", required: true },
    { name: "end", type: "string", note: "The period's last day, as it's read: \"Nov 30\".", required: true },
    { name: "format", type: "(n: number) => string", note: "How the figures read; commas, and millions shortened, by default." },
    { name: "label", type: "string", default: "\"Allowances\"", note: "What it shows, for screen readers." },
  ],
  examples: [{ id: "narrow", title: "In a narrow box", note: "Each line moves under its name, and the plan's line is drawn on each.", code: `<div className="w-[340px]">\n  <Pace items={items} end="Nov 30" />\n</div>` }],
  keyboard: [{ keys: "None", does: "It shows figures; it isn't a control." }],
  a11y: ["Each row is read as a sentence: used so far, of how much, where it's heading and whether that's past the plan.", "Past the plan is said in the percentage and the words, not by amber alone."],
};
