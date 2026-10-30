"use client";

import { useState, type ComponentType } from "react";
import { SwipeDeck, type SwipeDirection } from "../../pro-ui/swipe-deck";
import { Placeholder, type Layout } from "../_shared/placeholder";

/* What customers asked for this month, most wanted first. */
const REQUESTS = [
  { id: 412, title: "Dark mode for the editor", votes: 412, quote: "We work late. A white canvas at 1am is a lot.", who: "Sarah Mitchell", at: "Parcelworks", tags: ["editor", "theme"], also: ["JP", "SI", "MO", "AR"], teams: 61 },
  { id: 388, title: "Export to Figma with auto layout", votes: 368, quote: "Our designers rebuild every page by hand.", who: "Jake Morrison", at: "Northbeam", tags: ["figma", "export"], also: ["LM", "PR", "SI"], teams: 47 },
  { id: 361, title: "An undo history you can see", votes: 241, quote: "Let me scrub back, not press ⌘Z twenty times.", who: "Ryan Brooks", at: "Quanta", tags: ["editor"], also: ["AR", "MO"], teams: 29 },
  { id: 344, title: "Sign in with Okta", votes: 198, quote: "Security won't sign off without it.", who: "Emily Carter", at: "Larkspur", tags: ["security", "teams"], also: ["JP", "LM", "PR", "SI"], teams: 22 },
  { id: 327, title: "Comments on a section", votes: 176, quote: "Feedback lives in threads we lose.", who: "Megan Turner", at: "Lumen", tags: ["teams"], also: ["MO", "AR", "JP"], teams: 18 },
  { id: 309, title: "Scheduled publishing", votes: 121, quote: "Launches go out at 9am, not when I wake up.", who: "Ava Robinson", at: "Halden", tags: ["publish"], also: ["SI", "LM"], teams: 11 },
];
const MOST = REQUESTS[0].votes;


function Request({ r }: { r: (typeof REQUESTS)[number] }) {
  return (
    <div className="flex size-full flex-col p-6 max-[400px]:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--bd-subtle)]">Request #{r.id}</span>
        <span className="text-right">
          <span className="block font-mono text-[26px] font-medium leading-none tabular-nums text-[var(--bd-fg)]">{r.votes}</span>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-[var(--bd-subtle)]">votes</span>
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[rgb(var(--bd-ink)/0.07)]">
        <div className="h-full rounded-full bg-[var(--bd-fg)]" style={{ width: `${(r.votes / MOST) * 100}%` }} />
      </div>
      <h3 className="mt-6 text-balance text-[26px] font-semibold leading-[1.08] tracking-[-0.03em] text-[var(--bd-fg)] max-[400px]:text-[21px]">{r.title}</h3>
      <p className="mt-3 text-[14px] leading-relaxed text-[var(--bd-muted)]">&ldquo;{r.quote}&rdquo;</p>
      {/* Who else asked: a few faces, and how many teams in all. */}
      <div className="mt-auto flex items-center gap-2.5 pt-4">
        <span className="flex">
          {r.also.map((a) => (
            <span key={a} className="-ml-1.5 grid size-6 place-items-center rounded-full text-[9.5px] font-semibold text-[var(--bd-muted)] shadow-[0_0_0_2px_var(--bd-surface),inset_0_0_0_1px_rgb(var(--bd-ink)/0.1)] first:ml-0 [background:var(--bd-ui-raised)]">
              {a}
            </span>
          ))}
        </span>
        <span className="text-[12px] text-[var(--bd-subtle)]">and {r.teams} more teams asked</span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-dashed border-[rgb(var(--bd-ink)/0.14)] pt-4">
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-[var(--bd-fg)] shadow-[var(--bd-ui-lift),0_0_0_1px_rgb(var(--bd-ink)/0.08)] [background:var(--bd-ui-raised)]">
            {r.who
              .split(" ")
              .map((w) => w[0])
              .join("")}
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[13px] font-medium text-[var(--bd-fg)]">{r.who}</span>
            <span className="block truncate text-[12px] text-[var(--bd-subtle)]">{r.at}</span>
          </span>
        </span>
        <span className="flex shrink-0 gap-1">
          {r.tags.map((t) => (
            <span key={t} className="rounded-full px-2 py-0.5 font-mono text-[10.5px] text-[var(--bd-muted)] shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.14)]">
              {t}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

const WAYS: Record<SwipeDirection, string> = { right: "Roadmap", left: "Not now", up: "Next up" };

export function Demo() {
  const [tally, setTally] = useState<Record<SwipeDirection, number>>({ right: 0, left: 0, up: 0 });
  const count = (dir: SwipeDirection, by: number) => setTally((t) => ({ ...t, [dir]: t[dir] + by }));
  return (
    <div className="grid w-full justify-items-center gap-5">
      <div className="flex gap-5 font-mono text-[11.5px] uppercase tracking-[0.06em] text-[var(--bd-subtle)]">
        {(["up", "right", "left"] as const).map((d) => (
          <span key={d}>
            {WAYS[d]} <span className="tabular-nums text-[var(--bd-fg)]">{tally[d]}</span>
          </span>
        ))}
      </div>
      <SwipeDeck
        items={REQUESTS}
        getKey={(r) => String(r.id)}
        labels={WAYS}
        label="Feature requests"
        ratio={0.96}
        onSwipe={(_, d) => count(d, 1)}
        onUndo={(_, d) => count(d, -1)}
        empty={
          <div className="grid gap-1">
            <p className="text-[15px] font-medium text-[var(--bd-fg)]">Every request sorted</p>
            <p className="text-[13px] text-[var(--bd-muted)]">
              {tally.up} next up, {tally.right} on the roadmap, {tally.left} not now.
            </p>
          </div>
        }
      >
        {(r) => <Request r={r} />}
      </SwipeDeck>
    </div>
  );
}

/* Picking covers: keep or skip, no star. */
const COVERS: Array<{ id: string; layout: Layout; name: string }> = [
  { id: "a", layout: "photo", name: "Coast, morning" },
  { id: "b", layout: "landing", name: "Product shot" },
  { id: "c", layout: "portrait", name: "Founder portrait" },
  { id: "d", layout: "article", name: "Field notes" },
];

function Covers() {
  return (
    <SwipeDeck items={COVERS} getKey={(c) => c.id} star={false} label="Covers" className="max-w-[300px]">
      {(c) => (
        <div className="flex size-full flex-col">
          {/* Square on a 4 by 5 card: the picture fills it whole, the name the rest. */}
          <Placeholder layout={c.layout} ratio={1} className="w-full shrink-0" />
          <p className="flex flex-1 items-center px-5 text-[14px] font-medium text-[var(--bd-fg)]">{c.name}</p>
        </div>
      )}
    </SwipeDeck>
  );
}

export const examples: Record<string, ComponentType> = { covers: Covers };
