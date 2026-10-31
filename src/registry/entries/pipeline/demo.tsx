"use client";

import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { useEffect, useState, type ComponentType } from "react";
import { formatDuration, Pipeline, type PipelineStage, type PipelineStatus } from "../../pro-ui/pipeline";

/* A build of the storefront, from the push to its preview: each stage's length, and what it says as it goes. */
const PLAN = [
  { id: "queue", label: "Queued", ms: 2000, note: undefined, log: ["Waiting for a build machine", "Picked up in iad1, 4 cores"] },
  { id: "install", label: "Install", ms: 4000, note: "1,204 packages", log: ["Cloning acme/storefront at 7c2e9a1", "Restored the build cache from 2h ago", "added 1,204 packages in 3.6s"] },
  { id: "build", label: "Build", ms: 6000, note: "38 pages", log: ["Running next build", "Compiled in 4.1s", "Generating static pages (38/38)"] },
  { id: "checks", label: "Checks", ms: 4000, note: "214 tests", log: ["Type check passed", "214 tests passed in 3.2s"] },
  { id: "domains", label: "Domains", ms: 2000, note: undefined, log: ["Assigned storefront-git-gift-cards.relay.app", "Ready"] },
];

/* When each stage starts, from the push. */
const STARTS = PLAN.map((_, i) => PLAN.slice(0, i).reduce((n, s) => n + s.ms, 0));

export function Demo() {
  const [run, setRun] = useState(0);
  const [t, setT] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const total = PLAN.reduce((n, s) => n + s.ms, 0);
  // The build's clock: from the push, a tenth of a second at a time, until it's done.
  useEffect(() => {
    const start = Date.now();
    const timer = window.setInterval(() => {
      const now = Date.now() - start;
      setT(Math.min(now, total));
      if (now >= total) window.clearInterval(timer);
    }, 100);
    return () => window.clearInterval(timer);
  }, [run, total]);
  const stages: PipelineStage[] = PLAN.map((s, i) => {
    const from = STARTS[i];
    const status: PipelineStatus = t >= from + s.ms ? "done" : t >= from ? "running" : "waiting";
    // A running stage shows how long it's been going: the build's own clock, so every stage keeps time with it.
    return { id: s.id, label: s.label, status, duration: status === "done" ? s.ms : status === "running" ? t - from : undefined, estimate: status === "done" ? undefined : s.ms, note: status === "done" ? s.note : undefined };
  });
  const live = stages.find((s) => s.status === "running")?.id ?? null;
  const shown = picked ?? live ?? "domains";
  const plan = PLAN.find((s) => s.id === shown)!;
  const state = stages.find((s) => s.id === shown)!;
  const from = STARTS[PLAN.indexOf(plan)];
  // The stage's lines, as many as it has reached.
  const lines = state.status === "waiting" ? [] : plan.log.slice(0, state.status === "done" ? plan.log.length : Math.max(1, Math.ceil(((t - from) / plan.ms) * plan.log.length)));
  const ready = t >= total;
  return (
    <div className="grid w-full max-w-[600px] gap-4">
      <div className="flex items-center justify-between gap-3 text-[13px]">
        <span className="text-[var(--bd-muted)]">
          Preview of <span className="font-medium text-[var(--bd-fg)]">gift-cards</span>
        </span>
        {/* The time so far is the waterfall's own; once it's done, the whole run, and the way to run it again. */}
        <span className="flex h-7 items-center gap-2 font-mono text-[12px] tabular-nums text-[var(--bd-muted)]">
          {ready && `Ready in ${formatDuration(total)}`}
          {ready && (
            <button
              type="button"
              onClick={() => {
                setPicked(null);
                setT(0);
                setRun((r) => r + 1);
              }}
              aria-label="Build it again"
              className="grid size-7 place-items-center rounded-full text-[var(--bd-muted)] hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)]"
            >
              <ArrowCounterClockwiseIcon weight="regular" className="size-3.5" />
            </button>
          )}
        </span>
      </div>
      {/* The picked stage's output, joined under the track. */}
      <Pipeline label="Build of 7c2e9a1" stages={stages} selected={shown} onSelect={setPicked}>
        <div className="h-[84px] overflow-hidden px-4 py-3 font-mono text-[11.5px] leading-[19px]">
          {lines.length ? lines.map((l, i) => <p key={i} className={i === lines.length - 1 && state.status === "running" ? "text-[var(--bd-fg)]" : "text-[var(--bd-muted)]"}>{l}</p>) : <p className="text-[var(--bd-subtle)]">Not started yet.</p>}
        </div>
      </Pipeline>
    </div>
  );
}

function Failed() {
  return (
    <div className="w-full max-w-[560px]">
      <Pipeline
        stages={[
          { id: "install", label: "Install", status: "done", duration: 17000 },
          { id: "build", label: "Build", status: "done", duration: 39000 },
          { id: "checks", label: "Checks", status: "failed", duration: 6000, note: "2 type errors" },
          { id: "domains", label: "Domains", status: "skipped" },
        ]}
      />
    </div>
  );
}

function Narrow() {
  return (
    <div className="w-[300px]">
      <Pipeline
        stages={[
          { id: "queue", label: "Queued", status: "done", duration: 2000 },
          { id: "install", label: "Install", status: "done", duration: 18000, note: "1,204 packages" },
          { id: "build", label: "Build", status: "done", duration: 41000, note: "38 pages" },
          { id: "checks", label: "Checks", status: "done", duration: 9000 },
          { id: "domains", label: "Domains", status: "done", duration: 2000 },
        ]}
      />
    </div>
  );
}

export const examples: Record<string, ComponentType> = { failed: Failed, narrow: Narrow };
