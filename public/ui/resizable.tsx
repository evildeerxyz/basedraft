"use client";

import { animate, motion, useMotionTemplate, useMotionValue, useMotionValueEvent, useReducedMotion, type AnimationPlaybackControls } from "motion/react";
import { Children, useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

/*
 * Two panels side by side (or one over the other) with a line between them you can drag. The
 * handle is easy to catch: its grip is small but the area that takes the pointer is wide. Panels
 * stop at their least and most, catch for a moment at the sizes in `snap`, and with `collapsible`
 * fold away when dragged well past their least. Double-click the line to go back to where it
 * started. From the keyboard the line is a separator: the arrows move it, Shift moves it further,
 * and Enter folds the first panel away and back.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const SNAPPY = { type: "spring", stiffness: 520, damping: 42 } as const;
const SOFT = { type: "spring", stiffness: 300, damping: 30 } as const;
/* How near a snap point the size has to come, in percent, before it catches there. */
const CATCH = 2.5;
const STEP = 2;
const BIG_STEP = 10;

/* While the line is held, the whole page shows the resize cursor and nothing gets selected. */
const holding = (cursor: string | null) => {
  document.documentElement.style.cursor = cursor ?? "";
  document.body.style.userSelect = cursor ? "none" : "";
};

export type ResizableProps = {
  /** Side by side, or one over the other. */
  direction?: "horizontal" | "vertical";
  /** The first panel's size, as a percent of the whole. */
  size?: number;
  defaultSize?: number;
  onSizeChange?: (size: number) => void;
  /** The first panel's least and most, as percents. */
  min?: number;
  max?: number;
  /** Sizes the line catches at for a moment as it passes. */
  snap?: number[];
  /** Which panel folds away when dragged well past its least. */
  collapsible?: "start" | "end" | "both";
  /** What the line is called for screen readers. */
  label?: string;
  /** Exactly two ResizablePanels. */
  children: ReactNode;
  className?: string;
};

/** One of the two panels. Its content scrolls when it outgrows it. */
export function ResizablePanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("h-full w-full min-w-0 overflow-auto", className)}>{children}</div>;
}

export function Resizable({ direction = "horizontal", size, defaultSize = 50, onSizeChange, min = 15, max = 85, snap = [], collapsible, label = "Resize the panels", children, className }: ResizableProps) {
  const reduce = useReducedMotion();
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const run = useRef<AnimationPlaybackControls | null>(null);
  const before = useRef(defaultSize);
  const mv = useMotionValue(size ?? defaultSize);
  const basis = useMotionTemplate`${mv}%`;
  const [now, setNow] = useState(size ?? defaultSize);
  const [held, setHeld] = useState(false);
  const across = direction === "horizontal";
  const [first, second] = Children.toArray(children);
  const startFolds = collapsible === "start" || collapsible === "both";
  const endFolds = collapsible === "end" || collapsible === "both";
  const lo = startFolds ? 0 : min;
  const hi = endFolds ? 100 : max;

  // A size set from outside moves the line there, as a spring.
  useEffect(() => {
    if (size === undefined) return;
    run.current?.stop();
    if (reduce) mv.set(size);
    else run.current = animate(mv, size, SOFT);
  }, [size, mv, reduce]);

  useMotionValueEvent(mv, "change", (v) => setNow(Math.round(v)));

  /* Where a drag leaves the line: inside the least and most, caught at a snap point, or folded away past them. */
  const fit = (raw: number) => {
    if (startFolds && raw < min / 2) return 0;
    if (endFolds && raw > max + (100 - max) / 2) return 100;
    const v = Math.max(min, Math.min(max, raw));
    const near = snap.find((p) => Math.abs(v - p) < CATCH);
    return near ?? v;
  };
  /* Small moves follow the pointer exactly; a jump (folding, catching) springs, so it never teleports. */
  const go = (to: number, how: object = SNAPPY) => {
    const from = mv.get();
    if (Math.abs(to - from) < 0.01) return;
    run.current?.stop();
    if (reduce || Math.abs(to - from) < 4) {
      run.current = null;
      mv.set(to);
    } else {
      run.current = animate(mv, to, how);
    }
  };
  const commit = (to: number) => {
    go(to, SOFT);
    if (to > 0 && to < 100) before.current = to;
    onSizeChange?.(Math.round(to * 10) / 10);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setHeld(true);
    holding(across ? "col-resize" : "row-resize");
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!held || !box.current) return;
    const r = box.current.getBoundingClientRect();
    const raw = across ? ((e.clientX - r.left) / r.width) * 100 : ((e.clientY - r.top) / r.height) * 100;
    go(fit(raw));
  };
  const onPointerUp = () => {
    if (!held) return;
    setHeld(false);
    holding(null);
    const v = mv.get();
    if (v > 0 && v < 100) before.current = v;
    onSizeChange?.(Math.round(v * 10) / 10);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? BIG_STEP : STEP;
    const back = across ? "ArrowLeft" : "ArrowUp";
    const fwd = across ? "ArrowRight" : "ArrowDown";
    const v = mv.get();
    let to: number | null = null;
    if (e.key === back) to = v <= min && startFolds ? 0 : Math.max(min, v - step);
    else if (e.key === fwd) to = v === 0 ? min : v >= max && endFolds ? 100 : Math.min(max, v + step);
    else if (e.key === "Home") to = lo;
    else if (e.key === "End") to = hi;
    else if (e.key === "Enter" && collapsible) to = v === 0 || v === 100 ? before.current : startFolds ? 0 : 100;
    if (to === null) return;
    e.preventDefault();
    commit(to);
  };

  return (
    <div ref={box} className={cx("flex h-full w-full overflow-hidden rounded-[18px] bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]", across ? "flex-row" : "flex-col", className)}>
      <motion.div id={`${id}-first`} className="relative min-h-0 min-w-0 shrink-0 overflow-hidden" style={{ flexBasis: basis }} inert={now === 0}>
        {first}
      </motion.div>
      <div
        role="separator"
        tabIndex={0}
        aria-label={label}
        aria-controls={`${id}-first`}
        aria-orientation={across ? "vertical" : "horizontal"}
        aria-valuenow={now}
        aria-valuemin={lo}
        aria-valuemax={hi}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => commit(defaultSize)}
        onKeyDown={onKeyDown}
        style={{ touchAction: "none" }}
        className={cx(
          "group/handle relative z-10 shrink-0 outline-none",
          across ? "-mx-2 w-4 cursor-col-resize" : "-my-2 h-4 cursor-row-resize",
          "focus-visible:[&>span:first-child]:bg-[color:var(--bd-ui-focus)]",
        )}
      >
        {/* The line itself: a hairline that darkens as the handle is pointed at or held. */}
        <span aria-hidden className={cx("absolute bg-[var(--bd-line)] transition-colors duration-150 group-hover/handle:bg-[var(--bd-line-strong)]", across ? "inset-y-0 left-1/2 w-px -translate-x-1/2" : "inset-x-0 top-1/2 h-px -translate-y-1/2", held && "!bg-[var(--bd-line-strong)]")} />
        {/* The grip in the middle: a small pill that grows when pointed at and turns to ink while held. */}
        <motion.span
          aria-hidden
          className={cx("absolute left-1/2 top-1/2 rounded-full shadow-[0_1px_2px_rgb(var(--bd-shade)/0.18)]", across ? "h-8 w-1.5" : "h-1.5 w-8", held ? "[background:var(--bd-ui-ink)]" : "bg-[var(--bd-ui-track)] group-hover/handle:bg-[var(--bd-line-strong)]")}
          style={{ x: "-50%", y: "-50%" }}
          initial={false}
          animate={{ scale: held ? 1.15 : 1 }}
          whileHover={{ scale: 1.12 }}
          transition={SNAPPY}
        />
      </div>
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden" inert={now === 100}>
        {second}
      </div>
    </div>
  );
}
