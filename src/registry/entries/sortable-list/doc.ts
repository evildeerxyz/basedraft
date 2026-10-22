import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { SortableList } from "@/components/basedraft/sortable-list";

export function Outline() {
  const [sections, setSections] = useState([
    { id: "nav", name: "Navigation" },
    { id: "hero", name: "Hero" },
    { id: "features", name: "Features" },
    { id: "pricing", name: "Pricing" },
  ]);
  return (
    <SortableList
      label="Home page sections"
      items={sections}
      itemKey={(s) => s.id}
      itemLabel={(s) => s.name}
      onReorder={setSections}
      renderItem={(s) => s.name}
    />
  );
}`,
  use: [
    "For a short list whose order is the point: a page's sections, a playlist, steps, a priority list.",
    "With handle when the rows hold text people select or controls that need the whole row.",
    "Inside a box that scrolls: dragging near its top or bottom scrolls it along.",
  ],
  avoid: [
    "For records sorted by a value, like newest first: use Data table and let a column sort them.",
    "For picking items rather than ordering them: use Checkbox rows or Select.",
    "For a list longer than people can reasonably drag through, offer a move-to action as well.",
  ],
  parts: [
    {
      name: "SortableList",
      props: [
        { name: "items", type: "T[]", required: true, note: "The items, in their current order. New items from outside replace the list, unless a row is being moved." },
        { name: "itemKey", type: "(item: T) => string", required: true, note: "A stable key for each item." },
        { name: "renderItem", type: "(item: T, state: { dragging: boolean; index: number }) => ReactNode", required: true, note: "What each row shows. dragging is true while it's picked up; index is its place." },
        { name: "label", type: "string", required: true, note: "What the list is, for screen readers." },
        { name: "onReorder", type: "(items: T[]) => void", note: "Called with the items in their new order each time one is put down somewhere new. Without it the list keeps its own order." },
        { name: "itemLabel", type: "(item: T) => string", note: "Each item's name, for the row and for what's said as it moves. Its position by default." },
        { name: "handle", type: "boolean", default: "false", note: "Drag only by the grip at the start of each row. Without it, the whole row drags with a mouse or pen, and a finger picks a row up by holding it for a moment." },
        { name: "className", type: "string", note: "Goes on the list's white sheet." },
      ],
    },
  ],
  examples: [
    {
      id: "row",
      title: "Drag the whole row",
      note: "The row lifts as you drag it; the others slide apart to make room, and it settles at the speed you let go. On a touch screen, hold it for a moment first, so a swipe still scrolls.",
      code: `<SortableList
  label="Home page sections"
  items={sections}
  itemKey={(s) => s.id}
  itemLabel={(s) => s.name}
  onReorder={setSections}
  renderItem={(s) => <SectionRow s={s} />}
/>`,
    },
    {
      id: "handle",
      title: "Only by the grip",
      note: "With handle, the grip is the only way to drag, so the rest of the row is free for text and controls.",
      code: `<SortableList
  label="Home page sections"
  items={sections}
  itemKey={(s) => s.id}
  itemLabel={(s) => s.name}
  onReorder={setSections}
  handle
  renderItem={(s) => (
    <span className="block leading-tight">
      <span className="block text-sm font-medium">{s.name}</span>
      <span className="block text-[12px]">
        {s.note}. Select this text; only the grip drags.
      </span>
    </span>
  )}
/>`,
    },
    {
      id: "long",
      title: "Thirty rows in a short box",
      note: "Drag toward the box's top or bottom and it scrolls along, faster the nearer the edge.",
      code: `<div className="h-[280px] overflow-y-auto">
  <SortableList
    label="Pages"
    items={pages}
    itemKey={(p) => p.id}
    itemLabel={(p) => p.name}
    onReorder={setPages}
    renderItem={(p, { index }) => (
      <span className="flex items-center justify-between">
        <span className="font-medium">{p.name}</span>
        <span>{index + 1}</span>
      </span>
    )}
  />
</div>`,
    },
    {
      id: "keyboard",
      title: "From the keyboard",
      note: "Every move a pointer makes, the keyboard makes too, and each step is said out loud.",
      code: `<SortableList
  label="Home page sections"
  items={sections}
  itemKey={(s) => s.id}
  itemLabel={(s) => s.name}
  onReorder={setSections}
  renderItem={(s) => <SectionRow s={s} />}
/>
<p>
  Tab to a row, Space to pick it up, the arrows to move it, Space to put it
  down.
</p>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves into the list, to the last row that had focus." },
    { keys: "ArrowUp / ArrowDown", does: "Moves focus between rows. With a row picked up, moves it one place." },
    { keys: "Home / End", does: "Moves focus to the first or last row. With a row picked up, moves it to the top or the bottom." },
    { keys: "Space / Enter", does: "Picks the focused row up, or puts it down where it is." },
    { keys: "Escape", does: "Puts the row back where it was picked up." },
  ],
  a11y: [
    "Each row is focusable, named with itemLabel, and described by how to move it.",
    "Picking up, each move, putting down and putting back are said through an assertive live region, with the row's name and its position out of how many.",
    "Buttons and links inside a row stay clickable; a drag never starts on them.",
    "With reduced motion, rows move to their places at once instead of springing.",
  ],
};
