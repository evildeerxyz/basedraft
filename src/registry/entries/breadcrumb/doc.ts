import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import Link from "next/link";
import { Breadcrumb } from "@basedraft/ui";

export function Path() {
  return (
    <Breadcrumb
      link={Link}
      items={[
        { label: "Fieldwork", href: "/" },
        { label: "Sites", href: "/sites" },
        { label: "Zuno", href: "/sites/zuno" },
        { label: "Pricing" },
      ]}
    />
  );
}`,
  use: [
    "At the top of a page that sits a few levels deep, so people see where they are and can step back up.",
    "Give a level siblings when people often move across rather than up: from one site to another, one branch to the next.",
    "Pass your router's link as link, so every crumb navigates without a full page load.",
  ],
  avoid: [
    "For switching between views of the same thing: use Tabs.",
    "For a flat app with no depth: the page title alone says where you are.",
    "For the steps of a task: use Stepper.",
  ],
  parts: [
    {
      name: "Breadcrumb",
      note: "A nav with an ordered list of crumbs.",
      props: [
        { name: "items", type: "Crumb[]", note: "The path from the top down. The last is the page you're on.", required: true },
        { name: "max", type: "number", default: "4", note: "How many crumbs show before the middle ones fold into one menu. At least 3." },
        { name: "link", type: "ElementType", default: '"a"', note: "Your router's link, like Next.js's Link. It gets href and className." },
        { name: "label", type: "string", default: '"Breadcrumb"', note: "What the nav is called, for a screen reader." },
        { name: "className", type: "string", note: "Added to the nav." },
      ],
    },
    {
      name: "Crumb",
      note: "One level, as an object in items.",
      props: [
        { name: "label", type: "string", note: "Its name.", required: true },
        { name: "href", type: "string", note: "Where it goes. Leave it off the last one, the page you're on." },
        { name: "icon", type: "ReactNode", note: "Before the label, at 16px." },
        { name: "siblings", type: "{ label, href, icon? }[]", note: "Opened from a caret beside it, to jump across. The one with the same label is ticked." },
      ],
    },
  ],
  examples: [
    {
      id: "basic",
      title: "A path",
      note: "Links up to the page you're on, which is in ink and isn't a link.",
      code: `<Breadcrumb
  items={[
    { label: "Fieldwork", href: "/", icon: <HouseIcon weight="duotone" /> },
    { label: "Templates", href: "/templates" },
    { label: "Zuno" },
  ]}
/>`,
    },
    {
      id: "folded",
      title: "A long path, folded",
      note: "Past max, the middle folds into one button that opens the levels it hides.",
      code: `<Breadcrumb
  max={4}
  items={[
    { label: "Docs", href: "/docs" },
    { label: "Components", href: "/docs/components" },
    { label: "Data", href: "/docs/components/data" },
    { label: "Charts", href: "/docs/components/data/charts" },
    { label: "Bar chart", href: "/docs/components/data/charts/bar" },
    { label: "Stacked" },
  ]}
/>`,
    },
    {
      id: "siblings",
      title: "Across, not up",
      note: "A level with siblings carries a caret that opens them, the current one ticked.",
      code: `const sites = [
  { label: "Zuno", href: "/sites/zuno" },
  { label: "Noma", href: "/sites/noma" },
  { label: "Auren", href: "/sites/auren" },
];

<Breadcrumb
  items={[
    { label: "Fieldwork", href: "/" },
    { label: "Zuno", href: "/sites/zuno", siblings: sites },
    { label: "Settings" },
  ]}
/>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves from crumb to crumb, and to each fold or caret." },
    { keys: "Enter", does: "Follows a crumb, or opens a fold's or a caret's menu." },
    { keys: "↓", does: "On a fold or a caret, opens its menu." },
    { keys: "↑ ↓", does: "In a menu, moves between its links." },
    { keys: "Home End", does: "In a menu, jumps to the first or last link." },
    { keys: "A letter", does: "In a menu, jumps to the next link that starts with it." },
    { keys: "Escape", does: "Closes the menu and goes back to its button." },
  ],
  a11y: [
    "A nav named by label, around an ordered list, so a screen reader says how many levels deep the page is.",
    "The page you're on carries aria-current=\"page\".",
    "The fold says how many levels it hides, and each caret says which level it switches from; both say they open a menu, and whether it's open.",
    "The separators are drawn only and hidden from screen readers.",
  ],
};
