import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Meter } from "@basedraft/ui";

export function Push({ sent, total }: { sent: number; total: number }) {
  return (
    <Meter
      value={sent}
      max={total}
      label="Pushing to GitHub"
      valueLabel={\`\${sent} of \${total} files\`}
    />
  );
}`,
  use: [
    "For how far along something is, when you know the whole: files pushed, seats used, storage filled.",
    "Give it a label and a valueLabel in the unit people think in, like 42 of 61 files.",
  ],
  avoid: [
    "When there's no telling how long it will take: use Spinner.",
    "While a page's content is loading: use Skeleton.",
    "For setting a value: use Slider.",
  ],
  parts: [
    {
      name: "Meter",
      note: "Progress drawn in dots, with a dithered edge that springs to the value.",
      props: [
        { name: "value", type: "number", note: "How far along.", required: true },
        { name: "max", type: "number", default: "100", note: "What value is out of." },
        { name: "label", type: "string", note: "What it measures, above it on the left, and its name for screen readers." },
        { name: "valueLabel", type: "string", default: "a percent", note: "The value as it reads, above it on the right, and what screen readers hear." },
        { name: "cols", type: "number", default: "40", note: "How many dots across." },
        { name: "rows", type: "number", default: "4", note: "How many dots down." },
        { name: "className", type: "string", note: "Added to the meter, to size or place it." },
      ],
    },
  ],
  examples: [
    {
      id: "basic",
      title: "A percent",
      note: "With only a label, the value reads as a percent of max.",
      code: `<Meter value={64} label="Storage" className="max-w-[320px]" />`,
    },
    {
      id: "labeled",
      title: "In its own unit",
      note: "valueLabel says the value the way people count it.",
      code: `<Meter
  value={3.2}
  max={5}
  label="Images in this draft"
  valueLabel="3.2 of 5 GB"
  className="max-w-[320px]"
/>`,
    },
    {
      id: "compact",
      title: "Compact",
      note: "Fewer, larger dots for a small space.",
      code: `<Meter
  value={7}
  max={10}
  label="Seats"
  valueLabel="7 of 10"
  cols={20}
  rows={2}
  className="max-w-[240px]"
/>`,
    },
    {
      id: "live",
      title: "Changing",
      note: "As the value moves, the dithered edge springs to it.",
      code: `function Seats() {
  const [used, setUsed] = useState(6);
  return (
    <div className="grid w-full max-w-[320px] gap-3">
      <Meter
        value={used}
        max={10}
        label="Seats on your Team license"
        valueLabel={\`\${used} of 10\`}
        cols={30}
        rows={3}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setUsed((n) => Math.max(0, n - 1))}
        >
          Remove one
        </Button>
        <Button size="sm" onClick={() => setUsed((n) => Math.min(10, n + 1))}>
          Invite one
        </Button>
      </div>
    </div>
  );
}`,
    },
  ],
  a11y: [
    "The meter role, with aria-valuenow, aria-valuemin and aria-valuemax, named by label.",
    "Screen readers hear valueLabel when there is one, so the value reads in its own unit.",
    "The dots are drawn only, hidden from screen readers; the label and value say it all in text.",
  ],
};
