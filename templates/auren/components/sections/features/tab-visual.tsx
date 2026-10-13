"use client";

import { Fragment, useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/site";
import { Code } from "../../editor/highlight";
import { Panel } from "./panel";

type Slot = { to: string; note?: string };
const SLOTS: Slot[] = [{ to: "unitPrice" }, { to: "unitPrice" }, { to: "price: unitPrice", note: "keeps the metric key stable" }];

// each line is code, with `0` marking where a predicted edit lands
const LINES: Array<Array<string | 0>> = [
  ["// invoice/line.ts"],
  ["export function lineTotal(unitPrice: number, qty: number, discount = 0) {"],
  ["  if (qty <= 0) return 0;"],
  ["  const subtotal = ", 0, " * qty;"],
  ["  const capped = Math.min(discount, ", 0, ");"],
  ["  const total = subtotal - capped * qty;"],
  [`  metrics.observe("line_total", { `, 0, ", qty, total });"],
  ["  return round(total, 2);"],
  ["}"],
];

// global slot number for each `0` in LINES
const SLOT_IDS = (() => {
  let k = 0;
  return LINES.map((parts) => parts.map((part) => (part === 0 ? k++ : -1)));
})();

export function TabVisual({ active }: { active: boolean }) {
  const [accepted, setAccepted] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(
      () => setAccepted((a) => (a >= SLOTS.length ? 0 : a + 1)),
      accepted >= SLOTS.length ? 2600 : 1500,
    );
    return () => clearTimeout(id);
  }, [active, accepted]);

  const accept = () => setAccepted((a) => Math.min(SLOTS.length, a + 1));

  return (
    <Panel
      title="Tab · next edit"
      meta="on-device · 22 ms"
      footer={
        <>
          <span>
            You renamed <span className="text-paper/70">price</span> to <span className="text-paper/70">unitPrice</span>.
            Auren found {SLOTS.length} more places.
          </span>
          <span className="ml-auto flex gap-1">
            {SLOTS.map((_, i) => (
              <span key={i} className={cn("size-2 transition-colors", i < accepted ? "bg-accent" : "bg-paper/15")} />
            ))}
          </span>
        </>
      }
    >
      <div className="flex h-full flex-col justify-center py-6 font-mono text-[13px] leading-[26px]">
        {LINES.map((parts, li) => {
          const slots: number[] = [];
          const content = parts.map((part, pi) => {
            if (part !== 0) return <Code key={pi} line={part} />;
            const k = SLOT_IDS[li][pi];
            slots.push(k);
            const s = SLOTS[k];
            if (k < accepted)
              return (
                <motion.span
                  key={`${pi}-${k}-done`}
                  initial={{ backgroundColor: "color-mix(in oklab, var(--accent) 35%, transparent)" }}
                  animate={{ backgroundColor: "rgba(0,0,0,0)" }}
                  transition={{ duration: 1.2 }}
                  className="rounded-[2px]"
                >
                  <Code line={s.to} />
                </motion.span>
              );
            if (k === accepted)
              return (
                <Fragment key={pi}>
                  <span className="text-del line-through decoration-del/70">price</span>
                  <span className="rounded-[2px] bg-accent/12 text-accent">{s.to}</span>
                </Fragment>
              );
            return <Code key={pi} line="price" />;
          });
          const current = slots.includes(accepted);
          const pending = slots.some((k) => k > accepted);
          return (
            <div key={li} className={cn("relative flex whitespace-pre pr-4", current && "bg-paper/[0.04]")}>
              <span className="w-12 shrink-0 select-none pr-4 text-right text-paper/20">{li + 1}</span>
              <span className="w-3 shrink-0">
                {pending && <span className="inline-block size-[5px] -translate-y-px bg-accent/70" />}
                {li === 1 && <span className="inline-block size-[5px] -translate-y-px bg-paper/40" />}
              </span>
              <span className="min-w-0 truncate">{content}</span>
              {current && (
                <span className="ml-3 flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={accept}
                    className="inline-flex h-[19px] items-center gap-1 rounded-[3px] border border-accent/50 bg-accent/10 px-1.5 font-sans text-[10.5px] font-medium leading-none text-accent transition-colors hover:bg-accent hover:text-ink"
                  >
                    Tab
                  </button>
                  {SLOTS[accepted]?.note && (
                    <span className="hidden font-sans text-[11px] text-paper/40 xl:inline">{SLOTS[accepted].note}</span>
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
