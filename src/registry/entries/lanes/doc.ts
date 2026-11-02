import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Lanes, type LaneRow } from "@/components/basedraft/lanes";

const rows: LaneRow[] = projects.map((p) => ({
  id: p.id,
  label: p.name,
  sub: p.url,
  aside: p.requests,
  events: p.deploys.map((d) => ({ id: d.id, at: d.time, kind: d.production ? "ship" : "try", label: d.message })),
}));

export function Projects() {
  const [open, setOpen] = useState<string | null>(null);
  return <Lanes label="Projects" rows={rows} from={twoWeeksAgo} to={endOfToday} now={Date.now()} aside="Requests, 7d" selected={open} onSelect={setOpen} />;
}`,
  use: [
    "For many things over the same stretch of time, read together: projects and their deploys, services and their incidents, people and their shifts.",
    "Give a running thing a run event at now: its ring breathes until it's done.",
    "Give it onSelect to open what a row is about beside it.",
  ],
  avoid: ["For one job's stages over time: use Pipeline.", "For planned work with a start and an end: use Roadmap."],
  props: [
    { name: "rows", type: "LaneRow[]", note: "Each row: id, label, sub, lead (an icon tile), aside (a figure at its end) and its events.", required: true },
    { name: "from, to", type: "number", note: "The axis, in milliseconds since 1970.", required: true },
    { name: "now", type: "number", note: "Where the now line stands.", required: true },
    { name: "aside", type: "string", note: "What the row ends show, over them." },
    { name: "selected", type: "string | null", note: "The picked row." },
    { name: "onSelect", type: "(id: string) => void", note: "Makes each row pickable." },
    { name: "weekends", type: "boolean", default: "true", note: "Shade Saturdays and Sundays, on wide lanes." },
    { name: "label", type: "string", default: "\"Lanes\"", note: "What the rows are, for screen readers." },
  ],
  parts: [
    {
      name: "LaneEvent",
      props: [
        { name: "at", type: "number", note: "When, in milliseconds since 1970.", required: true },
        { name: "kind", type: "\"ship\" | \"try\" | \"fail\" | \"run\"", note: "An ink tick, a gray one, a red dot, or a breathing ring.", required: true },
        { name: "label", type: "string", note: "What it was, for its tip: \"Released 7c2e9a1\".", required: true },
      ],
    },
  ],
  examples: [{ id: "narrow", title: "In a narrow box", note: "Each lane moves under its row, with its own now line.", code: `<div className="w-[360px]">\n  <Lanes rows={rows} from={from} to={to} now={now} />\n</div>` }],
  keyboard: [{ keys: "Tab, Enter", does: "To a row, and to pick it, when rows can be picked." }],
  a11y: ["Each row is read as a sentence: what it is, how many of each kind of event, and when the last was.", "Failures are told by count and word as well as by red."],
};
