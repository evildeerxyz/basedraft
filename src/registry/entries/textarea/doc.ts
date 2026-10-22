import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Textarea } from "@basedraft/ui";

export function Brief() {
  return (
    <Textarea
      maxLength={160}
      showCount
      placeholder="What should change?"
      aria-label="What to change"
    />
  );
}`,
  use: [
    "For text that runs past a line: a brief, a note, a message, a prompt for Claude Code.",
    "Set maxLength and showCount where there's a limit, so people see it coming instead of hitting it.",
  ],
  avoid: [
    "For a single line: use Input.",
    "For a label, a hint and an error together: wrap it in Field.",
  ],
  parts: [
    {
      name: "Textarea",
      note: "A native textarea in a well, growing with what's typed, between 96 and 240px tall.",
      props: [
        { name: "maxLength", type: "number", note: "The limit, which the count measures against." },
        { name: "showCount", type: "boolean", default: "false", note: "Shows how much is typed out of maxLength, on a ring that fills and turns amber past 85 percent and red at the limit. Needs maxLength." },
        { name: "value / defaultValue", type: "string", note: "Controlled, or where it starts. The count follows either." },
        { name: "onChange", type: "(event) => void", note: "Called as it changes, as for any textarea." },
        { name: "className", type: "string", note: "Goes on the well around the textarea." },
        { name: "...props", type: "textarea props", note: "Everything a textarea takes: placeholder, name, disabled, rows, ref and the rest." },
      ],
    },
  ],
  examples: [
    {
      id: "basic",
      title: "On its own",
      note: "It starts four lines tall and grows as you type, up to 240px, then scrolls.",
      code: `<Textarea
  placeholder="Notes for the next person who opens this draft"
  aria-label="Notes"
  className="max-w-[340px]"
/>`,
    },
    {
      id: "count",
      title: "With a count",
      note: "The ring fills as you type toward the limit.",
      code: `<Textarea
  maxLength={120}
  showCount
  placeholder="A line for the template's card"
  aria-label="Card line"
  className="max-w-[340px]"
/>`,
    },
    {
      id: "limit",
      title: "Near the limit",
      note: "Past 85 percent the ring turns amber; at the limit, red. Controlled here, with value and onChange.",
      code: `function Tagline() {
  const [text, setText] = useState(
    "Zuno is an AI investment manager. It builds your portfolio and rebalances it daily.",
  );
  return (
    <Textarea
      maxLength={90}
      showCount
      value={text}
      onChange={(e) => setText(e.target.value)}
      aria-label="Tagline"
      className="max-w-[340px]"
    />
  );
}`,
    },
    {
      id: "disabled",
      title: "Disabled",
      note: "Faded, and it can't take focus or change.",
      code: `<Textarea
  disabled
  defaultValue="Locked while the site publishes."
  aria-label="Notes"
  className="max-w-[340px]"
/>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves focus into it, and out again. Tab doesn't type a tab character." },
    { keys: "Enter", does: "Starts a new line." },
  ],
  a11y: [
    "A native textarea, so typing, selection and screen readers work as usual.",
    "Give it a visible label, or an aria-label. A placeholder alone isn't a label.",
    "The count is shown as text (32 of 120) as well as the ring, so it isn't color alone.",
  ],
};
