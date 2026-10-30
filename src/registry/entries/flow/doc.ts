import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Flow, type FlowNode, type FlowEdge } from "@/components/basedraft/flow";

const nodes: FlowNode[] = [
  { id: "form", x: 0, y: 0, title: "Form sent", kind: "Trigger", outputs: [{ id: "answers", label: "Answers" }] },
  { id: "post", x: 300, y: 0, title: "Post to a channel", kind: "Message", inputs: [{ id: "message", label: "Message" }] },
];
const edges: FlowEdge[] = [{ id: "e1", from: "form", fromPort: "answers", to: "post", toPort: "message" }];

export function Automation() {
  return <Flow defaultNodes={nodes} defaultEdges={edges} onChange={(flow) => save(flow)} />;
}`,
  use: [
    "For building an automation, a pipeline, or a model of how things connect, where the joins are the point.",
    "Pass status while it runs: the running step pulses and what it's given flows along the line into it.",
    "Save from onChange; every change it reports can also be undone.",
  ],
  avoid: [
    "For steps that only ever go one after another: use Wizard or Steps.",
    "For a fixed diagram nobody edits: draw it, or use an image.",
    "For very large graphs, hundreds of nodes: it draws each one as HTML.",
  ],
  parts: [
    {
      name: "Flow",
      note: "The board, with its tools in one corner and the minimap in the other.",
      props: [
        { name: "defaultNodes", type: "FlowNode[]", note: "The steps to start with. After that the board keeps its own.", required: true },
        { name: "defaultEdges", type: "FlowEdge[]", default: "[]", note: "The connections to start with." },
        { name: "onChange", type: "({ nodes, edges }) => void", note: "Runs after each change that can be undone: a move, a connection, a deletion." },
        { name: "status", type: 'Record<string, "idle" | "running" | "done" | "error" | "skipped">', note: "How each step is doing. Running steps pulse and draw their input flowing in; done ones tick and turn their lines green; skipped ones fade." },
        { name: "height", type: "number", default: "440", note: "The board's height." },
        { name: "grid", type: "number", default: "16", note: "What the steps snap to, in board pixels." },
        { name: "minimap", type: "boolean", default: "true", note: "The map in the corner; click it to go there." },
        { name: "label", type: "string", default: '"Flow"', note: "What it is, for screen readers." },
        { name: "className", type: "string", note: "Added to the board." },
      ],
    },
    {
      name: "FlowNode",
      note: "One step, as an object in defaultNodes. Its height follows its ports, so every line lands exactly.",
      props: [
        { name: "id", type: "string", note: "Its key.", required: true },
        { name: "x, y", type: "number", note: "Where it sits on the board.", required: true },
        { name: "title", type: "string", note: "What it does.", required: true },
        { name: "kind", type: "string", note: "A word over the title: Trigger, Action, Branch." },
        { name: "icon", type: "ReactNode", note: "On a tile beside the title." },
        { name: "inputs", type: "{ id: string; label: string }[]", note: "Ports on its left, that lines come into." },
        { name: "outputs", type: "{ id: string; label: string }[]", note: "Ports on its right, that lines are drawn from." },
        { name: "meta", type: "string", note: "A line along its foot." },
      ],
    },
    {
      name: "FlowEdge",
      note: "One connection: { id, from, fromPort, to, toPort }.",
      props: [],
    },
  ],
  examples: [
    {
      id: "connect",
      title: "Joining steps",
      note: "Three steps with nothing between them. Drag from an output; the line snaps to the input you near, and ⌘Z takes it back.",
      code: `<Flow defaultNodes={steps} height={300} minimap={false} />`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves to each step and selects it." },
    { keys: "← → ↑ ↓", does: "Move the selected steps a grid square; with Shift, four." },
    { keys: "Delete Backspace", does: "Remove the selected steps, or the selected line." },
    { keys: "⌘Z ⇧⌘Z", does: "Undo and redo; Ctrl on Windows." },
    { keys: "+ − 0", does: "Zoom in, zoom out, fit everything in view." },
    { keys: "Esc", does: "Let go of the selection." },
  ],
  a11y: [
    "The board says how many steps and connections it has, and how to work it from the keys.",
    "Each step is a group named by its title, kind and status, and says when it's selected.",
    "Drawing a connection needs a pointer; everything else can be done from the keys.",
    "With reduced motion, running steps don't pulse and lines don't flow.",
  ],
};
