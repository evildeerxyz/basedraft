import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import {
  Button,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@basedraft/ui";

export function AccentPicker() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Accent: Lime</Button>
      </PopoverTrigger>
      <PopoverContent label="Accent" className="w-[272px]">
        {/* the swatches */}
        <PopoverClose asChild>
          <Button size="sm">Done</Button>
        </PopoverClose>
      </PopoverContent>
    </Popover>
  );
}`,
  use: [
    "For a small setting that belongs to one button: a color, a width, a link to share.",
    "When the person should keep the page in view and carry on after one choice.",
    "For a few controls together, a field and a switch, where a menu of actions would be wrong.",
  ],
  avoid: [
    "For a list of actions: use Menu, which handles the arrow keys and type-ahead for you.",
    "For a short label on hover: use Tooltip.",
    "For a task that needs full attention, or a form: use Dialog or Sheet.",
  ],
  parts: [
    {
      name: "Popover",
      note: "Holds whether it's open. Renders nothing itself.",
      props: [
        { name: "open", type: "boolean", note: "Whether it's open, when you control it." },
        { name: "defaultOpen", type: "boolean", default: "false", note: "Open at first, when Popover keeps the state." },
        { name: "onOpenChange", type: "(open: boolean) => void", note: "Called when it opens or closes." },
        { name: "children", type: "ReactNode", required: true, note: "The trigger and the content." },
      ],
    },
    {
      name: "PopoverTrigger",
      note: "Opens and closes it, and is what it's placed beside.",
      props: [
        { name: "asChild", type: "boolean", default: "false", note: "Use the one element you pass instead of a plain button." },
        { name: "...props", type: "button props", note: "Everything a button takes." },
      ],
    },
    {
      name: "PopoverContent",
      note: "The card, in a portal, beside its trigger. It flips above when there's no room below, and stays inside the window.",
      props: [
        { name: "side", type: '"bottom" | "top"', default: '"bottom"', note: "The side it prefers." },
        { name: "align", type: '"start" | "center" | "end"', default: '"center"', note: "Which edge of the trigger it lines up with." },
        { name: "gap", type: "number", default: "8", note: "Space between the trigger and the card, in pixels." },
        { name: "label", type: "string", note: "Its name for screen readers, when nothing inside names it." },
        { name: "className", type: "string", note: "Added to the card: set its width here." },
        { name: "children", type: "ReactNode", required: true, note: "What's in it." },
      ],
    },
    {
      name: "PopoverClose",
      note: "Closes it from inside and puts focus back on the trigger.",
      props: [
        { name: "asChild", type: "boolean", default: "false", note: "Use the one element you pass. Its own onClick runs first." },
        { name: "...props", type: "button props", note: "Everything a button takes." },
      ],
    },
  ],
  examples: [
    {
      id: "share",
      title: "A link to share",
      note: "A field, a copy button and a switch together, aligned to the trigger's start.",
      code: `<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Share</Button>
  </PopoverTrigger>
  <PopoverContent
    label="Share this draft"
    align="start"
    className="w-[320px]"
  >
    <p className="text-sm font-medium">Share this draft</p>
    <CopyButton
      value="https://basedraft.site/d/zuno-spring"
      label="Copy"
      variant="pill"
    />
    <label className="mt-4 flex items-center justify-between text-sm">
      Anyone with the link can look
      <Switch
        size="sm"
        defaultChecked
        aria-label="Anyone with the link can look"
      />
    </label>
  </PopoverContent>
</Popover>`,
    },
    {
      id: "align",
      title: "Aligned three ways",
      note: "Start, center and end line the card up with the trigger's left edge, middle or right edge.",
      code: `<PopoverContent align="start">...</PopoverContent>
<PopoverContent align="center">...</PopoverContent>
<PopoverContent align="end">...</PopoverContent>`,
    },
    {
      id: "top",
      title: "Above its trigger",
      note: "side=\"top\" for a trigger near the foot of the window. Each choice is wrapped in PopoverClose, so picking one closes it.",
      code: `<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">{width} px</Button>
  </PopoverTrigger>
  <PopoverContent side="top" label="Preview width" className="w-[240px]">
    {["1440", "820", "390"].map((w) => (
      <PopoverClose key={w} asChild>
        <Button
          variant={w === width ? "ink" : "outline"}
          size="sm"
          onClick={() => setWidth(w)}
        >
          {w}
        </Button>
      </PopoverClose>
    ))}
  </PopoverContent>
</Popover>`,
    },
  ],
  keyboard: [
    { keys: "Enter / Space", does: "On the trigger, opens it, or closes it if it's open." },
    { keys: "Tab", does: "Moves through the controls inside. Tabbing past the last one closes it." },
    { keys: "Esc", does: "Closes it and puts focus back on the trigger." },
  ],
  a11y: [
    'The trigger has aria-haspopup="dialog", aria-expanded and aria-controls pointing at the card.',
    'The card has role="dialog"; give it a label when no heading inside names it.',
    "Focus moves into the card when it opens (to data-autofocus, or the first control), and back to the trigger when it closes with Escape or PopoverClose.",
    "It isn't modal: the page behind still scrolls and a click anywhere else closes it.",
  ],
};
