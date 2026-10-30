import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { ParticleText } from "@/components/basedraft/particle-text";

export function Hero() {
  return <ParticleText words={["draft", "design", "ship"]} height={220} className="font-display" />;
}`,
  use: [
    "For a hero's one big word, or a short set of words that turn into each other: a launch, a section opener, a 404.",
    "Give it your display face through className; the letters are set in whatever font the box has.",
    "Keep words short: they're set as large as the box allows, so a long one gets small.",
  ],
  avoid: [
    "For text people read: it's drawn, so keep the real heading nearby for search and reading.",
    "More than once on a page: it's the loudest thing there.",
  ],
  parts: [
    {
      name: "ParticleText",
      note: "A box of the given height, as wide as its parent, with the word drawn in it.",
      props: [
        { name: "words", type: "string[]", note: "The words, shown in turn; one holds still.", required: true },
        { name: "interval", type: "number", default: "3200", note: "How long each word stays, in ms." },
        { name: "height", type: "number", default: "220", note: "The box's height; the word fits it." },
        { name: "gap", type: "number", default: "4", note: "The space between pixels, in px." },
        { name: "dither", type: "boolean", default: "true", note: "Lights the letters from above through an ordered dither; false fills them solid." },
        { name: "repel", type: "number", default: "90", note: "How far the pointer pushes pixels, in px; 0 turns it off." },
        { name: "weight", type: "number", default: "600", note: "The weight the word is set in." },
        { name: "className", type: "string", note: "Added to the box: the font goes here." },
      ],
    },
  ],
  examples: [
    {
      id: "still",
      title: "One word",
      note: "A single word holds still; finer pixels, a lighter weight and a smaller reach for the pointer.",
      code: `<ParticleText words={["basedraft"]} height={150} gap={3} repel={70} weight={500} />`,
    },
  ],
  keyboard: [{ keys: "None", does: "It's to look at; there's nothing to press." }],
  a11y: [
    "The word is live text for screen readers, announced as it changes; the drawing is hidden from them.",
    "With reduced motion the pixels don't fly or scatter: each word simply shows.",
  ],
};
