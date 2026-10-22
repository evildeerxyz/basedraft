import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Slider } from "@basedraft/ui";

export function Spacing() {
  return (
    <Slider
      label="Space between sections"
      min={0}
      max={160}
      step={8}
      defaultValue={96}
      format={(v) => \`\${v} px\`}
      ticks={[0, 40, 80, 120, 160]}
    />
  );
}`,
  use: [
    "For a value in a range where feel matters more than the exact number: spacing, radius, opacity, zoom.",
    "Give it format so the value reads in its unit, and ticks for the stops that matter.",
  ],
  avoid: [
    "When an exact number matters, like a price or a count: use Input with type number.",
    "For a few named steps: use Segmented control.",
    "For showing progress, not setting a value: use Meter.",
  ],
  parts: [
    {
      name: "Slider",
      note: "A native range input under an ink track and a bead.",
      props: [
        { name: "min", type: "number", default: "0", note: "The lowest value." },
        { name: "max", type: "number", default: "100", note: "The highest value." },
        { name: "step", type: "number", default: "1", note: "How far one move goes, by arrow key or drag." },
        { name: "value", type: "number", note: "The value, when you control it." },
        { name: "defaultValue", type: "number", default: "min", note: "Where it starts, when it keeps its own state." },
        { name: "onValueChange", type: "(value: number) => void", note: "Called as it moves." },
        { name: "label", type: "string", note: "Its name, shown above it with the value, and tied to the input." },
        { name: "format", type: "(value: number) => string", default: "String", note: "How a value reads: above the track, in the bubble, and to screen readers." },
        { name: "ticks", type: "number[]", note: "Values to mark under the track, each with its number. The marks up to the value are inked." },
        { name: "disabled", type: "boolean", default: "false", note: "Fades it and stops it moving." },
        { name: "name", type: "string", note: "Its name in a form, so the value is submitted." },
        { name: "aria-label", type: "string", note: "Names it for screen readers when there's no label." },
        { name: "className", type: "string", note: "Added to the slider's outer block, to size or place it." },
      ],
    },
  ],
  examples: [
    {
      id: "basic",
      title: "With a unit",
      note: "format puts the unit on the value above the track and in the bubble.",
      code: `<Slider
  label="Corner radius"
  min={0}
  max={32}
  defaultValue={14}
  format={(v) => \`\${v} px\`}
  className="max-w-[320px]"
/>`,
    },
    {
      id: "ticks",
      title: "With ticks",
      note: "Marks under the track for each stop. Hold the bead to see its bubble.",
      code: `<Slider
  label="Columns"
  min={1}
  max={6}
  defaultValue={3}
  ticks={[1, 2, 3, 4, 5, 6]}
  className="max-w-[320px]"
/>`,
    },
    {
      id: "controlled",
      title: "Controlled",
      note: "value and onValueChange, here darkening a picture as it moves.",
      code: `function Darken() {
  const [dim, setDim] = useState(40);
  return (
    <div className="grid w-full max-w-[320px] gap-3">
      <Slider
        label="Darken the hero image"
        value={dim}
        onValueChange={setDim}
        format={(v) => \`\${v}%\`}
      />
      <div
        className="h-16 rounded-[14px] bg-[linear-gradient(135deg,#c8ff3e,#1f6b4a)]"
        style={{ boxShadow: \`inset 0 0 0 999px rgb(0 0 0 / \${dim / 100})\` }}
      />
    </div>
  );
}`,
    },
    {
      id: "unlabeled",
      title: "Without a label",
      note: "For a toolbar, with an aria-label instead. Tab to it and the bubble stays up.",
      code: `<Slider
  aria-label="Zoom"
  min={25}
  max={200}
  step={25}
  defaultValue={100}
  format={(v) => \`\${v}%\`}
  className="max-w-[320px]"
/>`,
    },
    {
      id: "disabled",
      title: "Disabled",
      note: "Faded, and it won't move.",
      code: `<Slider
  label="Section spacing"
  max={160}
  defaultValue={64}
  format={(v) => \`\${v} px\`}
  disabled
  className="max-w-[320px]"
/>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves focus to the bead, and shows its bubble." },
    { keys: "← / →, ↑ / ↓", does: "Moves it down or up by one step." },
    { keys: "Page Up / Page Down", does: "Moves it by a larger step." },
    { keys: "Home / End", does: "Moves it to min or max." },
  ],
  a11y: [
    "A native range input sits over the drawing, so dragging, keys and screen readers work as for any slider.",
    "label is tied to the input; without one, pass aria-label.",
    "Screen readers hear the value as format writes it (96 px), through aria-valuetext.",
  ],
};
