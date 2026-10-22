import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { RollingNumber } from "@basedraft/ui";

export function TemplateStats({
  pages,
  sections,
}: {
  pages: number;
  sections: number;
}) {
  return (
    <dl className="flex gap-8">
      <div>
        <dt className="text-xs">Pages</dt>
        <dd className="text-3xl font-semibold">
          <RollingNumber value={pages} />
        </dd>
      </div>
      <div>
        <dt className="text-xs">Sections</dt>
        <dd className="text-3xl font-semibold">
          <RollingNumber value={sections} />
        </dd>
      </div>
    </dl>
  );
}`,
  use: [
    "A figure worth watching change: a price as you switch plans, a count as it grows, a total that updates live.",
    "Stats on a landing page that roll up the first time they come into view.",
    "Anywhere a number changes in place and you want the change to be seen, not just swapped.",
  ],
  avoid: [
    "Numbers in a table or a long list, where motion in every row is noise: plain text with tabular-nums.",
    "Progress toward a known end: Meter shows how far along, not just how many.",
    "Values that change many times a second, like a timer: the reels can't settle, so render plain text.",
  ],
  parts: [
    {
      name: "RollingNumber",
      note: "Named so it never hides JavaScript's own Number in the file you use it in.",
      props: [
        { name: "value", type: "number", required: true, note: "The number to show. Change it and the reels roll to it." },
        { name: "format", type: '"number" | "currency" | "compact" | "percent"', default: '"number"', note: "1,240, $1,240, 1.2K, or 42% from 0.42." },
        { name: "currency", type: "string", default: '"USD"', note: "For currency, the ISO code." },
        { name: "decimals", type: "number", note: "Digits after the point, at most. None by default, one for compact." },
        { name: "locale", type: "string", default: '"en-US"', note: "How it's written: separators, symbols and order." },
        { name: "options", type: "Intl.NumberFormatOptions", note: "Any other formatting; these win over format's own." },
        { name: "rollIn", type: "boolean", default: "true", note: "Roll up from zero the first time it's seen. Off, it starts at its value." },
        { name: "live", type: "boolean", default: "false", note: "Announce each new value to screen readers, for numbers that update on their own." },
        { name: "...props", type: "span props", note: "Everything a span takes; set its size and weight with className." },
      ],
    },
  ],
  examples: [
    {
      id: "currency",
      title: "A price that changes",
      note: "Switch between a template and Pro, and the dollars roll over.",
      code: `const [pro, setPro] = useState(false);

<div className="grid justify-items-center gap-4">
  <RollingNumber
    value={pro ? 149 : 79}
    format="currency"
    className="text-5xl font-semibold tracking-tight"
  />
  <Button variant="outline" size="sm" onClick={() => setPro((p) => !p)}>
    {pro ? "One template" : "Every template, with Pro"}
  </Button>
</div>`,
    },
    {
      id: "compact",
      title: "Compact",
      note: "Thousands as K and millions as M, with one digit after the point.",
      code: `const [downloads, setDownloads] = useState(12_400);

<div className="grid justify-items-center gap-4">
  <p className="text-sm text-[var(--bd-muted)]">
    <RollingNumber
      value={downloads}
      format="compact"
      className="text-4xl font-semibold text-[var(--bd-fg)]"
    />{" "}
    downloads
  </p>
  <Button
    variant="outline"
    size="sm"
    onClick={() => setDownloads((d) => d + 1_250)}
  >
    Add a week
  </Button>
</div>`,
    },
    {
      id: "percent",
      title: "Percent",
      note: "Pass the share as a fraction: 0.024 reads as 2.4% with one decimal.",
      code: `<RollingNumber
  value={0.024}
  format="percent"
  decimals={1}
  className="text-4xl font-semibold tracking-tight"
/>`,
    },
    {
      id: "live",
      title: "A live count",
      note: "Seats on a Team license, said aloud as they change.",
      code: `const [seats, setSeats] = useState(4);

<div className="flex items-center gap-4">
  <Button
    variant="outline"
    size="icon"
    aria-label="One seat fewer"
    onClick={() => setSeats((s) => Math.max(1, s - 1))}
  >
    <MinusIcon weight="regular" />
  </Button>
  <p className="text-sm text-[var(--bd-muted)]">
    <RollingNumber
      value={seats}
      live
      className="text-3xl font-semibold text-[var(--bd-fg)]"
    />{" "}
    of 10 seats
  </p>
  <Button
    variant="outline"
    size="icon"
    aria-label="One seat more"
    onClick={() => setSeats((s) => Math.min(10, s + 1))}
  >
    <PlusIcon weight="regular" />
  </Button>
</div>`,
    },
  ],
  a11y: [
    "The reels are hidden from assistive tech; a visually hidden copy of the formatted number is what's read.",
    "With live, that copy is a polite live region, so each new value is announced once it settles.",
    "With reduced motion, the digits change in place without rolling.",
    "Digits are tabular, so a changing number never shifts the words beside it.",
  ],
};
