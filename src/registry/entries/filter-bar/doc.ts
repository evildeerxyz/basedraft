import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { FilterBar, type Filter } from "@/components/basedraft/filter-bar";

const fields = [
  { id: "status", label: "Status", options: [{ value: "live", label: "Live" }, { value: "failed", label: "Failed" }] },
  { id: "region", label: "Region", plural: "regions", options: [{ value: "fra1", label: "Frankfurt" }, { value: "hnd1", label: "Tokyo" }] },
];

export function Deploys() {
  const [filters, setFilters] = useState<Filter[]>([{ field: "status", values: ["failed"] }]);
  const shown = deploys.filter((d) => filters.every((f) => f.values.includes(d[f.field]) !== !!f.not));
  return <FilterBar noun="deploys" fields={fields} value={filters} onValueChange={setFilters} />;
}`,
  use: ["Above a table, a list or a board people narrow often: deploys, issues, orders.", "Keep the fields to the handful people filter by; each field's options are what's in the data.", "Put a view switch or a count after it as children; they sit at the far end."],
  avoid: ["For one choice: a Segmented or a Select says it in fewer parts.", "For free text search on its own: use an Input with a search icon."],
  parts: [
    {
      name: "FilterBar",
      note: "The chips, the Filter button that adds one, and Clear.",
      props: [
        { name: "fields", type: "FilterField[]", note: "What can be filtered: id, label, icon, options, and a plural for several values.", required: true },
        { name: "value", type: "Filter[]", note: "The filters, when you control them: field, values and not." },
        { name: "defaultValue", type: "Filter[]", default: "[]", note: "The filters at first." },
        { name: "onValueChange", type: "(filters: Filter[]) => void", note: "Told after every change." },
        { name: "noun", type: "string", note: "What's filtered, for the sentence: Showing all deploys, Showing deploys where…" },
        { name: "children", type: "ReactNode", note: "At the far end: a view switch, a count." },
        { name: "label", type: "string", default: '"Filters"', note: "What it is, for a screen reader." },
      ],
    },
  ],
  examples: [{ id: "empty", title: "Starting empty", note: "Where opens the parts to filter by; pick one, then tick its values.", code: `<FilterBar noun="deploys" fields={fields} />` }],
  keyboard: [
    { keys: "Enter or Space", does: "On a dashed word: flips is and is not, or opens its values." },
    { keys: "Up Down", does: "In a list: moves through the options." },
    { keys: "Enter", does: "In a list: ticks the option, or opens a field's values." },
    { keys: "Escape", does: "Closes the list." },
  ],
  a11y: ["Every part of a chip is its own button with a name that says what it does.", "The lists are listboxes; a ticked value is marked selected."],
};
