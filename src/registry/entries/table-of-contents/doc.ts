import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { TableOfContents } from "@basedraft/ui";

export function OnThisPage() {
  return (
    <aside className="sticky top-24">
      <TableOfContents
        items={[
          { id: "before", label: "Before you publish" },
          { id: "domain", label: "Check the domain", level: 2 },
          { id: "publishing", label: "Publishing" },
          { id: "after", label: "After it's live" },
        ]}
      />
    </aside>
  );
}`,
  use: [
    "Beside a long page people read or come back to: docs, a guide, a changelog, a long post.",
    "Give each heading an id, and list them in order; level 2 and 3 for the ones inside a section.",
    "Set offset to your sticky header's height, so a section counts as reached once it's below it.",
  ],
  avoid: [
    "For a page of a few screens or less: it doesn't need one.",
    "For moving between pages: use App sidebar or Breadcrumb.",
    "For switching views in place: use Tabs.",
  ],
  parts: [
    {
      name: "TableOfContents",
      note: "A nav of links to the page's sections.",
      props: [
        { name: "items", type: "{ id: string; label: string; level?: 1 | 2 | 3 }[]", note: "The sections, in order: each heading's id, its name, and how deep it sits.", required: true },
        { name: "title", type: "string", default: '"On this page"', note: "Over the list, and its name for screen readers." },
        { name: "offset", type: "number", default: "96", note: "How far from the top a heading counts as reached, in pixels: below a sticky header." },
        { name: "scrollRoot", type: "RefObject<HTMLElement>", note: "The box that scrolls, when it isn't the window." },
        { name: "updateHash", type: "boolean", default: "true", note: "Puts a clicked section's link in the address bar, without a jump." },
        { name: "className", type: "string", note: "Added to the nav." },
      ],
    },
  ],
  examples: [
    {
      id: "flat",
      title: "One level",
      note: "Only the sections, for a shorter page.",
      code: `<TableOfContents
  items={[
    { id: "before", label: "Before you publish" },
    { id: "publishing", label: "Publishing" },
    { id: "after", label: "After it's live" },
  ]}
/>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves from link to link." },
    { keys: "Enter", does: "Glides to the section." },
  ],
  a11y: [
    "A nav named by title, so a screen reader finds it among the landmarks.",
    "The section being read carries aria-current=\"location\".",
    "The links are real links to each heading, so they work without JavaScript and can be opened in a new tab.",
    "With reduced motion, a click jumps rather than glides.",
  ],
};
