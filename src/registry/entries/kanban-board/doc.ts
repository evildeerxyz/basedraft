import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import {
  KanbanBoard,
  type KanbanColumn,
} from "@/components/basedraft/kanban-board";

const launch: KanbanColumn[] = [
  {
    id: "ideas",
    title: "Ideas",
    cards: [{ id: "c1", title: "A pricing page for Auren", tags: ["Copy"] }],
  },
  {
    id: "writing",
    title: "Writing",
    limit: 3,
    cards: [{ id: "c2", title: "Zuno hero, take two", people: ["Olivia Bennett"] }],
  },
  { id: "review", title: "In review", cards: [] },
  { id: "shipped", title: "Shipped", cards: [] },
];

export function LaunchBoard() {
  return (
    <KanbanBoard
      label="Zuno launch"
      defaultColumns={launch}
      onAddCard={(_, title) => ({ id: crypto.randomUUID(), title })}
    />
  );
}`,
  use: [
    "For work that moves through stages: a launch, a content calendar, hiring, support.",
    "When people move things by hand and the order inside a column matters.",
    "Give it a label: it names the board for screen readers and their announcements.",
  ],
  avoid: [
    "For one list in one order, like a page's sections: use SortableList.",
    "For many rows to sort and scan by their fields: use DataTable.",
  ],
  parts: [
    {
      name: "KanbanBoard",
      note: "Columns side by side, scrolling across when they don't fit. Cards lift and travel with the pointer or the keyboard; the others make room.",
      props: [
        { name: "label", type: "string", note: "What the board is, for screen readers: \"Zuno launch\".", required: true },
        { name: "columns", type: "KanbanColumn[]", note: "The columns and their cards, when you keep them." },
        { name: "defaultColumns", type: "KanbanColumn[]", default: "[]", note: "The columns at first, when the board keeps them." },
        { name: "onColumnsChange", type: "(columns, move?) => void", note: "Called with the new columns each time a card is moved or added; move says which card went where." },
        { name: "renderCard", type: "(card) => ReactNode", note: "What a card shows. Its title, note, tags, people and meta by default." },
        { name: "onAddCard", type: "(columnId, title) => card | void", note: "Shows Add a card at each column's foot. Return the new card, or add it yourself when you keep the columns." },
        { name: "collapsible", type: "boolean", default: "true", note: "Lets each column fold to a narrow strip." },
        { name: "defaultCollapsed", type: "string[]", default: "[]", note: "Columns folded at first, by id." },
        { name: "enforceLimits", type: "boolean", default: "false", note: "Turns a card away from a column that's at its limit. Without it, the count only turns red." },
        { name: "size", type: '"md" | "sm"', default: '"md"', note: "md for a page, sm for a card or a side panel." },
      ],
    },
    {
      name: "KanbanColumn",
      note: "The shape of a column.",
      props: [
        { name: "id", type: "string", note: "Unique on the board.", required: true },
        { name: "title", type: "string", note: "Its name at the top.", required: true },
        { name: "limit", type: "number", note: "How many cards it should hold." },
        { name: "cards", type: "KanbanCard[]", note: "Its cards, top to bottom.", required: true },
      ],
    },
    {
      name: "KanbanCard",
      note: "The shape of a card. Add fields of your own and draw them with renderCard.",
      props: [
        { name: "id", type: "string", note: "Unique on the board.", required: true },
        { name: "title", type: "string", note: "What it is.", required: true },
        { name: "note", type: "string", note: "A line or two under the title." },
        { name: "tags", type: "string[]", note: "Small labels over the title." },
        { name: "people", type: "string[]", note: "Who it's with, drawn as initials." },
        { name: "meta", type: "string", note: "A quiet word at the foot: a date, an estimate." },
      ],
    },
  ],
  examples: [
    {
      id: "limits",
      title: "Limits",
      note: "A column with a limit shows its count against it, and with enforceLimits turns cards away once it's full.",
      code: `<KanbanBoard label="Review queue" enforceLimits defaultColumns={[
  { id: "todo", title: "To review", cards: [...] },
  { id: "doing", title: "Reviewing", limit: 2, cards: [...] },
  { id: "done", title: "Approved", cards: [] },
]} />`,
    },
    {
      id: "compact",
      title: "Compact",
      note: "size=\"sm\" for a card or a side panel, with the last column folded.",
      code: `<KanbanBoard
  label="This week"
  size="sm"
  defaultCollapsed={["done"]}
  defaultColumns={columns}
/>`,
    },
    {
      id: "custom",
      title: "Your own cards",
      note: "renderCard draws a card your way; the board still lifts, moves and announces it.",
      code: `<KanbanBoard
  label="Orders"
  defaultColumns={orders}
  renderCard={(o) => (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium">{o.title}</span>
      <span className="text-xs tabular-nums">{o.meta}</span>
    </div>
  )}
/>`,
    },
  ],
  keyboard: [
    { keys: "Space / Enter", does: "Lifts the focused card, or drops the one you're carrying." },
    { keys: "Up / Down", does: "Moves the carried card within its column, or moves focus between cards." },
    { keys: "Left / Right", does: "Carries the card to the column beside, or moves focus there." },
    { keys: "Esc", does: "Puts the carried card back where it started." },
  ],
  a11y: [
    "The board is a labelled region; each column is a list named by its title and count.",
    "Lifting, moving and dropping a card are announced in a live region: where it is, out of how many.",
    "Every drag has the keyboard equal above, and reduced motion moves cards without the travel.",
  ],
};
