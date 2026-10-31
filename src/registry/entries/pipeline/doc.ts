import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Pipeline, type PipelineStage } from "@/components/basedraft/pipeline";

const stages: PipelineStage[] = [
  { id: "queue", label: "Queued", status: "done", duration: 2000 },
  { id: "install", label: "Install", status: "done", duration: 18000, note: "1,204 packages" },
  { id: "build", label: "Build", status: "running", startedAt: started, estimate: 14000 },
  { id: "checks", label: "Checks", status: "waiting", estimate: 6000 },
  { id: "domains", label: "Domains", status: "waiting", estimate: 2000 },
];

export function Build() {
  const [stage, setStage] = useState("build");
  return (
    <>
      <Pipeline label="Build of 7c2e9a1" stages={stages} selected={stage} onSelect={setStage}>
        <Output lines={logs[stage]} />
      </Pipeline>
    </>
  );
}`,
  use: [
    "For a job that goes through stages in order: a build, a deploy, an import, a migration.",
    "Give a running stage startedAt and it counts its own time; give a finished one duration.",
    "Give stages still to come their estimate (from the last run): their ghost bars sit where they're expected, and the running one grows toward it.",
    "Give it onSelect to pick a stage like a tab, and its output as children: it opens under that stage's row.",
    "Put what went wrong in a failed stage's note, short: \"2 type errors\".",
  ],
  avoid: ["For steps a person fills in, like a form in parts: use Wizard or Stepper.", "For tasks with no order between them: use a list with a status on each."],
  parts: [
    {
      name: "Pipeline",
      props: [
        { name: "stages", type: "PipelineStage[]", note: "The stages in order: id, label and status, with duration once over, startedAt while running, and an optional note.", required: true },
        { name: "selected", type: "string | null", note: "The picked stage's id, when stages can be picked." },
        { name: "onSelect", type: "(id: string) => void", note: "Makes each stage pickable, like a tab." },
        { name: "children", type: "ReactNode", note: "What the picked stage did, opened under its row." },
        { name: "label", type: "string", default: "\"Stages\"", note: "What the job is, for screen readers." },
      ],
    },
    {
      name: "PipelineStage",
      props: [
        { name: "status", type: "\"waiting\" | \"running\" | \"done\" | \"failed\" | \"skipped\" | \"canceled\"", note: "Where it's at.", required: true },
        { name: "duration", type: "number", note: "How long it took, in milliseconds." },
        { name: "startedAt", type: "number", note: "When it started, so a running stage counts up." },
        { name: "estimate", type: "number", note: "How long it usually takes: where its ghost sits before it runs, and how far its bar is headed." },
        { name: "note", type: "string", note: "A short line under it; red when it failed." },
      ],
    },
    { name: "formatDuration", props: [{ name: "ms", type: "number", note: "A length of time as people say it: 41s, 1m 12s. For a total beside the rail.", required: true }] },
  ],
  examples: [
    { id: "failed", title: "A stage that failed", note: "Red, with what went wrong under it; the stages after it never ran.", code: `<Pipeline stages={[\n  { id: "install", label: "Install", status: "done", duration: 17000 },\n  { id: "build", label: "Build", status: "done", duration: 39000 },\n  { id: "checks", label: "Checks", status: "failed", duration: 6000, note: "2 type errors" },\n  { id: "domains", label: "Domains", status: "skipped" },\n]} />` },
    { id: "narrow", title: "In a narrow box", note: "The same rows in a narrow box: the bars shorten, the names and times stay whole.", code: `<div className="w-[320px]">\n  <Pipeline stages={stages} />\n</div>` },
  ],
  keyboard: [
    { keys: "Tab", does: "To the picked stage, when stages can be picked." },
    { keys: "↑ ↓", does: "Picks the stage above or below." },
    { keys: "Home / End", does: "Picks the first or last stage." },
  ],
  a11y: [
    "Each stage reads its name, how it's going, its time and its note; done, running and failed are said in words, not shown only by color or icon.",
    "Pickable, it's a tablist of stages, one row each. A stage that changes how it's going is announced once, not every tick of its clock. The axis and the bars are drawn; each row's words carry the same.",
    "With reduced motion, the running ring and the bar hold still.",
  ],
};
