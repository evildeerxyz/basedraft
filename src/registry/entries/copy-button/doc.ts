import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { CopyButton } from "@basedraft/ui";

export function RepoLink() {
  return (
    <div className="flex items-center gap-2 rounded-full border py-1 pl-4 pr-1">
      <code className="text-sm">github.com/fieldwork/zuno-site</code>
      <CopyButton
        value="https://github.com/fieldwork/zuno-site"
        variant="pill"
      />
    </div>
  );
}`,
  use: [
    "Beside anything people copy rather than read: a link, a key, an address, a short command.",
    "The round one fits inside fields and rows; the pill says Copy outright, where there's room.",
  ],
  avoid: [
    "For a shell command: use Command line, which colors it and copies it too.",
    "For copying a whole block of code: put it in a code block with its own copy action.",
  ],
  parts: [
    {
      name: "CopyButton",
      note: "A button that writes value to the clipboard.",
      props: [
        { name: "value", type: "string", note: "The text that goes on the clipboard.", required: true },
        { name: "label", type: "string", default: '"Copy"', note: "What the pill says and a screen reader hears. Name what's copied: Copy link, Copy the key." },
        { name: "variant", type: '"icon" | "pill"', default: '"icon"', note: "A round 32px button with just the icon, or a pill that says the label, then Copied." },
        { name: "...props", type: "button props", note: "Everything a button takes, except value, which is the text to copy." },
      ],
    },
  ],
  examples: [
    {
      id: "icon",
      title: "Round",
      note: "Just the icon, at the end of whatever it copies.",
      code: `<div className="flex items-center gap-3 rounded-full bg-[var(--bd-surface-2)] py-1 pl-4 pr-1">
  <code className="font-mono text-[13px]">npm install @basedraft/ui</code>
  <CopyButton value="npm install @basedraft/ui" label="Copy the command" />
</div>`,
    },
    {
      id: "pill",
      title: "Pill",
      note: "The label turns into Copied, and back, as the icon turns over.",
      code: `<CopyButton
  value="https://basedraft.site/templates/zuno"
  label="Copy link"
  variant="pill"
/>`,
    },
    {
      id: "field",
      title: "In a field",
      note: "As an Input's trailing part, for a key someone needs once and shouldn't retype.",
      code: `<Input
  readOnly
  value="bd_live_7Hq2Xc9Lm4"
  aria-label="API key"
  className="max-w-[320px] pr-1.5 font-mono"
  trailing={<CopyButton value="bd_live_7Hq2Xc9Lm4" label="Copy the key" />}
/>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves focus to it." },
    { keys: "Enter / Space", does: "Copies the value." },
  ],
  a11y: [
    "A native button named by label, which becomes Copied for a moment after a copy.",
    "The ring and the turning icon are decoration, hidden from screen readers.",
    "Copying needs the page to be served over https (or localhost), as the clipboard does.",
  ],
};
