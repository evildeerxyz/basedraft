import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Switch } from "@basedraft/ui";

export function Snap() {
  return (
    <label className="flex items-center justify-between gap-4 text-sm">
      Snap to sections
      <Switch defaultChecked onCheckedChange={(on) => console.log(on)} />
    </label>
  );
}`,
  use: [
    "For a setting that takes effect the moment it's flipped: autosave, snapping, notifications.",
    "Put it at the end of a row, inside a label, so the whole row flips it.",
  ],
  avoid: [
    "For a choice that's only applied when a form is submitted: use Checkbox.",
    "For one of several options: use Radio group, or Segmented control for two to four.",
  ],
  parts: [
    {
      name: "Switch",
      note: "A native button with the switch role.",
      props: [
        { name: "checked", type: "boolean", note: "Whether it's on, when you control it." },
        { name: "defaultChecked", type: "boolean", default: "false", note: "Whether it starts on, when it keeps its own state." },
        { name: "onCheckedChange", type: "(checked: boolean) => void", note: "Called each time it flips, with the new state." },
        { name: "size", type: '"sm" | "md"', default: '"md"', note: "20 or 26px tall." },
        { name: "disabled", type: "boolean", default: "false", note: "Fades it and stops it flipping." },
        { name: "...props", type: "button props", note: "Everything a button takes except onChange, like aria-label and id." },
      ],
    },
  ],
  examples: [
    {
      id: "sizes",
      title: "Sizes",
      note: "Small for dense panels, medium everywhere else. Inside a label, the text flips it too.",
      code: `<div className="grid w-full max-w-[300px] gap-3">
  <label className="flex items-center justify-between gap-6 text-[13px]">
    Show grid lines
    <Switch size="sm" />
  </label>
  <label className="flex items-center justify-between gap-6 text-sm">
    Publish on every save
    <Switch defaultChecked />
  </label>
</div>`,
    },
    {
      id: "controlled",
      title: "Controlled",
      note: "checked and onCheckedChange, when something else reads the state.",
      code: `function Autosave() {
  const [on, setOn] = useState(true);
  return (
    <label className="flex items-center gap-3 text-sm">
      <Switch checked={on} onCheckedChange={setOn} />
      Autosave is {on ? "on" : "off"}
    </label>
  );
}`,
    },
    {
      id: "disabled",
      title: "Disabled",
      note: "On or off, when it can't be changed here. Say why in the label.",
      code: `<div className="grid w-full max-w-[300px] gap-3 text-sm text-[var(--bd-muted)]">
  <label className="flex items-center justify-between gap-6">
    Client projects, with Team
    <Switch disabled />
  </label>
  <label className="flex items-center justify-between gap-6">
    Every future update
    <Switch defaultChecked disabled />
  </label>
</div>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves focus to the switch." },
    { keys: "Space / Enter", does: "Flips it." },
  ],
  a11y: [
    "A button with the switch role, its aria-checked saying on or off.",
    "Wrap it in a label with its text, or give it an aria-label, so it's announced by name.",
    "The knob's stretch and spring are only motion; the state is in aria-checked and the ink fill, not color alone.",
  ],
};
