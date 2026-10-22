import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@basedraft/ui";

export function Search() {
  // Opens with ⌘K (Ctrl K elsewhere) on its own.
  return (
    <CommandDialog label="Search Zuno">
      <CommandInput placeholder="Search pages and actions" />
      <CommandList>
        <CommandEmpty />
        <CommandGroup heading="Pages">
          <CommandItem
            value="Pricing"
            keywords={["/pricing"]}
            onSelect={() => router.push("/pricing")}
          >
            Pricing
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Actions">
          <CommandItem
            value="Publish to GitHub"
            shortcut={["⌘", "P"]}
            onSelect={publish}
          >
            Publish to GitHub
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}`,
  use: [
    "For a site or an app with more pages and actions than a menu can hold: one field that finds any of them.",
    "As a ⌘K palette, so people who know the keyboard can get anywhere without the mouse.",
    "In place, as the search inside a picker that lists many things.",
  ],
  avoid: [
    "For a few actions about one thing: use Menu.",
    "For choosing a value in a form: use Select.",
    "For searching long text or records on a server: filter there, and give the results to CommandItem.",
  ],
  parts: [
    {
      name: "Command",
      note: "The palette in place: holds what's typed and which item is active.",
      props: [
        { name: "label", type: "string", default: '"Search"', note: "Its name for screen readers." },
        { name: "bare", type: "boolean", default: "false", note: "No card of its own, for a palette set inside another surface." },
        { name: "onEscape", type: "() => void", note: "Called on Escape. Without it, Escape clears the field." },
        { name: "className", type: "string", note: "Added to the card." },
        { name: "children", type: "ReactNode", required: true, note: "The input, the list and the footer." },
      ],
    },
    {
      name: "CommandDialog",
      note: "The palette over the page, with the hero's light at its head. Choosing an item closes it.",
      props: [
        { name: "open", type: "boolean", note: "Whether it's open, when you control it." },
        { name: "defaultOpen", type: "boolean", default: "false", note: "Open at first, when it keeps the state." },
        { name: "onOpenChange", type: "(open: boolean) => void", note: "Called when it opens or closes." },
        { name: "shortcut", type: "string | false", default: '"k"', note: "The letter that, with ⌘ or Ctrl, opens and closes it. false for none, when your app already has one." },
        { name: "label", type: "string", default: '"Search"', note: "Its name for screen readers." },
        { name: "children", type: "ReactNode", required: true, note: "The input, the list and the footer." },
      ],
    },
    {
      name: "CommandInput",
      note: "The field. It drives the list: arrows move, Enter runs the active item.",
      props: [
        { name: "placeholder", type: "string", default: '"Search"', note: "What it says while empty." },
        { name: "...props", type: "input props", note: "Everything an input takes, except value and onChange, which the palette owns." },
      ],
    },
    { name: "CommandList", note: "The groups and items. It scrolls on its own, up to 320px tall.", props: [{ name: "label", type: "string", default: '"Results"', note: "Its name for screen readers." }, { name: "className", type: "string", note: "Set a different height here." }] },
    { name: "CommandEmpty", note: "Shows only when nothing matches.", props: [{ name: "children", type: "ReactNode", default: '"Nothing matches that."', note: "What it says; a suggestion helps." }] },
    { name: "CommandGroup", note: "Items under a small heading. A group with nothing left in it steps aside.", props: [{ name: "heading", type: "ReactNode", note: "Its heading. The group is labelled by it." }] },
    {
      name: "CommandItem",
      note: "One page or action. It shows while every word typed is in its value, keywords or name.",
      props: [
        { name: "value", type: "string", required: true, note: "What it's found by, and its key: unique within the palette." },
        { name: "keywords", type: "string[]", note: "Other words that should find it: a path, a synonym." },
        { name: "onSelect", type: "() => void", note: "Runs on a click, or Enter while it's active." },
        { name: "icon", type: "ReactNode", note: "An icon on a small tile before the name." },
        { name: "hint", type: "ReactNode", note: "A quiet note at the end, like a path." },
        { name: "shortcut", type: "string[]", note: 'Its keys, shown at the end: ["⌘", "P"]. Not bound.' },
        { name: "disabled", type: "boolean", default: "false", note: "Faded; onSelect doesn't run." },
        { name: "children", type: "ReactNode", required: true, note: "Its name." },
      ],
    },
    { name: "CommandFooter", note: "The keys that work here, small, and anything you add on the right.", props: [{ name: "children", type: "ReactNode", note: "A note on the right, like a count." }] },
  ],
  examples: [
    {
      id: "dialog",
      title: "As a palette over the page",
      note: "Opened by a button here, with shortcut={false} since this site has its own ⌘K. Left to itself it opens with ⌘K.",
      code: `<Button variant="outline" onClick={() => setOpen(true)}>
  Search Zuno
</Button>
<CommandDialog
  open={open}
  onOpenChange={setOpen}
  shortcut={false}
  label="Search Zuno"
>
  <CommandInput placeholder="Search Zuno's pages and actions" />
  <CommandList>
    <CommandEmpty />
    <CommandGroup heading="Pages">...</CommandGroup>
    <CommandGroup heading="Actions">...</CommandGroup>
  </CommandList>
  <CommandFooter>Zuno, 25 pages</CommandFooter>
</CommandDialog>`,
    },
    {
      id: "empty",
      title: "A helpful empty state",
      note: "Type something that isn't there: the group steps aside and the empty line suggests what to try.",
      code: `<CommandList>
  <CommandEmpty>No section by that name. Try “hero” or “pricing”.</CommandEmpty>
  <CommandGroup heading="Sections">
    {sections.map((s) => <CommandItem key={s} value={s}>{s}</CommandItem>)}
  </CommandGroup>
</CommandList>`,
    },
    {
      id: "footer",
      title: "Hints and a footer",
      note: "A hint at the end of each row, and a footer that teaches the keys.",
      code: `<Command label="Jump to a page">
  <CommandInput placeholder="Jump to a page" />
  <CommandList>
    <CommandEmpty />
    <CommandGroup>
      {pages.map((p) => (
        <CommandItem key={p.label} value={p.label} hint={p.path}>
          {p.label}
        </CommandItem>
      ))}
    </CommandGroup>
  </CommandList>
  <CommandFooter>{pages.length} pages</CommandFooter>
</Command>`,
    },
  ],
  keyboard: [
    { keys: "⌘K / Ctrl K", does: "Opens or closes CommandDialog, unless its shortcut is turned off." },
    { keys: "↓ / ↑", does: "Moves the active item down or up, round at the ends." },
    { keys: "Ctrl Home / Ctrl End", does: "Jumps to the first or the last item." },
    { keys: "Enter", does: "Runs the active item; in the dialog, then closes it." },
    { keys: "Esc", does: "Closes the dialog, or clears the field when it's in place." },
  ],
  a11y: [
    'The field has role="combobox" and aria-activedescendant pointing at the active item, so focus stays in the field while screen readers read the item.',
    'The list has role="listbox"; items have role="option" with aria-selected; groups have role="group", labelled by their heading.',
    "The dialog has role=\"dialog\" and aria-modal, puts focus in the field when it opens and gives focus back where it was when it closes.",
    "Typing narrows the list as you go; the first match becomes active, so Enter does the obvious thing.",
  ],
};
