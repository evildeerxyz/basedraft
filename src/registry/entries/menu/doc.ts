import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@basedraft/ui";

export function SectionMenu() {
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="outline">Hero section</Button>
      </MenuTrigger>
      <MenuContent>
        <MenuItem shortcut={["⌘", "D"]} onSelect={duplicate}>
          Duplicate
        </MenuItem>
        <MenuItem onSelect={moveUp}>Move up</MenuItem>
        <MenuSeparator />
        <MenuItem tone="stop" onSelect={remove}>
          Delete section
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}`,
  use: [
    "For a handful of actions about one thing, kept out of the way until they're wanted: a section, a draft, an account.",
    "For options that tick on and off, where several are often set in a row.",
    "Where the keyboard matters: it's fully driven by arrows, Home, End, letters and Enter.",
  ],
  avoid: [
    "For choosing one value in a form: use Select or Segmented control.",
    "For a setting with its own controls, like a color or a link: use Popover.",
    "For searching a long list of pages and actions: use Command.",
    "For the one action everyone needs: put it on the page as a Button rather than inside a menu.",
  ],
  parts: [
    {
      name: "Menu",
      note: "Holds whether it's open. Renders nothing itself.",
      props: [
        { name: "open", type: "boolean", note: "Whether it's open, when you control it." },
        { name: "defaultOpen", type: "boolean", default: "false", note: "Open at first, when Menu keeps the state." },
        { name: "onOpenChange", type: "(open: boolean) => void", note: "Called when it opens or closes." },
        { name: "children", type: "ReactNode", required: true, note: "The trigger and the content." },
      ],
    },
    {
      name: "MenuTrigger",
      note: "Opens it. Down arrow opens it on the first action, up arrow on the last.",
      props: [
        { name: "asChild", type: "boolean", default: "false", note: "Use the one element you pass instead of a plain button." },
        { name: "...props", type: "button props", note: "Everything a button takes." },
      ],
    },
    {
      name: "MenuContent",
      note: "The list, in a portal, beside its trigger. Flips above when there's no room below.",
      props: [
        { name: "side", type: '"bottom" | "top"', default: '"bottom"', note: "The side it prefers." },
        { name: "align", type: '"start" | "center" | "end"', default: '"start"', note: "Which edge of the trigger it lines up with." },
        { name: "gap", type: "number", default: "6", note: "Space between the trigger and the list, in pixels." },
        { name: "className", type: "string", note: "Added to the list." },
        { name: "children", type: "ReactNode", required: true, note: "Items, labels, groups and separators." },
      ],
    },
    {
      name: "MenuItem",
      note: "One action. Choosing it runs onSelect and closes the menu.",
      props: [
        { name: "onSelect", type: "() => void", note: "Runs on a click, Enter or Space." },
        { name: "icon", type: "ReactNode", note: "An icon before the name." },
        { name: "shortcut", type: "string[]", note: 'Its keys, one each: ["⌘", "D"]. Shown, not bound; bind them in your app.' },
        { name: "tone", type: '"default" | "stop"', default: '"default"', note: "Stop sets it in red, for the one that can't be undone." },
        { name: "disabled", type: "boolean", default: "false", note: "Faded and skipped by the arrow keys." },
        { name: "children", type: "ReactNode", required: true, note: "Its name. Type-ahead matches on it." },
      ],
    },
    {
      name: "MenuCheckboxItem",
      note: "An option that ticks on and off. Choosing it keeps the menu open.",
      props: [
        { name: "checked", type: "boolean", note: "Whether it's on, when you control it." },
        { name: "defaultChecked", type: "boolean", default: "false", note: "On at first, when it keeps the state." },
        { name: "onCheckedChange", type: "(checked: boolean) => void", note: "Called with the new value." },
        { name: "shortcut", type: "string[]", note: "Its keys, shown at the end." },
        { name: "disabled", type: "boolean", default: "false", note: "Faded and skipped." },
        { name: "children", type: "ReactNode", required: true, note: "Its name." },
      ],
    },
    { name: "MenuLabel", note: "A section's small name, over its items.", props: [{ name: "...props", type: "div props", note: "Everything a div takes." }] },
    { name: "MenuGroup", note: "A group of items for screen readers.", props: [{ name: "label", type: "string", note: "Its name, usually the same as its MenuLabel." }, { name: "children", type: "ReactNode", required: true, note: "Its items." }] },
    { name: "MenuSeparator", note: "A hairline between sections.", props: [{ name: "className", type: "string", note: "Added to the line." }] },
  ],
  examples: [
    {
      id: "account",
      title: "An account menu",
      note: "Aligned to the trigger's end, as a menu at the right of a header should be. The label shows whose account it is.",
      code: `<Menu>
  <MenuTrigger asChild>
    <Button variant="outline">Emily Carter</Button>
  </MenuTrigger>
  <MenuContent align="end">
    <MenuLabel>emily@larkspur.co</MenuLabel>
    <MenuItem icon={<ReceiptIcon weight="duotone" />}>Purchases</MenuItem>
    <MenuItem icon={<UsersThreeIcon weight="duotone" />}>Team</MenuItem>
    <MenuItem icon={<GearSixIcon weight="duotone" />} shortcut={["⌘", ","]}>
      Settings
    </MenuItem>
    <MenuSeparator />
    <MenuItem icon={<SignOutIcon weight="duotone" />}>Sign out</MenuItem>
  </MenuContent>
</Menu>`,
    },
    {
      id: "checkable",
      title: "Options that tick",
      note: "Each option keeps the menu open, so the grid, the rulers and the outlines can be set in one go.",
      code: `<MenuContent>
  <MenuCheckboxItem
    checked={grid}
    onCheckedChange={setGrid}
    shortcut={["⌘", "'"]}
  >
    Layout grid
  </MenuCheckboxItem>
  <MenuCheckboxItem
    checked={rulers}
    onCheckedChange={setRulers}
    shortcut={["⌘", "R"]}
  >
    Rulers
  </MenuCheckboxItem>
  <MenuCheckboxItem checked={outlines} onCheckedChange={setOutlines}>
    Section outlines
  </MenuCheckboxItem>
</MenuContent>`,
    },
    {
      id: "icon",
      title: "From an icon button",
      note: "A lone icon needs an aria-label. A disabled item stays in the list to say it exists, and the arrows skip it.",
      code: `<Menu>
  <MenuTrigger asChild>
    <Button variant="outline" size="icon" aria-label="More for this draft">
      <DotsThreeIcon weight="bold" />
    </Button>
  </MenuTrigger>
  <MenuContent align="end">
    <MenuItem>Rename</MenuItem>
    <MenuItem>Duplicate</MenuItem>
    <MenuItem disabled>Move to team (Team plan)</MenuItem>
    <MenuSeparator />
    <MenuItem tone="stop">Delete draft</MenuItem>
  </MenuContent>
</Menu>`,
    },
  ],
  keyboard: [
    { keys: "Enter / Space / ↓", does: "On the trigger, opens it on the first action." },
    { keys: "↑", does: "On the trigger, opens it on the last action." },
    { keys: "↓ / ↑", does: "Moves to the next or the previous action, round at the ends." },
    { keys: "Home / End", does: "Moves to the first or the last action." },
    { keys: "A letter", does: "Moves to the next action whose name starts with it; letters typed quickly spell more of the name." },
    { keys: "Enter / Space", does: "Runs the action, or ticks the option." },
    { keys: "Esc", does: "Closes it and puts focus back on the trigger." },
    { keys: "Tab", does: "Closes it and moves on through the page." },
  ],
  a11y: [
    'The trigger has aria-haspopup="menu", aria-expanded and aria-controls; the list has role="menu" and is labelled by the trigger.',
    'Actions have role="menuitem"; options have role="menuitemcheckbox" with aria-checked. Disabled ones have aria-disabled.',
    "Focus moves through the items themselves, so a screen reader reads each one as it's reached, with its state.",
    "Shortcuts are shown for the eye only; screen readers aren't read the key caps.",
  ],
};
