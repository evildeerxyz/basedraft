"use client";

import { useEffect, useState } from "react";
import { CheckCircleIcon, CircleNotchIcon, GitBranchIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { ditherTile, rampMasks } from "@/lib/dither";
import { cn, toast } from "@/lib/site";
import { Kbd } from "../../ui/primitives";
import { Panel } from "./panel";

const RUNS = [
  {
    title: "Upgrade apps/web to React 19",
    branch: "agent/react-19",
    speed: 0.8,
    start: 0.52,
    stages: ["Reading 214 files", "Applying codemods", "Fixing 9 type errors", "Running 1,204 tests"],
    diff: "+612 -540",
  },
  {
    title: "Add rate limiting to POST /charges",
    branch: "agent/rate-limit",
    speed: 1.25,
    start: 0.86,
    stages: ["Reading limiter config", "Editing 3 files", "Writing tests", "Running 48 tests"],
    diff: "+48 -3",
  },
  {
    title: "Fix the flaky webhook retry test",
    branch: "agent/flaky-retry",
    speed: 0.65,
    start: 0.3,
    stages: ["Reproducing, 40 runs", "Bisecting 12 commits", "Patching clock mock", "Re-running 200×"],
    diff: "+6 -2",
  },
  {
    title: "Document the Ledger SDK",
    branch: "agent/sdk-docs",
    speed: 1,
    start: 0.06,
    stages: ["Reading 64 files", "Drafting 11 pages", "Compiling examples", "Linking API refs"],
    diff: "+1,180",
  },
];

const TRACK = ditherTile(9, 1, "#efebe2");
const EDGE = rampMasks(12, 2, { axis: "x" }).end;
const CYCLE = 1.18; // progress past 1.0 is time spent "ready"

export function AgentsVisual({ active }: { active: boolean }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 90);
    return () => clearInterval(id);
  }, [active]);

  const runs = RUNS.map((r) => {
    const p = (r.start + tick * r.speed * 0.0032) % CYCLE;
    return { ...r, p: Math.min(1, p), done: p >= 1 };
  });
  const ready = runs.filter((r) => r.done).length;

  return (
    <Panel
      title="Background agents"
      meta={`${runs.length - ready} running · ${ready} ready`}
      footer={<span>Each agent works on its own branch, in a sandbox. Your working tree stays yours.</span>}
    >
      <div className="flex h-full flex-col">
      <ul className="divide-y divide-paper/8 border-b border-paper/8">
        {runs.map((r) => {
          const stage = r.stages[Math.min(3, Math.floor(r.p * 4))];
          const secs = Math.floor(r.p * 540);
          return (
            <li key={r.branch} className="grid grid-cols-[18px_minmax(0,1fr)_auto] gap-x-3 px-5 py-[18px]">
              <span className="pt-0.5">
                {r.done ? (
                  <CheckCircleIcon size={16} weight="fill" className="text-accent" />
                ) : (
                  <CircleNotchIcon size={16} className="animate-spin text-paper/45" />
                )}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[14px] text-paper/90">{r.title}</div>
                <div className="mt-1 flex min-w-0 items-center gap-3 font-mono text-[11px] text-paper/40">
                  <span className="flex shrink-0 items-center gap-1">
                    <GitBranchIcon size={11} />
                    {r.branch}
                  </span>
                  <span className={cn("truncate", r.done && "text-accent")}>{r.done ? "Ready for review" : stage}</span>
                </div>
                <div
                  className="relative mt-3 h-[6px]"
                  style={{ backgroundImage: TRACK, backgroundSize: "8px 8px", opacity: r.done ? 0.9 : 1 }}
                >
                  <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${r.p * 100}%` }}>
                    {!r.done && (
                      <div
                        className="absolute inset-y-0 left-full w-6 -scale-x-100 bg-accent"
                        style={{ maskImage: EDGE, WebkitMaskImage: EDGE }}
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between font-mono text-[11px] text-paper/40">
                <span>
                  {String(Math.floor(secs / 60)).padStart(2, "0")}:{String(secs % 60).padStart(2, "0")}
                </span>
                {r.done ? (
                  <button
                    type="button"
                    onClick={() => toast(`Opened ${r.branch} for review`)}
                    className="rounded-[4px] bg-paper px-2 py-1 font-sans text-[11.5px] font-medium text-ink transition-colors hover:bg-accent"
                  >
                    Review {r.diff}
                  </button>
                ) : (
                  <span>{Math.round(r.p * 100)}%</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto hidden p-5 sm:block">
        <div className="flex h-11 items-center gap-3 rounded-[6px] border border-dashed border-paper/15 px-3.5 text-[13px] text-paper/35">
          <PlusIcon size={14} />
          Describe another task…
          <span className="ml-auto flex gap-1 text-paper">
            <Kbd>⌘</Kbd>
            <Kbd>N</Kbd>
          </span>
        </div>
      </div>
      </div>
    </Panel>
  );
}
