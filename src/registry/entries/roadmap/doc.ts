import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Roadmap, type RoadmapItem } from "@/components/basedraft/roadmap";

export function Plan({ work }: { work: RoadmapItem[] }) {
  const [items, setItems] = useState(work);
  return (
    <Roadmap
      items={items}
      onItemsChange={(next, moved) => {
        setItems(next);
        save(moved);
      }}
      from="2026-10-05"
      days={84}
      today="2026-10-30"
    />
  );
}`,
  use: ["For a team's plan across weeks or a quarter: launches, projects, a migration in phases.", "Group items by team or by goal, and give each a status so the risks stand out in amber.", "Save the moved item from onItemsChange: it's passed as the second argument."],
  avoid: ["For tasks moving through stages: use the Kanban board.", "For a day's appointments: use the Scheduler."],
  parts: [
    {
      name: "Roadmap",
      note: "Names on the left, the days across, a bar for each item.",
      props: [
        { name: "items", type: "RoadmapItem[]", note: "The work, when you control it." },
        { name: "defaultItems", type: "RoadmapItem[]", default: "[]", note: "The work at first, when it keeps its own." },
        { name: "onItemsChange", type: "(items, changed) => void", note: "Told after a drag or a key moves or stretches one." },
        { name: "from", type: "string", note: "The first day shown, YYYY-MM-DD.", required: true },
        { name: "days", type: "number", default: "84", note: "How many days across." },
        { name: "today", type: "string", note: "Ruled in ink with its date." },
        { name: "scale", type: '"week" | "month"', default: '"week"', note: "Week: wide enough to drag by the day. Month: a quarter fits." },
        { name: "selected", type: "string | null", note: "The item drawn picked." },
        { name: "onSelect", type: "(item) => void", note: "Told on a click that isn't a drag, or Enter." },
      ],
    },
    {
      name: "RoadmapItem",
      props: [
        { name: "start, end", type: "string", note: "First and last day, YYYY-MM-DD, both included.", required: true },
        { name: "status", type: '"planned" | "active" | "risk" | "done"', note: "Outline, filled to its progress, amber, or solid ink." },
        { name: "progress", type: "number", note: "0 to 1, filled in from the left." },
        { name: "group", type: "string", note: "Items with the same group sit together under it." },
        { name: "owner", type: "string", note: "Who has it, by name: their dithered face shows beside the item." },
      ],
    },
  ],
  examples: [{ id: "quarter", title: "A quarter at once", note: "The month scale fits thirteen weeks in the same width.", code: `<Roadmap items={items} from="2026-10-01" days={92} scale="month" />` }],
  keyboard: [
    { keys: "Left Right", does: "Moves the focused bar a day." },
    { keys: "Shift Left Right", does: "Makes it a day shorter or longer." },
    { keys: "Enter", does: "Picks it." },
  ],
  a11y: ["Each bar says its item, its dates and how far along it is, and how to move it.", "Status is drawn in outline, fill and a mark as well as color."],
};
