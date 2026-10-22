import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { useState } from "react";
import { Pagination } from "@basedraft/ui";

export function Sections() {
  const [page, setPage] = useState(1);
  return <Pagination page={page} total={24} onPageChange={setPage} />;
}`,
  use: [
    "Under a long list or a table that loads a page at a time: search results, orders, sections.",
    "Give it href when each page has its own address, so the pages are links that can be shared and crawled.",
    "Use compact where room is short, like the foot of a card or a phone.",
  ],
  avoid: [
    "For a feed people read top to bottom: load more as they scroll, or with a Load more button.",
    "For the steps of a task: use Stepper.",
    "For a few views of the same thing: use Tabs.",
  ],
  parts: [
    {
      name: "Pagination",
      note: "A nav with the pages in a list.",
      props: [
        { name: "page", type: "number", note: "The page you're on, from 1.", required: true },
        { name: "total", type: "number", note: "How many pages there are.", required: true },
        { name: "onPageChange", type: "(page: number) => void", note: "Runs with the page that was picked." },
        { name: "siblings", type: "number", default: "1", note: "How many pages show on each side of the current one." },
        { name: "variant", type: '"pages" | "compact"', default: '"pages"', note: "Every page in reach, or Page 3 of 12 between two arrows." },
        { name: "href", type: "(page: number) => string", note: "Each page's address. The pages become links." },
        { name: "link", type: "ElementType", default: '"a"', note: "Your router's link, like Next.js's Link, used with href." },
        { name: "label", type: "string", default: '"Pagination"', note: "What the nav is called, for a screen reader." },
        { name: "className", type: "string", note: "Added to the nav." },
      ],
    },
  ],
  examples: [
    {
      id: "basic",
      title: "A few pages",
      note: "Up to seven, every page shows.",
      code: `function Orders() {
  const [page, setPage] = useState(2);
  return <Pagination page={page} total={6} onPageChange={setPage} />;
}`,
    },
    {
      id: "many",
      title: "Many pages",
      note: "The far ones fold into …, and the row keeps its length, so the pill and your pointer stay put while the numbers roll.",
      code: `function Results() {
  const [page, setPage] = useState(9);
  return <Pagination page={page} total={40} siblings={2} onPageChange={setPage} />;
}`,
    },
    {
      id: "compact",
      title: "Compact",
      note: "Page 3 of 12 between two arrows, its number rolling the way you went.",
      code: `function Reviews() {
  const [page, setPage] = useState(3);
  return <Pagination variant="compact" page={page} total={12} onPageChange={setPage} />;
}`,
    },
    {
      id: "links",
      title: "As links",
      note: "With href, each page is a link with its own address. Pass Next.js's Link as link.",
      code: `<Pagination
  page={page}
  total={18}
  href={(p) => \`/blocks?page=\${p}\`}
  link={Link}
/>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves along the arrows and the pages." },
    { keys: "Enter", does: "Goes to the focused page." },
  ],
  a11y: [
    "A nav named by label, so a screen reader can find it among the landmarks.",
    "Each page is named Page 3, the current one with aria-current=\"page\"; the arrows are Previous page and Next page.",
    "At either end the arrow is marked disabled and can't be reached by Tab.",
    "Compact says Page 3 of 12 aloud as it changes. The … and the rolling digits are drawn only.",
  ],
};
