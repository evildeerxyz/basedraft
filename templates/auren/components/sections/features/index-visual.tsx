"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { FileTsIcon, MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import { ditherTile, rampMasks } from "@/lib/dither";
import { Code } from "../../editor/highlight";
import { Panel } from "./panel";

const QUERY = "where do we retry failed webhooks?";
const GROUPS = [
  { name: "api", cols: 6 },
  { name: "lib", cols: 7 },
  { name: "webhooks", cols: 6 },
  { name: "jobs", cols: 5 },
  { name: "test", cols: 6 },
];
const COLS = GROUPS.reduce((n, g) => n + g.cols, 0);
const STARTS = GROUPS.map((_, i) => GROUPS.slice(0, i).reduce((n, g) => n + g.cols, 0));
const ROWS = 8;
const HITS = new Set(["9:4", "14:2", "17:5", "21:1"]);
const SCAN_DELAY = 1.2;
const SCAN_TIME = 1.7;

const RESULTS = [
  { file: "src/webhooks/dispatch.ts", line: 88, score: "0.94", code: "await retry(() => send(event), { attempts: 5 });" },
  { file: "src/lib/retry.ts", line: 12, score: "0.89", code: "export async function retry<T>(fn: () => Promise<T>) {" },
  { file: "src/jobs/requeue.ts", line: 41, score: "0.71", code: `queue.add("webhook", event, { delay: backoff(n) });` },
];

// deterministic "file sizes" so server and client agree
const level = (c: number, r: number) => {
  const h = Math.sin(c * 12.9898 + r * 78.233) * 43758.5453;
  const f = h - Math.floor(h);
  return f < 0.14 ? 0 : [6, 12, 20, 28, 40][Math.floor(f * 5)];
};

const TILES = new Map<number, string>();
const tile = (l: number) => {
  if (!TILES.has(l)) TILES.set(l, ditherTile(l, 1, "#efebe2"));
  return TILES.get(l)!;
};
const TRAIL = rampMasks(16, 3, { axis: "x" }).end;

export function IndexVisual({ active }: { active: boolean }) {
  const [cycle, setCycle] = useState(0);
  const [chars, setChars] = useState(QUERY.length);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setCycle((c) => c + 1), 8500);
    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setChars(n);
      if (n >= QUERY.length) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [active, cycle]);

  return (
    <Panel
      title="Ask the codebase"
      meta="local index"
      footer={
        <>
          <span>18,402 files</span>
          <span className="text-paper/20">/</span>
          <span>3 citations</span>
          <span className="ml-auto">142 ms</span>
        </>
      }
    >
      <div className="flex h-full flex-col gap-5 p-5">
        <div className="flex h-11 items-center gap-3 rounded-[6px] border border-paper/12 bg-ink-2 px-3.5 text-[14px]">
          <MagnifyingGlassIcon size={15} className="text-paper/45" />
          <span className="text-paper/90">
            {QUERY.slice(0, chars)}
            <span className="ml-px inline-block h-4 w-[2px] translate-y-[3px] bg-accent [animation:blink_1s_steps(1)_infinite]" />
          </span>
        </div>

        <div className="relative">
          <div className="flex gap-3">
            {GROUPS.map((g, gi) => {
              const start = STARTS[gi];
              return (
                <div key={g.name} className="min-w-0" style={{ flex: g.cols }}>
                  <div className="mb-1.5 font-mono text-[10.5px] text-paper/35">{g.name}/</div>
                  <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${g.cols}, minmax(0, 1fr))` }}>
                    {Array.from({ length: g.cols * ROWS }, (_, i) => {
                      const c = start + (i % g.cols);
                      const r = Math.floor(i / g.cols);
                      const hit = HITS.has(`${c}:${r}`);
                      return (
                        <div key={i} className="relative aspect-square">
                          <div
                            className="absolute inset-0 opacity-70"
                            style={{ backgroundImage: tile(level(c, r)), backgroundSize: "8px 8px" }}
                          />
                          {hit && (
                            <motion.div
                              key={cycle}
                              className="absolute -inset-px bg-accent"
                              initial={active ? { opacity: 0, scale: 0.4 } : false}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: SCAN_DELAY + (c / COLS) * SCAN_TIME, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          {active && (
            <motion.div
              key={cycle}
              aria-hidden
              className="pointer-events-none absolute -bottom-1 top-4 w-px bg-accent"
              initial={{ left: "0%", opacity: 0 }}
              animate={{ left: "100%", opacity: [0, 1, 1, 0] }}
              transition={{ delay: SCAN_DELAY, duration: SCAN_TIME, ease: "linear" }}
            >
              <div
                className="absolute inset-y-0 right-0 w-12 bg-accent/60"
                style={{ maskImage: TRAIL, WebkitMaskImage: TRAIL, maskSize: "100% 24px", WebkitMaskSize: "100% 24px" }}
              />
            </motion.div>
          )}
        </div>

        <ol className="mt-auto space-y-1.5">
          {RESULTS.map((r, i) => (
            <motion.li
              key={`${cycle}-${r.file}`}
              initial={active ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: SCAN_DELAY + SCAN_TIME + 0.2 + i * 0.14, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-[16px_minmax(0,1fr)_auto] items-start gap-x-3 rounded-[6px] border border-paper/8 bg-ink-2 px-3 py-2.5"
            >
              <FileTsIcon size={14} className="mt-0.5 text-accent" />
              <div className="min-w-0">
                <div className="font-mono text-[12px] text-paper/85">
                  {r.file}
                  <span className="text-paper/35">:{r.line}</span>
                </div>
                <div className="mt-1 truncate font-mono text-[11.5px]">
                  <Code line={r.code} />
                </div>
              </div>
              <span className="font-mono text-[11px] text-paper/35">{r.score}</span>
            </motion.li>
          ))}
        </ol>
      </div>
    </Panel>
  );
}
