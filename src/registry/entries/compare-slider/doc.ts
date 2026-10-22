import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { CompareSlider } from "@basedraft/ui";

export function Redesign() {
  return (
    <CompareSlider
      label="The pricing page, before and after"
      before={<img src="/pricing-old.jpg" alt="The old pricing page" />}
      after={<img src="/pricing-new.jpg" alt="The new pricing page" />}
    />
  );
}`,
  use: [
    "For showing what changed between two versions of the same picture: a redesign, a photo's edit, light and dark.",
    "Use the same size and framing on both sides, so only the change moves.",
    "Name the sides with labels when it isn't obvious which is which.",
  ],
  avoid: [
    "For two different things side by side: show them side by side.",
    "For a run of several pictures: use Carousel.",
  ],
  parts: [
    {
      name: "CompareSlider",
      note: "Two layers and the line between them.",
      props: [
        { name: "before", type: "ReactNode", note: "The left side. An image fills it.", required: true },
        { name: "after", type: "ReactNode", note: "The right side.", required: true },
        { name: "labels", type: "[string, string] | false", default: '["Before", "After"]', note: "Each side's name, in its corner; they step aside as the line comes near." },
        { name: "value", type: "number", note: "Where the line is, from 0 to 100, when you keep it." },
        { name: "defaultValue", type: "number", default: "50", note: "Where the line starts, when the slider keeps it." },
        { name: "onValueChange", type: "(value: number) => void", note: "Runs as the line moves." },
        { name: "ratio", type: "number", default: "1.6", note: "Width over height." },
        { name: "label", type: "string", default: '"Compare"', note: "What the handle says to a screen reader." },
        { name: "...props", type: "div props", note: "Everything a div takes. Size it with className." },
      ],
    },
  ],
  examples: [
    {
      id: "edit",
      title: "A photo's edit",
      note: "The same picture on both sides, square.",
      code: `<CompareSlider
  ratio={1}
  before={<img src="/ava.jpg" alt="Ava in black and white" style={{ filter: "grayscale(1)" }} />}
  after={<img src="/ava.jpg" alt="Ava in color" />}
  className="max-w-[300px]"
/>`,
    },
    {
      id: "quiet",
      title: "Anything, without labels",
      note: "Each side can be any element, here a headline before and after its rewrite.",
      code: `<CompareSlider
  labels={false}
  ratio={2}
  before={<Headline>An AI investment manager for everyone</Headline>}
  after={<Headline dark>Money that manages itself.</Headline>}
/>`,
    },
  ],
  keyboard: [
    { keys: "← →", does: "Moves the line a small step." },
    { keys: "Shift ← →", does: "Moves it a large step." },
    { keys: "Home End", does: "Moves it all the way to one side." },
  ],
  a11y: [
    "The handle is a slider named by label, saying how much of each side shows.",
    "Each side keeps its own alt text, so a screen reader can read both pictures.",
    "With reduced motion, a press moves the line at once rather than springing.",
  ],
};
