import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { useState } from "react";
import { Tour } from "@/components/basedraft/tour";

export function StudioTour() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Take the tour</button>
      <Tour
        open={open}
        onOpenChange={setOpen}
        steps={[
          { target: "#sections", side: "right", title: "Your page, section by section", body: "Drag one to move it." },
          { target: "#publish", title: "Publish when it's ready" },
        ]}
      />
    </>
  );
}`,
  use: [
    "For showing someone around a screen the first time they see it, or after it changed: three to five stops, no more.",
    "Point each step at the thing itself, with a selector or a ref, and say what it's for in a line or two.",
    "Open it from a button people can find again, like Take the tour, rather than only on the first visit.",
  ],
  avoid: [
    "For a hint about one thing: use Tooltip or Hover card.",
    "For the steps a new account should take: use Onboarding.",
    "For a question that needs an answer: use Dialog.",
  ],
  parts: [
    {
      name: "Tour",
      note: "The dim with its window, and the card, in a portal over the page.",
      props: [
        { name: "steps", type: "TourStep[]", note: "The stops, in order.", required: true },
        { name: "open", type: "boolean", note: "Whether it's showing.", required: true },
        { name: "onOpenChange", type: "(open: boolean) => void", note: "Runs when it's ended: Escape, the close button, or Done.", required: true },
        { name: "onFinish", type: "() => void", note: "Runs when Done is pressed on the last step, not when it's ended early." },
        { name: "padding", type: "number", default: "8", note: "How far the window opens past the thing's edges, in pixels." },
        { name: "label", type: "string", default: '"Tour"', note: "What it's called, for a screen reader." },
      ],
    },
    {
      name: "TourStep",
      note: "One stop, as an object in steps.",
      props: [
        { name: "target", type: "string | RefObject<HTMLElement>", note: "What it points at: a CSS selector, or a ref to the element.", required: true },
        { name: "title", type: "string", note: "What it is, in a line.", required: true },
        { name: "body", type: "ReactNode", note: "What it's for, in a line or two." },
        { name: "side", type: '"top" | "bottom" | "left" | "right"', default: '"bottom"', note: "Where the card sits; it goes round to another side if there isn't room." },
      ],
    },
  ],
  examples: [
    {
      id: "studio",
      title: "Four stops",
      note: "Each step points at an element by ref; the card goes to whichever side has room.",
      code: `const steps = [
  { target: sectionsRef, side: "right", title: "Your page, section by section", body: "Drag one to move it." },
  { target: devicesRef, title: "See it on every screen" },
  { target: previewRef, title: "Preview before it's live" },
  { target: publishRef, title: "Publish when it's ready" },
];

<Tour steps={steps} open={open} onOpenChange={setOpen} />`,
    },
  ],
  keyboard: [
    { keys: "→ Enter", does: "Goes to the next step, or finishes on the last." },
    { keys: "←", does: "Goes back a step." },
    { keys: "Tab", does: "Moves between the card's buttons, and stays in the card." },
    { keys: "Escape", does: "Ends the tour, and focus goes back where it was." },
  ],
  a11y: [
    "The card is a modal dialog named by its step's title and described by its body, and focus stays in it while the tour is open.",
    "It says which step it is, like 2 of 4, in words as well as dots.",
    "When the tour ends, focus goes back to whatever had it before, like the button that started it.",
    "With reduced motion, the window and the card jump to each step instead of gliding.",
  ],
};
