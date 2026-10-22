import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { SplitButton } from "@basedraft/ui";

export function Merge({ onMerge }: { onMerge: (how: string) => void }) {
  return (
    <SplitButton
      defaultValue="squash"
      onAction={onMerge}
      actions={[
        { value: "merge", label: "Merge", description: "Every commit is added to main." },
        { value: "squash", label: "Squash and merge", description: "The commits become one on main." },
        { value: "rebase", label: "Rebase and merge", description: "The commits are replayed on top of main." },
      ]}
    />
  );
}`,
  use: [
    "For one action that can be done a few ways, where people settle on the way they like: merge, publish, export, send.",
    "Give each way a description, so the list says what it does, not only what it's called.",
    "Keep value in your state, or a saved setting, to remember the way someone picked last time.",
  ],
  avoid: [
    "For a list of different actions on one thing: use Menu.",
    "For a choice that should be made before anything happens, and stay visible: use Segmented or Radio group.",
    "For one action with no alternatives: use Button.",
  ],
  parts: [
    {
      name: "SplitButton",
      note: "The pill that runs the chosen action, and the caret that opens the others.",
      props: [
        { name: "actions", type: "SplitAction[]", note: "The ways it can be done: value, label, and a description, icon or disabled if you like.", required: true },
        { name: "value", type: "string", note: "The chosen action's value, when you keep it. Leave it out and the button does." },
        { name: "defaultValue", type: "string", default: "the first", note: "The action chosen at first, when the button keeps it." },
        { name: "onValueChange", type: "(value: string) => void", note: "Runs when another action is chosen from the list." },
        { name: "onAction", type: "(value: string) => void", note: "Runs with the chosen action's value when the pill is pressed." },
        { name: "variant", type: '"ink" | "outline"', default: '"ink"', note: "Ink for the main action on a page, outline for the rest." },
        { name: "size", type: '"sm" | "md"', default: '"md"', note: "32 or 40 pixels tall." },
        { name: "loading", type: "boolean", default: "false", note: "Dots in place of the label, and the pill can't be pressed, while the action runs." },
        { name: "disabled", type: "boolean", default: "false", note: "Neither part can be pressed." },
        { name: "menuLabel", type: "string", default: '"More actions"', note: "What the caret says to a screen reader." },
      ],
    },
  ],
  examples: [
    {
      id: "publish",
      title: "Publish, three ways",
      note: "Icons and descriptions in the list; the pill shows dots while it publishes.",
      code: `function Publish() {
  const [busy, setBusy] = useState(false);
  return (
    <SplitButton
      loading={busy}
      onAction={() => {
        setBusy(true);
        setTimeout(() => setBusy(false), 1600);
      }}
      actions={[
        { value: "live", label: "Publish", icon: <GlobeIcon weight="duotone" />, description: "Live on zuno.site now." },
        { value: "staging", label: "Publish to staging", icon: <FlaskIcon weight="duotone" />, description: "On staging.zuno.site, for a last look." },
        { value: "schedule", label: "Schedule", icon: <CalendarDotsIcon weight="duotone" />, description: "Pick a time, and it goes live then." },
      ]}
    />
  );
}`,
    },
    {
      id: "outline",
      title: "Outline, small",
      note: "For an action that isn't the page's main one.",
      code: `<SplitButton
  variant="outline"
  size="sm"
  actions={[
    { value: "zip", label: "Export as zip" },
    { value: "figma", label: "Copy to Figma" },
    { value: "github", label: "Push to GitHub" },
  ]}
/>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves to the pill, then to the caret." },
    { keys: "Enter Space", does: "On the pill, runs the chosen action; on the caret, opens the list." },
    { keys: "↓ ↑", does: "On the caret, opens the list; in it, moves between actions." },
    { keys: "Enter", does: "In the list, chooses the action and goes back to the pill, ready to press." },
    { keys: "Escape", does: "Closes the list and goes back to the caret." },
  ],
  a11y: [
    "Two buttons: the pill, named by the chosen action, and the caret, named by menuLabel, saying it opens a menu and whether it's open.",
    "The list is a menu of radio items, the chosen one checked, so a screen reader says which way is set.",
    "While loading, the pill is busy and can't be pressed.",
  ],
};
