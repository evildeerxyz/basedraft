import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import {
  DataTable,
  type DataTableColumn,
} from "@/components/basedraft/data-table";

type Order = { id: string; name: string; amount: number; date: string };

const columns: DataTableColumn<Order>[] = [
  { key: "id", header: "Order", cell: (o) => o.id, sortBy: (o) => o.id },
  {
    key: "name",
    header: "Customer",
    cell: (o) => o.name,
    sortBy: (o) => o.name,
  },
  {
    key: "amount",
    header: "Amount",
    cell: (o) => \`$\${o.amount}\`,
    sortBy: (o) => o.amount,
    align: "end",
  },
  { key: "date", header: "Date", cell: (o) => o.date, sortBy: (o) => o.date },
];

export function Purchases({ orders }: { orders: Order[] }) {
  return (
    <DataTable
      label="Purchases"
      rows={orders}
      columns={columns}
      rowKey={(o) => o.id}
      rowLabel={(o) => \`order \${o.id}\`}
      selectable
      defaultSort={{ key: "date", direction: "desc" }}
    />
  );
}`,
  use: [
    "For records people scan, compare and act on: orders, members, invoices, deploys.",
    "With selectable when people act on several rows at once, like refunding or exporting them.",
    "With expand when each row has details that would crowd the columns.",
    "With maxHeight and stickyFirstColumn for long or wide tables, so the header and the row's name stay in view.",
  ],
  avoid: [
    "For a handful of items people reorder by hand: use Sortable list.",
    "For a few key figures: use Stat.",
    "For one record's fields: a Card with a short list reads better than a one-row table.",
  ],
  parts: [
    {
      name: "DataTable",
      props: [
        { name: "rows", type: "T[]", required: true, note: "The records, in the order they come when no column is sorted." },
        { name: "columns", type: "DataTableColumn<T>[]", required: true, note: "One per column, in order. See DataTableColumn." },
        { name: "rowKey", type: "(row: T) => string", required: true, note: "A stable key for each row. Selection and open rows are kept by it." },
        { name: "label", type: "string", required: true, note: "What the table is, as its caption for screen readers." },
        { name: "rowLabel", type: "(row: T) => string", note: 'Each row\'s name for its box and its disclosure: "order BD-1042". Its position by default.' },
        { name: "selectable", type: "boolean", default: "false", note: "A box at the start of each row, and one in the header that picks or clears them all. Shift-click picks a run." },
        { name: "selected", type: "string[]", note: "Controlled: the picked rows' keys." },
        { name: "defaultSelected", type: "string[]", default: "[]", note: "The rows picked to start with, uncontrolled." },
        { name: "onSelectedChange", type: "(keys: string[]) => void", note: "Called with the picked keys each time they change." },
        { name: "sort", type: '{ key: string; direction: "asc" | "desc" } | null', note: "Controlled: the sorted column and its direction, or null for the rows' own order." },
        { name: "defaultSort", type: "DataTableSort", default: "null", note: "Where sorting starts, uncontrolled." },
        { name: "onSortChange", type: "(sort: DataTableSort) => void", note: "Called as a header is clicked: up, then down, then back to the rows' own order." },
        { name: "expand", type: "(row: T) => ReactNode", note: "What a row opens to. With it, each row gets a disclosure at its start." },
        { name: "density", type: '"compact" | "regular" | "relaxed"', default: '"regular"', note: "How much room each row has." },
        { name: "empty", type: "ReactNode", note: "Shown when there are no rows, in place of the default line." },
        { name: "maxHeight", type: "number | string", note: "Past this height the rows scroll under a header that stays put." },
        { name: "stickyFirstColumn", type: "boolean", default: "false", note: "Holds the boxes, the disclosure and the first column still while the rest scrolls sideways, with a soft edge once it does." },
        { name: "actions", type: "(picked: string[], clear: () => void) => ReactNode", note: "Buttons for the picked rows. While any are picked they ride an ink bar that springs up over the table's foot, with the count and a button to clear them." },
        { name: "onRowClick", type: "(row: T) => void", note: "Opens a row on a click anywhere in it that isn't one of its own controls (its box, its menu, a link): into a panel beside the table, or its page." },
        { name: "active", type: "string | null", note: "The key of the row that's open, so it stays lit while it is." },
        { name: "className", type: "string", note: "Goes on the white sheet the table sits on." },
      ],
    },
    {
      name: "DataTableColumn",
      note: "One column, as an object in columns.",
      props: [
        { name: "key", type: "string", required: true, note: "Unique among the columns. Sorting is kept by it." },
        { name: "header", type: "ReactNode", required: true, note: "What the column is." },
        { name: "cell", type: "(row: T) => ReactNode", required: true, note: "What the column shows for a row." },
        { name: "sortBy", type: "(row: T) => string | number | Date", note: "What it sorts by. With it, the header becomes a button. Strings sort as people expect, so BD-9 comes before BD-10." },
        { name: "align", type: '"start" | "end"', default: '"start"', note: "End-align numbers and money, so their digits line up." },
        { name: "width", type: "string", note: 'A CSS width: "120px", "30%".' },
      ],
    },
  ],
  examples: [
    {
      id: "sorting",
      title: "Sorting",
      note: "Each click on a header goes up, then down, then back to the rows' own order. The arrow turns as the direction flips, and the rows glide to their new places.",
      code: `<DataTable
  label="Purchases"
  rows={orders}
  columns={columns}
  rowKey={(o) => o.id}
  defaultSort={{ key: "amount", direction: "desc" }}
/>`,
    },
    {
      id: "selection",
      title: "Picking rows",
      note: "Controlled, with a bar that acts on the picked rows. Shift-click picks every row between the last one and this one.",
      code: `const [picked, setPicked] = useState<string[]>(["BD-1047"]);

<span>
  {picked.length
    ? \`\${picked.length} picked. Shift-click to pick a run.\`
    : "Pick rows, or shift-click a run of them."}
</span>
<button type="button" disabled={!picked.length} onClick={() => setPicked([])}>
  Refund {picked.length || ""}
</button>
<DataTable
  label="Purchases"
  rows={orders}
  columns={columns}
  rowKey={(o) => o.id}
  rowLabel={(o) => \`order \${o.id}\`}
  selectable
  selected={picked}
  onSelectedChange={setPicked}
  density="compact"
/>`,
    },
    {
      id: "expand",
      title: "Rows that open",
      note: "expand gives each row a disclosure; the row opens to whatever it returns, and the rows under it make room.",
      code: `<DataTable
  label="Purchases"
  rows={orders}
  columns={columns}
  rowKey={(o) => o.id}
  rowLabel={(o) => \`order \${o.id}\`}
  expand={(o) => (
    <div className="flex items-center gap-8 text-[13px]">
      <span>Paid by card ending 4242</span>
      <span>{o.product === "Team" ? "10 seats" : "1 seat"}</span>
      <button type="button">Receipt</button>
    </div>
  )}
/>`,
    },
    {
      id: "long",
      title: "Two hundred rows",
      note: "A header that stays put as the rows scroll under it, and a first column that holds still when it scrolls sideways. Past 80 rows a sort lands at once rather than gliding.",
      code: `<DataTable
  label="All purchases"
  rows={orders}
  columns={columns}
  rowKey={(o) => o.id}
  rowLabel={(o) => \`order \${o.id}\`}
  selectable
  stickyFirstColumn
  density="compact"
  maxHeight={320}
/>`,
    },
    {
      id: "empty",
      title: "Nothing yet",
      note: "With no rows it says so: a line of its own by default, or what you pass to empty.",
      code: `<DataTable
  label="Refunds"
  rows={[]}
  columns={columns}
  rowKey={(o) => o.id}
  empty={
    <span className="inline-flex flex-col items-center gap-1 text-sm">
      <span className="font-medium">No refunds this month</span>
      <span>Refunded orders show up here.</span>
    </span>
  }
/>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves between the header's sort buttons, the boxes and the disclosures." },
    { keys: "Enter / Space", does: "On a header, sorts by it: up, then down, then the rows' own order. On a disclosure, opens or closes its row." },
    { keys: "Space", does: "On a box, picks or unpicks its row; on the header's box, every row." },
    { keys: "Shift + Space", does: "On a box, picks or unpicks every row from the last one to this one." },
  ],
  a11y: [
    "It's a real table with a caption named by label, so screen readers announce it and move cell by cell.",
    "The picked rows' bar is a toolbar named by the count (\"2 picked\"), reached with Tab after the table; its last button clears the picks.",
    'A sortable header carries aria-sort ("ascending", "descending" or "none") and its sort button is named by the header.',
    "Each row's box is a checkbox named after the row; the header's reads as mixed while only some rows are picked.",
    "Each disclosure says whether its row is open and points at the region it opens, named after the row.",
    "With reduced motion, rows land in their new order at once and open rows appear without growing.",
  ],
};
