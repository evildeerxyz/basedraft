import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { useState } from "react";
import { Chips } from "@basedraft/ui";

export function TemplateFilters() {
  const [on, setOn] = useState<string[]>([]);
  return (
    <Chips
      label="Filter templates"
      value={on}
      onValueChange={setOn}
      options={[
        { value: "nextjs", label: "Next.js", count: 12 },
        { value: "astro", label: "Astro", count: 4 },
        { value: "dark", label: "Dark mode", count: 6 },
      ]}
    />
  );
}`,
  use: [
    "For filtering a list or a gallery by a few tags at once: framework, category, status.",
    "Give each a count, so people see what a filter leaves before they pick it.",
    "Set max on a long row, so the common filters lead and the rest wait behind +N.",
  ],
  avoid: [
    "For one choice of two to five that switches a view: use Segmented or Tabs.",
    "For a choice inside a form, sent with it: use Checkbox or Radio group.",
    "For free-form tags someone types: use Tag input.",
  ],
  parts: [
    {
      name: "Chips",
      note: "A row of chips, as a group of toggle buttons, or radios when one at a time.",
      props: [
        { name: "options", type: "ChipOption[]", note: "The chips: value and label, and a count, icon or disabled if you like.", required: true },
        { name: "label", type: "string", note: "What the chips choose, for a screen reader.", required: true },
        { name: "value", type: "string[]", note: "What's on, when you keep it. Leave it out and the chips do." },
        { name: "defaultValue", type: "string[]", default: "[]", note: "What's on at first, when the chips keep it." },
        { name: "onValueChange", type: "(value: string[]) => void", note: "Runs with what's on whenever a chip turns on or off." },
        { name: "multiple", type: "boolean", default: "true", note: "Several on at once, or one at a time; picking the one that's on turns it off." },
        { name: "max", type: "number", note: "How many show before the rest fold into +N. Any that are on stay in view." },
        { name: "clearable", type: "boolean", default: "true", note: "Shows Clear once anything is on, with several at a time." },
        { name: "size", type: '"sm" | "md"', default: '"md"', note: "28 or 32 pixels tall." },
        { name: "className", type: "string", note: "Added to the row." },
      ],
    },
  ],
  examples: [
    {
      id: "single",
      title: "One at a time",
      note: "With multiple={false} they're radios: arrows move and choose, and Tab stops once.",
      code: `<Chips
  label="Status"
  multiple={false}
  defaultValue={["live"]}
  options={[
    { value: "live", label: "Live", count: 8 },
    { value: "draft", label: "Draft", count: 3 },
    { value: "archived", label: "Archived", count: 12 },
  ]}
/>`,
    },
    {
      id: "icons",
      title: "With icons, small",
      note: "An icon before each name; it takes the ink when the chip is on.",
      code: `<Chips
  label="Show"
  size="sm"
  defaultValue={["pages"]}
  options={[
    { value: "pages", label: "Pages", icon: <FileIcon weight="duotone" /> },
    { value: "blocks", label: "Blocks", icon: <SquaresFourIcon weight="duotone" /> },
    { value: "images", label: "Images", icon: <ImageIcon weight="duotone" /> },
  ]}
/>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves from chip to chip, then to +N and Clear. One at a time, the chips are one stop." },
    { keys: "Enter Space", does: "Turns the chip on or off." },
    { keys: "← →", does: "One at a time, moves to the next chip and chooses it." },
  ],
  a11y: [
    "Several at a time, each chip is a toggle button that says whether it's pressed; one at a time, a radio in a radio group.",
    "The group is named by label, and each chip by its name and count.",
    "The +N chip says whether the rest are showing.",
  ],
};
