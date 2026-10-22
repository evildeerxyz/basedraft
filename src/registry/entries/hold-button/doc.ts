import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { TrashIcon } from "@phosphor-icons/react";
import { HoldButton } from "@basedraft/ui";

export function DeleteDraft({ onDelete }: { onDelete: () => void }) {
  return (
    <HoldButton
      tone="stop"
      done="Deleted"
      icon={<TrashIcon weight="duotone" />}
      onConfirm={onDelete}
    >
      Hold to delete this draft
    </HoldButton>
  );
}`,
  use: [
    "For an action that can't be undone, or costs something to redo: deleting, resetting, publishing over what's live.",
    "In place of a confirm dialog, when one deliberate hold is enough to be sure.",
    "Say hold in the label, so nobody waits for a click to work.",
  ],
  avoid: [
    "For everyday actions: use Button. A hold on every action is tiring.",
    "When the person needs to read what will happen first, or type to confirm: use Dialog.",
    "For something that can be undone: use Button, and offer undo in a Toast.",
  ],
  parts: [
    {
      name: "HoldButton",
      note: "A button that fills as it's held and confirms at the end.",
      props: [
        { name: "children", type: "ReactNode", note: "The label. Say hold in it.", required: true },
        { name: "onConfirm", type: "() => void", note: "Called once, when the hold reaches the end." },
        { name: "duration", type: "number", default: "1400", note: "How long to hold, in milliseconds." },
        { name: "tone", type: '"ink" | "stop"', default: '"ink"', note: "The fill: ink, or red for deleting." },
        { name: "done", type: "ReactNode", default: '"Done"', note: "What it says, with a check, once confirmed. It returns to rest after 2.2 seconds." },
        { name: "icon", type: "ReactNode", note: "Leads the label, and stays with it on the fill." },
        { name: "className", type: "string", note: "Added to the button, to size or place it." },
      ],
    },
  ],
  examples: [
    {
      id: "ink",
      title: "Ink",
      note: "The default fill, for an action that's weighty rather than dangerous.",
      code: `<HoldButton done="Published" icon={<UploadSimpleIcon weight="duotone" />}>
  Hold to publish over the live site
</HoldButton>`,
    },
    {
      id: "stop",
      title: "Stop",
      note: "Red, for deleting. Let go before the end and it drains away.",
      code: `<HoldButton tone="stop" done="Deleted" icon={<TrashIcon weight="duotone" />}>
  Hold to delete Zuno's draft
</HoldButton>`,
    },
    {
      id: "duration",
      title: "A longer hold",
      note: "Raise duration for something bigger. Here, 2.6 seconds.",
      code: `<HoldButton
  duration={2600}
  done="Reset"
  icon={<ArrowCounterClockwiseIcon weight="regular" />}
>
  Hold to reset the theme
</HoldButton>`,
    },
    {
      id: "confirm",
      title: "Doing something",
      note: "onConfirm runs once each time the hold completes.",
      code: `function ClearCache() {
  const [cleared, setCleared] = useState(0);
  return (
    <div className="grid justify-items-center gap-3">
      <HoldButton done="Cleared" onConfirm={() => setCleared((n) => n + 1)}>
        Hold to clear the preview cache
      </HoldButton>
      <p className="text-xs text-[var(--bd-subtle)]">Cleared {cleared} times</p>
    </div>
  );
}`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves focus to it." },
    { keys: "Space / Enter (held)", does: "Fills it, as holding the pointer does. Letting go early drains it." },
  ],
  a11y: [
    "A native button, described to screen readers as press and hold to confirm, so the hold is never a surprise.",
    "When it confirms, a polite live region says what it says then, like Deleted.",
    "The label stays the button's name throughout; the fill is drawn over a copy hidden from screen readers.",
    "Touch holds don't open the context menu or scroll the page.",
  ],
};
