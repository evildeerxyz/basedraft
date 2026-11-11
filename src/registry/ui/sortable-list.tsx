"use client";

import { DotsSixVerticalIcon } from "@phosphor-icons/react";
import { animate, motion, motionValue, useReducedMotion, type MotionValue } from "motion/react";
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

/*
 * A list you put in order by hand. Pick a row up and it lifts off the sheet with a shadow under
 * it; the others slide apart to make room as it passes; let go and it settles into its place at
 * the speed it was moving. Near the top or bottom of a scrolling box, the box scrolls along. From
 * the keyboard: Space picks the focused row up, the arrows move it, Space puts it down and Escape
 * puts it back, each step said out loud. On a touch screen, hold a row for a moment to pick it up
 * (or use the grip, with `handle`), so a quick swipe still scrolls the page.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const SNAPPY = { type: "spring", stiffness: 520, damping: 42 } as const;
const SOFT = { type: "spring", stiffness: 300, damping: 30 } as const;
/* How near the edge of the scrolling box the pointer has to be before it scrolls, and how fast it goes at the very edge. */
const EDGE = 56;
const MAX_SPEED = 18;
/* How far the pointer moves before a press becomes a drag, and how long a touch is held to pick a row up. */
const SLOP = 4;
const HOLD_MS = 260;
const INTERACTIVE = "button, a, input, textarea, select, label, [contenteditable], [data-no-drag]";

export type SortableListProps<T> = {
  items: T[];
  /** A stable key for each item: its id. */
  itemKey: (item: T) => string;
  /** Called with the items in their new order each time one is put down somewhere new. */
  onReorder?: (items: T[]) => void;
  /** What a row shows. `dragging` is true while it's picked up. */
  renderItem: (item: T, state: { dragging: boolean; index: number }) => ReactNode;
  /** What the list is, for screen readers: "Home page sections". */
  label: string;
  /** Each item's name in what's said as it moves: "Hero". Its position by default. */
  itemLabel?: (item: T) => string;
  /** Drag only by the grip at the start of each row, so the rest of the row can hold buttons and text to select. */
  handle?: boolean;
  className?: string;
};

type Rect = { top: number; height: number };
type Drag = {
  key: string;
  from: number;
  over: number;
  mode: "pointer" | "keyboard";
  rects: Rect[];
  gap: number;
  scroller: HTMLElement | null;
  startY: number;
  startScroll: number;
  lastY: number;
  samples: Array<[number, number]>;
};

/** The nearest box above the list that scrolls up and down, or the page itself. */
function scrollerOf(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY;
    if ((o === "auto" || o === "scroll") && p.scrollHeight > p.clientHeight) return p;
  }
  return null;
}
const scrollTopOf = (s: HTMLElement | null) => (s ? s.scrollTop : window.scrollY);
/* While a row is held, the whole page shows the grabbing hand and no text gets selected by the sweep. */
const holding = (on: boolean) => {
  document.documentElement.style.cursor = on ? "grabbing" : "";
  document.body.style.userSelect = on ? "none" : "";
};
const now = () => performance.now();

export function SortableList<T>({ items, itemKey, onReorder, renderItem, label, itemLabel, handle = false, className }: SortableListProps<T>) {
  const reduce = useReducedMotion();
  const hint = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const rows = useRef(new Map<string, HTMLLIElement>());
  // Each row's offset while things move, kept for the list's life and made as rows appear.
  const [ys] = useState(() => new Map<string, MotionValue<number>>());
  const refocus = useRef<string | null>(null);
  const drag = useRef<Drag | null>(null);
  const pending = useRef<{ key: string; x: number; y: number; id: number; type: string; el: Element; held: boolean; timer?: number } | null>(null);
  const busy = useRef(false);
  const reset = useRef(false);
  const justDragged = useRef(false);
  const raf = useRef(0);
  const [list, setList] = useState(items);
  const [source, setSource] = useState(items);
  const [lifted, setLifted] = useState<string | null>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [say, setSay] = useState("");

  // New items from outside replace the list, unless one is in someone's hand.
  if (items !== source && !lifted) {
    setSource(items);
    setList(items);
  }

  const keys = list.map(itemKey);
  const yOf = (key: string) => {
    let v = ys.get(key);
    if (!v) ys.set(key, (v = motionValue(0)));
    return v;
  };
  const nameOf = (i: number) => (itemLabel ? itemLabel(list[i]) : `Item ${i + 1}`);

  // Once the new order is on the page, every row's offset goes back to nothing in the same frame, so nothing jumps.
  useLayoutEffect(() => {
    if (!reset.current) return;
    reset.current = false;
    ys.forEach((v) => v.set(0));
    // Moving a row in the page can take the focus with it; a row put down from the keyboard keeps it.
    if (refocus.current) rows.current.get(refocus.current)?.focus();
    refocus.current = null;
  }, [list, ys]);

  // While a row is held on a touch screen, a finger moving shouldn't scroll the page under it.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const stop = (e: TouchEvent) => {
      if (drag.current || pending.current?.held) e.preventDefault();
    };
    el.addEventListener("touchmove", stop, { passive: false });
    return () => el.removeEventListener("touchmove", stop);
  }, []);

  /* Where each row's top would be with the held one moved to `over`, given each row's height and the gap between them. */
  const shifts = (d: Drag, over: number) => {
    const order = d.rects.map((_, i) => i).filter((i) => i !== d.from);
    order.splice(over, 0, d.from);
    const out: number[] = [];
    let y = d.rects[0].top;
    for (const i of order) {
      out[i] = y - d.rects[i].top;
      y += d.rects[i].height + d.gap;
    }
    return out;
  };
  const move = (v: MotionValue<number>, to: number, how: object = SNAPPY) => (reduce ? v.set(to) : animate(v, to, how));
  /* The others make room for the held row at `over`. */
  const makeRoom = (d: Drag, over: number) => {
    const s = shifts(d, over);
    keys.forEach((k, i) => {
      if (i !== d.from) move(yOf(k), s[i]);
    });
    return s;
  };

  const begin = (key: string, mode: Drag["mode"], startY: number) => {
    const from = keys.indexOf(key);
    const scroller = scrollerOf(listRef.current!);
    const top = scrollTopOf(scroller);
    const rects = keys.map((k) => {
      const r = rows.current.get(k)!.getBoundingClientRect();
      return { top: r.top + top, height: r.height };
    });
    const gap = rects.length > 1 ? rects[1].top - (rects[0].top + rects[0].height) : 0;
    drag.current = { key, from, over: from, mode, rects, gap, scroller, startY, startScroll: top, lastY: startY, samples: [] };
    setLifted(key);
    if (mode === "pointer") {
      holding(true);
      raf.current = requestAnimationFrame(edgeScroll);
    } else {
      setSay(`Picked up ${nameOf(from)}, position ${from + 1} of ${keys.length}. Arrow keys move it, Space puts it down, Escape puts it back.`);
    }
  };

  /* The held row follows the pointer, and the others make room once its middle passes theirs. */
  const follow = (clientY: number) => {
    const d = drag.current;
    if (!d) return;
    d.lastY = clientY;
    const dy = clientY - d.startY + (scrollTopOf(d.scroller) - d.startScroll);
    yOf(d.key).set(dy);
    const t = now();
    d.samples.push([t, dy]);
    while (d.samples.length > 2 && t - d.samples[0][0] > 90) d.samples.shift();
    const mid = d.rects[d.from].top + d.rects[d.from].height / 2 + dy;
    let over = 0;
    d.rects.forEach((r, i) => {
      if (i !== d.from && r.top + r.height / 2 < mid) over++;
    });
    if (over !== d.over) {
      d.over = over;
      makeRoom(d, over);
    }
  };

  /* Near the top or bottom of the scrolling box, scroll it, faster the nearer the edge, and keep the row under the pointer. */
  function edgeScroll() {
    const d = drag.current;
    if (!d || d.mode !== "pointer") return;
    const r = d.scroller ? d.scroller.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
    const up = d.lastY - r.top;
    const down = r.bottom - d.lastY;
    const speed = up < EDGE ? -MAX_SPEED * ((EDGE - up) / EDGE) ** 2 : down < EDGE ? MAX_SPEED * ((EDGE - down) / EDGE) ** 2 : 0;
    if (speed) {
      if (d.scroller) d.scroller.scrollTop += speed;
      else window.scrollBy(0, speed);
      follow(d.lastY);
    }
    raf.current = requestAnimationFrame(edgeScroll);
  }

  const settle = () => {
    cancelAnimationFrame(raf.current);
    holding(false);
  };

  /* Put it down: it springs into its slot at the speed it was moving, then the list takes the new order. */
  const drop = () => {
    const d = drag.current;
    if (!d) return;
    settle();
    busy.current = true;
    const s = shifts(d, d.over);
    const [a, b] = [d.samples[0], d.samples[d.samples.length - 1]];
    const velocity = a && b && b[0] > a[0] ? ((b[1] - a[1]) / (b[0] - a[0])) * 1000 : 0;
    const done = () => {
      const next = [...list];
      const [held] = next.splice(d.from, 1);
      next.splice(d.over, 0, held);
      reset.current = true;
      if (d.mode === "keyboard") refocus.current = d.key;
      drag.current = null;
      busy.current = false;
      setLifted(null);
      setList(next);
      if (d.from !== d.over) onReorder?.(next);
    };
    if (d.mode === "keyboard") setSay(d.from === d.over ? `Put ${nameOf(d.from)} back in position ${d.from + 1}.` : `Moved ${nameOf(d.from)} to position ${d.over + 1} of ${keys.length}.`);
    if (reduce) return done();
    animate(yOf(d.key), s[d.from], { ...SOFT, velocity }).then(done);
  };

  /* Put it back where it was: everything springs home and nothing changes. */
  const cancel = () => {
    const d = drag.current;
    if (!d) return;
    settle();
    keys.forEach((k) => move(yOf(k), 0, SOFT));
    drag.current = null;
    setLifted(null);
    if (d.mode === "keyboard") setSay(`Put ${nameOf(d.from)} back in position ${d.from + 1}.`);
  };

  /* A press becomes a drag once the pointer moves a little, or, for a finger on a row, once it's held still for a moment. */
  const onPointerDown = (e: ReactPointerEvent, key: string, fromGrip: boolean) => {
    if (e.button !== 0 || busy.current || drag.current) return;
    if (handle && !fromGrip) return;
    if (!fromGrip && (e.target as Element).closest(INTERACTIVE)) return;
    const p = { key, x: e.clientX, y: e.clientY, id: e.pointerId, type: e.pointerType, el: e.currentTarget, held: false, timer: undefined as number | undefined };
    pending.current = p;
    if (p.type === "touch" && !fromGrip) {
      p.timer = window.setTimeout(() => {
        if (pending.current !== p) return;
        p.held = true;
        navigator.vibrate?.(8);
        p.el.setPointerCapture?.(p.id);
        begin(key, "pointer", p.y);
      }, HOLD_MS);
    }
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== p.id) return;
      if (!drag.current) {
        const far = Math.hypot(ev.clientX - p.x, ev.clientY - p.y);
        if (p.type === "touch" && !fromGrip) {
          // Moving before the hold is up means a scroll, not a drag.
          if (far > 8 && !p.held) end();
          return;
        }
        if (far < SLOP) return;
        p.el.setPointerCapture?.(p.id);
        begin(key, "pointer", p.y);
      }
      follow(ev.clientY);
    };
    const end = (ev?: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      clearTimeout(p.timer);
      pending.current = null;
      if (!drag.current) return;
      justDragged.current = true;
      setTimeout(() => (justDragged.current = false));
      if (ev?.type === "pointercancel") cancel();
      else drop();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLLIElement>, key: string) => {
    if (e.target !== e.currentTarget) return;
    const d = drag.current;
    const i = keys.indexOf(key);
    if (!d) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!busy.current) begin(key, "keyboard", 0);
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End") {
        e.preventDefault();
        const to = e.key === "Home" ? 0 : e.key === "End" ? keys.length - 1 : Math.max(0, Math.min(keys.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)));
        rows.current.get(keys[to])?.focus();
      }
      return;
    }
    if (d.mode !== "keyboard") return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End") {
      e.preventDefault();
      const over = e.key === "Home" ? 0 : e.key === "End" ? keys.length - 1 : Math.max(0, Math.min(keys.length - 1, d.over + (e.key === "ArrowDown" ? 1 : -1)));
      if (over === d.over) return;
      d.over = over;
      const s = makeRoom(d, over);
      move(yOf(d.key), s[d.from]);
      setSay(`${nameOf(d.from)}, position ${over + 1} of ${keys.length}.`);
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      drop();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    } else if (e.key === "Tab") {
      drop();
    }
  };

  return (
    <>
      <ul ref={listRef} aria-label={label} className={cx("relative grid gap-1 rounded-[18px] bg-[var(--bd-surface)] p-1.5 text-[var(--bd-fg)] shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]", className)}>
        {list.map((item, index) => {
          const key = keys[index];
          const held = lifted === key;
          return (
            <motion.li
              key={key}
              ref={(el: HTMLLIElement | null) => {
                if (el) rows.current.set(key, el);
                else rows.current.delete(key);
              }}
              tabIndex={(focusKey ?? keys[0]) === key ? 0 : -1}
              aria-roledescription="sortable item"
              aria-describedby={hint}
              aria-label={nameOf(index)}
              onFocus={() => setFocusKey(key)}
              onBlur={() => drag.current?.mode === "keyboard" && drag.current.key === key && drop()}
              onKeyDown={(e) => onKeyDown(e, key)}
              onPointerDown={(e) => onPointerDown(e, key, false)}
              onClickCapture={(e) => {
                if (justDragged.current) e.stopPropagation();
              }}
              style={{ y: yOf(key), zIndex: held ? 10 : 0, touchAction: handle ? "auto" : "pan-y" }}
              animate={{ scale: held ? 1.02 : 1 }}
              transition={reduce ? { duration: 0 } : SNAPPY}
              className={cx("group/row relative rounded-[14px] outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--bd-ui-focus)]", !handle && (held ? "cursor-grabbing" : "cursor-grab"))}
            >
              {/* The lifted row's shadow, faded in rather than drawn, so only opacity moves. */}
              <motion.span aria-hidden className="pointer-events-none absolute inset-0 rounded-[14px] shadow-[var(--bd-shadow-float),inset_0_0_0_1px_var(--bd-line)]" initial={false} animate={{ opacity: held ? 1 : 0 }} transition={{ duration: 0.18 }} />
              <div className={cx("relative flex items-center gap-2.5 rounded-[14px] bg-[var(--bd-surface)] py-2.5 pl-1.5 pr-3 transition-colors duration-150", !held && "group-hover/row:bg-[color-mix(in_oklab,var(--bd-surface),var(--bd-fg)_3%)]")}>
                <span
                  aria-hidden
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onPointerDown(e, key, true);
                  }}
                  style={{ touchAction: "none" }}
                  className={cx("grid h-8 w-6 shrink-0 place-items-center rounded-[8px] text-[var(--bd-subtle)] transition-colors duration-150 hover:text-[var(--bd-fg)] active:bg-[var(--bd-ui-track)]", held ? "cursor-grabbing text-[var(--bd-fg)]" : "cursor-grab")}
                >
                  <DotsSixVerticalIcon size={16} weight="bold" />
                </span>
                <div className="min-w-0 flex-1">{renderItem(item, { dragging: held, index })}</div>
              </div>
            </motion.li>
          );
        })}
      </ul>
      <p id={hint} className="sr-only">
        Press Space to pick it up, the arrow keys to move it, Space to put it down, or Escape to put it back.
      </p>
      <p className="sr-only" aria-live="assertive">
        {say}
      </p>
    </>
  );
}
