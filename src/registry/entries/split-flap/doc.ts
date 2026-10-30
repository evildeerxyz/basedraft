import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { SplitFlap } from "@/components/basedraft/split-flap";

export function Status({ status }: { status: string }) {
  return (
    <div className="rounded-2xl bg-neutral-950 p-3 text-xl">
      <SplitFlap value={status} length={9} />
    </div>
  );
}`,
  use: [
    "For short values that change and deserve to be seen changing: a status, a countdown's words, a launch board, an arrivals list.",
    "Set its size with font-size: every tile is sized in em.",
    "Give it a length so a shorter value pads with blanks and the row keeps its shape.",
  ],
  avoid: [
    "For long text or text people read closely: it's slow on purpose.",
    "For numbers that change many times a second: use Number, which rolls.",
  ],
  parts: [
    {
      name: "SplitFlap",
      note: "A row of tiles, one per letter.",
      props: [
        { name: "value", type: "string", note: "What it shows. It turns upper case; letters it doesn't have show as blanks.", required: true },
        { name: "length", type: "number", note: "How many tiles, padded with blanks. The value's length by default." },
        { name: "align", type: '"left" | "right"', default: '"left"', note: "Where the value sits when there are spare tiles." },
        { name: "speed", type: "number", default: "60", note: "Ms for each flap to turn." },
        { name: "stagger", type: "number", default: "40", note: "Ms between one tile starting and the next." },
        { name: "color", type: "string", note: "The letters' color: amber for a delay, green for a go." },
        { name: "className", type: "string", note: "Added to the row: its font-size sets the tiles." },
      ],
    },
    {
      name: "FLAPS",
      note: "The characters the tiles turn through, in order: a blank, A to Z, 0 to 9 and : . - ' / &.",
      props: [],
    },
  ],
  examples: [
    {
      id: "type",
      title: "Type on it",
      note: "Twelve tiles following an input, a little faster: each letter flips forward to what you type.",
      code: `<SplitFlap value={text} length={12} speed={45} stagger={30} />`,
    },
  ],
  keyboard: [{ keys: "None", does: "It shows; there's nothing to press." }],
  a11y: [
    "It's read as its value, not tile by tile, and not the letters it passes on the way.",
    "With reduced motion each tile shows its letter at once.",
  ],
};
