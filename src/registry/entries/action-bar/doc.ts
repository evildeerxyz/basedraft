import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { CopySimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { ActionBar, ActionBarButton } from "@basedraft/ui";

export function Sections() {
  const [picked, setPicked] = useState<string[]>([]);
  return (
    <>
      {/* your list, setting picked as rows are ticked */}
      <ActionBar
        count={picked.length}
        onClear={() => setPicked([])}
        label="Sections"
      >
        <ActionBarButton
          icon={<CopySimpleIcon weight="duotone" />}
          onClick={duplicate}
        >
          Duplicate
        </ActionBarButton>
        <ActionBarButton
          tone="stop"
          icon={<TrashIcon weight="duotone" />}
          onClick={remove}
        >
          Delete
        </ActionBarButton>
      </ActionBar>
    </>
  );
}`,
  use: [
    "When people pick several rows, files or sections and then act on all of them at once.",
    "When the actions only make sense with a selection, so they shouldn't take room the rest of the time.",
  ],
  avoid: [
    "For actions that are always there: use Toolbar.",
    "For telling people something happened: use Toast.",
    "For one item's actions: use Menu on the item.",
  ],
  parts: [
    {
      name: "ActionBar",
      note: "The bar. It shows while count is above zero, and holds your selection only as a number.",
      props: [
        { name: "count", type: "number", note: "How many are selected. Above zero, the bar rises; at zero, it sinks.", required: true },
        { name: "onClear", type: "() => void", note: "Lets the selection go: called by its clear button and by Escape.", required: true },
        { name: "label", type: "string", default: '"Selection"', note: "What's selected, for screen readers: the bar reads as \"Sections: 3 selected\"." },
        { name: "noun", type: "string", default: '"selected"', note: "The word after the count." },
        { name: "position", type: '"fixed" | "absolute"', default: '"fixed"', note: "Fixed floats at the foot of the window, in a portal. Absolute stays inside the nearest positioned container of yours." },
        { name: "className", type: "string", note: "Added to the bar." },
        { name: "children", type: "ReactNode", note: "Its actions, as ActionBarButtons.", required: true },
      ],
    },
    {
      name: "ActionBarButton",
      note: "One action. Its word hides when the bar has less than 480px to sit in, and stays its name.",
      props: [
        { name: "icon", type: "ReactNode", note: "Shown before the word, at 16px.", required: true },
        { name: "children", type: "ReactNode", note: "The action's word.", required: true },
        { name: "onClick", type: "() => void", note: "Called when it's pressed." },
        { name: "tone", type: '"stop"', note: "Marks what can't be undone: its icon turns red." },
        { name: "disabled", type: "boolean", default: "false", note: "Can't be pressed, and the arrows skip it." },
      ],
    },
  ],
  examples: [
    {
      id: "basic",
      title: "Inside a card",
      note: 'With position="absolute" it rises from the foot of your own container rather than the window.',
      code: `<div className="relative overflow-hidden pb-20">
  {rows}
  <ActionBar
    position="absolute"
    count={picked.length}
    onClear={() => setPicked([])}
    label="Templates"
  >
    <ActionBarButton icon={<ExportIcon weight="duotone" />}>
      Export
    </ActionBarButton>
  </ActionBar>
</div>`,
    },
    {
      id: "fixed",
      title: "At the foot of the window",
      note: "The default. Press F6 to bring focus to it, Escape to let the selection go.",
      code: `<ActionBar count={count} onClear={() => setCount(0)} label="Sections">
  <ActionBarButton icon={<CopySimpleIcon weight="duotone" />}>
    Duplicate
  </ActionBarButton>
  <ActionBarButton
    tone="stop"
    icon={<TrashIcon weight="duotone" />}
    onClick={() => setCount(0)}
  >
    Delete
  </ActionBarButton>
</ActionBar>`,
    },
    {
      id: "count",
      title: "The count rolls",
      note: "Its digits roll up as the count grows and down as it shrinks; at zero the bar sinks away still showing the last number.",
      code: `<ActionBar
  position="absolute"
  count={count}
  onClear={() => setCount(0)}
  label="Pages"
  noun="pages"
>
  <ActionBarButton icon={<ExportIcon weight="duotone" />}>
    Export
  </ActionBarButton>
</ActionBar>`,
    },
  ],
  keyboard: [
    { keys: "F6", does: "Brings focus to the bar's first action, unless you're typing in a field." },
    { keys: "→ / ←", does: "Moves between the bar's actions." },
    { keys: "Enter / Space", does: "Runs the focused action." },
    { keys: "Escape", does: "Clears the selection (unless you're typing), and focus goes back to where it was before the bar." },
    { keys: "Tab", does: "Moves through the actions and on; fixed, the bar comes last on the page." },
  ],
  a11y: [
    'The bar is role="toolbar", named with your label and the count, so it reads as "Sections: 3 selected".',
    "A polite live region says the count each time it changes, without moving focus.",
    "It never takes focus by itself, so ticking rows or typing carries on; F6 brings focus to it on purpose.",
    "When the selection is cleared from inside the bar, focus returns to where it came from rather than falling to the page.",
    "In narrow spaces the action words hide visually but stay as each button's name, and show as a tooltip.",
    "With more than one bar showing, F6 and Escape go to one: the bar focus is in, else the one whose container holds focus.",
    "It rises on a soft spring of transform and opacity; with reduced motion it fades.",
  ],
};
