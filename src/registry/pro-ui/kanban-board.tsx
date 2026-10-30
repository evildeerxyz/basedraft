"use client";

import { CaretDoubleLeftIcon, CaretDoubleRightIcon, PlusIcon } from "@phosphor-icons/react";
import { animate, LayoutGroup, motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

/*
 * A board of columns and cards, for work that moves through stages. Pick a card up and it lifts
 * off the board, tilting a little with the way it's moving; the cards it passes slide apart, the
 * column under it lights, and the board scrolls along at its edges. Let go and it settles into
 * the gap it left. From the keyboard, the arrows move between cards, Space picks one up, the
 * arrows carry it within and across columns, Space puts it down and Escape puts it back, each
 * step said out loud. Columns can be folded to a narrow strip, hold a limit, and take new cards
 * typed in place.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const SNAPPY = { type: "spring", stiffness: 520, damping: 42 } as const;
const SOFT = { type: "spring", stiffness: 300, damping: 30 } as const;
/* How far the pointer moves before a press becomes a drag, and how long a touch is held to pick a card up. */
const SLOP = 4;
const HOLD_MS = 260;
/* How near an edge the pointer has to be before the board scrolls, and how fast it goes at the very edge. */
const EDGE = 56;
const MAX_SPEED = 16;
const INTERACTIVE = "button, a, input, textarea, select, label, [contenteditable], [data-no-drag]";

/* True once it's running in the browser: the server and the first render agree on false, so the portal never trips hydration. */
const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

export type KanbanCard = {
  id: string;
  title: string;
  /** A line or two under the title. */
  note?: string;
  /** Small labels over the title. */
  tags?: string[];
  /** Who it's with, as names: drawn as initials. */
  people?: string[];
  /** A quiet word at the foot: a date, an estimate. */
  meta?: string;
};

export type KanbanColumn<T extends KanbanCard = KanbanCard> = {
  id: string;
  title: string;
  /** How many cards it should hold. Past it, the count turns red; with `enforceLimits`, it takes no more. */
  limit?: number;
  cards: T[];
};

/** What just happened, alongside the new columns. */
export type KanbanMove = { cardId: string; from: string; to: string; index: number };

export type KanbanBoardProps<T extends KanbanCard = KanbanCard> = {
  /** The columns and their cards, when you keep them. */
  columns?: KanbanColumn<T>[];
  /** The columns at first, when the board keeps them. */
  defaultColumns?: KanbanColumn<T>[];
  /** Called with the new columns each time a card is moved or added. */
  onColumnsChange?: (columns: KanbanColumn<T>[], move?: KanbanMove) => void;
  /** What a card shows. Its title, note, tags, people and meta by default. */
  renderCard?: (card: T) => ReactNode;
  /** Shows "Add a card" at each column's foot. Return the new card, or add it yourself when you keep the columns. */
  onAddCard?: (columnId: string, title: string) => T | void;
  /** Lets each column fold to a narrow strip. */
  collapsible?: boolean;
  /** Columns folded at first, by id. */
  defaultCollapsed?: string[];
  /** Turns a card away from a column that's at its limit. */
  enforceLimits?: boolean;
  /** What the board is, for screen readers: "Zuno launch". */
  label: string;
  /** md for a page, sm for a card or a side panel. */
  size?: "md" | "sm";
  className?: string;
  style?: CSSProperties;
};

type Scope = { "data-theme"?: string; className?: string };
/* The light or dark the board sits in, so the card that floats in a portal while it's carried wears the same. */
function scopeOf(el: Element | null): Scope {
  if (!el) return {};
  const byAttr = el.closest("[data-theme]");
  const byClass = el.closest(".dark, .light, .bd-light");
  const near = byAttr && byClass ? (byAttr.contains(byClass) ? byClass : byAttr) : (byAttr ?? byClass);
  if (!near) return {};
  if (near === byAttr) return { "data-theme": near.getAttribute("data-theme") ?? undefined };
  return { className: ["dark", "bd-light", "light"].find((c) => near.classList.contains(c)) };
}

/*
 * A face for someone without a picture, the way Vercel draws them: two colors picked by their name,
 * one dithered into the other through a 4 by 4 ordered matrix, so the same name always gets the
 * same face.
 */
const FACE_BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const FACE_CELLS = 12;
/** The second color's cells, as one path, for each way the gradient can run. */
const FACE_RAMPS = [0, 1, 2, 3].map((dir) => {
  const n = FACE_CELLS - 1;
  let d = "";
  for (let y = 0; y < FACE_CELLS; y++)
    for (let x = 0; x < FACE_CELLS; x++) {
      const t = dir === 0 ? x / n : dir === 1 ? y / n : dir === 2 ? (x + y) / (2 * n) : (x + n - y) / (2 * n);
      if ((FACE_BAYER[(y % 4) * 4 + (x % 4)] + 0.5) / 16 < t * 1.25 - 0.12) d += `M${x} ${y}h1v1h-1z`;
    }
  return d;
});
/** Light and deep, in the muted colors basedraft uses: ocean, pine, moss, ochre, clay, rose, plum, slate. */
const FACE_COLORS: Array<[string, string]> = [
  ["oklch(0.86 0.07 235)", "oklch(0.47 0.13 252)"],
  ["oklch(0.87 0.07 170)", "oklch(0.46 0.09 172)"],
  ["oklch(0.9 0.08 128)", "oklch(0.55 0.12 138)"],
  ["oklch(0.91 0.09 88)", "oklch(0.64 0.14 62)"],
  ["oklch(0.87 0.07 45)", "oklch(0.55 0.14 35)"],
  ["oklch(0.87 0.08 8)", "oklch(0.52 0.16 2)"],
  ["oklch(0.86 0.09 330)", "oklch(0.48 0.15 318)"],
  ["oklch(0.89 0.02 255)", "oklch(0.44 0.04 258)"],
];
const faceSeed = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

/** Someone's dithered face, filling its box; give it colors to draw it in theirs. */
function Face({ name, colors }: { name: string; colors?: [string, string] }) {
  const seed = faceSeed(name);
  const [light, deep] = colors ?? FACE_COLORS[seed % FACE_COLORS.length];
  return (
    <svg viewBox={`0 0 ${FACE_CELLS} ${FACE_CELLS}`} shapeRendering="crispEdges" aria-hidden className="block size-full">
      <rect width={FACE_CELLS} height={FACE_CELLS} style={{ fill: light }} />
      <path d={FACE_RAMPS[(seed >>> 5) % 4]} style={{ fill: deep }} />
    </svg>
  );
}

function Faces({ people }: { people: string[] }) {
  return (
    <span className="flex [&>*+*]:-ml-1.5">
      {people.slice(0, 3).map((p) => (
        <span key={p} title={p} role="img" aria-label={p} className="size-6 overflow-hidden rounded-full ring-2 ring-[var(--bd-surface)]">
          <Face name={p} />
        </span>
      ))}
    </span>
  );
}

/** A card's face by default: its tags, title, note, and who and when at the foot. */
function CardFace({ card }: { card: KanbanCard }) {
  return (
    <>
      {card.tags && card.tags.length > 0 && (
        <span className="mb-2 flex flex-wrap gap-1">
          {card.tags.map((t) => (
            <span key={t} className="rounded-full bg-[var(--bd-ui-track)] px-2 py-0.5 text-[11px] font-medium leading-4 text-[var(--bd-muted)]">
              {t}
            </span>
          ))}
        </span>
      )}
      <span className="block text-[13.5px] font-medium leading-snug text-[var(--bd-fg)]">{card.title}</span>
      {card.note && <span className="mt-1 line-clamp-2 block text-[12.5px] leading-snug text-[var(--bd-muted)]">{card.note}</span>}
      {((card.people?.length ?? 0) > 0 || card.meta) && (
        <span className="mt-3 flex items-center justify-between gap-2">
          {card.people?.length ? <Faces people={card.people} /> : <span />}
          {card.meta && <span className="text-[11.5px] tabular-nums text-[var(--bd-subtle)]">{card.meta}</span>}
        </span>
      )}
    </>
  );
}

type Drag = { id: string; from: string; fromIndex: number; to: string; index: number; w: number; h: number; offX: number; offY: number };
type Lift = { id: string; from: string; fromIndex: number; snapshot: KanbanColumn<KanbanCard>[] };

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `card-${Math.random().toString(36).slice(2)}`);

/** The columns with one card taken out of where it is and put in at `index` of `to`. */
function moved<T extends KanbanCard>(cols: KanbanColumn<T>[], id: string, to: string, index: number): KanbanColumn<T>[] {
  let card: T | undefined;
  const out = cols.map((c) => {
    const at = c.cards.findIndex((k) => k.id === id);
    if (at < 0) return c;
    card = c.cards[at];
    return { ...c, cards: c.cards.filter((k) => k.id !== id) };
  });
  if (!card) return cols;
  return out.map((c) => (c.id === to ? { ...c, cards: [...c.cards.slice(0, index), card!, ...c.cards.slice(index)] } : c));
}

const where = (cols: KanbanColumn<KanbanCard>[], id: string) => {
  for (const c of cols) {
    const i = c.cards.findIndex((k) => k.id === id);
    if (i >= 0) return { col: c.id, index: i };
  }
  return null;
};

export function KanbanBoard<T extends KanbanCard = KanbanCard>({ columns, defaultColumns = [], onColumnsChange, renderCard, onAddCard, collapsible = true, defaultCollapsed = [], enforceLimits = false, label, size = "md", className, style }: KanbanBoardProps<T>) {
  const [inner, setInner] = useState(defaultColumns);
  const cols = columns ?? inner;
  const commit = useCallback(
    (next: KanbanColumn<T>[], move?: KanbanMove) => {
      setInner(next);
      onColumnsChange?.(next, move);
    },
    [onColumnsChange],
  );
  const [folded, setFolded] = useState<string[]>(defaultCollapsed);
  const reduce = useReducedMotion();
  const mounted = useMounted();
  const uid = useId();
  const board = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const lists = useRef(new Map<string, HTMLDivElement>());
  const [said, setSaid] = useState("");

  /* ---------- the pointer ---------- */

  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const [dropping, setDropping] = useState(false);
  const [scope, setScope] = useState<Scope>({});
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const tilt = useSpring(0, { stiffness: 260, damping: 22 });
  const pointer = useRef({ x: 0, y: 0, t: 0 });
  const raf = useRef(0);
  // Where columns run past the board's edge, that edge fades, so the board reads as one that scrolls rather than one cut off.
  const [more, setMore] = useState({ left: false, right: false });
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const read = () => {
      const left = el.scrollLeft > 1;
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      setMore((m) => (m.left === left && m.right === right ? m : { left, right }));
    };
    read();
    el.addEventListener("scroll", read, { passive: true });
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", read);
      ro.disconnect();
    };
  }, [folded, cols.length]);
  const fade = more.left || more.right ? `linear-gradient(to right, ${more.left ? "transparent, black 40px" : "black"}, ${more.right ? "black calc(100% - 40px), transparent" : "black"})` : undefined;

  const full = useCallback((c: KanbanColumn<T>, id: string) => enforceLimits && c.limit !== undefined && c.cards.filter((k) => k.id !== id).length >= c.limit, [enforceLimits]);

  // Where the carried card would land: the column under the pointer, before the first card whose middle is below it.
  const target = useCallback(
    (px: number, py: number, d: Drag) => {
      let best: { col: string; index: number } | null = null;
      for (const c of cols) {
        if (folded.includes(c.id)) continue;
        const el = lists.current.get(c.id);
        if (!el) continue;
        const r = el.parentElement!.getBoundingClientRect();
        if (px < r.left || px > r.right) continue;
        if (c.id !== d.from && full(c, d.id)) return { col: d.to, index: d.index };
        // Layout offsets, not on-screen boxes, so cards still sliding into place don't make the target flicker.
        const others = [...el.querySelectorAll<HTMLElement>("[data-card]")].filter((n) => n.dataset.card !== d.id);
        const ly = py - el.getBoundingClientRect().top + el.scrollTop;
        let index = others.length;
        for (let i = 0; i < others.length; i++) {
          if (ly < others[i].offsetTop + others[i].offsetHeight / 2) {
            index = i;
            break;
          }
        }
        best = { col: c.id, index };
      }
      return best ?? { col: d.to, index: d.index };
    },
    [cols, folded, full],
  );

  const retarget = useCallback(() => {
    const d = dragRef.current;
    if (!d) return;
    const t = target(pointer.current.x, pointer.current.y, d);
    if (t.col !== d.to || t.index !== d.index) {
      dragRef.current = { ...d, to: t.col, index: t.index };
      setDrag(dragRef.current);
    }
  }, [target]);

  // While a card is carried near an edge, the board scrolls sideways and its column up or down: a loop each frame, kept in a ref so it can call itself.
  const loop = useRef(() => {});
  const tick = useCallback(() => {
    const d = dragRef.current;
    if (!d) return;
    const { x: px, y: py } = pointer.current;
    const speed = (into: number) => (into < EDGE ? Math.ceil(((EDGE - into) / EDGE) * MAX_SPEED) : 0);
    let moved = false;
    const s = scroller.current;
    if (s) {
      const r = s.getBoundingClientRect();
      const dx = speed(px - r.left) ? -speed(px - r.left) : speed(r.right - px);
      if (dx && s.scrollWidth > s.clientWidth) {
        s.scrollLeft += dx;
        moved = true;
      }
    }
    const list = lists.current.get(d.to);
    if (list) {
      const r = list.getBoundingClientRect();
      if (px > r.left && px < r.right) {
        const dy = speed(py - r.top) ? -speed(py - r.top) : speed(r.bottom - py);
        if (dy && list.scrollHeight > list.clientHeight) {
          list.scrollTop += dy;
          moved = true;
        }
      }
    }
    if (moved) retarget();
    raf.current = requestAnimationFrame(() => loop.current());
  }, [retarget]);
  useEffect(() => {
    loop.current = tick;
  }, [tick]);

  const press = useRef<{ id: string; col: string; index: number; x: number; y: number; el: HTMLElement; pointerId: number; touch: boolean; timer: number; live: boolean } | null>(null);

  const begin = useCallback(
    (p: NonNullable<typeof press.current>) => {
      const r = p.el.getBoundingClientRect();
      setScope(scopeOf(board.current));
      const d: Drag = { id: p.id, from: p.col, fromIndex: p.index, to: p.col, index: p.index, w: r.width, h: r.height, offX: p.x - r.left, offY: p.y - r.top };
      dragRef.current = d;
      x.set(r.left);
      y.set(r.top);
      tilt.jump(0);
      setDrag(d);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(tick);
      setSaid(`Picked up ${p.el.dataset.title ?? "card"}.`);
    },
    [tick, tilt, x, y],
  );

  const end = useCallback(
    (cancel: boolean) => {
      cancelAnimationFrame(raf.current);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      const d = dragRef.current;
      if (!d) return;
      const finish = () => {
        dragRef.current = null;
        setDrag(null);
        setDropping(false);
        if (cancel || (d.to === d.from && d.index === d.fromIndex)) return;
        const next = moved(cols, d.id, d.to, d.index);
        commit(next, { cardId: d.id, from: d.from, to: d.to, index: d.index });
        const title = cols.flatMap((c) => c.cards).find((k) => k.id === d.id)?.title ?? "Card";
        const col = cols.find((c) => c.id === d.to);
        setSaid(`${title} moved to ${col?.title ?? "column"}, position ${d.index + 1}.`);
      };
      if (cancel) {
        dragRef.current = { ...d, to: d.from, index: d.fromIndex };
        setDrag(dragRef.current);
      }
      // The card settles into the gap it left, at the speed it was moving.
      requestAnimationFrame(() => {
        const slot = document.querySelector<HTMLElement>(`[data-board="${uid}"] [data-card="${CSS.escape(d.id)}"]`);
        if (!slot || reduce) return finish();
        const r = slot.getBoundingClientRect();
        setDropping(true);
        tilt.set(0);
        Promise.all([animate(x, r.left, { ...SOFT, velocity: x.getVelocity() }), animate(y, r.top, { ...SOFT, velocity: y.getVelocity() })]).then(finish);
      });
    },
    [cols, commit, reduce, tilt, uid, x, y],
  );

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const p = press.current;
      if (!p || e.pointerId !== p.pointerId) return;
      if (!p.live) {
        const far = Math.hypot(e.clientX - p.x, e.clientY - p.y) > SLOP;
        if (p.touch) {
          // A swipe before the hold is a scroll, not a drag.
          if (far) {
            clearTimeout(p.timer);
            press.current = null;
          }
          return;
        }
        if (!far) return;
        p.live = true;
        begin(p);
      }
      const d = dragRef.current;
      if (!d) return;
      const now = e.timeStamp;
      const dt = Math.max(1, now - pointer.current.t);
      const vx = (e.clientX - pointer.current.x) / dt;
      pointer.current = { x: e.clientX, y: e.clientY, t: now };
      x.set(e.clientX - d.offX);
      y.set(e.clientY - d.offY);
      if (!reduce) tilt.set(Math.max(-7, Math.min(7, 2 + vx * 5)));
      retarget();
    };
    const up = (e: PointerEvent) => {
      const p = press.current;
      if (!p || e.pointerId !== p.pointerId) return;
      clearTimeout(p.timer);
      press.current = null;
      if (p.live) end(e.type === "pointercancel");
    };
    // A carried card keeps a touch screen from scrolling under it.
    const hold = (e: TouchEvent) => {
      if (dragRef.current) e.preventDefault();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("touchmove", hold, { passive: false });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("touchmove", hold);
    };
  }, [begin, end, reduce, retarget, tilt, x, y]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>, card: T, col: string, index: number) => {
    if (e.button !== 0 || dropping || lift || (e.target as HTMLElement).closest(INTERACTIVE)) return;
    const touch = e.pointerType === "touch";
    const p = { id: card.id, col, index, x: e.clientX, y: e.clientY, el: e.currentTarget, pointerId: e.pointerId, touch, timer: 0, live: false };
    pointer.current = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    if (touch) {
      p.timer = window.setTimeout(() => {
        if (press.current !== p) return;
        p.live = true;
        begin(p);
        navigator.vibrate?.(8);
      }, HOLD_MS);
    }
    press.current = p;
  };

  /* ---------- the keyboard ---------- */

  const [focusId, setFocusId] = useState<string | null>(null);
  const [lift, setLift] = useState<Lift | null>(null);
  const refocus = useRef<string | null>(null);

  useLayoutEffect(() => {
    const id = refocus.current;
    if (!id) return;
    refocus.current = null;
    const el = board.current?.querySelector<HTMLElement>(`[data-card="${CSS.escape(id)}"]`);
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  });

  const open = cols.filter((c) => !folded.includes(c.id));
  const moveFocus = (id: string) => {
    setFocusId(id);
    refocus.current = id;
  };

  const onKey = (e: ReactKeyboardEvent<HTMLElement>, card: T) => {
    const at = where(cols as KanbanColumn<KanbanCard>[], card.id);
    if (!at) return;
    const ci = open.findIndex((c) => c.id === at.col);
    const col = open[ci];
    const title = card.title;
    const lifted = lift?.id === card.id;
    const k = e.key;
    if (k === " " || k === "Enter") {
      e.preventDefault();
      if (!lifted) {
        setLift({ id: card.id, from: at.col, fromIndex: at.index, snapshot: cols as KanbanColumn<KanbanCard>[] });
        setSaid(`Picked up ${title}, in ${col?.title}, position ${at.index + 1} of ${col?.cards.length}. Arrows move it, Space puts it down, Escape puts it back.`);
      } else {
        setLift(null);
        if (at.col !== lift.from || at.index !== lift.fromIndex) onColumnsChange?.(cols, { cardId: card.id, from: lift.from, to: at.col, index: at.index });
        setSaid(`${title} put down in ${col?.title}, position ${at.index + 1}.`);
      }
      return;
    }
    if (k === "Escape" && lifted) {
      e.preventDefault();
      commit(lift.snapshot as KanbanColumn<T>[]);
      setLift(null);
      refocus.current = card.id;
      setSaid(`${title} put back where it was.`);
      return;
    }
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"].includes(k)) return;
    e.preventDefault();
    if (lifted) {
      let to = col;
      let index = at.index;
      if (k === "ArrowUp") index = Math.max(0, at.index - 1);
      else if (k === "ArrowDown") index = Math.min(col.cards.length - 1, at.index + 1);
      else if (k === "Home") index = 0;
      else if (k === "End") index = col.cards.length - 1;
      else {
        // The next open column that can take it, that way.
        const step = k === "ArrowLeft" ? -1 : 1;
        let i = ci + step;
        while (open[i] && full(open[i], card.id)) i += step;
        if (!open[i]) return setSaid(`${title} can't go further ${k === "ArrowLeft" ? "left" : "right"}.`);
        to = open[i];
        index = Math.min(at.index, to.cards.length);
      }
      if (to.id === at.col && index === at.index) return;
      const next = moved(cols, card.id, to.id, index);
      setInner(next);
      if (columns) onColumnsChange?.(next);
      refocus.current = card.id;
      const count = next.find((c) => c.id === to.id)!.cards.length;
      setSaid(`${to.title}, position ${index + 1} of ${count}.`);
      return;
    }
    // Moving focus: up and down in the column, left and right to the nearest card across.
    if (k === "ArrowUp" && at.index > 0) moveFocus(col.cards[at.index - 1].id);
    else if (k === "ArrowDown" && at.index < col.cards.length - 1) moveFocus(col.cards[at.index + 1].id);
    else if (k === "Home") moveFocus(col.cards[0].id);
    else if (k === "End") moveFocus(col.cards.at(-1)!.id);
    else if (k === "ArrowLeft" || k === "ArrowRight") {
      const step = k === "ArrowLeft" ? -1 : 1;
      for (let i = ci + step; open[i]; i += step) {
        if (open[i].cards.length) return moveFocus(open[i].cards[Math.min(at.index, open[i].cards.length - 1)].id);
      }
    }
  };

  // Only one card is in the tab order; the arrows reach the rest.
  const tabbable = focusId && where(cols as KanbanColumn<KanbanCard>[], focusId) ? focusId : (open.find((c) => c.cards.length)?.cards[0]?.id ?? null);

  /* ---------- adding ---------- */

  const [adding, setAdding] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const add = (colId: string) => {
    const t = draft.trim();
    if (!t) return setAdding(null);
    const made = onAddCard?.(colId, t);
    if (made || !columns) {
      const card = (made ?? { id: newId(), title: t }) as T;
      commit(
        cols.map((c) => (c.id === colId ? { ...c, cards: [...c.cards, card] } : c)),
        { cardId: card.id, from: colId, to: colId, index: cols.find((c) => c.id === colId)!.cards.length },
      );
    }
    setDraft("");
    setSaid(`Added ${t}.`);
  };

  const dragged = drag ? cols.flatMap((c) => c.cards).find((k) => k.id === drag.id) : undefined;
  // What's drawn: while a card is carried, it already sits where it would land, as an empty slot the others make room for.
  const view = drag ? moved(cols, drag.id, drag.to, drag.index) : cols;
  // Open columns share the width they're given, down to a floor; under that, the board scrolls sideways.
  const W = size === "sm" ? "min-w-[200px] flex-[1_0_0%]" : "min-w-[280px] flex-[1_0_0%]";

  return (
    <div data-board={uid} ref={board} role="region" aria-label={label} className={cx("relative flex min-h-0 flex-col rounded-[22px] bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.07),var(--bd-shadow-resting)]", className)} style={style}>
      <p id={`${uid}-how`} className="sr-only">
        Press Space to pick a card up, the arrow keys to move it, Space to put it down and Escape to put it back.
      </p>
      <p aria-live="assertive" className="sr-only">
        {said}
      </p>
      <LayoutGroup id={uid}>
        <div ref={scroller} className="no-scrollbar flex min-h-0 flex-1 overflow-x-auto overscroll-x-contain" style={{ maskImage: fade, WebkitMaskImage: fade }}>
          {view.map((col, ci) => {
            const isFolded = folded.includes(col.id);
            const over = drag?.to === col.id && (drag.to !== drag.from || drag.index !== drag.fromIndex);
            const shown = col.cards;
            const count = shown.length;
            const overLimit = col.limit !== undefined && count > col.limit;
            const atLimit = col.limit !== undefined && count >= col.limit;
            const turnedAway = !!drag && drag.from !== col.id && full(col, drag.id);
            return (
              <Fragment key={col.id}>
                {ci > 0 && <span aria-hidden className="my-3 w-px shrink-0 bg-[var(--bd-line-subtle)]" />}
                <motion.section layout="position" transition={reduce ? { duration: 0 } : SNAPPY} aria-labelledby={`${uid}-${col.id}`} className={cx("relative flex min-h-0 flex-col", isFolded ? "w-12 shrink-0" : W)}>
                  {isFolded ? (
                    <button type="button" onClick={() => setFolded((f) => f.filter((x) => x !== col.id))} aria-expanded={false} aria-label={`Open ${col.title}, ${count} cards`} className="group/fold flex h-full min-h-40 flex-col items-center gap-3 rounded-[16px] px-2 pb-3 text-[var(--bd-muted)] outline-none transition-colors hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[color:var(--bd-ui-focus)]">
                      {/* The same row as an open column's head, so the arrow lines up with the arrows and counts beside it. */}
                      <span className="flex h-12 shrink-0 items-center pt-1">
                        <span className="grid size-7 place-items-center rounded-full transition-colors group-hover/fold:bg-[rgb(var(--bd-ink)/0.06)]">
                          <CaretDoubleRightIcon weight="regular" className="size-3.5" />
                        </span>
                      </span>
                      <span id={`${uid}-${col.id}`} className="text-[12.5px] font-medium [writing-mode:vertical-rl]">
                        {col.title}
                      </span>
                      <span className="rounded-full bg-[var(--bd-ui-track)] px-1.5 py-0.5 text-[10.5px] tabular-nums">{count}</span>
                    </button>
                  ) : (
                    <>
                      <header className="flex h-12 shrink-0 items-center gap-2 px-4 pt-1">
                        <h3 id={`${uid}-${col.id}`} className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                          {col.title}
                        </h3>
                        <span className={cx("rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums transition-colors", overLimit ? "bg-[color-mix(in_oklab,var(--bd-ui-stop)_14%,transparent)] text-[var(--bd-ui-stop)]" : "bg-[var(--bd-ui-track)] text-[var(--bd-muted)]")} aria-label={col.limit !== undefined ? `${count} of ${col.limit}` : `${count} cards`}>
                          {count}
                          {col.limit !== undefined && <span className="opacity-60">/{col.limit}</span>}
                        </span>
                        {collapsible && (
                          <button type="button" onClick={() => setFolded((f) => [...f, col.id])} aria-label={`Fold ${col.title}`} className="-mr-1.5 grid size-7 place-items-center rounded-full text-[var(--bd-subtle)] outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]">
                            <CaretDoubleLeftIcon weight="regular" className="size-3.5" />
                          </button>
                        )}
                      </header>
                      {/* The column lights while a card is carried over it, and says so when it's full. */}
                      <span aria-hidden className={cx("pointer-events-none absolute inset-x-1.5 bottom-1.5 top-12 rounded-[16px] transition-opacity duration-200", turnedAway ? "bg-[color-mix(in_oklab,var(--bd-ui-stop)_7%,transparent)] opacity-100" : "bg-[rgb(var(--bd-ink)/0.04)]", over ? "opacity-100" : turnedAway ? "" : "opacity-0")} />
                      <div
                        ref={(el) => {
                          if (el) lists.current.set(col.id, el);
                          else lists.current.delete(col.id);
                        }}
                        role="list"
                        aria-label={`${col.title}, ${count} cards`}
                        className="no-scrollbar relative flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain px-3 pb-3 pt-1"
                      >
                        {shown.map((card, i) => {
                          const carried = drag?.id === card.id;
                          const lifted = lift?.id === card.id;
                          return (
                            <motion.div
                              key={card.id}
                              layoutId={`${uid}-${card.id}`}
                              layout="position"
                              transition={reduce ? { duration: 0 } : SNAPPY}
                              role="listitem"
                              aria-roledescription="card"
                              aria-describedby={`${uid}-how`}
                              data-card={card.id}
                              data-title={card.title}
                              tabIndex={card.id === tabbable ? 0 : -1}
                              onFocus={() => setFocusId(card.id)}
                              onKeyDown={(e) => onKey(e, card)}
                              onPointerDown={(e) => onPointerDown(e, card, col.id, i)}
                              onContextMenu={(e) => press.current?.touch && e.preventDefault()}
                              style={{ touchAction: "manipulation" }}
                              className={cx(
                                "relative shrink-0 cursor-grab select-none rounded-[14px] p-3 text-left outline-none transition-[box-shadow,opacity] duration-200",
                                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]",
                                carried ? "bg-[rgb(var(--bd-ink)/0.035)] shadow-[inset_0_0_0_1.5px_rgb(var(--bd-ink)/0.1)] [&>*]:invisible" : "[background:var(--bd-ui-raised)] shadow-[var(--bd-ui-lift),0_0_0_1px_rgb(var(--bd-ink)/0.06)] hover:shadow-[var(--bd-ui-lift),0_0_0_1px_rgb(var(--bd-ink)/0.12)]",
                                lifted && "z-10 shadow-[0_18px_36px_-14px_rgb(var(--bd-shade)/0.4),0_0_0_1.5px_rgb(var(--bd-ink)/0.35)]",
                              )}
                              animate={lifted && !reduce ? { scale: 1.02, rotate: -1 } : { scale: 1, rotate: 0 }}
                            >
                              {renderCard ? renderCard(card) : <CardFace card={card} />}
                            </motion.div>
                          );
                        })}
                        {count === 0 && !drag && <p className="grid flex-1 place-items-center rounded-[14px] py-6 text-center text-[12.5px] text-[var(--bd-subtle)] shadow-[inset_0_0_0_1.5px_rgb(var(--bd-ink)/0.07)]">Nothing here yet</p>}
                      </div>
                      {turnedAway && <p className="absolute inset-x-0 bottom-4 text-center text-[11.5px] font-medium text-[var(--bd-ui-stop)]">At its limit</p>}
                      {onAddCard ? (
                        <div className="shrink-0 px-3 pb-3">
                          {adding === col.id ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                add(col.id);
                              }}
                            >
                              <input
                                autoFocus
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") {
                                    setDraft("");
                                    setAdding(null);
                                  }
                                }}
                                onBlur={() => !draft.trim() && setAdding(null)}
                                placeholder="Card title, then Enter"
                                aria-label={`New card in ${col.title}`}
                                className="h-10 w-full rounded-[12px] bg-[var(--bd-ui-field)] px-3 text-[13px] text-[var(--bd-fg)] shadow-[var(--bd-ui-well)] outline-none placeholder:text-[var(--bd-subtle)] focus:shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.4),0_0_0_4px_rgb(var(--bd-ink)/0.06)]"
                              />
                            </form>
                          ) : (
                            <button type="button" disabled={atLimit && enforceLimits} onClick={() => setAdding(col.id)} className="flex h-9 w-full items-center gap-2 rounded-[12px] px-2.5 text-[13px] text-[var(--bd-muted)] outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.05)] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)] disabled:opacity-40">
                              <PlusIcon weight="regular" className="size-3.5" /> Add a card
                            </button>
                          )}
                        </div>
                      ) : null}
                    </>
                  )}
                </motion.section>
              </Fragment>
            );
          })}
        </div>
      </LayoutGroup>
      {/* The card in hand, floating over the page in a portal, tilting with the way it moves. */}
      {mounted &&
        drag &&
        dragged &&
        createPortal(
          <div {...scope} style={{ display: "contents" }}>
            <motion.div
              aria-hidden
              initial={reduce ? false : { scale: 1, boxShadow: "0 1px 2px rgb(0 0 0 / 0.08)" }}
              animate={dropping ? { scale: 1, boxShadow: "0 1px 2px rgb(0 0 0 / 0.08)" } : { scale: reduce ? 1 : 1.04, boxShadow: "0 28px 50px -18px rgb(0 0 0 / 0.42), 0 8px 18px -10px rgb(0 0 0 / 0.22)" }}
              transition={SOFT}
              style={{ position: "fixed", left: 0, top: 0, x, y, rotate: tilt, width: drag.w, zIndex: 100, pointerEvents: "none" }}
              className="rounded-[14px] p-3 text-left text-[var(--bd-fg)] [background:var(--bd-ui-raised)] ring-1 ring-[rgb(var(--bd-ink)/0.08)]"
            >
              {renderCard ? renderCard(dragged) : <CardFace card={dragged} />}
            </motion.div>
          </div>,
          document.body,
        )}
    </div>
  );
}
