import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { CommandLine } from "@basedraft/ui";

export function RunIt() {
  return (
    <CommandLine
      label="after unzipping"
      commands={{
        npm: "npm install && npm run dev",
        pnpm: "pnpm install && pnpm dev",
        bun: "bun install && bun dev",
      }}
    />
  );
}`,
  use: [
    "For a shell command someone will paste into a terminal: an install, a script to run, a clone.",
    "Give it commands keyed by package manager when the command differs between them; it adds a switch.",
  ],
  avoid: [
    "For code that isn't a command, or runs over several lines: use a code block.",
    "For a short value to copy that isn't a command, like a link or a key: use Copy button.",
  ],
  parts: [
    {
      name: "CommandLine",
      note: "A small ink terminal, dark in light mode and in dark.",
      props: [
        { name: "command", type: "string", note: "One command, with no switch. Use this or commands." },
        { name: "commands", type: "Record<string, string>", note: "A command per package manager, keyed by its name. The first is shown first, and a switch appears for two or more." },
        { name: "label", type: "string", note: "A few words on what it's for, in the terminal's top bar beside the three dots." },
        { name: "className", type: "string", note: "Added to the terminal, to size or place it." },
      ],
    },
  ],
  examples: [
    {
      id: "single",
      title: "One command",
      note: "No top bar, just the line and its copy button.",
      code: `<CommandLine command="npm install @basedraft/ui" />`,
    },
    {
      id: "managers",
      title: "A switch between package managers",
      note: "The same step for npm, pnpm, bun and yarn. The one you pick is the one that's copied.",
      code: `<CommandLine
  commands={{
    npm: "npm install @basedraft/ui motion",
    pnpm: "pnpm add @basedraft/ui motion",
    bun: "bun add @basedraft/ui motion",
    yarn: "yarn add @basedraft/ui motion",
  }}
/>`,
    },
    {
      id: "labeled",
      title: "With a label",
      note: "A label alone brings the top bar, to say where the command runs.",
      code: `<CommandLine
  label="in the zuno folder"
  command="git clone https://github.com/larkspur/zuno-site && cd zuno-site"
/>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves through the package managers, then to the copy button." },
    { keys: "Enter / Space", does: "Picks the focused package manager, or copies the command." },
  ],
  a11y: [
    "The command is text in a code element, so it can be selected and read as is; the $ before it can't be selected.",
    "The copy button is named Copy the command, and Copied for a moment after.",
    "The package managers are a tab list, each marked selected or not.",
  ],
};
