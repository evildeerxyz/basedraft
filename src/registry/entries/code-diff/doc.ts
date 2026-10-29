import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { CodeDiff } from "@/components/basedraft/code-diff";

export function Change({ before, after }: { before: string; after: string }) {
  return <CodeDiff filename="src/lib/pricing.ts" before={before} after={after} />;
}`,
  use: [
    "In a review, a changelog or a guide, to show what changed in a file and nothing else.",
    "Hand it the two versions as text; it works out the lines and the words that changed.",
    "Put several in a column, collapsible, for a change that touches a few files.",
  ],
  avoid: [
    "For code on its own: use Code block.",
    "For two pictures, before and after: use Compare slider.",
    "For very large files: past a few thousand changed lines it shows the middle as replaced whole, rather than line by line.",
  ],
  parts: [
    {
      name: "CodeDiff",
      note: "A file's header, its count of what changed, and its lines.",
      props: [
        { name: "before", type: "string", note: "The file as it was.", required: true },
        { name: "after", type: "string", note: "The file as it is now.", required: true },
        { name: "filename", type: "string", note: "Its name, over the code. The colors follow its extension." },
        { name: "oldFilename", type: "string", note: "Its old name, when it was renamed. Shows old → new." },
        { name: "language", type: '"tsx" | "ts" | "jsx" | "js" | "css" | "json" | "bash"', note: "How to color it, when the name doesn't say." },
        { name: "view", type: '"unified" | "split"', note: "One column, or old and new side by side. Leave it out and set defaultView to let the switch in the header run it." },
        { name: "defaultView", type: '"unified" | "split"', default: '"unified"', note: "The view it starts in." },
        { name: "onViewChange", type: "(view) => void", note: "Runs when the switch changes the view." },
        { name: "context", type: "number", default: "3", note: "How many unchanged lines stay around each change. The rest fold to a row that opens." },
        { name: "collapsible", type: "boolean", default: "false", note: "A caret in the header that folds the whole file." },
        { name: "dither", type: "boolean", default: "true", note: "The count's cell that holds both green and red mixes them in dots; false gives it to whichever is more." },
        { name: "className", type: "string", note: "Added to the box: a width here." },
      ],
    },
  ],
  examples: [
    {
      id: "split",
      title: "Side by side",
      note: "defaultView=\"split\": old on the left, new on the right, and dots where a side has nothing. Give it room, 800px or so.",
      code: `<CodeDiff filename="styles/button.css" before={before} after={after} defaultView="split" />`,
    },
    {
      id: "renamed",
      title: "Renamed, and folding",
      note: "oldFilename shows the rename; collapsible adds a caret that folds the file. dither={false} gives the shared cell to the bigger side.",
      code: `<CodeDiff
  oldFilename="components/nav.tsx"
  filename="components/site-nav.tsx"
  before={before}
  after={after}
  collapsible
  dither={false}
/>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves through the view switch, the folded rows and the caret." },
    { keys: "← →", does: "On the view switch, picks Unified or Split." },
    { keys: "Enter Space", does: "Opens a folded row, or folds the file." },
  ],
  a11y: [
    "Each added or removed line starts with \"Added\" or \"Removed\" for screen readers; the + and − are drawn only.",
    "The count is said in words, and the bar is hidden from screen readers.",
    "The view switch is a radio group, and the caret says whether the file is open.",
  ],
};
