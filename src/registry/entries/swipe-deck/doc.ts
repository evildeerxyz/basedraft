import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { SwipeDeck } from "@/components/basedraft/swipe-deck";

export function Triage({ requests }) {
  return (
    <SwipeDeck
      items={requests}
      getKey={(r) => r.id}
      labels={{ right: "Roadmap", left: "Not now", up: "Next up" }}
      onSwipe={(r, direction) => decide(r.id, direction)}
    >
      {(r) => <RequestCard request={r} />}
    </SwipeDeck>
  );
}`,
  use: [
    "For deciding on many things one at a time, where each is a quick yes or no: triaging requests, picking covers, reviewing candidates, sorting a backlog.",
    "Name the three ways for what they mean here; the buttons say them.",
    "Turn star off when there are only two choices.",
  ],
  avoid: [
    "When people need to compare things side by side: use a table or a grid.",
    "For choices that can't be undone: the deck makes deciding light, and Undo is there for that reason.",
  ],
  parts: [
    {
      name: "SwipeDeck",
      note: "The stack, and the buttons under it.",
      props: [
        { name: "items", type: "T[]", note: "The cards, in order.", required: true },
        { name: "getKey", type: "(item: T) => string", note: "A key for each.", required: true },
        { name: "children", type: "(item: T) => ReactNode", note: "What a card shows; it fills the card.", required: true },
        { name: "onSwipe", type: '(item, "left" | "right" | "up") => void', note: "Runs when a card goes." },
        { name: "onUndo", type: "(item, direction) => void", note: "Runs when Undo brings one back, with the way it had gone." },
        { name: "labels", type: "{ left?, right?, up? }", default: '{ left: "Skip", right: "Keep", up: "Star" }', note: "What each way means." },
        { name: "star", type: "boolean", default: "true", note: "Allows the third way, up." },
        { name: "stack", type: "number", default: "3", note: "How many cards show behind each other." },
        { name: "ratio", type: "number", default: "0.8", note: "A card's shape, width over height: 4 by 5 to start." },
        { name: "empty", type: "ReactNode", note: "What shows when every card has gone; Start over sits under it." },
        { name: "label", type: "string", default: '"Cards"', note: "What the deck is, for screen readers." },
        { name: "className", type: "string", note: "Added to its box; it's 360px wide at most." },
      ],
    },
  ],
  examples: [
    {
      id: "covers",
      title: "Two ways",
      note: "star={false} for a plain keep or skip, here picking covers.",
      code: `<SwipeDeck items={covers} getKey={(c) => c.id} star={false}>
  {(c) => <Cover cover={c} />}
</SwipeDeck>`,
    },
  ],
  keyboard: [
    { keys: "→", does: "Keep the top card, or what right means here." },
    { keys: "←", does: "Skip it." },
    { keys: "↑", does: "Star it." },
    { keys: "Backspace ⌘Z", does: "Bring the last one back." },
  ],
  a11y: [
    "The deck is a group that says how many cards are left; each decision is announced.",
    "Every swipe has a button and a key, so nothing needs a drag.",
    "With reduced motion, cards go without flying.",
  ],
};
