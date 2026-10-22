import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Sparkline } from "@basedraft/ui";

export function SalesCell({ days }: { days: number[] }) {
  return <Sparkline data={days} height={28} label="Sales, last 30 days" />;
}`,
  use: [
    "For a trend beside a number, where the shape matters more than the values: a row of a table, a stat, a sentence.",
    "Give it a label that says what it shows, since a screen reader can't see the line.",
    "Turn on dither for a wash of dots that matches dithered charts nearby, and live for a value still coming in.",
  ],
  avoid: [
    "For reading values off a line, with axes and a crosshair: use Area chart.",
    "For a number with its change and its own line under it: use Stat.",
    "For comparing a few values: use Bar list.",
  ],
  parts: [
    {
      name: "Sparkline",
      note: "An inline picture of the trend.",
      props: [
        { name: "data", type: "number[]", note: "The values, oldest first.", required: true },
        { name: "height", type: "number", default: "32", note: "How tall, in pixels. It's as wide as its box." },
        { name: "color", type: "string", default: '"var(--bd-ui-viz-1)"', note: "The line's color: any CSS color." },
        { name: "fill", type: "boolean", default: "true", note: "A wash under the line." },
        { name: "dither", type: "boolean", default: "false", note: "The wash as dots that thin toward the floor, instead of a fading gradient." },
        { name: "dot", type: "boolean", default: "true", note: "A dot on the latest value." },
        { name: "live", type: "boolean", default: "false", note: "The dot pulses." },
        { name: "label", type: "string", note: "What it shows, for a screen reader. From the first to the last value by default." },
      ],
    },
  ],
  examples: [
    {
      id: "dither",
      title: "Dither or gradient",
      note: "dither turns the wash to dots that thin toward the floor; without it, a gradient fades out.",
      code: `<Sparkline data={zuno} height={56} dither />
<Sparkline data={noma} height={56} />`,
    },
    {
      id: "live",
      title: "In a sentence, live",
      note: "Small enough to sit in a line of text; live makes the latest dot pulse.",
      code: `<p>
  Visitors right now
  <span className="mx-2 inline-block w-24 align-middle">
    <Sparkline data={visitors} height={20} live />
  </span>
  24
</p>`,
    },
  ],
  a11y: [
    "Role img, named by label, so a screen reader hears what it shows rather than nothing.",
    "Without a label, it says the first and the last value.",
    "With reduced motion, the line is there at once instead of drawing in.",
  ],
};
