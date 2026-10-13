"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Keys, WithKeys } from "@/site/keys";

/*
 * Helping people find their way without getting in it. Studio works like the design tools people
 * already know, so this only points at what's different: a four-step tour the first time, one
 * line of hints near the toolbar that follows what you're doing, and the shortcuts under ?.
 */

const STORE = "bd-studio-guide";
type Saved = { toured: boolean; hints: boolean };

function read(): Saved {
  try {
    return { toured: false, hints: true, ...(JSON.parse(localStorage.getItem(STORE) ?? "{}") as Partial<Saved>) };
  } catch {
    return { toured: false, hints: true };
  }
}

/** Whether the tour has been seen, and whether hints show. Remembered in this browser. */
export function useGuide() {
  const [saved, setSaved] = useState(read);
  const update = useCallback((next: Partial<Saved>) => {
    setSaved((s) => {
      const out = { ...s, ...next };
      try {
        localStorage.setItem(STORE, JSON.stringify(out));
      } catch {
        /* private mode: it just won't be remembered */
      }
      return out;
    });
  }, []);
  return [saved, update] as const;
}

/* ---------- the tour ---------- */

export interface TourStep {
  /** The element it points at: [data-tour=...]. */
  at: string;
  side: "right" | "left" | "top" | "bottom-end" | "center";
  title: string;
  body: string;
}

const W = 300;
const GAP = 14;

export function Tour({ steps, open, onClose }: { steps: TourStep[]; open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [box, setBox] = useState<DOMRect | null>(null);
  const step = steps[Math.min(i, steps.length - 1)];

  // Where the step's element is, kept up to date as panels move.
  useLayoutEffect(() => {
    if (!open || !step) return;
    let id = 0;
    let last = "";
    const find = () => {
      const r = document.querySelector(`[data-tour="${step.at}"]`)?.getBoundingClientRect() ?? null;
      const k = r ? `${r.left}|${r.top}|${r.width}|${r.height}` : "";
      if (k !== last) {
        last = k;
        setBox(r);
      }
      id = requestAnimationFrame(find);
    };
    find();
    return () => cancelAnimationFrame(id);
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [open, onClose]);

  if (!open || !step || typeof document === "undefined") return null;
  const last = i >= steps.length - 1;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const r = box ?? new DOMRect(vw / 2, vh / 2, 0, 0);
  let pos: { left: number; top?: number; bottom?: number };
  if (step.side === "right") pos = { left: r.right + GAP, top: Math.min(vh - 220, r.top + 56) };
  else if (step.side === "left") pos = { left: r.left - GAP - W, top: Math.min(vh - 220, r.top + 56) };
  else if (step.side === "top") pos = { left: r.left + r.width / 2 - W / 2, bottom: vh - r.top + GAP };
  else if (step.side === "bottom-end") pos = { left: r.right - W, top: r.bottom + GAP };
  else pos = { left: r.left + r.width / 2 - W / 2, top: r.top + r.height * 0.32 };
  pos.left = Math.max(12, Math.min(vw - W - 12, pos.left));
  const ring = step.side !== "center" && box;

  return createPortal(
    <>
      {ring && <motion.span aria-hidden layout className="pointer-events-none fixed z-[90] rounded-[10px] shadow-[0_0_0_2px_var(--bd-select),0_0_0_6px_rgb(151_71_255/0.18)]" style={{ left: r.left - 3, top: r.top - 3, width: r.width + 6, height: r.height + 6 }} transition={{ type: "spring", stiffness: 420, damping: 40 }} />}
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          role="dialog"
          aria-label={step.title}
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
          transition={{ type: "spring", stiffness: 520, damping: 40 }}
          className="fixed z-[91] rounded-[10px] bg-surface p-4 shadow-[0_16px_48px_rgb(var(--bd-shade)/0.22),0_0_0_1px_rgb(var(--bd-ink)/0.08)]"
          style={{ ...pos, width: W }}
        >
          <p className="text-[12px] font-medium tabular-nums text-subtle">
            {i + 1} of {steps.length}
          </p>
          <h3 className="mt-1 text-[15px] font-semibold">{step.title}</h3>
          <p className="mt-1.5 text-[13px] leading-snug text-muted">
            <WithKeys text={step.body} />
          </p>
          <div className="mt-4 flex items-center justify-between gap-2">
            <button type="button" onClick={onClose} className="h-8 rounded-[7px] px-2 text-[13px] text-muted transition-colors hover:bg-fg/[0.05] hover:text-fg">
              {last ? "Close" : "Skip"}
            </button>
            <div className="flex items-center gap-1.5">
              {i > 0 && (
                <button type="button" onClick={() => setI(i - 1)} className="h-8 rounded-[7px] bg-fg/[0.06] px-3 text-[13px] font-medium transition-colors hover:bg-fg/[0.1]">
                  Back
                </button>
              )}
              <button type="button" autoFocus onClick={() => (last ? onClose() : setI(i + 1))} className="btn-ink inline-flex h-8 items-center rounded-[7px] px-3 text-[13px] font-medium">
                {last ? "Start building" : "Next"}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>,
    document.body,
  );
}

/* ---------- hints ---------- */

/** One line above the toolbar on what you can do right now. */
export function HintLine({ text, show }: { text: string; show: boolean }) {
  return (
    <div aria-live="polite" className="pointer-events-none absolute bottom-[68px] left-1/2 z-30 -translate-x-1/2">
      <AnimatePresence mode="wait">
        {show && (
          <motion.p
            key={text}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: 0.2 }}
            className="whitespace-nowrap rounded-[8px] bg-surface/90 px-3 py-1.5 text-[12.5px] text-muted shadow-[0_0_0_0.5px_rgb(var(--bd-ink)/0.12),0_2px_8px_rgb(var(--bd-shade)/0.06)] backdrop-blur"
          >
            <WithKeys text={text} />
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- help ---------- */

const SHORTCUTS: Array<{ group: string; rows: Array<[string, string]> }> = [
  {
    group: "Canvas",
    rows: [
      ["Select", "V"],
      ["Hand", "H"],
      ["Comment", "C"],
      ["Pan while held", "Space"],
      ["Zoom", "Cmd Scroll"],
      ["Zoom in, out", "Cmd + −"],
      ["Zoom to fit", "Shift 1"],
      ["Zoom to 100%", "Shift 0"],
      ["Hide panels", "Cmd \\"],
      ["Preview", "Shift P"],
    ],
  },
  {
    group: "Editing",
    rows: [
      ["Edit text", "Click"],
      ["Use the page as a visitor would", "Alt Click"],
      ["Keep, undo the text", "Enter Esc"],
      ["Move a section", "Alt Up Down"],
      ["Duplicate", "Cmd D"],
      ["Remove", "Delete"],
      ["Undo, redo", "Cmd Z"],
    ],
  },
];

export function HelpPanel({ hints, onHints, onTour }: { hints: boolean; onHints: (on: boolean) => void; onTour: () => void }) {
  return (
    <>
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-line px-4 text-[13px] font-semibold">
        Help
        <span className="flex items-center gap-1.5 text-[12px] font-normal text-muted">
          This list <Keys combo="?" />
        </span>
      </div>
      <div className="flex gap-2 p-3">
        <button type="button" onClick={onTour} className="h-8 flex-1 rounded-[7px] bg-fg/[0.06] text-[13px] font-medium transition-colors hover:bg-fg/[0.1]">
          Take the tour
        </button>
        <button type="button" role="switch" aria-checked={hints} onClick={() => onHints(!hints)} className="flex h-8 flex-1 items-center justify-center gap-2 rounded-[7px] bg-fg/[0.06] text-[13px] font-medium transition-colors hover:bg-fg/[0.1]">
          <span aria-hidden className={cn("relative h-[14px] w-[24px] rounded-full transition-colors", hints ? "bg-accent" : "bg-fg/[0.2]")}>
            <span className={cn("absolute left-[2px] top-[2px] size-[10px] rounded-full bg-white shadow transition-transform", hints && "translate-x-[10px]")} />
          </span>
          Hints
        </button>
      </div>
      <div className="min-h-0 overflow-y-auto px-3 pb-3">
        {SHORTCUTS.map((g) => (
          <div key={g.group} className="mt-1 first:mt-0">
            <p className="px-1 pb-1 pt-2 text-[12px] font-medium text-subtle">{g.group}</p>
            {g.rows.map(([label, keys]) => (
              <div key={label} className="flex h-8 items-center justify-between rounded-[6px] px-1 text-[13px]">
                <span>{label}</span>
                {keys === "Click" ? <span className="text-[12px] text-muted">Click</span> : <Keys combo={keys} />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
