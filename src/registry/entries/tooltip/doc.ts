import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { ExportIcon } from "@phosphor-icons/react";
import { Tooltip } from "@basedraft/ui";

export function ExportTool() {
  return (
    <Tooltip content="Export" keys={["⌘", "E"]}>
      <button type="button" aria-label="Export">
        <ExportIcon weight="duotone" />
      </button>
    </Tooltip>
  );
}`,
  use: [
    "To name an icon-only control, and teach its shortcut, on hover or keyboard focus.",
    "For a few words at most. A tooltip is a label, not a paragraph.",
  ],
  avoid: [
    "For anything interactive, or more than a short line: use Popover.",
    "For information people must see to use the page: put it on the page.",
    "On touch screens there's no hover, so never hide the only explanation in a tooltip.",
  ],
  parts: [
    {
      name: "Tooltip",
      note: "Wraps one element and describes it while it shows.",
      props: [
        { name: "content", type: "ReactNode", note: "What the bubble says.", required: true },
        { name: "children", type: "ReactElement", note: "The one element it describes, usually a button. It's given aria-describedby while the bubble shows.", required: true },
        { name: "keys", type: "string[]", note: 'The action\'s shortcut, a small cap each: ["⌘", "E"].' },
        { name: "side", type: '"top" | "bottom"', default: '"top"', note: "Above what it describes, or below." },
        { name: "delay", type: "number", default: "160", note: "How long to wait before it shows, in milliseconds, so passing over a toolbar doesn't flash every label." },
        { name: "className", type: "string", note: "Added to the bubble." },
      ],
    },
  ],
  examples: [
    {
      id: "basic",
      title: "Naming an icon",
      note: "Point at the button, or tab to it.",
      code: `<Tooltip content="Duplicate section">
  <Button size="icon" variant="outline" aria-label="Duplicate section">
    <CopySimpleIcon weight="duotone" />
  </Button>
</Tooltip>`,
    },
    {
      id: "keys",
      title: "With a shortcut",
      note: "The keys ride along on small caps.",
      code: `<Tooltip content="Undo" keys={["⌘", "Z"]}>
  <Button size="icon" variant="outline" aria-label="Undo">
    <ArrowCounterClockwiseIcon weight="regular" />
  </Button>
</Tooltip>`,
    },
    {
      id: "bottom",
      title: "Below",
      note: 'side="bottom", for controls at the top of a window.',
      code: `<Tooltip content="Share a preview link" side="bottom">
  <Button variant="outline" size="sm">
    <LinkSimpleIcon weight="duotone" /> Share
  </Button>
</Tooltip>`,
    },
    {
      id: "delay",
      title: "A longer wait",
      note: "delay={600}, for a control people point at on the way to something else.",
      code: `<Tooltip content="Drag to reorder" delay={600}>
  <Button size="icon" variant="ghost" aria-label="Drag to reorder">
    <DotsSixVerticalIcon weight="bold" />
  </Button>
</Tooltip>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Focusing the element shows its tooltip after the delay." },
    { keys: "Esc", does: "Puts the tooltip away." },
  ],
  a11y: [
    "The bubble has the tooltip role, and the element it wraps is described by it while it shows.",
    "It shows on keyboard focus as well as hover, and Escape dismisses it.",
    "An icon-only button still needs its own aria-label; the tooltip describes it, it doesn't name it.",
  ],
};
