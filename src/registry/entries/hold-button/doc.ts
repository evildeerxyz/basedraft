import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { HoldButton } from "@basedraft/ui";

export function SendPayout({ onSend }: { onSend: () => void }) {
  return (
    <HoldButton
      done="Sent"
      icon={<PaperPlaneTiltIcon weight="duotone" />}
      onConfirm={onSend}
    >
      Hold to send $2,400
    </HoldButton>
  );
}`,
  use: [
    "For an action that can't be taken back, or costs something to redo: sending money, revoking a key, publishing over what's live.",
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
      note: "A button whose dial winds closed as it's held, with the time left at its end, and confirms when the dial is full.",
      props: [
        { name: "children", type: "ReactNode", note: "The label. Say hold in it.", required: true },
        { name: "onConfirm", type: "() => void", note: "Called once, when the hold reaches the end." },
        { name: "duration", type: "number", default: "1400", note: "How long to hold, in milliseconds." },
        { name: "tone", type: '"ink" | "stop"', default: '"ink"', note: "The dial's color: ink, or red for what can't be taken back." },
        { name: "done", type: "ReactNode", default: '"Done"', note: "What it says once confirmed, the dial filled with a check. It returns to rest after 2.2 seconds." },
        { name: "icon", type: "ReactNode", note: "Sits in the dial until it's confirmed." },
        { name: "className", type: "string", note: "Added to the button, to size or place it." },
      ],
    },
  ],
  examples: [
    {
      id: "ink",
      title: "Ink",
      note: "The default dial, for an action that's weighty rather than dangerous.",
      code: `<HoldButton done="Published" icon={<UploadSimpleIcon weight="duotone" />}>
  Hold to publish over the live site
</HoldButton>`,
    },
    {
      id: "stop",
      title: "Stop",
      note: "A red dial, for what can't be taken back. Let go before the end and it unwinds.",
      code: `<HoldButton tone="stop" done="Revoked" icon={<KeyIcon weight="duotone" />}>
  Hold to revoke the API key
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
    { keys: "Space / Enter (held)", does: "Winds the dial, as holding the pointer does. Letting go early unwinds it." },
  ],
  a11y: [
    "A native button, described to screen readers as press and hold to confirm, so the hold is never a surprise.",
    "When it confirms, a polite live region says what it says then, like Deleted.",
    "The dial and the countdown are drawn for the eye and hidden from screen readers; the label is the button's name.",
    "Touch holds don't open the context menu or scroll the page.",
  ],
};
