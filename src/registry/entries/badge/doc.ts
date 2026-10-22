import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Badge } from "@basedraft/ui";

export function Status() {
  return (
    <div className="flex gap-2">
      <Badge variant="outline" dot="ok" live>Live</Badge>
      <Badge variant="secondary" dot="idle">Draft</Badge>
      <Badge>Pro</Badge>
    </div>
  );
}`,
  use: [
    "Beside a name, to say what it is or what state it's in: Pro, Draft, Live, Deploying.",
    "Give it a dot for a state that changes, and live for one that's happening right now.",
  ],
  avoid: [
    "For something to click: use Button. A badge isn't interactive.",
    "For a running count that updates: use Number.",
    "For progress: use Meter, or Spinner when there's no telling how long.",
  ],
  parts: [
    {
      name: "Badge",
      note: "A small stamp, as a span.",
      props: [
        { name: "variant", type: '"default" | "secondary" | "outline" | "paper" | "metal"', default: '"default"', note: "Default is ink. Secondary is quiet gray, outline a hairline on white, paper near white, and metal a brushed edge for the rarest thing on the page." },
        { name: "dot", type: '"ok" | "wait" | "stop" | "idle"', note: "A status dot before the text: green, amber, red or gray." },
        { name: "live", type: "boolean", default: "false", note: "The dot pulses, for something happening now. Needs dot." },
        { name: "children", type: "ReactNode", note: "The words; an icon in it sizes to 12px." },
        { name: "...props", type: "span props", note: "Everything a span takes." },
      ],
    },
  ],
  examples: [
    {
      id: "variants",
      title: "Five stamps",
      note: "Ink for the label that matters, gray for the ordinary, metal once.",
      code: `<div className="flex flex-wrap items-center justify-center gap-2">
  <Badge>Pro</Badge>
  <Badge variant="secondary">Free</Badge>
  <Badge variant="outline">Next.js</Badge>
  <Badge variant="paper">53 sections</Badge>
  <Badge variant="metal">Team</Badge>
</div>`,
    },
    {
      id: "dots",
      title: "With a status dot",
      note: "Four states, each with its own color and its own word, so color is never the only sign.",
      code: `<div className="flex flex-wrap items-center justify-center gap-2">
  <Badge variant="outline" dot="ok">Published</Badge>
  <Badge variant="outline" dot="wait">Building</Badge>
  <Badge variant="outline" dot="stop">Failed</Badge>
  <Badge variant="outline" dot="idle">Not started</Badge>
</div>`,
    },
    {
      id: "live",
      title: "Live",
      note: "The dot pulses while something is happening.",
      code: `<div className="flex flex-wrap items-center justify-center gap-2">
  <Badge variant="outline" dot="ok" live>3 people editing</Badge>
  <Badge variant="secondary" dot="wait" live>Deploying zuno.site</Badge>
</div>`,
    },
    {
      id: "icon",
      title: "With an icon",
      note: "A small icon before the words.",
      code: `<div className="flex flex-wrap items-center justify-center gap-2">
  <Badge>
    <DiamondIcon weight="duotone" /> Pro
  </Badge>
  <Badge variant="outline">
    <FigmaLogoIcon weight="duotone" /> Copies to Figma
  </Badge>
</div>`,
    },
  ],
  a11y: [
    "A span with plain text, read as part of what it sits beside.",
    "The dot is decoration; the words carry the state, so it never rests on color alone.",
    "With reduced motion, a live dot stops pulsing.",
  ],
};
