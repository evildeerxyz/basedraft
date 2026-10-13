"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CheckIcon, CircleNotchIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { cn, toast } from "@/lib/site";
import { Code } from "../../editor/highlight";
import { Panel } from "./panel";

const HUNKS = [
  {
    file: "src/api/charges.ts",
    why: "Mount the limiter refunds.ts already uses instead of adding a second one.",
    lines: [
      { t: "-", s: `charges.post("/", requireAuth, async (req, res) => {` },
      { t: "+", s: `charges.post("/", requireAuth, limit("charges"), async (req, res) => {` },
    ],
  },
  {
    file: "src/lib/limit.ts",
    why: "Key by account, not IP. Your API keys are shared across hosts.",
    lines: [
      { t: "-", s: "  const key = req.ip;" },
      { t: "+", s: "  const key = req.account?.id ?? req.ip;" },
    ],
  },
  {
    file: "config/limits.ts",
    why: "30 a minute matches the Pro plan limit in billing/plans.ts.",
    lines: [
      { t: " ", s: `  refunds: { window: "1m", max: 10 },` },
      { t: "+", s: `  charges: { window: "1m", max: 30 },` },
    ],
  },
];

export function ReviewVisual() {
  const [kept, setKept] = useState(() => HUNKS.map(() => true));
  const [testing, setTesting] = useState(0);
  const count = kept.filter(Boolean).length;

  useEffect(() => {
    if (!testing) return;
    const id = window.setTimeout(() => setTesting(0), 1100);
    return () => clearTimeout(id);
  }, [testing]);

  const toggle = (i: number, value: boolean) => {
    if (kept[i] === value) return;
    setKept((k) => k.map((v, j) => (j === i ? value : v)));
    setTesting((t) => t + 1);
  };

  return (
    <Panel
      title="Review · agent/rate-limit"
      meta={`${count} of ${HUNKS.length} hunks kept`}
      footer={
        <>
          {testing ? (
            <span className="flex items-center gap-2">
              <CircleNotchIcon size={12} className="animate-spin text-accent" />
              Re-running tests on what you keep…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="size-1.5 bg-add" />
              {28 + count} passed · 0 failed
            </span>
          )}
          <button
            type="button"
            disabled={!count}
            onClick={() => toast(`Committed ${count} ${count === 1 ? "hunk" : "hunks"} to agent/rate-limit`)}
            className="ml-auto rounded-[4px] bg-paper px-2.5 py-1 font-sans text-[12px] font-medium text-ink transition-colors hover:bg-accent disabled:opacity-40"
          >
            Commit {count} {count === 1 ? "hunk" : "hunks"}
          </button>
        </>
      }
    >
      <div className="no-scrollbar h-full space-y-3 overflow-y-auto p-4" data-lenis-prevent>
        {HUNKS.map((h, i) => (
          <motion.div
            key={h.file}
            animate={{ opacity: kept[i] ? 1 : 0.45 }}
            className="overflow-hidden rounded-[6px] border border-paper/10 bg-ink-2"
          >
            <div className="flex items-center gap-3 border-b border-paper/8 px-3 py-2">
              <span className="truncate font-mono text-[11.5px] text-paper/70">{h.file}</span>
              <div className="ml-auto flex shrink-0 rounded-[5px] border border-paper/10 p-0.5" role="group" aria-label={`Hunk in ${h.file}`}>
                {[true, false].map((value) => (
                  <button
                    key={String(value)}
                    type="button"
                    aria-pressed={kept[i] === value}
                    onClick={() => toggle(i, value)}
                    className={cn(
                      "flex h-6 items-center gap-1 rounded-[3px] px-2 text-[11.5px] transition-colors",
                      kept[i] === value ? (value ? "bg-paper text-ink" : "bg-del/90 text-ink") : "text-paper/50 hover:text-paper",
                    )}
                  >
                    {value ? <CheckIcon size={11} weight="bold" /> : <XIcon size={11} weight="bold" />}
                    {value ? "Keep" : "Drop"}
                  </button>
                ))}
              </div>
            </div>
            <p className="px-3 pt-2.5 text-[12.5px] leading-snug text-paper/60">
              <span className="text-accent">Why · </span>
              {h.why}
            </p>
            <div className="py-2 font-mono text-[12px] leading-[21px]">
              {h.lines.map((l, j) => (
                <div
                  key={j}
                  className={cn(
                    "flex whitespace-pre px-3",
                    l.t === "+" && "bg-add/[0.09]",
                    l.t === "-" && "bg-del/[0.08]",
                    !kept[i] && "line-through decoration-paper/30",
                  )}
                >
                  <span className={cn("w-4 shrink-0", l.t === "+" ? "text-add" : "text-del")}>
                    {l.t === "+" ? "+" : l.t === "-" ? "-" : ""}
                  </span>
                  <span className={cn("truncate", l.t === "-" && "opacity-50")}>
                    <Code line={l.s} />
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </Panel>
  );
}
