import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Spinner } from "@basedraft/ui";

export function Building() {
  return (
    <p className="flex items-center gap-2.5 text-sm">
      <Spinner size="sm" label="Building zuno.zip" />
      Building zuno.zip
    </p>
  );
}`,
  use: [
    "Something is on its way and you can't say how far along it is: a build, a sign in, a page of results.",
    "Beside the words for what's loading, so the wait has a name.",
    "On its own in a panel that's waiting, at the large size.",
  ],
  avoid: [
    "When you know how far along it is: Meter fills as it goes.",
    "On a button that's working: give Button loading, which keeps its width and holds off clicks.",
    "Before content whose shape you know: Skeleton shows where it will land.",
  ],
  parts: [
    {
      name: "Spinner",
      props: [
        { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', note: "16, 24 or 40px across, with 5, 7 or 11 dots a side so they stay fine at every size." },
        { name: "label", type: "string", default: '"Loading"', note: "What a screen reader hears. Name what's loading when you can." },
        { name: "className", type: "string", note: "It takes the text's color, so set text-* here or on a parent to change it." },
        { name: "...props", type: "span props", note: "Everything a span takes." },
      ],
    },
  ],
  examples: [
    {
      id: "sizes",
      title: "Sizes",
      note: "Small beside a line of text, medium on its own, large for a whole panel that's waiting.",
      code: `<div className="flex items-center gap-8">
  <Spinner size="sm" />
  <Spinner />
  <Spinner size="lg" />
</div>`,
    },
    {
      id: "inline",
      title: "Beside its words",
      note: "Give it the same words as its label, so what's seen and what's heard agree.",
      code: `<p className="flex items-center gap-2.5 text-sm text-[var(--bd-muted)]">
  <Spinner size="sm" label="Checking your license" />
  Checking your license
</p>`,
    },
    {
      id: "on-ink",
      title: "On ink",
      note: "It takes the text's color, so on an ink surface it turns light with the words.",
      code: `<div className="flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-medium text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]">
  <Spinner size="sm" label="Sending to GitHub" />
  Sending to GitHub
</div>`,
    },
    {
      id: "panel",
      title: "A panel that's waiting",
      note: "Large and centered, with a line under it, where a whole region is loading.",
      code: `<div className="grid h-44 w-full place-items-center rounded-[18px] bg-[var(--bd-ui-field)] shadow-[var(--bd-ui-well)]">
  <div className="grid justify-items-center gap-3 text-sm text-[var(--bd-muted)]">
    <Spinner size="lg" label="Loading your purchases" />
    Loading your purchases
  </div>
</div>`,
    },
  ],
  a11y: [
    'It has role="status" and the label as its name, so a screen reader says it politely, without moving focus.',
    "The dots are hidden from assistive tech; only the label is read.",
    "With reduced motion the crest stops and the ring holds as a still fade round it, so it still reads as waiting.",
    "When what was loading arrives, take the spinner away; only move focus if the person asked for what arrived.",
  ],
};
