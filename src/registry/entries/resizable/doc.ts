import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Resizable, ResizablePanel } from "@basedraft/ui";

export function Editor() {
  return (
    <div className="h-[480px]">
      <Resizable
        defaultSize={46}
        snap={[50]}
        label="Resize the code and the preview"
      >
        <ResizablePanel>
          <CodePane />
        </ResizablePanel>
        <ResizablePanel>
          <PreviewPane />
        </ResizablePanel>
      </Resizable>
    </div>
  );
}`,
  use: [
    "For two views people want side by side and will size to the task: code and preview, a list and its detail, an outline and a page.",
    "With collapsible for a side panel people sometimes want out of the way altogether.",
    "With snap for sizes people come back to, like half and half.",
  ],
  avoid: [
    "For a panel that slides over the page and goes away: use Sheet.",
    "For switching between two views rather than seeing both: use Tabs or Segmented control.",
    "On a phone, where two panels side by side don't fit: stack them, or let one fold away.",
  ],
  parts: [
    {
      name: "Resizable",
      note: "Holds exactly two ResizablePanels and the line between them. It fills its parent, so give the parent a height.",
      props: [
        { name: "direction", type: '"horizontal" | "vertical"', default: '"horizontal"', note: "Side by side, or one over the other." },
        { name: "size", type: "number", note: "Controlled: the first panel's size as a percent. Changing it springs the line there." },
        { name: "defaultSize", type: "number", default: "50", note: "Where it starts, uncontrolled, and where a double-click on the line goes back to." },
        { name: "onSizeChange", type: "(size: number) => void", note: "Called as the line moves and when it's let go, with the first panel's size." },
        { name: "min", type: "number", default: "15", note: "The first panel's least, as a percent." },
        { name: "max", type: "number", default: "85", note: "The first panel's most, as a percent." },
        { name: "snap", type: "number[]", default: "[]", note: "Sizes the line catches at as it passes, within 2.5%." },
        { name: "collapsible", type: '"start" | "end" | "both"', note: "Which panel folds away when the line is dragged well past its least or most. A folded panel can't be reached with Tab." },
        { name: "label", type: "string", default: '"Resize the panels"', note: "What the line is called for screen readers." },
        { name: "className", type: "string", note: "Goes on the white sheet the panels sit on." },
      ],
    },
    {
      name: "ResizablePanel",
      note: "One of the two. Its content scrolls when it outgrows it.",
      props: [
        { name: "children", type: "ReactNode", required: true, note: "What the panel holds." },
        { name: "className", type: "string", note: "Goes on the panel's scrolling box." },
      ],
    },
  ],
  examples: [
    {
      id: "snaps",
      title: "Catching at sizes",
      note: "The line catches at a third, half and two thirds as it passes, so those sizes are easy to land on. Double-click it to go back to where it started.",
      code: `const [size, setSize] = useState(50);

<div className="h-[220px]">
  <Resizable
    defaultSize={50}
    snap={[33, 50, 67]}
    onSizeChange={setSize}
    label="Resize the code and the preview"
  >
    <ResizablePanel>
      <Code />
    </ResizablePanel>
    <ResizablePanel>
      <Preview />
    </ResizablePanel>
  </Resizable>
</div>
<p>Code takes {Math.round(size)}%.</p>`,
    },
    {
      id: "vertical",
      title: "One over the other",
      code: `<div className="h-[300px]">
  <Resizable
    direction="vertical"
    defaultSize={60}
    min={25}
    max={85}
    label="Resize the code and the terminal"
  >
    <ResizablePanel>
      <Code />
    </ResizablePanel>
    <ResizablePanel>
      <Terminal />
    </ResizablePanel>
  </Resizable>
</div>`,
    },
    {
      id: "collapse",
      title: "A side panel that folds away",
      note: "Drag the outline well past its least and it folds away with a spring; drag back out, or press Enter on the line, to bring it back at its last size.",
      code: `<div className="h-[230px]">
  <Resizable
    defaultSize={34}
    min={24}
    max={50}
    collapsible="start"
    label="Resize the outline"
  >
    <ResizablePanel>
      <Outline />
    </ResizablePanel>
    <ResizablePanel>
      <Preview />
    </ResizablePanel>
  </Resizable>
</div>`,
    },
    {
      id: "controlled",
      title: "Sized from outside",
      note: "With size, the line springs to each new value; onSizeChange keeps it in step with dragging.",
      code: `const [size, setSize] = useState(50);

{
  [30, 50, 70].map((s) => (
    <button key={s} type="button" onClick={() => setSize(s)}>
      {s}%
    </button>
  ));
}
<div className="h-[200px]">
  <Resizable
    size={size}
    onSizeChange={setSize}
    label="Resize the code and the preview"
  >
    <ResizablePanel>
      <Code />
    </ResizablePanel>
    <ResizablePanel>
      <Preview />
    </ResizablePanel>
  </Resizable>
</div>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Focuses the line between the panels." },
    { keys: "ArrowLeft / ArrowRight", does: "Moves the line 2% (ArrowUp and ArrowDown when it's vertical). Past the least, a collapsible panel folds away." },
    { keys: "Shift + Arrow", does: "Moves the line 10%." },
    { keys: "Home / End", does: "Moves the line to the first panel's least or most, or folds a collapsible one." },
    { keys: "Enter", does: "Folds the collapsible panel away, or brings it back at its last size." },
  ],
  a11y: [
    "The line is a focusable separator controlling the first panel, with its size as aria-valuenow between aria-valuemin and aria-valuemax.",
    "A folded panel is inert, so Tab skips what's inside it and screen readers don't read it.",
    "The grip is only drawn; the whole strip around the line takes the pointer, so it's easy to catch.",
    "With reduced motion, folding, snapping and resetting happen at once instead of springing.",
  ],
};
