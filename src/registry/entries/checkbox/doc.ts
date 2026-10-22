import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { CheckboxRow } from "@basedraft/ui";

export function Summary() {
  return (
    <CheckboxRow
      defaultChecked
      label="Send a summary each week"
      description="A short email every Monday with what changed in your drafts."
      onCheckedChange={(on) => console.log(on)}
    />
  );
}`,
  use: [
    "For things people can turn on and off independently, each one saved when the form is sent.",
    "For a list where any number can be picked, with one box over them all that's half on while only some are.",
    "Use CheckboxRow when the choice needs a line on what it does; the whole row is what you click.",
  ],
  avoid: [
    "For a setting that takes effect the moment it flips: use Switch.",
    "For one choice out of a few: use Radio group, or Segmented control for two to four short ones.",
  ],
  parts: [
    {
      name: "Checkbox",
      note: "The box on its own. Label it with a <label> around it, or one pointing at its id.",
      props: [
        { name: "checked", type: 'boolean | "indeterminate"', note: "Controlled. Half on shows a bar and reads as mixed." },
        { name: "defaultChecked", type: 'boolean | "indeterminate"', default: "false", note: "Where it starts, uncontrolled." },
        { name: "onCheckedChange", type: "(checked: boolean) => void", note: "Called with the new state on each click. From half on, a click ticks it." },
        { name: "size", type: '"sm" | "md"', default: '"md"', note: "16 or 20px square." },
        { name: "name", type: "string", note: "With a name, a hidden input carries value in a form while it's ticked." },
        { name: "value", type: "string", default: '"on"', note: "What the form sends while it's ticked." },
        { name: "disabled", type: "boolean", default: "false", note: "Faded, and it can't be clicked or focused." },
        { name: "...props", type: "button props", note: "Everything a button takes: id, aria-label, onClick and the rest. It renders a button with role checkbox." },
      ],
    },
    {
      name: "CheckboxRow",
      note: "A checkbox at the start of a row, its label and a line under it. Takes every Checkbox prop too.",
      props: [
        { name: "label", type: "ReactNode", required: true, note: "What ticking it means. Becomes the checkbox's name." },
        { name: "description", type: "ReactNode", note: "A line under the label, read after it." },
        { name: "className", type: "string", note: "Goes on the row, to pad or indent it." },
      ],
    },
  ],
  examples: [
    {
      id: "basic",
      title: "With a label around it",
      note: "Wrap it in a label and the words tick it too.",
      code: `<label className="flex items-center gap-2.5 text-sm">
  <Checkbox defaultChecked />
  Remember this device
</label>`,
    },
    {
      id: "row",
      title: "As a row",
      note: "CheckboxRow adds a line under the label, and the whole row ticks it.",
      code: `<CheckboxRow
  defaultChecked
  label="Send a summary each week"
  description="A short email every Monday with what changed in your drafts."
  className="max-w-[340px]"
/>`,
    },
    {
      id: "half-on",
      title: "Half on",
      note: "One box over a list: ticked when all are, half on while some are, and it ticks or clears them all.",
      code: `function Frameworks() {
  const [on, setOn] = useState(["next"]);
  const parts = ["next", "astro"];
  return (
    <div className="grid max-w-[300px]">
      <CheckboxRow
        label="Both frameworks"
        checked={
          on.length === parts.length
            ? true
            : on.length
              ? "indeterminate"
              : false
        }
        onCheckedChange={(c) => setOn(c ? parts : [])}
      />
      {parts.map((p) => (
        <CheckboxRow
          key={p}
          label={p === "next" ? "Next.js" : "Astro"}
          checked={on.includes(p)}
          onCheckedChange={(c) =>
            setOn((o) => (c ? [...o, p] : o.filter((x) => x !== p)))
          }
          className="pl-7"
        />
      ))}
    </div>
  );
}`,
    },
    {
      id: "sizes",
      title: "Sizes",
      note: "Small for dense lists and tables, medium everywhere else.",
      code: `<div className="flex items-center gap-6 text-sm">
  <label className="flex items-center gap-2">
    <Checkbox size="sm" defaultChecked />
    Small
  </label>
  <label className="flex items-center gap-2.5">
    <Checkbox defaultChecked />
    Medium
  </label>
</div>`,
    },
    {
      id: "disabled",
      title: "Disabled",
      note: "For something that's set for them, or not theirs to change yet. Say why in the description.",
      code: `<div className="grid max-w-[340px]">
  <CheckboxRow
    defaultChecked
    disabled
    label="Personal projects"
    description="Every license covers them."
  />
  <CheckboxRow
    disabled
    label="Client projects"
    description="Comes with a Team license."
  />
</div>`,
    },
  ],
  keyboard: [
    { keys: "Space", does: "Ticks or clears it." },
    { keys: "Enter", does: "Ticks or clears it, as a button does." },
    { keys: "Tab", does: "Moves to the next checkbox; each one is its own stop." },
  ],
  a11y: [
    "A button with role checkbox and aria-checked: true, false, or mixed while half on.",
    "Its name comes from the label around it or pointing at it. CheckboxRow names it from label and describes it with description.",
    "The tick is drawn, not spoken; screen readers say checked, not checked or mixed.",
    "With a name it carries its value in a native form through a hidden input, sent only while it's ticked.",
  ],
};
