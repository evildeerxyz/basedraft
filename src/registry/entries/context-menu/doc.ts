import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuSub, ContextMenuTrigger } from "@basedraft/ui";

export function SiteCard() {
  return (
    <ContextMenu>
      <ContextMenuTrigger aria-label="Zuno, right-click for actions">…</ContextMenuTrigger>
      <ContextMenuContent label="Actions for Zuno">
        <ContextMenuItem shortcut={["⌘", "D"]} onSelect={duplicate}>Duplicate</ContextMenuItem>
        <ContextMenuSub label="Move to">
          <ContextMenuItem onSelect={() => move("drafts")}>Drafts</ContextMenuItem>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem tone="stop" onSelect={remove}>Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}`,
  use: [
    "For the actions on a thing people work with a lot, where right-clicking is natural: files, cards, rows, a canvas.",
    "Repeat the actions somewhere visible too, like a menu button or a toolbar. A right-click is a shortcut, not the only way.",
    "Group the actions, put the one that can't be undone last in tone=\"stop\", and show the shortcuts you've bound.",
  ],
  avoid: [
    "For a menu opened from a button: use Menu.",
    "For searching pages and actions: use Command.",
    "For one destructive action that needs a deliberate press: use Hold button.",
  ],
  parts: [
    { name: "ContextMenu", note: "Holds whether it's open and where.", props: [{ name: "onOpenChange", type: "(open: boolean) => void", note: "Runs when it opens or closes." }] },
    {
      name: "ContextMenuTrigger",
      note: "The area that opens it. A div that takes focus; give it an aria-label.",
      props: [
        { name: "children", type: "ReactNode", note: "What's right-clicked.", required: true },
        { name: "...props", type: "div props", note: "Everything a div takes." },
      ],
    },
    {
      name: "ContextMenuContent",
      note: "The menu, in a portal at the pointer.",
      props: [
        { name: "label", type: "string", note: "What the menu is for, for a screen reader." },
        { name: "children", type: "ReactNode", note: "Items, checkbox items, submenus, labels and separators.", required: true },
      ],
    },
    {
      name: "ContextMenuItem",
      note: "One action; choosing it closes the menu.",
      props: [
        { name: "onSelect", type: "() => void", note: "Runs when it's chosen." },
        { name: "icon", type: "ReactNode", note: "Before the label." },
        { name: "shortcut", type: "string[]", note: "Its keys, one each, shown on the right. Shown, not bound." },
        { name: "tone", type: '"default" | "stop"', default: '"default"', note: "Stop is red, for the one that can't be undone." },
        { name: "disabled", type: "boolean", note: "Shown faded, skipped by the keys." },
      ],
    },
    {
      name: "ContextMenuCheckboxItem",
      note: "An option that ticks on and off and keeps the menu open.",
      props: [
        { name: "checked", type: "boolean", note: "Whether it's on, when you keep it." },
        { name: "defaultChecked", type: "boolean", default: "false", note: "Whether it starts on." },
        { name: "onCheckedChange", type: "(checked: boolean) => void", note: "Runs when it's ticked or unticked." },
      ],
    },
    {
      name: "ContextMenuSub",
      note: "A row that opens more actions beside it.",
      props: [
        { name: "label", type: "string", note: "Its name.", required: true },
        { name: "icon", type: "ReactNode", note: "Before the label." },
        { name: "children", type: "ReactNode", note: "Its items.", required: true },
      ],
    },
    { name: "ContextMenuLabel", note: "A section's name, small and quiet.", props: [] },
    { name: "ContextMenuSeparator", note: "A hairline between sections.", props: [] },
  ],
  examples: [
    {
      id: "canvas",
      title: "Options that stay open",
      note: "Checkbox items tick without closing the menu, so several can be set in a row.",
      code: `<ContextMenu>
  <ContextMenuTrigger aria-label="Canvas, right-click for options">…</ContextMenuTrigger>
  <ContextMenuContent label="Canvas">
    <ContextMenuLabel>View</ContextMenuLabel>
    <ContextMenuCheckboxItem defaultChecked>Show the grid</ContextMenuCheckboxItem>
    <ContextMenuCheckboxItem defaultChecked>Snap to sections</ContextMenuCheckboxItem>
    <ContextMenuSeparator />
    <ContextMenuItem shortcut={["⌘", "0"]} onSelect={fit}>Zoom to fit</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`,
    },
  ],
  keyboard: [
    { keys: "Shift F10", does: "On the focused trigger, opens the menu on its first action. So does the menu key." },
    { keys: "↑ ↓", does: "Moves between actions." },
    { keys: "Home End", does: "Jumps to the first or last action." },
    { keys: "A letter", does: "Jumps to the next action that starts with it." },
    { keys: "Enter Space", does: "Chooses the action, or opens a submenu." },
    { keys: "→", does: "Opens a submenu on its first action." },
    { keys: "← Escape", does: "Closes a submenu; at the top, closes the menu and goes back to the trigger." },
  ],
  a11y: [
    "The menu is role menu, named by label; its rows are menuitem or menuitemcheckbox, and a submenu row says it opens a menu and whether it's open.",
    "The trigger takes focus and announces Shift+F10 as its shortcut, so the menu can be reached without a mouse.",
    "On touch, a long press opens it.",
    "With reduced motion, it appears without growing, and the ring at the pointer is left out.",
  ],
};
