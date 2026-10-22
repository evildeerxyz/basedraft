import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Kbd, KbdGroup } from "@basedraft/ui";

export function SearchHint() {
  return (
    <p className="flex items-center gap-2 text-sm">
      Search
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </p>
  );
}`,
  use: [
    "Wherever a keyboard shortcut is mentioned: in a menu, a tooltip, a help line.",
    "It goes down when that key is pressed, which teaches the shortcut as people try it.",
  ],
  avoid: [
    "For a shortcut inside a tooltip: Tooltip draws its own small caps from its keys prop.",
    "For a button: use Button. A keycap isn't something to press on screen, though clicking it plays along.",
  ],
  parts: [
    {
      name: "Kbd",
      note: "One keycap, as a kbd element.",
      props: [
        { name: "children", type: "string", note: "The key as a Mac shows it: ⌘, ⇧, ⌥, ⌃, ↵, ⌫, Esc, Tab, Space, the arrows, or a letter.", required: true },
        { name: "listen", type: "boolean", default: "true", note: "Goes down when that key is pressed on the keyboard. Set false for a long list of caps." },
        { name: "size", type: '"sm" | "md"', default: '"md"', note: "20 or 28px tall." },
        { name: "...props", type: "kbd props", note: "Everything a kbd takes." },
      ],
    },
    {
      name: "KbdGroup",
      note: "Keys pressed together, side by side.",
      props: [{ name: "...props", type: "span props", note: "Everything a span takes." }],
    },
  ],
  examples: [
    {
      id: "keys",
      title: "Single keys",
      note: "Press Escape, Enter or Backspace and watch the cap.",
      code: `<div className="flex items-center gap-2">
  <Kbd>Esc</Kbd>
  <Kbd>↵</Kbd>
  <Kbd>⌫</Kbd>
</div>`,
    },
    {
      id: "combo",
      title: "A combination",
      note: "Keys held together, in a group.",
      code: `<div className="flex items-center gap-3 text-sm text-[var(--bd-muted)]">
  Open the command menu
  <KbdGroup>
    <Kbd>⌘</Kbd>
    <Kbd>⇧</Kbd>
    <Kbd>P</Kbd>
  </KbdGroup>
</div>`,
    },
    {
      id: "sizes",
      title: "Sizes",
      note: "Small inside text and menus, medium on its own.",
      code: `<div className="flex items-center gap-4">
  <KbdGroup>
    <Kbd size="sm">⌘</Kbd>
    <Kbd size="sm">S</Kbd>
  </KbdGroup>
  <KbdGroup>
    <Kbd>⌘</Kbd>
    <Kbd>S</Kbd>
  </KbdGroup>
</div>`,
    },
    {
      id: "inline",
      title: "In a sentence",
      note: "Small caps sit on the line of text.",
      code: `<p className="text-sm text-[var(--bd-muted)]">
  Press <Kbd size="sm">⌘</Kbd> <Kbd size="sm">Z</Kbd> to undo, or{" "}
  <Kbd size="sm">P</Kbd> to preview.
</p>`,
    },
  ],
  a11y: [
    "A native kbd element, so screen readers and copy and paste treat it as a key.",
    "Symbols like ⌘ are read as their names by most screen readers; spell the shortcut out nearby where it's important.",
    "Listening only draws the cap going down; it never stops the key doing what it does.",
  ],
};
