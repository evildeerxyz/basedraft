"use client";

import { ArrowRightIcon, CaretDownIcon, CaretUpIcon, MinusIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

/*
 * The few things a new account should do first, in a card that keeps count. A ring fills as they
 * get done; each step ticks with an ink circle whose tick draws in, and the next one opens on its
 * own with the button that does it. When the last is done the card blooms with a field of dither
 * dots and says so. It folds into a small pill in the corner, showing the count, and opens back
 * out of it; and it can be put away for good.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const SNAPPY = { type: "spring", stiffness: 520, damping: 42 } as const;
const SOFT = { type: "spring", stiffness: 300, damping: 30 } as const;
const DRAW = { duration: 0.28, ease: [0.16, 1, 0.3, 1] } as const;
const NONE = { duration: 0 } as const;

export type OnboardingAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  /** Doing it ticks the step. Set false when your app ticks it itself, once it's really done. */
  completes?: boolean;
};

export type OnboardingStep = {
  id: string;
  title: string;
  description?: ReactNode;
  /** A short note at the end of the row, like "2 min". */
  meta?: string;
  action?: OnboardingAction;
};

export type OnboardingChecklistProps = {
  steps: OnboardingStep[];
  title?: ReactNode;
  description?: ReactNode;
  /** The ids of the steps that are done. Leave it out and the checklist keeps them itself. */
  done?: string[];
  defaultDone?: string[];
  onDoneChange?: (done: string[]) => void;
  /** Folded into the pill. */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Shows the close button. Called once the card has gone. */
  onDismiss?: () => void;
  dismissible?: boolean;
  /** What it says when everything's done. */
  finished?: { title?: ReactNode; description?: ReactNode; action?: Omit<OnboardingAction, "completes"> };
  /** Floating in a corner, or in the page where you put it. */
  placement?: "corner" | "inline";
  corner?: "bottom-right" | "bottom-left";
  /** In the corner of the element around it (which should be relative) rather than the window's. */
  contained?: boolean;
  /** The pill's word. */
  pillLabel?: string;
  className?: string;
};

/* ---------- the ring ---------- */

function Ring({ value, total, size, stroke, still, children }: { value: number; total: number; size: number; stroke: number; still: boolean; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg aria-hidden width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bd-ui-track)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--bd-fg)"
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: total ? value / total : 0, opacity: value ? 1 : 0 }}
          transition={still ? NONE : SOFT}
        />
      </svg>
      {children}
    </span>
  );
}

function Check({ on, still, className }: { on: boolean; still: boolean; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <motion.path d="M5 10.5l3.2 3.1L15 7" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" initial={false} animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={still ? NONE : DRAW} />
    </svg>
  );
}

/* ---------- the bloom, when the last step is done ---------- */

/* A 4 by 4 ordered-dither matrix: where the dots fall, thinning out with distance the way a dithered gradient does. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const CELL = 13;
const BLOOM = (() => {
  const dots: { x: number; y: number; delay: number }[] = [];
  const cols = 27;
  const rows = 20;
  const reach = Math.hypot(cols, rows * 0.9);
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const d = Math.hypot(c - 2, (r - 2) * 0.9) / reach;
      const t = BAYER[(r % 4) * 4 + (c % 4)] / 16;
      if (t > 1.05 - d * 1.25) continue;
      dots.push({ x: c * CELL + 6, y: r * CELL + 6, delay: d * 0.75 + t * 0.12 });
    }
  return dots;
})();

function Bloom() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {BLOOM.map((p, i) => (
        <motion.span
          key={i}
          className="absolute size-[3px] rounded-full bg-[var(--bd-fg)]"
          style={{ left: p.x, top: p.y }}
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: [0, 0.85, 0], scale: [0.3, 1, 0.6] }}
          transition={{ duration: 0.95, delay: p.delay, times: [0, 0.22, 1], ease: "easeOut" }}
        />
      ))}
    </span>
  );
}

/* ---------- a step ---------- */

const ACTION = "relative inline-flex h-8 select-none items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(var(--bd-shade)/0.2),0_6px_16px_-8px_rgb(var(--bd-shade)/0.5)] transition-[filter,scale] duration-150 hover:brightness-[1.12] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)] [&_svg]:size-3.5";
const GHOST = "inline-flex h-8 select-none items-center rounded-full px-3 text-[13px] font-medium text-[var(--bd-muted)] transition-[background-color,color,scale] duration-150 hover:bg-[rgb(var(--bd-ink)/0.05)] hover:text-[var(--bd-fg)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]";

function ActionButton({ action, onDone }: { action: Omit<OnboardingAction, "completes"> & { completes?: boolean }; onDone?: () => void }) {
  const run = () => {
    action.onClick?.();
    if (action.completes !== false) onDone?.();
  };
  const inner = (
    <>
      {action.label}
      <ArrowRightIcon weight="regular" />
    </>
  );
  return action.href ? (
    <a href={action.href} onClick={run} className={ACTION}>
      {inner}
    </a>
  ) : (
    <button type="button" onClick={run} className={ACTION}>
      {inner}
    </button>
  );
}

type RowProps = { step: OnboardingStep; done: boolean; open: boolean; uid: string; still: boolean; onTick: () => void; onOpen: () => void; onComplete: () => void };

function Row({ step, done, open, uid, still, onTick, onOpen, onComplete }: RowProps) {
  const head = `${uid}-${step.id}-head`;
  const panel = `${uid}-${step.id}-panel`;
  return (
    <li className="relative">
      {open && <motion.span layoutId={`${uid}-open`} aria-hidden className="absolute inset-0 rounded-[14px] bg-[color-mix(in_oklab,var(--bd-ui-track)_38%,var(--bd-surface))]" transition={still ? NONE : SNAPPY} />}
      <div className="relative flex items-center gap-1 pl-2.5 pr-1.5">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={`${step.title}, done`}
          onClick={onTick}
          className="group/tick relative grid size-8 shrink-0 place-items-center rounded-full outline-none transition-transform duration-100 active:scale-[0.86] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
        >
          <span className={cx("absolute inset-[5px] rounded-full bg-[var(--bd-surface)] transition-shadow duration-150", done ? "shadow-none" : "shadow-[inset_0_0_0_1.5px_var(--bd-line-strong)] group-hover/tick:shadow-[inset_0_0_0_1.5px_rgb(var(--bd-ink)/0.45)]")} />
          <motion.span
            aria-hidden
            className="absolute inset-[5px] rounded-full shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(var(--bd-shade)/0.22)] [background:var(--bd-ui-ink)]"
            initial={false}
            animate={{ scale: done ? 1 : 0.4, opacity: done ? 1 : 0 }}
            transition={still ? NONE : { type: "spring", stiffness: 600, damping: 26 }}
          />
          <Check on={done} still={still} className="relative size-3.5 text-[var(--bd-ui-ink-text)]" />
        </button>
        <button
          type="button"
          id={head}
          data-ob-row=""
          aria-expanded={open}
          aria-controls={panel}
          onClick={onOpen}
          className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[10px] pl-1.5 pr-1.5 text-left outline-none focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
        >
          <span className={cx("relative min-w-0 truncate text-[14px] transition-colors duration-200", done ? "text-[var(--bd-subtle)]" : open ? "font-medium text-[var(--bd-fg)]" : "text-[var(--bd-fg)]")}>
            {step.title}
            <motion.span aria-hidden className="absolute inset-x-0 top-1/2 h-px origin-left bg-current" initial={false} animate={{ scaleX: done ? 1 : 0 }} transition={still ? NONE : { ...DRAW, delay: done ? 0.08 : 0 }} />
          </span>
          {step.meta && !done && <span className="ml-auto shrink-0 text-[12px] tabular-nums text-[var(--bd-subtle)]">{step.meta}</span>}
          <motion.span aria-hidden animate={{ rotate: open ? 180 : 0 }} transition={still ? NONE : SNAPPY} className={cx("grid size-4 shrink-0 place-items-center text-[var(--bd-subtle)] [&_svg]:size-3", (!step.meta || done) && "ml-auto")}>
            <CaretDownIcon weight="regular" />
          </motion.span>
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panel}
            role="region"
            aria-labelledby={head}
            initial={still ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={still ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={still ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={SOFT}
            className="relative overflow-hidden"
          >
            <div className="pb-3.5 pl-[50px] pr-4">
              {step.description && <p className="text-[13px] leading-relaxed text-[var(--bd-muted)]">{step.description}</p>}
              {step.action && !done && (
                <div className="mt-3">
                  <ActionButton action={step.action} onDone={onComplete} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

/* ---------- the checklist ---------- */

export function OnboardingChecklist({
  steps,
  title = "Get started",
  description,
  done,
  defaultDone = [],
  onDoneChange,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  onDismiss,
  dismissible = true,
  finished,
  placement = "corner",
  corner = "bottom-right",
  contained = false,
  pillLabel = "Setup",
  className,
}: OnboardingChecklistProps) {
  const still = !!useReducedMotion();
  const uid = useId();
  const [innerDone, setInnerDone] = useState<string[]>(defaultDone);
  const doneIds = done ?? innerDone;
  const isDone = (id: string) => doneIds.includes(id);
  const count = steps.filter((s) => isDone(s.id)).length;
  const total = steps.length;
  const all = total > 0 && count === total;

  const [innerFolded, setInnerFolded] = useState(defaultCollapsed);
  const folded = collapsed ?? innerFolded;
  const [gone, setGone] = useState(false);

  // The step that's open: to start with, the first that isn't done.
  const [openId, setOpenId] = useState<string | null>(() => steps.find((s) => !defaultDone.includes(s.id) && !(done ?? []).includes(s.id))?.id ?? null);
  const [celebrate, setCelebrate] = useState(false);
  const [said, setSaid] = useState("");
  const advance = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (advance.current) clearTimeout(advance.current);
  }, []);

  const setDone = (next: string[]) => {
    setInnerDone(next);
    onDoneChange?.(next);
  };
  const tick = (step: OnboardingStep, force?: boolean) => {
    const on = force ?? !isDone(step.id);
    if (on === isDone(step.id)) return;
    const next = on ? [...doneIds, step.id] : doneIds.filter((d) => d !== step.id);
    setDone(next);
    const left = steps.filter((s) => !next.includes(s.id));
    setSaid(on ? `${step.title} done. ${total - left.length} of ${total}.` : `${step.title} not done. ${total - left.length} of ${total}.`);
    if (advance.current) clearTimeout(advance.current);
    if (!on) return;
    if (!left.length) {
      setCelebrate(!still);
      advance.current = setTimeout(() => setCelebrate(false), 2200);
      return;
    }
    // A beat to see the tick, then the next one that isn't done opens.
    if (openId === step.id || openId === null) {
      const at = steps.findIndex((s) => s.id === step.id);
      const after = [...steps.slice(at + 1), ...steps.slice(0, at)].find((s) => !next.includes(s.id));
      advance.current = setTimeout(() => setOpenId(after?.id ?? null), 420);
    }
  };

  const fold = (next: boolean) => {
    setInnerFolded(next);
    onCollapsedChange?.(next);
  };
  const pill = useRef<HTMLButtonElement>(null);
  const minimize = useRef<HTMLButtonElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    const frame = requestAnimationFrame(() => (folded ? pill : minimize).current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [folded]);
  const toggleFold = (next: boolean) => {
    moved.current = true;
    fold(next);
  };

  // Up and down move between the steps' titles.
  const list = useRef<HTMLUListElement>(null);
  const onListKey = (e: KeyboardEvent) => {
    const rows = [...(list.current?.querySelectorAll<HTMLElement>("[data-ob-row]") ?? [])];
    const at = rows.indexOf(document.activeElement as HTMLElement);
    if (at < 0) return;
    if (e.key === "ArrowDown") rows[Math.min(rows.length - 1, at + 1)]?.focus();
    else if (e.key === "ArrowUp") rows[Math.max(0, at - 1)]?.focus();
    else if (e.key === "Home") rows[0]?.focus();
    else if (e.key === "End") rows[rows.length - 1]?.focus();
    else return;
    e.preventDefault();
  };

  const floating = placement === "corner";
  const left = corner === "bottom-left";
  const round = folded ? 999 : 22;

  const card = (
    <motion.div
      key="card"
      layout={!still}
      initial={still ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={still ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96, transition: { duration: 0.16 } }}
      transition={still ? NONE : SOFT}
      style={{ borderRadius: round }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && floating && !folded) {
          e.stopPropagation();
          toggleFold(true);
        }
      }}
      className={cx(
        "pointer-events-auto relative overflow-hidden bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[var(--bd-shadow-float),0_0_0_1px_rgb(var(--bd-ink)/0.07)]",
        folded ? "w-auto" : floating ? (contained ? "w-[min(340px,100%)]" : "w-[min(340px,calc(100vw-32px))]") : "w-full max-w-[360px]",
        className,
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {folded ? (
          <motion.button
            key="pill"
            ref={pill}
            type="button"
            layout={!still ? "position" : false}
            aria-expanded={false}
            aria-label={all ? `${pillLabel}: all done. Open the checklist` : `${pillLabel}: ${count} of ${total} done. Open the checklist`}
            onClick={() => toggleFold(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: still ? NONE : { duration: 0.18, delay: 0.08 } }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
            className="flex h-11 items-center gap-2.5 whitespace-nowrap rounded-full pl-2 pr-3.5 text-[13.5px] outline-none transition-transform duration-100 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[color:var(--bd-ui-focus)]"
          >
            <Ring value={count} total={total} size={28} stroke={3} still={still}>
              {all && <Check on still={still} className="size-3.5 text-[var(--bd-fg)]" />}
            </Ring>
            <span className="font-medium">{pillLabel}</span>
            <span className="tabular-nums text-[var(--bd-muted)]">{all ? "Done" : `${count}/${total}`}</span>
            <CaretUpIcon weight="regular" className="size-3 text-[var(--bd-subtle)]" />
          </motion.button>
        ) : (
          <motion.section
            key="card"
            layout={!still ? "position" : false}
            aria-labelledby={`${uid}-title`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: still ? NONE : { duration: 0.2, delay: 0.06 } }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
            className="relative"
          >
            {celebrate && <Bloom />}
            <header className="relative z-[1] flex items-start gap-3 px-4 pb-3 pt-4">
              <span role="progressbar" aria-label="Setup progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={count} aria-valuetext={`${count} of ${total} done`}>
                <Ring value={count} total={total} size={44} stroke={3.5} still={still}>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {all ? (
                      <motion.span key="all" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={still ? NONE : SNAPPY} className="grid">
                        <Check on still={still} className="size-[18px] text-[var(--bd-fg)]" />
                      </motion.span>
                    ) : (
                      <motion.span key={count} initial={still ? { opacity: 0 } : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={still ? { opacity: 0 } : { opacity: 0, y: -6 }} transition={still ? NONE : SNAPPY} className="text-[12px] font-semibold tabular-nums">
                        {count}/{total}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Ring>
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <h2 id={`${uid}-title`} className="truncate text-[15px] font-semibold tracking-[-0.01em]">
                  {title}
                </h2>
                <p className="mt-0.5 text-[13px] leading-snug text-[var(--bd-muted)]">{all ? `All ${total} done.` : (description ?? `${count} of ${total} done`)}</p>
              </div>
              <div className="-mr-1.5 -mt-1 flex shrink-0 items-center">
                <button
                  ref={minimize}
                  type="button"
                  aria-expanded
                  aria-label="Minimize the checklist"
                  onClick={() => toggleFold(true)}
                  className="grid size-8 place-items-center rounded-full text-[var(--bd-subtle)] transition-[background-color,color,scale] duration-150 hover:bg-[rgb(var(--bd-ink)/0.05)] hover:text-[var(--bd-fg)] active:scale-90 focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)] [&_svg]:size-4"
                >
                  <MinusIcon weight="regular" />
                </button>
                {dismissible && (
                  <button
                    type="button"
                    aria-label="Close the checklist"
                    onClick={() => setGone(true)}
                    className="grid size-8 place-items-center rounded-full text-[var(--bd-subtle)] transition-[background-color,color,scale] duration-150 hover:bg-[rgb(var(--bd-ink)/0.05)] hover:text-[var(--bd-fg)] active:scale-90 focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)] [&_svg]:size-4"
                  >
                    <XIcon weight="regular" />
                  </button>
                )}
              </div>
            </header>

            <AnimatePresence initial={false}>
              {!all ? (
                <motion.div key="steps" initial={still ? { opacity: 0 } : { height: 0, opacity: 0 }} animate={still ? { opacity: 1 } : { height: "auto", opacity: 1 }} exit={still ? { opacity: 0 } : { height: 0, opacity: 0 }} transition={SOFT} className="relative overflow-hidden">
                  <ul ref={list} onKeyDown={onListKey} className="grid max-h-[min(440px,calc(100vh-180px))] gap-0.5 overflow-y-auto px-1.5 pb-2 [scrollbar-width:thin]">
                    {steps.map((s) => (
                      <Row
                        key={s.id}
                        step={s}
                        done={isDone(s.id)}
                        open={openId === s.id}
                        uid={uid}
                        still={still}
                        onTick={() => tick(s)}
                        onOpen={() => setOpenId(openId === s.id ? null : s.id)}
                        onComplete={() => tick(s, true)}
                      />
                    ))}
                  </ul>
                </motion.div>
              ) : (
                <motion.div key="finished" initial={still ? { opacity: 0 } : { height: 0, opacity: 0 }} animate={still ? { opacity: 1 } : { height: "auto", opacity: 1 }} exit={still ? { opacity: 0 } : { height: 0, opacity: 0 }} transition={SOFT} className="relative z-[1] overflow-hidden">
                  <div className="px-4 pb-4 pl-[72px]">
                    <p className="text-[14px] font-medium">{finished?.title ?? "You're all set"}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--bd-muted)]">{finished?.description ?? "That's everything to get going. You'll find all of it again in Settings."}</p>
                    {(finished?.action || dismissible) && (
                      <div className="-ml-0.5 mt-3 flex flex-wrap items-center gap-1">
                        {finished?.action && <ActionButton action={{ ...finished.action, completes: false }} />}
                        {dismissible && (
                          <button type="button" onClick={() => setGone(true)} className={GHOST}>
                            Close
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <div
      className={cx(
        floating ? cx(contained ? "absolute" : "fixed", "bottom-4 z-[70] flex", left ? "left-4 right-4 justify-start" : "left-4 right-4 justify-end", "pointer-events-none items-end") : "relative flex items-start",
      )}
    >
      <AnimatePresence onExitComplete={onDismiss}>{!gone && card}</AnimatePresence>
      <span role="status" aria-live="polite" className="sr-only">
        {said}
      </span>
    </div>
  );
}
