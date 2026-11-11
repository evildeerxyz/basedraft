"use client";

import { XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

/*
 * A short walk through a screen, one thing at a time. The page dims, a soft-edged window opens over
 * the thing being shown, and a card beside it says what it's for. Next, and the window glides to
 * the next thing, taking its shape, while the card follows round to whichever side has room; the
 * page scrolls it into view when it has to. The arrow keys step, Escape ends it, and focus stays
 * on the card while it's open and goes back where it was after.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* True once it's running in the browser: the server and the first render agree on false, so the portal never trips hydration. */
const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

type Scope = { "data-theme"?: string; className?: string };
/* The light or dark the thing being shown sits in, so the card in a portal on body matches it. */
function scopeOf(el: Element | null): Scope {
  if (!el) return {};
  const byAttr = el.closest("[data-theme]");
  const byClass = el.closest(".dark, .light, .bd-light");
  const near = byAttr && byClass ? (byAttr.contains(byClass) ? byClass : byAttr) : (byAttr ?? byClass);
  if (!near) return {};
  if (near === byAttr) return { "data-theme": near.getAttribute("data-theme") ?? undefined };
  return { className: ["dark", "bd-light", "light"].find((c) => near.classList.contains(c)) };
}

export type TourStep = {
  /** What it points at: a CSS selector, or a ref to the element. */
  target: string | RefObject<HTMLElement | null>;
  title: string;
  body?: ReactNode;
  /** Which side of it the card sits on. It goes round to another if there isn't room. */
  side?: "top" | "bottom" | "left" | "right";
};

export type TourProps = {
  steps: TourStep[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Runs when Done is pressed on the last step. */
  onFinish?: () => void;
  /** How far the window opens past the thing's edges, in pixels. */
  padding?: number;
  /** What the tour is called, for a screen reader. */
  label?: string;
};

type Rect = { x: number; y: number; w: number; h: number };
const CARD = 300;
const GAP = 14;
const EDGE = 12;

const find = (t: TourStep["target"]) => (typeof t === "string" ? document.querySelector<HTMLElement>(t) : t.current);

/** Where the card goes beside the window: the side asked for if it fits, then the others, kept on screen. */
function place(r: Rect | null, w: number, h: number, side: TourStep["side"] = "bottom") {
  if (!r) return { x: (innerWidth - w) / 2, y: (innerHeight - h) / 2 };
  const order = [side, ...(["bottom", "top", "right", "left"] as const).filter((s) => s !== side)];
  const fits = { bottom: r.y + r.h + GAP + h < innerHeight - EDGE, top: r.y - GAP - h > EDGE, right: r.x + r.w + GAP + w < innerWidth - EDGE, left: r.x - GAP - w > EDGE };
  const s = order.find((o) => fits[o!]) ?? "bottom";
  const cx = r.x + r.w / 2 - w / 2;
  const cy = r.y + r.h / 2 - h / 2;
  const pos = s === "bottom" ? { x: cx, y: r.y + r.h + GAP } : s === "top" ? { x: cx, y: r.y - GAP - h } : s === "right" ? { x: r.x + r.w + GAP, y: cy } : { x: r.x - GAP - w, y: cy };
  return { x: Math.min(Math.max(EDGE, pos.x), innerWidth - EDGE - w), y: Math.min(Math.max(EDGE, pos.y), innerHeight - EDGE - h) };
}

export function Tour({ steps, open, onOpenChange, onFinish, padding = 8, label = "Tour" }: TourProps) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardSize, setCardSize] = useState({ w: CARD, h: 180 });
  const [scope, setScope] = useState<Scope>({});
  const card = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLElement | null>(null);
  const still = useReducedMotion();
  const mounted = useMounted();
  const id = useId();
  const step = steps[i];
  const last = i === steps.length - 1;

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  const go = useCallback((to: number) => setI(Math.max(0, Math.min(steps.length - 1, to))), [steps.length]);
  const next = useCallback(() => {
    if (last) {
      onFinish?.();
      close();
    } else go(i + 1);
  }, [last, onFinish, close, go, i]);

  // Opening starts at the first step.
  const [opened, setOpened] = useState(open);
  if (open !== opened) {
    setOpened(open);
    if (open) setI(0);
  }
  // It remembers where focus was, and gives it back when it closes.
  useEffect(() => {
    if (!open) return;
    back.current = document.activeElement as HTMLElement | null;
    return () => back.current?.focus?.({ preventScroll: true });
  }, [open]);

  // The window follows the thing: scrolled into view if needed, then measured as the page moves.
  useLayoutEffect(() => {
    if (!open || !step) return;
    const el = find(step.target);
    const b = el?.getBoundingClientRect();
    if (el && b && (b.top < 80 || b.bottom > innerHeight - 80)) el.scrollIntoView({ block: "center", behavior: still ? "auto" : "smooth" });
    const measure = () => {
      setScope(scopeOf(el));
      if (!el) return setRect(null);
      const r = el.getBoundingClientRect();
      setRect({ x: r.left - padding, y: r.top - padding, w: r.width + padding * 2, h: r.height + padding * 2 });
    };
    const frame = requestAnimationFrame(measure);
    addEventListener("scroll", measure, true);
    addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    if (el) ro.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", measure, true);
      removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, [open, step, padding, still]);

  useLayoutEffect(() => {
    if (card.current) setCardSize({ w: card.current.offsetWidth, h: card.current.offsetHeight });
  }, [i, open]);

  // Focus on the card's main button at each step; arrows step, Escape ends, Tab stays inside.
  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => card.current?.querySelector<HTMLElement>("[data-main]")?.focus({ preventScroll: true }));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") go(i - 1);
      else if (e.key === "Tab") {
        const all = [...(card.current?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]") ?? [])];
        const at = all.indexOf(document.activeElement as HTMLElement);
        const to = e.shiftKey ? (at <= 0 ? all.length - 1 : at - 1) : at === all.length - 1 ? 0 : at + 1;
        all[to]?.focus();
      } else return;
      e.preventDefault();
    };
    addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(t);
      removeEventListener("keydown", onKey);
    };
  }, [open, i, close, next, go]);

  if (!mounted) return null;
  const pos = place(rect, cardSize.w, cardSize.h, step?.side);
  const spring = still ? { duration: 0 } : { type: "spring" as const, stiffness: 300, damping: 32 };
  const hole = rect ?? { x: innerWidth / 2, y: innerHeight / 2, w: 0, h: 0 };

  return createPortal(
    <div {...scope} style={{ display: "contents" }}>
      <AnimatePresence>
        {open && step && (
          <motion.div key="tour" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-[100]">
            {/* The dim, with a window cut over the thing being shown. */}
            <svg aria-hidden className="absolute inset-0 size-full">
              <defs>
                <mask id={`${id}-hole`}>
                  <rect width="100%" height="100%" fill="white" />
                  <motion.rect initial={false} animate={{ x: hole.x, y: hole.y, width: hole.w, height: hole.h }} transition={spring} rx={14} fill="black" />
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgb(10 10 12 / 0.5)" mask={`url(#${id}-hole)`} />
            </svg>
            {rect && <motion.span aria-hidden initial={false} animate={{ x: hole.x, y: hole.y, width: hole.w, height: hole.h }} transition={spring} className="pointer-events-none absolute left-0 top-0 rounded-[14px] shadow-[0_0_0_2px_rgb(255_255_255/0.9),0_0_0_7px_rgb(255_255_255/0.14)]" />}
            <motion.div
              ref={card}
              role="dialog"
              aria-modal="true"
              aria-label={label}
              aria-labelledby={`${id}-title`}
              aria-describedby={step.body ? `${id}-body` : undefined}
              initial={false}
              animate={{ x: pos.x, y: pos.y }}
              transition={spring}
              className="absolute left-0 top-0 w-[300px] max-w-[calc(100vw-24px)] rounded-[20px] bg-[var(--bd-surface)] p-4 text-[var(--bd-fg)] shadow-[var(--bd-shadow-float),0_0_0_1px_rgb(var(--bd-ink)/0.08)]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs tabular-nums text-[var(--bd-subtle)]">
                  {i + 1} of {steps.length}
                </span>
                <button type="button" onClick={close} aria-label="End the tour" className="-mr-1.5 -mt-1 grid size-7 place-items-center rounded-full text-[var(--bd-subtle)] outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]">
                  <XIcon weight="regular" className="size-3.5" />
                </button>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={i} initial={{ opacity: 0, y: still ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={{ duration: 0.2 }}>
                  <p id={`${id}-title`} className="mt-1.5 text-[15px] font-medium tracking-[-0.01em]">
                    {step.title}
                  </p>
                  {step.body && (
                    <div id={`${id}-body`} className="mt-1 text-[13.5px] leading-[1.55] text-[var(--bd-muted)]">
                      {step.body}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
              <div className="mt-4 flex items-center gap-2">
                {/* Where you are: done steps filled, this one a longer bar, the rest faint. */}
                <span aria-hidden className="mr-auto flex items-center gap-1">
                  {steps.map((_, k) => (
                    <motion.span key={k} initial={false} animate={{ width: k === i ? 16 : 6 }} transition={spring} className={cx("h-1.5 rounded-full", k <= i ? "bg-[var(--bd-fg)]" : "bg-[var(--bd-ui-track)]")} />
                  ))}
                </span>
                {i > 0 && (
                  <button type="button" onClick={() => go(i - 1)} className="h-8 rounded-full px-3 text-[13px] font-medium text-[var(--bd-muted)] outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]">
                    Back
                  </button>
                )}
                <button
                  type="button"
                  data-main
                  onClick={next}
                  className="h-8 rounded-full px-3.5 text-[13px] font-medium text-[var(--bd-ui-ink-text)] outline-none [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_4px_12px_-6px_rgb(var(--bd-shade)/0.5)] transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
                >
                  {last ? "Done" : "Next"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
