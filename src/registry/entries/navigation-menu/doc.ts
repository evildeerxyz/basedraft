import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import Link from "next/link";
import { StackIcon } from "@phosphor-icons/react";
import { NavigationMenu, NavigationMenuCard, NavigationMenuItem, NavigationMenuLink } from "@/components/basedraft/navigation-menu";

export function SiteNav() {
  return (
    <NavigationMenu link={Link}>
      <NavigationMenuItem label="Product" className="grid w-[480px] grid-cols-2">
        <NavigationMenuCard link={Link} href="/components" icon={<StackIcon weight="duotone" />} title="Components" description="Free on npm." />
        <NavigationMenuCard link={Link} href="/blocks" title="Blocks" description="Every section, live." />
      </NavigationMenuItem>
      <NavigationMenuLink href="/pricing">Pricing</NavigationMenuLink>
    </NavigationMenu>
  );
}`,
  use: [
    "For a marketing site's header with a few menus of links, where each menu holds different things: a grid of products, a list of templates, a short column of guides.",
    "Size each panel with className; the card moves between them and takes each one's size.",
    "Keep plain links, like Pricing, as NavigationMenuLink, so they sit on the bar without a panel.",
  ],
  avoid: [
    "For an app's navigation down the side: use App sidebar.",
    "For a list of actions from a button: use Menu.",
    "For a phone: show the links in a Sheet behind a menu button instead.",
  ],
  parts: [
    {
      name: "NavigationMenu",
      note: "The nav, its bar, and the panel that moves between its menus.",
      props: [
        { name: "children", type: "NavigationMenuItem | NavigationMenuLink", note: "The bar's menus and links, in order.", required: true },
        { name: "label", type: "string", default: '"Main"', note: "What the nav is called, for a screen reader." },
        { name: "link", type: "ElementType", default: '"a"', note: "Your router's link, for the plain links on the bar." },
        { name: "className", type: "string", note: "Added to the nav." },
      ],
    },
    {
      name: "NavigationMenuItem",
      note: "A menu on the bar, and what its panel holds.",
      props: [
        { name: "label", type: "string", note: "Its name on the bar.", required: true },
        { name: "children", type: "ReactNode", note: "The panel's content: cards, links, anything.", required: true },
        { name: "className", type: "string", note: "The panel's width and layout, like grid w-[480px] grid-cols-2." },
      ],
    },
    {
      name: "NavigationMenuLink",
      note: "A plain link on the bar.",
      props: [
        { name: "href", type: "string", note: "Where it goes.", required: true },
        { name: "children", type: "ReactNode", note: "Its name.", required: true },
      ],
    },
    {
      name: "NavigationMenuCard",
      note: "A link in a panel, with an icon, a title and a line on it.",
      props: [
        { name: "href", type: "string", note: "Where it goes.", required: true },
        { name: "title", type: "string", note: "Its name.", required: true },
        { name: "description", type: "string", note: "A line on where it goes." },
        { name: "icon", type: "ReactNode", note: "On a soft tile before the title." },
        { name: "link", type: "ElementType", default: '"a"', note: "Your router's link." },
      ],
    },
  ],
  examples: [
    {
      id: "header",
      title: "In a header",
      note: "Three menus of different sizes: watch the card resize as it moves from one to the next.",
      code: `<NavigationMenu>
  <NavigationMenuItem label="Product" className="grid w-[500px] grid-cols-2">…</NavigationMenuItem>
  <NavigationMenuItem label="Templates" className="grid w-[420px]">…</NavigationMenuItem>
  <NavigationMenuItem label="Learn" className="grid w-[300px]">…</NavigationMenuItem>
  <NavigationMenuLink href="/pricing">Pricing</NavigationMenuLink>
</NavigationMenu>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves along the bar." },
    { keys: "Enter Space ↓", does: "Opens a menu and moves into its panel." },
    { keys: "← →", does: "Moves between the bar's menus and links; with a menu open, the panel moves along." },
    { keys: "Tab in a panel", does: "Moves through its links, then on to the next menu on the bar." },
    { keys: "Escape", does: "Closes the panel and goes back to its menu." },
  ],
  a11y: [
    "A nav named by label; each menu is a button saying whether its panel is open, and which panel it controls.",
    "The panel's links are real links, in the Tab order while it's open.",
    "It waits a beat before opening on hover, and before closing, so passing over the bar doesn't flash panels.",
    "With reduced motion, the panel moves and resizes at once, without gliding.",
  ],
};
