import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Funnel } from "@/components/basedraft/funnel";

export function Signups() {
  return (
    <Funnel
      label="From visit to Pro"
      steps={[
        { label: "Visited", value: 48210 },
        { label: "Signed up", value: 4860 },
        { label: "Published", value: 2105 },
        { label: "Went Pro", value: 642 },
      ]}
    />
  );
}`,
  use: [
    "For steps people go through in order, where each keeps some of the last: visit to signup, cart to paid, invite to joined.",
    "Keep it to the steps that matter, three to six, so each bar has room for its numbers.",
    "Use dither for a page with dithered charts, and dither={false} for a calmer one.",
  ],
  avoid: [
    "For values that don't follow from one another: use Bar chart or Bar list.",
    "For a trend over time: use Area chart.",
    "For parts of one whole: use Donut chart.",
  ],
  parts: [
    {
      name: "Funnel",
      note: "The bars, the flow between them, and each step's numbers under it.",
      props: [
        { name: "steps", type: "{ label: string; value: number }[]", note: "The steps in order, each with how many reached it.", required: true },
        { name: "label", type: "string", note: "What it shows, for a screen reader.", required: true },
        { name: "height", type: "number", default: "200", note: "How tall the bars can stand, in pixels. It's as wide as its box." },
        { name: "color", type: "string", default: '"var(--bd-ui-viz-1)"', note: "The bars' color: any CSS color." },
        { name: "dither", type: "boolean", default: "true", note: "The ones lost dissolve as dots over each bar; false holds them as a faint wash." },
        { name: "format", type: "(value: number) => string", default: "grouped", note: "The counts as they read." },
        { name: "className", type: "string", note: "Added to its box." },
      ],
    },
  ],
  examples: [
    {
      id: "short",
      title: "Three steps",
      note: "A checkout, shorter and in another color.",
      code: `<Funnel
  label="Checkout"
  height={160}
  color="var(--bd-ui-viz-2)"
  steps={[
    { label: "Cart", value: 1840 },
    { label: "Details", value: 1210 },
    { label: "Paid", value: 968 },
  ]}
/>`,
    },
    {
      id: "wash",
      title: "Without dither",
      note: "dither={false}: the ones lost are a faint wash over each bar.",
      code: `<Funnel label="Invites" dither={false} steps={invites} />`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves onto the funnel." },
    { keys: "← →", does: "Moves between steps, opening each one's card." },
    { keys: "Home End", does: "Moves to the first or last step." },
    { keys: "Escape", does: "Closes the card." },
  ],
  a11y: [
    "A group named by label, with a picture that lists every step and how many made it through.",
    "Moving with the keys says each step aloud: its count, its share of the first step, and what it kept from the one before.",
    "Every number is also written under its bar, so nothing is said by height alone.",
    "With reduced motion, the bars stand at once instead of rising.",
  ],
};
