import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Marquee } from "@basedraft/ui";

const TEAMS = [
  "Northbeam",
  "Ledgerly",
  "Parcelworks",
  "Quanta",
  "Helio",
  "Mosaic",
];

export function Teams() {
  return (
    <Marquee label="Teams that build on Noma" className="max-w-3xl">
      {TEAMS.map((name) => (
        <span key={name} className="text-lg font-medium text-[var(--bd-muted)]">
          {name}
        </span>
      ))}
    </Marquee>
  );
}`,
  use: [
    "A row of customers' logos under a hero, where the point is many, not any one of them.",
    "Short quotes or words that read fine in passing.",
    "Decoration with content behind it: everything in it should also be reachable some other way, or not matter if missed.",
  ],
  avoid: [
    "Anything someone has to read or act on, like prices or steps: lay it out still.",
    "A handful of items that fit the width: a plain row is calmer.",
    "Long passages: quotes in a Card grid, which people can read at their own pace.",
  ],
  parts: [
    {
      name: "Marquee",
      note: "Each child is one item. It repeats them as many times as it takes to fill its width.",
      props: [
        { name: "children", type: "ReactNode", required: true, note: "The items, each one a logo, a quote or a word." },
        { name: "speed", type: "number", default: "40", note: "Pixels a second. Keep it slow enough to read." },
        { name: "reverse", type: "boolean", default: "false", note: "Drift to the right instead of the left." },
        { name: "pauseOnHover", type: "boolean", default: "true", note: "Hold still while pointed at or while something inside has focus." },
        { name: "fade", type: "number", default: "56", note: "How far in from each edge it fades, in pixels. 0 for a hard edge." },
        { name: "gap", type: "number", default: "40", note: "The space between items, in pixels." },
        { name: "label", type: "string", note: "What it is, for screen readers: \"Teams that build on Noma\"." },
        { name: "...props", type: "div props", note: "Everything a div takes; set its width with className." },
      ],
    },
  ],
  examples: [
    {
      id: "logos",
      title: "Logos",
      note: "Icons and names in the quiet gray, so the row reads as a texture of names.",
      code: `<Marquee label="Teams that build on Noma" className="w-full max-w-[560px]">
  {LOGOS.map(({ name, icon: Icon }) => (
    <span
      key={name}
      className="flex items-center gap-2 text-[17px] font-semibold tracking-tight text-[var(--bd-muted)]"
    >
      <Icon weight="duotone" className="size-5" /> {name}
    </span>
  ))}
</Marquee>`,
    },
    {
      id: "quotes",
      title: "Quotes",
      note: "Slower, and closer together, so each card can be read as it passes.",
      code: `<Marquee
  label="What teams say"
  speed={26}
  gap={14}
  className="w-full max-w-[640px]"
>
  {QUOTES.map((q) => (
    <figure
      key={q.name}
      className="w-[250px] rounded-[16px] bg-[var(--bd-surface)] p-4 shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.07)]"
    >
      <blockquote className="text-sm leading-snug text-[var(--bd-fg)]">
        {q.text}
      </blockquote>
      <figcaption className="mt-3 text-xs text-[var(--bd-muted)]">
        {q.name}, {q.team}
      </figcaption>
    </figure>
  ))}
</Marquee>`,
    },
    {
      id: "rows",
      title: "Two rows, opposite ways",
      note: "A second row in reverse, a little faster, for a wall of names.",
      code: `<div className="grid w-full max-w-[560px] gap-4">
  <Marquee label="Teams that build on Noma">{logos}</Marquee>
  <Marquee reverse speed={52} aria-hidden>{logos}</Marquee>
</div>`,
    },
    {
      id: "hard-edge",
      title: "A hard edge",
      note: "With fade at 0 it runs right to the edge, for a band across a page.",
      code: `<Marquee
  label="What's inside"
  fade={0}
  speed={60}
  gap={28}
  className="w-full max-w-[560px] rounded-full px-1 py-2.5 text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]"
>
  {["Next.js", "Astro", "Figma", "Studio", "GitHub", "Dark mode"].map((w) => (
    <span key={w} className="text-sm font-medium">
      {w}
    </span>
  ))}
</Marquee>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves into the first copy's links or buttons, and holds the row still while focus is inside." },
  ],
  a11y: [
    'It has role="marquee" and your label as its name, so it\'s announced as a region that moves, without its items read on a loop.',
    "Only the first copy is read and reached with Tab; the rest are aria-hidden and inert.",
    "It holds still under the pointer and while focus is inside it, so anything in it can be read or used.",
    "With reduced motion it stops, and the row scrolls sideways by hand instead.",
    "A second row that only repeats the first can be hidden with aria-hidden, as in the two rows example.",
  ],
};
