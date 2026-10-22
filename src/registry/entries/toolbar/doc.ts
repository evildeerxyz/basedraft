import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import {
  LinkSimpleIcon,
  TextBIcon,
  TextItalicIcon,
} from "@phosphor-icons/react";
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarToggle,
} from "@basedraft/ui";

export function TextTools() {
  const [bold, setBold] = useState(false);
  return (
    <Toolbar label="Text">
      <ToolbarToggle
        label="Bold"
        keys={["⌘", "B"]}
        icon={<TextBIcon weight="bold" />}
        pressed={bold}
        onPressedChange={setBold}
      />
      <ToolbarToggle
        label="Italic"
        keys={["⌘", "I"]}
        icon={<TextItalicIcon weight="duotone" />}
      />
      <ToolbarSeparator />
      <ToolbarButton
        label="Link"
        keys={["⌘", "K"]}
        icon={<LinkSimpleIcon weight="duotone" />}
        onClick={addLink}
      />
    </Toolbar>
  );
}`,
  use: [
    "For a compact set of tools over something you're editing: text formatting, a canvas, a code view.",
    "When tools are icons and their names and shortcuts can live in tooltips.",
    "When the set may outgrow its space on a phone: the end folds into a More menu on its own.",
  ],
  avoid: [
    "For a handful of actions on a selection: use Action bar, which rises when something is picked.",
    "For one choice of a few with words: use Segmented control.",
    "For a long list of actions behind one button: use Menu.",
    "For the main buttons of a page or a form: use Button, where words are always shown.",
  ],
  parts: [
    {
      name: "Toolbar",
      note: "The bar, one stop for Tab. Holds the tools as children, in order.",
      props: [
        { name: "label", type: "string", note: "Names the toolbar for screen readers.", required: true },
        { name: "side", type: '"top" | "bottom"', default: '"top"', note: "Where the tooltips show: above the bar or below it." },
        { name: "className", type: "string", note: "Added to the bar." },
        { name: "children", type: "ReactNode", note: "Buttons, toggles, groups and separators. Each child is one slot that can fold into More.", required: true },
      ],
    },
    {
      name: "ToolbarButton",
      note: "A tool that does something once.",
      props: [
        { name: "label", type: "string", note: "Its name, in its tooltip and to screen readers.", required: true },
        { name: "icon", type: "ReactNode", note: "What shows, at 18px.", required: true },
        { name: "keys", type: "string[]", note: 'Its shortcut, a cap each: ["⌘", "K"]. Shown in the tooltip and set as aria-keyshortcuts. Wire the shortcut itself in your app.' },
        { name: "onClick", type: "() => void", note: "Called when it's pressed, from the bar or from the More menu." },
        { name: "disabled", type: "boolean", default: "false", note: "Skipped by the arrow keys and greyed in the menu." },
      ],
    },
    {
      name: "ToolbarToggle",
      note: "A tool that stays on until pressed again.",
      props: [
        { name: "label", type: "string", note: "Its name.", required: true },
        { name: "icon", type: "ReactNode", note: "What shows.", required: true },
        { name: "pressed", type: "boolean", note: "Whether it's on, when you control it." },
        { name: "defaultPressed", type: "boolean", default: "false", note: "Where it starts, when it keeps its own state." },
        { name: "onPressedChange", type: "(pressed: boolean) => void", note: "Called with the new state." },
        { name: "keys", type: "string[]", note: "Its shortcut, for the tooltip." },
        { name: "disabled", type: "boolean", default: "false", note: "Can't be pressed." },
      ],
    },
    {
      name: "ToolbarGroup",
      note: "One choice of a few that holds; its chip slides to the choice.",
      props: [
        { name: "label", type: "string", note: "Names the group, and heads it in the More menu.", required: true },
        { name: "options", type: "{ value: string; label: string; icon: ReactNode; keys?: string[] }[]", note: "The choices, in order.", required: true },
        { name: "value", type: "string", note: "The choice, when you control it." },
        { name: "defaultValue", type: "string", default: "the first option", note: "Where it starts otherwise." },
        { name: "onValueChange", type: "(value: string) => void", note: "Called with the new choice." },
      ],
    },
    { name: "ToolbarSeparator", note: "A thin rule between groups of tools. Never left at the end of the bar when it folds.", props: [] },
  ],
  examples: [
    {
      id: "basic",
      title: "Toggles and a button",
      note: "Rest on a tool for its tooltip; move along the bar and it glides to the next one at once.",
      code: `<Toolbar label="Text">
  <ToolbarToggle
    label="Bold"
    keys={["⌘", "B"]}
    icon={<TextBIcon weight="bold" />}
    pressed={bold}
    onPressedChange={setBold}
  />
  <ToolbarToggle
    label="Italic"
    keys={["⌘", "I"]}
    icon={<TextItalicIcon weight="duotone" />}
    pressed={italic}
    onPressedChange={setItalic}
  />
  <ToolbarSeparator />
  <ToolbarButton
    label="Link"
    keys={["⌘", "K"]}
    icon={<LinkSimpleIcon weight="duotone" />}
  />
</Toolbar>`,
    },
    {
      id: "group",
      title: "One choice that holds",
      note: "The chip slides to the choice; it's a radio group inside the bar.",
      code: `const [align, setAlign] = useState("center");

<Toolbar label="Alignment">
  <ToolbarGroup
    label="Alignment"
    value={align}
    onValueChange={setAlign}
    options={[
      {
        value: "left",
        label: "Align left",
        icon: <TextAlignLeftIcon weight="duotone" />,
        keys: ["⌘", "⇧", "L"],
      },
      {
        value: "center",
        label: "Align center",
        icon: <TextAlignCenterIcon weight="duotone" />,
        keys: ["⌘", "⇧", "E"],
      },
      {
        value: "right",
        label: "Align right",
        icon: <TextAlignRightIcon weight="duotone" />,
        keys: ["⌘", "⇧", "R"],
      },
    ]}
  />
</Toolbar>`,
    },
    {
      id: "overflow",
      title: "Folds when it runs out of room",
      note: "Narrow the room it has and the tools at the end fold into a More menu, where toggles still tick and the group still picks.",
      code: `<div style={{ width: room }}>
  <Toolbar label="Text">
    <ToolbarToggle
      label="Bold"
      keys={["⌘", "B"]}
      icon={<TextBIcon weight="bold" />}
    />
    <ToolbarToggle
      label="Italic"
      keys={["⌘", "I"]}
      icon={<TextItalicIcon weight="duotone" />}
    />
    <ToolbarToggle
      label="Underline"
      keys={["⌘", "U"]}
      icon={<TextUnderlineIcon weight="duotone" />}
    />
    <ToolbarSeparator />
    <ToolbarGroup label="Alignment" options={ALIGN} />
    <ToolbarSeparator />
    <ToolbarButton
      label="Link"
      keys={["⌘", "K"]}
      icon={<LinkSimpleIcon weight="duotone" />}
    />
    <ToolbarButton
      label="Comment"
      keys={["C"]}
      icon={<ChatCircleTextIcon weight="duotone" />}
    />
  </Toolbar>
</div>
<Slider
  label="Room"
  min={120}
  max={380}
  step={4}
  value={room}
  onValueChange={setRoom}
  format={(v) => \`\${v}px\`}
/>`,
    },
    {
      id: "below",
      title: "Tooltips below, a tool disabled",
      note: "For a bar along the top of a canvas, side=\"bottom\" puts tooltips under it. A disabled tool is skipped by the arrows.",
      code: `<Toolbar label="Canvas" side="bottom">
  <ToolbarButton
    label="Undo"
    keys={["⌘", "Z"]}
    icon={<ArrowCounterClockwiseIcon weight="regular" />}
  />
  <ToolbarButton
    label="Redo"
    keys={["⌘", "⇧", "Z"]}
    icon={<ArrowClockwiseIcon weight="regular" />}
  />
  <ToolbarSeparator />
  <ToolbarButton
    label="Zoom in"
    keys={["⌘", "+"]}
    icon={<MagnifyingGlassPlusIcon weight="duotone" />}
  />
  <ToolbarButton
    label="Fit to screen"
    keys={["⇧", "1"]}
    icon={<CornersOutIcon weight="duotone" />}
  />
  <ToolbarButton
    label="Comment"
    keys={["C"]}
    disabled
    icon={<ChatCircleTextIcon weight="duotone" />}
  />
</Toolbar>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves focus into the bar, to the tool last used, and on out of it. The whole bar is one stop." },
    { keys: "→ / ←", does: "Moves to the next or previous tool, wrapping at the ends, More included." },
    { keys: "Home / End", does: "Moves to the first or last tool." },
    { keys: "Enter / Space", does: "Presses the tool: runs a button, flips a toggle, picks a choice." },
    { keys: "↓", does: "On More, opens its menu at the first tool." },
    { keys: "↑ / ↓", does: "In the More menu, moves between its tools." },
    { keys: "Escape", does: "Hides the tooltip; in the More menu, closes it and returns focus to More." },
  ],
  a11y: [
    'The bar is role="toolbar" with your label, and keeps one tool in the tab order (a roving tabindex), as the WAI-ARIA toolbar pattern asks.',
    "Every tool is named by its label, since only its icon shows; toggles carry aria-pressed and shortcuts carry aria-keyshortcuts.",
    'A group is a radiogroup of radios with aria-checked; the arrow keys move focus along the bar and Enter or Space picks.',
    'The tooltip is role="tooltip" and shows on keyboard focus straight away, on hover after a moment, and never covers the tool you pressed.',
    'Folded tools stay usable in the More menu as menu items, checkboxes and radios, with the same names and states.',
    "Motion is springs on transform and opacity only; with reduced motion, chips and the menu fade instead.",
  ],
};
