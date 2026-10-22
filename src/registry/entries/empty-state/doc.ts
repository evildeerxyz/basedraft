import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { NotePencilIcon } from "@phosphor-icons/react";
import { Button, EmptyState } from "@basedraft/ui";

export function NoDrafts() {
  return (
    <EmptyState
      icon={<NotePencilIcon weight="duotone" />}
      title="No drafts yet"
      description="Open a template in Studio and every change you make is kept here as a draft."
      action={<Button variant="metal">Open Studio</Button>}
    />
  );
}`,
  use: [
    "A list, a table or a page with nothing in it yet: drafts, purchases, people on a team.",
    "A search or a filter that found nothing, with the way out of it.",
    "To say what will be here and offer the one action that puts it there.",
  ],
  avoid: [
    "While content is still loading: Skeleton or Spinner, so it doesn't look empty for a moment first.",
    "For an error, where something went wrong rather than nothing being there: say what failed and how to retry.",
    "Inside a small control, like an empty select: a line of plain text is enough.",
  ],
  parts: [
    {
      name: "EmptyState",
      props: [
        { name: "title", type: "ReactNode", required: true, note: "What's missing, plainly: \"No drafts yet\"." },
        { name: "icon", type: "ReactNode", note: "An icon for what will be here. It rides the front card of a small fan of ghost cards, which spreads a little when it's pointed at." },
        { name: "description", type: "ReactNode", note: "What will be here, and how it gets here." },
        { name: "action", type: "ReactNode", note: "The button or link that starts it. One is best; two at most." },
        { name: "variant", type: '"paper" | "plain"', default: '"paper"', note: "On paper, on a field of fine dots that fades from the middle; plain, for inside a card that already has a face." },
        { name: "size", type: '"sm" | "md"', default: '"md"', note: "Small for a panel or a search result; medium for a page." },
        { name: "titleAs", type: '"h2" | "h3" | "h4" | "p"', default: '"h3"', note: "The title's element, to fit the page's headings." },
        { name: "...props", type: "div props", note: "Everything a div takes." },
      ],
    },
  ],
  examples: [
    {
      id: "plain",
      title: "Plain, in a card",
      note: "Inside a card that already has its own face, without the paper.",
      code: `<div className="w-full max-w-[380px] rounded-[20px] bg-[var(--bd-surface)] shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.07)]">
  <EmptyState
    variant="plain"
    icon={<ReceiptIcon weight="duotone" />}
    title="Nothing bought yet"
    description="Templates you buy land here, ready to download or send to GitHub."
    action={
      <Button variant="outline" size="sm">
        Browse templates
      </Button>
    }
  />
</div>`,
    },
    {
      id: "search",
      title: "No results",
      note: "Small, for a search that found nothing, with the way back out.",
      code: `<EmptyState
  size="sm"
  icon={<MagnifyingGlassIcon weight="duotone" />}
  title="No sections match “pricng”"
  description="Check the spelling, or try a kind like hero or footer."
  action={<Button variant="ghost" size="sm">Clear search</Button>}
  className="w-full max-w-[360px]"
/>`,
    },
    {
      id: "team",
      title: "Just you so far",
      note: "Where people will be, with the action that brings them.",
      code: `<EmptyState
  icon={<UsersThreeIcon weight="duotone" />}
  title="Just you so far"
  description="Your Team license has room for 9 more. Invite them by email."
  action={<Button size="sm">Invite people</Button>}
  className="w-full max-w-[420px]"
/>`,
    },
  ],
  a11y: [
    "The title is a real heading (h3 by default; set titleAs to fit the page), so it's found in the page's outline.",
    "The icon and its tile are decorative and hidden; the title and the line say everything.",
    "Give the action words that say what it does, like \"Open Studio\", not \"Get started\".",
    "When a search or filter empties a list, say so in a live region near the field as well, so the change is heard.",
  ],
};
