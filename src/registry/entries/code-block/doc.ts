import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { CodeBlock } from "@basedraft/ui";

export function Setup() {
  return (
    <CodeBlock
      filename="app/layout.tsx"
      highlight={[2]}
      code={\`import type { ReactNode } from "react";
import "@basedraft/ui/styles.css";\`}
    />
  );
}`,
  use: [
    "For code people will read or copy: docs, a changelog, setup steps, an API reference.",
    "Give it filename for a file, so it's clear where the code goes; tabs for one command in a few package managers.",
    "Mark the lines that matter with highlight, and fold a long file with maxLines.",
  ],
  avoid: [
    "For one shell command on a dark strip with a package manager switch: use Command line.",
    "For a word of code inside a sentence: use a code element.",
    "For a key someone presses: use Kbd.",
  ],
  parts: [
    {
      name: "CodeBlock",
      note: "A figure with the code, its name or tabs, and a copy button.",
      props: [
        { name: "code", type: "string", note: "The code. Leave it out when there are tabs." },
        { name: "language", type: '"tsx" | "ts" | "jsx" | "js" | "css" | "json" | "bash"', default: "from filename, or tsx", note: "How to color it." },
        { name: "filename", type: "string", note: "The file's name, over the code, with an icon for its kind." },
        { name: "tabs", type: "{ label, code, language?, filename? }[]", note: "The same thing a few ways, each a tab." },
        { name: "lineNumbers", type: "boolean", default: "more than one line", note: "Numbers down the side." },
        { name: "highlight", type: "number[]", note: "Lines to mark, counting from 1." },
        { name: "wrap", type: "boolean", default: "true", note: "Long lines wrap on a hanging indent. false scrolls them sideways." },
        { name: "maxLines", type: "number", note: "Folds the code to its first lines, with a button to show all." },
        { name: "className", type: "string", note: "Added to the card." },
      ],
    },
  ],
  examples: [
    {
      id: "install",
      title: "One command, three ways",
      note: "Tabs for each package manager, the chosen one on a pill that slides.",
      code: `<CodeBlock
  tabs={[
    { label: "npm", code: "npm install @basedraft/ui", language: "bash" },
    { label: "pnpm", code: "pnpm add @basedraft/ui", language: "bash" },
    { label: "bun", code: "bun add @basedraft/ui", language: "bash" },
  ]}
/>`,
    },
    {
      id: "css",
      title: "A stylesheet",
      note: "The language comes from the file's name.",
      code: `<CodeBlock filename="app/globals.css" code={theme} />`,
    },
    {
      id: "long",
      title: "Long lines, a long file",
      note: "Lines wrap and hang from their own indent; maxLines folds the rest away until it's asked for.",
      code: `<CodeBlock filename="lib/plans.ts" code={plans} maxLines={6} />`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves to the tabs, then the copy button." },
    { keys: "Enter", does: "Chooses a tab, copies the code, or shows the folded lines." },
  ],
  a11y: [
    "A figure with the file's name as its caption, around a pre and code, so a screen reader reads it as code.",
    "Line numbers and marks are drawn only and aren't copied or read.",
    "The copy button says Copied once it has.",
  ],
};
