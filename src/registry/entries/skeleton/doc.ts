import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Skeleton, SkeletonText } from "@basedraft/ui";

export function PurchasesLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="Your purchases"
      className="grid gap-4"
    >
      <span className="sr-only">Loading your purchases</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-10" />
          <SkeletonText lines={2} className="max-w-[220px]" />
        </div>
      ))}
    </section>
  );
}`,
  use: [
    "While content loads whose shape you already know: a list of purchases, a template's card, a profile.",
    "In the very spot the content will land, at its size, so nothing jumps when it arrives.",
    "For waits of a second or two; past that, say what's happening as well.",
  ],
  avoid: [
    "When you can't predict the shape, or it's one small thing: Spinner, beside a word on what's loading.",
    "For progress you can measure, like an upload: Meter.",
    "For nothing at all to show: Empty state, which says so and offers the way to start.",
  ],
  parts: [
    {
      name: "Skeleton",
      note: "One shape. Give it a size with className.",
      props: [
        { name: "shape", type: '"block" | "line" | "circle"', default: '"block"', note: "A block for pictures and cards (12px corners), a line for text (12px tall), a circle for avatars and icons." },
        { name: "className", type: "string", note: "Its size and any corner of your own." },
        { name: "...props", type: "span props", note: "Everything a span takes." },
      ],
    },
    {
      name: "SkeletonText",
      note: "A paragraph's worth of lines, the last one shorter.",
      props: [
        { name: "lines", type: "number", default: "3", note: "How many lines. With more than one, the last is 62% wide." },
        { name: "className", type: "string", note: "Its width; the lines fill it." },
      ],
    },
    {
      name: "SkeletonAvatar",
      note: "A circle at an avatar's size.",
      props: [{ name: "size", type: '"sm" | "md" | "lg"', default: '"md"', note: "28, 36 or 48px." }],
    },
  ],
  examples: [
    {
      id: "text",
      title: "Text",
      note: "Lines for a paragraph; the last runs short, the way a paragraph ends.",
      code: `<SkeletonText lines={3} className="max-w-[320px]" />`,
    },
    {
      id: "card",
      title: "A template's card",
      note: "Built from the shapes of the card it stands in for: the picture, the logo and two lines.",
      code: `<div className="w-[260px] rounded-[18px] bg-[var(--bd-surface)] p-3 shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.07)]">
  <Skeleton className="aspect-[16/10] w-full" />
  <div className="mt-3 flex items-center gap-2.5 px-1">
    <SkeletonAvatar size="sm" />
    <SkeletonText lines={2} />
  </div>
</div>`,
    },
    {
      id: "people",
      title: "People",
      note: "Avatars at their three sizes, beside a name and a role.",
      code: `<div className="grid w-full max-w-[300px] gap-4">
  {(["lg", "md", "sm"] as const).map((size) => (
    <div key={size} className="flex items-center gap-3">
      <SkeletonAvatar size={size} />
      <SkeletonText lines={2} className="max-w-[180px]" />
    </div>
  ))}
</div>`,
    },
    {
      id: "shapes",
      title: "The three shapes",
      note: "A block, a line and a circle, sized by className.",
      code: `<div className="flex items-center gap-4">
  <Skeleton className="h-16 w-24" />
  <Skeleton shape="line" className="w-28" />
  <Skeleton shape="circle" className="size-12" />
</div>`,
    },
  ],
  a11y: [
    "Every shape is aria-hidden: it's not content, and reading out empty boxes helps no one.",
    'Mark the region it fills with aria-busy="true", and put a visually hidden line in it saying what\'s loading.',
    "When the content arrives, swap the skeleton out in place and drop aria-busy, so the region is read once, whole.",
    "With reduced motion the band of dots doesn't pass; the shapes stay as solid gray.",
  ],
};
