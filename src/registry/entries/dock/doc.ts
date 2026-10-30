import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Dock, DockItem, DockDivider } from "@/components/basedraft/dock";

export function Launcher() {
  return (
    <Dock>
      <DockItem label="Home" icon={<HouseIcon />} active />
      <DockItem label="Mail" icon={<TrayIcon />} badge={3} />
      <DockDivider />
      <DockItem label="Trash" icon={<TrashIcon />} />
    </Dock>
  );
}`,
  use: [
    "For a handful of places or tools that are always one reach away: an app's launcher, a portfolio's sections, a desktop-like product.",
    "Mark what's open with active, and what wants attention with a badge.",
    "Give keys an href to make them links; pass your router's Link as link.",
  ],
  avoid: [
    "For more than ten or so: the swell crowds. Use App sidebar or Navigation menu.",
    "On touch screens as the only way around: there's no pointer to swell under, so keep the sizes generous.",
  ],
  parts: [
    {
      name: "Dock",
      note: "The frosted bar.",
      props: [
        { name: "children", type: "ReactNode", note: "DockItem and DockDivider.", required: true },
        { name: "size", type: "number", default: "44", note: "A key's size at rest, in px." },
        { name: "magnify", type: "number", default: "66", note: "Its size right under the pointer." },
        { name: "reach", type: "number", default: "140", note: "How far the swell reaches either side of the pointer, in px." },
        { name: "label", type: "string", default: '"Dock"', note: "What it is, for screen readers." },
        { name: "className", type: "string", note: "Added to the nav around it." },
      ],
    },
    {
      name: "DockItem",
      note: "A metal key: a button, or a link with href.",
      props: [
        { name: "label", type: "string", note: "Its name, shown over it.", required: true },
        { name: "icon", type: "ReactNode", note: "The icon on the key, in white.", required: true },
        { name: "onClick", type: "() => void", note: "What pressing it does." },
        { name: "href", type: "string", note: "Where it goes; it's a link then." },
        { name: "link", type: "ElementType", default: '"a"', note: "Your router's link." },
        { name: "active", type: "boolean", note: "Open: a dot under it." },
        { name: "badge", type: "ReactNode", note: "A count or mark on its corner." },
      ],
    },
    { name: "DockDivider", note: "A thin line between groups.", props: [] },
  ],
  examples: [
    {
      id: "links",
      title: "Smaller, as links",
      note: "size, magnify and reach turned down for a site's few links, each an href.",
      code: `<Dock size={38} magnify={54} reach={110}>
  <DockItem label="Home" icon={<HouseIcon />} href="/" active />
  <DockItem label="Docs" icon={<BookOpenTextIcon />} href="/docs" />
</Dock>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves into the dock and out of it." },
    { keys: "← → Home End", does: "Walk along the keys; the one with focus swells and shows its name." },
    { keys: "Enter Space", does: "Press the key." },
  ],
  a11y: [
    "It's a nav landmark; each key says its name, whether it's open, and its badge.",
    "With reduced motion the keys don't swell or hop.",
  ],
};
