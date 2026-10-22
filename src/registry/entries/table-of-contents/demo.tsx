"use client";

import { useId, useRef, type ComponentType } from "react";
import { TableOfContents, type TocItem } from "../../ui/table-of-contents";

/* A short guide, its sections and what they say. */
const GUIDE: Array<TocItem & { body: string }> = [
  { id: "before", label: "Before you publish", level: 1, body: "A site goes live from its main branch. Anything still on a branch stays in Studio until it's merged." },
  { id: "domain", label: "Check the domain", level: 2, body: "Point your domain at zuno.site in Settings, then Domains. The check turns green once the DNS record is found, usually within the hour." },
  { id: "plan", label: "Pick a plan", level: 2, body: "Free sites publish to a basedraft address. Your own domain, and a team editing together, come with Team." },
  { id: "publishing", label: "Publishing", level: 1, body: "There are two ways, and they land in the same place." },
  { id: "studio", label: "From Studio", level: 2, body: "Press Publish at the top right. The build takes under a minute, and the page you were on opens live when it's done." },
  { id: "github", label: "From GitHub", level: 2, body: "Push to main. Every push builds, and the last one that builds cleanly goes live." },
  { id: "after", label: "After it's live", level: 1, body: "Each publish is kept. Roll back from Deploys if something looks wrong, and the one before comes back in seconds." },
];

/** The guide in a box that scrolls, with its contents beside it. */
function Guide({ levels = true }: { levels?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  // Ids of its own, so two guides on one page don't share their headings.
  const key = useId().replace(/[^a-zA-Z0-9]/g, "");
  const items = GUIDE.filter((g) => levels || g.level === 1).map((g) => ({ id: `${key}-${g.id}`, label: g.label, level: g.level }));
  return (
    <div className="@container w-full max-w-[560px]">
    <div className="grid gap-5 @[460px]:grid-cols-[minmax(0,1fr)_150px] @[460px]:gap-6">
      <div ref={box} className="relative h-[260px] overflow-y-auto @[460px]:h-[320px] rounded-[20px] bg-[var(--bd-surface)] px-5 pb-40 pt-4 shadow-[inset_0_0_0_1px_var(--bd-line)]">
        {GUIDE.map((g) => {
          const H = g.level === 1 ? "h3" : "h4";
          return (
            <section key={g.id} className={g.level === 1 ? "mt-6 first:mt-0" : "mt-4"}>
              <H id={`${key}-${g.id}`} className={g.level === 1 ? "text-[15px] font-medium text-[var(--bd-fg)]" : "text-[13.5px] font-medium text-[var(--bd-fg)]"}>
                {g.label}
              </H>
              <p className="mt-1.5 text-[13px] leading-[1.6] text-[var(--bd-muted)]">{g.body}</p>
            </section>
          );
        })}
      </div>
      <TableOfContents items={items} scrollRoot={box} offset={24} updateHash={false} className="-order-1 @[460px]:order-none @[460px]:pt-4" />
    </div>
    </div>
  );
}

export function Demo() {
  return <Guide />;
}

function Flat() {
  return <Guide levels={false} />;
}

export const examples: Record<string, ComponentType> = { flat: Flat };
