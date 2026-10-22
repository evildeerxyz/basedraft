import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Tree, type TreeNode } from "@/components/basedraft/tree";

const files: TreeNode[] = [
  {
    id: "app",
    label: "app",
    children: [
      { id: "app/layout.tsx", label: "layout.tsx" },
      { id: "app/page.tsx", label: "page.tsx" },
    ],
  },
  { id: "package.json", label: "package.json" },
];

export function Files() {
  return (
    <Tree
      label="Files"
      items={files}
      defaultExpanded={["app"]}
      onSelect={(id) => console.log("open", id)}
    />
  );
}`,
  use: [
    "For things nested inside things: a project's files, a docs site's pages, folders of assets.",
    "Pick icons by name for files, or icons=\"none\" for a tree of anything else, with a count or a badge in meta.",
    "Keep expanded in your state when the tree should remember what was open, or open a folder from somewhere else.",
  ],
  avoid: [
    "For a list only one level deep: use a plain list, or Menu for actions.",
    "For moving between a few pages of an app: use App sidebar.",
    "For questions that open to answers: use Accordion.",
  ],
  parts: [
    {
      name: "Tree",
      note: "The tree, as one stop for Tab.",
      props: [
        { name: "items", type: "TreeNode[]", note: "The top level, each node with its children.", required: true },
        { name: "label", type: "string", note: "What the tree is called, for a screen reader.", required: true },
        { name: "expanded", type: "string[]", note: "The open folders' ids, when you keep them. Leave it out and the tree does." },
        { name: "defaultExpanded", type: "string[]", default: "[]", note: "The folders open at first, when the tree keeps them." },
        { name: "onExpandedChange", type: "(ids: string[]) => void", note: "Runs with the open folders whenever one opens or closes." },
        { name: "selected", type: "string | null", note: "The chosen row's id, when you keep it." },
        { name: "defaultSelected", type: "string | null", default: "null", note: "The row chosen at first, when the tree keeps it." },
        { name: "onSelect", type: "(id: string, node: TreeNode) => void", note: "Runs when a row is chosen, by a click, Enter or Space." },
        { name: "icons", type: '"files" | "none"', default: '"files"', note: "Folder and file icons picked by name, or none." },
        { name: "className", type: "string", note: "Added to the tree." },
      ],
    },
    {
      name: "TreeNode",
      note: "One row, as an object.",
      props: [
        { name: "id", type: "string", note: "Unique in the tree. A file's path makes a good one.", required: true },
        { name: "label", type: "string", note: "Its name. A file's extension picks its icon.", required: true },
        { name: "children", type: "TreeNode[]", note: "What it holds. Any node with children, even an empty list, is a folder." },
        { name: "icon", type: "ReactNode", note: "In place of the icon picked by name." },
        { name: "meta", type: "ReactNode", note: "Small, at the row's end: a count, a badge, a letter for its git status." },
        { name: "disabled", type: "boolean", note: "Shown faded; it can be reached but not chosen." },
      ],
    },
  ],
  examples: [
    {
      id: "files",
      title: "A project",
      note: "Icons by extension, folders that open, and a git status letter in meta.",
      code: `<Tree
  label="zuno-site"
  defaultExpanded={["app", "components"]}
  defaultSelected="components/hero.tsx"
  items={[
    {
      id: "app",
      label: "app",
      children: [
        { id: "app/layout.tsx", label: "layout.tsx" },
        { id: "app/page.tsx", label: "page.tsx" },
        { id: "app/globals.css", label: "globals.css" },
      ],
    },
    {
      id: "components",
      label: "components",
      children: [
        { id: "components/hero.tsx", label: "hero.tsx", meta: "M" },
        { id: "components/pricing.tsx", label: "pricing.tsx", meta: "U" },
      ],
    },
    { id: "README.md", label: "README.md" },
  ]}
/>`,
    },
    {
      id: "plain",
      title: "Not files",
      note: "With icons=\"none\", for any nesting, here a docs site's pages with a count in meta.",
      code: `<Tree
  label="Docs"
  icons="none"
  defaultExpanded={["components"]}
  items={[
    { id: "start", label: "Get started" },
    {
      id: "components",
      label: "Components",
      meta: 79,
      children: [
        { id: "actions", label: "Actions", meta: 8 },
        { id: "forms", label: "Forms", meta: 18 },
        { id: "data", label: "Data", meta: 11 },
      ],
    },
    { id: "theming", label: "Theming" },
  ]}
/>`,
    },
    {
      id: "controlled",
      title: "Opened from outside",
      note: "Keep expanded in your state to open or close everything at once.",
      code: `function Assets() {
  const [open, setOpen] = useState<string[]>([]);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(["public", "public/people"])}>
        Open all
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen([])}>
        Close all
      </Button>
      <Tree label="Assets" items={assets} expanded={open} onExpandedChange={setOpen} />
    </>
  );
}`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves into the tree, onto the row you were last on, and out again." },
    { keys: "↓ ↑", does: "Moves to the next or previous row you can see." },
    { keys: "→", does: "Opens a closed folder; on an open one, moves to its first row." },
    { keys: "←", does: "Closes an open folder; otherwise moves up to the folder that holds the row." },
    { keys: "Home End", does: "Moves to the first or last row." },
    { keys: "Enter", does: "Chooses the row, and opens or closes a folder." },
    { keys: "Space", does: "Chooses the row." },
    { keys: "*", does: "Opens every folder beside this one." },
    { keys: "A letter", does: "Moves to the next row whose name starts with it." },
  ],
  a11y: [
    "A tree of treeitems, nested in groups, each with its level, its place among its siblings, and whether it's open.",
    "The chosen row is aria-selected; a disabled one is aria-disabled.",
    "One row at a time is in the Tab order, so Tab moves past the tree in one step and the arrows move within it.",
    "The carets, icons and guide lines are drawn only and hidden from screen readers.",
  ],
};
