import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { ScrollArea } from "@basedraft/ui";

export function Notes() {
  return (
    <ScrollArea label="What's new" fade="dither" className="h-72">
      …
    </ScrollArea>
  );
}`,
  use: [
    "For a list or a panel that's longer than its box: release notes, a sidebar, a row of cards, a menu of countries.",
    "Give it a height in className, or a maxHeight to grow to before it scrolls.",
    "Name it with label when nothing inside takes focus, so keyboard users can reach it and scroll.",
  ],
  avoid: [
    "For the page itself: let the page scroll.",
    "For a long table: show the rows in pages with Pagination.",
    "For a strip people swipe one item at a time: use Carousel.",
  ],
  parts: [
    {
      name: "ScrollArea",
      note: "The box, with its own bar and faded edges.",
      props: [
        { name: "children", type: "ReactNode", note: "What scrolls.", required: true },
        { name: "orientation", type: '"vertical" | "horizontal" | "both"', default: '"vertical"', note: "Which way it scrolls. With both, the top and bottom edges fade." },
        { name: "fade", type: '"gradient" | "dither" | "none"', default: '"gradient"', note: "How an edge fades while there's more past it." },
        { name: "maxHeight", type: "number | string", note: "The most it grows to before it scrolls." },
        { name: "label", type: "string", note: "Names the box and lets the keys reach it." },
        { name: "className", type: "string", note: "Added to the outer box: give it a height here." },
        { name: "viewportClassName", type: "string", note: "Added to the box that scrolls: padding goes here, so it scrolls with the content." },
      ],
    },
  ],
  examples: [
    {
      id: "sideways",
      title: "Sideways",
      note: "orientation=\"horizontal\" for a row of cards; the bar runs along the bottom.",
      code: `<ScrollArea orientation="horizontal" label="Templates" viewportClassName="pb-4">
  <div className="flex gap-3">…</div>
</ScrollArea>`,
    },
    {
      id: "grow",
      title: "Grows, then scrolls",
      note: "maxHeight lets a short list stay short and a long one stop at a size.",
      code: `<ScrollArea maxHeight={180} label="Countries">…</ScrollArea>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "With a label, focuses the box." },
    { keys: "↑ ↓ Page Up Page Down Space", does: "Scroll it, as the browser does." },
    { keys: "Home End", does: "Go to the top or bottom." },
  ],
  a11y: [
    "Scrolling is the browser's own, so the wheel, touch, keys and screen readers all work as they always do.",
    "With a label it's a region that takes focus, which a scrolling box needs when nothing inside it can.",
    "The bar and the faded edges are drawn only and hidden from screen readers.",
  ],
};
