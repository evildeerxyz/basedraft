"use client";

import { AtIcon, BellIcon, CheckIcon, ChecksIcon, EnvelopeSimpleIcon, TrayIcon } from "@phosphor-icons/react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

/*
 * Notifications behind a bell. The bell carries a count of what's unread that rolls, digit by
 * digit, when it changes, and rings when something new arrives. It opens a card with three tabs
 * (everything, what's unread, where you were mentioned) and a thumb that slides between them. The
 * list is grouped by day, each one with a face or an icon. Opening one marks it read; so does
 * swiping it aside, or swiping it back to keep it for later. Mark all read empties the Unread tab
 * row by row, and each tab says something kind when it's empty.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const SNAPPY = { type: "spring", stiffness: 520, damping: 42 } as const;
const SOFT = { type: "spring", stiffness: 300, damping: 30 } as const;
/* How far a row slides before letting go of it marks it. */
const SWIPE = 84;

/* True once it's running in the browser: the server and the first render agree on false, so the portal never trips hydration. */
const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

type Scope = { "data-theme"?: string; className?: string };
/* The light or dark the bell sits in, so the card in its portal matches it. */
function scopeOf(el: Element | null): Scope {
  if (!el) return {};
  const byAttr = el.closest("[data-theme]");
  const byClass = el.closest(".dark, .light, .bd-light");
  const near = byAttr && byClass ? (byAttr.contains(byClass) ? byClass : byAttr) : (byAttr ?? byClass);
  if (!near) return {};
  if (near === byAttr) return { "data-theme": near.getAttribute("data-theme") ?? undefined };
  return { className: ["dark", "bd-light", "light"].find((c) => near.classList.contains(c)) };
}

type Side = "top" | "bottom";
type Align = "start" | "center" | "end";
function place(t: DOMRect, w: number, h: number, side: Side, align: Align, gap: number) {
  const pad = 8;
  let s = side;
  if (s === "bottom" && t.bottom + gap + h > innerHeight - pad && t.top - gap - h > pad) s = "top";
  else if (s === "top" && t.top - gap - h < pad && t.bottom + gap + h < innerHeight - pad) s = "bottom";
  const top = s === "bottom" ? t.bottom + gap : t.top - gap - h;
  const want = align === "start" ? t.left : align === "end" ? t.right - w : t.left + t.width / 2 - w / 2;
  return { top, left: Math.min(Math.max(pad, want), innerWidth - pad - w), side: s };
}

/* ---------- the items ---------- */

export type InboxAction = {
  label: string;
  /** The one that matters, drawn in ink. */
  primary?: boolean;
  /** Runs when it's pressed, and marks the item read. Return changes to make to the item: { actions: undefined, note: "You joined" }. */
  onClick?: (item: InboxItem) => Partial<InboxItem> | void;
};

export type InboxItem = {
  id: string;
  /** Who did it, as their face and in bold before the text: "Olivia Bennett". */
  actor?: string;
  /** Their picture. Initials on a tint from their name without one. */
  avatar?: string;
  /** An icon: alone, for what the product sends itself, or as a small badge on the actor's face. */
  icon?: ReactNode;
  /** What happened, after the actor's name: "bought Zuno". */
  text: string;
  /** A line under it: what they wrote, an amount, a file. */
  note?: string;
  /** The heading it's grouped under: "Today". inboxWhen() makes these from a date. */
  day: string;
  /** When, short: "2m", "9:41 AM". */
  time: string;
  read?: boolean;
  /** Whether it mentions you, for the Mentions tab. */
  mention?: boolean;
  /** Buttons under the text: Accept, Decline. */
  actions?: InboxAction[];
};

export type InboxTab = "all" | "unread" | "mentions";

/**
 * The day heading and the time for a date, the way Inbox shows them: "Today" and "12m",
 * "Yesterday" and "4:12 PM". Call it in the browser, not on the server, so the two agree.
 */
export function inboxWhen(date: Date, now = new Date()) {
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((start(now) - start(date)) / 864e5);
  const mins = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 6e4));
  const day = days === 0 ? "Today" : days === 1 ? "Yesterday" : date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const time = days === 0 && mins < 1 ? "Now" : days === 0 && mins < 60 ? `${mins}m` : days === 0 ? `${Math.floor(mins / 60)}h` : date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return { day, time };
}

/* Controlled when items is given, keeping its own list otherwise; either way onItemsChange hears every change. */
function useItems(items: InboxItem[] | undefined, defaultItems: InboxItem[] | undefined, onItemsChange: ((items: InboxItem[]) => void) | undefined) {
  const [own, setOwn] = useState<InboxItem[]>(defaultItems ?? []);
  const list = items ?? own;
  const set = (next: InboxItem[]) => {
    if (!items) setOwn(next);
    onItemsChange?.(next);
  };
  return [list, set] as const;
}

/* ---------- the count ---------- */

const ROLL = {
  enter: (up: boolean) => ({ y: up ? "75%" : "-75%", opacity: 0 }),
  still: { y: "0%", opacity: 1 },
  leave: (up: boolean) => ({ y: up ? "-75%" : "75%", opacity: 0 }),
};

/** A number that rolls to its new value, each digit turning on its own wheel, up as it grows and down as it shrinks. */
function Rolling({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const [seen, setSeen] = useState(value);
  const [up, setUp] = useState(true);
  if (seen !== value) {
    setUp(value > seen);
    setSeen(value);
  }
  const chars = [...(value > 99 ? "99+" : String(value))];
  return (
    <span className="inline-flex tabular-nums">
      {chars.map((ch, i) => (
        // Keyed by place from the right, so the ones digit keeps its wheel as the number grows.
        <span key={chars.length - i} className="relative inline-grid overflow-hidden">
          <AnimatePresence initial={false} mode="popLayout" custom={up}>
            <motion.span key={ch} custom={up} variants={ROLL} initial={reduce ? { opacity: 0 } : "enter"} animate="still" exit={reduce ? { opacity: 0 } : "leave"} transition={SNAPPY} className="[grid-area:1/1]">
              {ch}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}

/* ---------- a row ---------- */

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
function DitherFace({ name, colors }: { name: string; colors?: [string, string] }) {
  const seed = faceSeed(name);
  const [light, deep] = colors ?? FACE_COLORS[seed % FACE_COLORS.length];
  return (
    <svg viewBox={`0 0 ${FACE_CELLS} ${FACE_CELLS}`} shapeRendering="crispEdges" aria-hidden className="block size-full">
      <rect width={FACE_CELLS} height={FACE_CELLS} style={{ fill: light }} />
      <path d={FACE_RAMPS[(seed >>> 5) % 4]} style={{ fill: deep }} />
    </svg>
  );
}

function Face({ item }: { item: InboxItem }) {
  const badge = item.mention ? <AtIcon weight="bold" /> : item.icon;
  if (!item.actor)
    return (
      <span aria-hidden className="grid size-9 place-items-center rounded-full bg-[var(--bd-ui-track)] text-[var(--bd-fg)] [&_svg]:size-4">
        {item.icon ?? <BellIcon weight="duotone" />}
      </span>
    );
  return (
    <span aria-hidden className="relative size-9">
      <span className="grid size-full place-items-center overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {item.avatar ? <img src={item.avatar} alt="" className="size-full object-cover" /> : <DitherFace name={item.actor} />}
      </span>
      {badge && <span className="absolute -bottom-1 -right-1 grid size-[18px] place-items-center rounded-full bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.1)] [&_svg]:size-2.5">{badge}</span>}
    </span>
  );
}

type RowProps = {
  item: InboxItem;
  tabbable: boolean;
  /** Whether marking it makes it leave this tab, so a swipe carries it off instead of springing back. */
  leaves: boolean;
  describedBy: string;
  onOpen: () => void;
  onToggle: () => void;
  onAction: (a: InboxAction) => void;
  onKey: (e: ReactKeyboardEvent<HTMLDivElement>) => void;
  onFocus: () => void;
};

/**
 * One notification, on a layer that slides. Swiped past the mark it flips read and unread; short
 * of it, it springs home with the speed it was let go at. Vertical drags stay the page's.
 */
function Row({ item, tabbable, leaves, describedBy, onOpen, onToggle, onAction, onKey, onFocus }: RowProps) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const press = useRef<{ id: number; x: number; y: number; on: boolean } | null>(null);
  const swiped = useRef(false);
  const [swiping, setSwiping] = useState(false);
  const fromLeft = useTransform(x, [12, SWIPE], [0, 1]);
  const fromRight = useTransform(x, [-SWIPE, -12], [1, 0]);
  const textId = useId();
  const verb = item.read ? "Mark unread" : "Mark read";
  const VerbIcon = item.read ? EnvelopeSimpleIcon : CheckIcon;

  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as Element).closest("button, a, input")) return;
    press.current = { id: e.pointerId, x: e.clientX, y: e.clientY, on: false };
  };
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (!p || p.id !== e.pointerId) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (!p.on) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        p.on = true;
        p.x = e.clientX - Math.sign(dx) * 8;
        e.currentTarget.setPointerCapture(e.pointerId);
        setSwiping(true);
      } else if (Math.abs(dy) > 8) press.current = null;
      return;
    }
    const d = e.clientX - p.x;
    // Past the mark it pulls harder, so you feel where it acts.
    const past = Math.abs(d) - SWIPE;
    x.set(past > 0 ? Math.sign(d) * (SWIPE + past * 0.35) : d);
  };
  const up = (e: ReactPointerEvent<HTMLDivElement>) => {
    const p = press.current;
    press.current = null;
    if (!p?.on) return;
    swiped.current = true;
    setSwiping(false);
    const v = x.getVelocity();
    const at = x.get();
    const go = Math.abs(at) > SWIPE || (Math.abs(v) > 700 && Math.abs(at) > 28 && Math.sign(v) === Math.sign(at));
    if (go) onToggle();
    if (go && leaves && !reduce) animate(x, Math.sign(at) * (e.currentTarget.offsetWidth + 24), { type: "spring", stiffness: 380, damping: 40, velocity: v });
    else animate(x, 0, { ...SNAPPY, velocity: v });
  };
  const cancel = () => {
    press.current = null;
    setSwiping(false);
    animate(x, 0, SNAPPY);
  };

  return (
    <div className="relative overflow-hidden">
      {/* What a swipe will do, waiting under the row on both sides. */}
      <div aria-hidden className="absolute inset-0 flex items-center justify-between bg-[var(--bd-ui-track)] px-5 text-[12.5px] font-medium text-[var(--bd-fg)]">
        <motion.span style={{ opacity: fromLeft }} className="flex items-center gap-1.5">
          <VerbIcon weight={item.read ? "duotone" : "bold"} className="size-4" /> {verb}
        </motion.span>
        <motion.span style={{ opacity: fromRight }} className="flex items-center gap-1.5">
          {verb} <VerbIcon weight={item.read ? "duotone" : "bold"} className="size-4" />
        </motion.span>
      </div>
      <motion.div
        data-row={item.id}
        role="article"
        aria-labelledby={textId}
        aria-describedby={describedBy}
        aria-keyshortcuts="Enter R"
        tabIndex={tabbable ? 0 : -1}
        onFocus={(e) => e.target === e.currentTarget && onFocus()}
        onKeyDown={onKey}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={cancel}
        onClick={() => {
          if (swiped.current) return void (swiped.current = false);
          onOpen();
        }}
        style={{ x, touchAction: "pan-y" }}
        className={cx(
          "relative grid cursor-pointer grid-cols-[36px_minmax(0,1fr)_auto] gap-3 bg-[var(--bd-surface)] px-4 py-3 outline-none transition-colors duration-150",
          "hover:bg-[color-mix(in_oklab,var(--bd-ui-track)_38%,var(--bd-surface))] focus-visible:bg-[color-mix(in_oklab,var(--bd-ui-track)_38%,var(--bd-surface))] focus-visible:shadow-[inset_2px_0_0_var(--bd-ui-ink-solid)]",
          swiping && "select-none",
        )}
      >
        <Face item={item} />
        <div className="min-w-0">
          <p id={textId} className={cx("text-[13.5px] leading-[1.45] transition-colors duration-200", item.read ? "text-[var(--bd-muted)]" : "text-[var(--bd-fg)]")}>
            {!item.read && <span className="sr-only">Unread. </span>}
            {item.actor && <strong className="font-semibold text-[var(--bd-fg)]">{item.actor} </strong>}
            {item.text}
          </p>
          {item.note && <p className={cx("mt-1 line-clamp-2 text-[12.5px] leading-[1.5] text-[var(--bd-muted)]", item.mention && "border-l-2 border-[var(--bd-line)] pl-2")}>{item.note}</p>}
          {item.actions && item.actions.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {item.actions.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  tabIndex={tabbable ? 0 : -1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction(a);
                  }}
                  className={cx(
                    "h-7 rounded-full px-3 text-[12px] font-medium outline-none transition-[scale,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)] active:scale-[0.96]",
                    a.primary ? "text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(var(--bd-shade)/0.25)]" : "text-[var(--bd-fg)] [background:var(--bd-ui-raised)] shadow-[var(--bd-ui-lift),0_0_0_1px_rgb(var(--bd-ink)/0.08)]",
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 pt-0.5">
          <span className="text-[11.5px] tabular-nums text-[var(--bd-subtle)]">{item.time}</span>
          <span aria-hidden className={cx("size-2 rounded-full bg-[var(--bd-ui-ink-solid)] transition-[opacity,scale] duration-300 ease-[var(--bd-ease)]", item.read && "scale-50 opacity-0")} />
        </div>
      </motion.div>
    </div>
  );
}

/* ---------- the card ---------- */

const TABS: Array<{ id: InboxTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "mentions", label: "Mentions" },
];

const EMPTY: Record<InboxTab, { title: string; note?: string; icon: typeof TrayIcon }> = {
  all: { title: "Nothing here yet", note: "Purchases, invites and updates will show up here.", icon: TrayIcon },
  unread: { title: "You're all caught up", note: "Anything new will show up here.", icon: ChecksIcon },
  mentions: { title: "No mentions", note: "When someone mentions you in a comment, it shows up here.", icon: AtIcon },
};

const SLIDE = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 16 }),
  still: { opacity: 1, x: 0 },
  leave: (dir: number) => ({ opacity: 0, x: dir * -16 }),
};

export type InboxPanelProps = {
  items?: InboxItem[];
  defaultItems?: InboxItem[];
  /** Hears every change: a row marked, all marked, an action's changes. */
  onItemsChange?: (items: InboxItem[]) => void;
  /** Called when a row is opened, by a click or Enter. It's marked read either way. */
  onOpenItem?: (item: InboxItem) => void;
  defaultTab?: InboxTab;
  /** The heading. "Notifications" by default. */
  title?: string;
  /** What each tab says when it has nothing to show. */
  empty?: Partial<Record<InboxTab, { title: string; note?: string }>>;
  /** Something under the list: a link to settings, or to every notification. */
  footer?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/** The card itself, for a page or a sheet of its own. Inbox puts it behind a bell. */
export function InboxPanel(props: InboxPanelProps & { elevated?: boolean }) {
  const { onOpenItem, defaultTab = "all", title = "Notifications", empty, footer, elevated, className, style } = props;
  const [items, setItems] = useItems(props.items, props.defaultItems, props.onItemsChange);
  const [tab, setTab] = useState<InboxTab>(defaultTab);
  const [dir, setDir] = useState(1);
  const [active, setActive] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  const reduce = useReducedMotion();
  const uid = useId();
  const card = useRef<HTMLDivElement>(null);

  const unread = items.filter((i) => !i.read).length;
  const counts: Record<InboxTab, number> = { all: 0, unread, mentions: items.filter((i) => i.mention && !i.read).length };
  const shown = tab === "unread" ? items.filter((i) => !i.read) : tab === "mentions" ? items.filter((i) => i.mention) : items;
  // Rows glide only when the list itself changes (one leaves, arrives, is read, loses its buttons), never because something around them re-rendered.
  const layoutKey = `${tab}:${shown.map((i) => `${i.id}${i.read ? 1 : 0}${i.actions?.length ?? 0}`).join()}`;
  const ids = shown.map((i) => i.id);
  const tabbable = active && ids.includes(active) ? active : ids[0];
  const groups: Array<{ day: string; items: InboxItem[] }> = [];
  for (const i of shown) {
    const g = groups.find((x) => x.day === i.day);
    if (g) g.items.push(i);
    else groups.push({ day: i.day, items: [i] });
  }

  const choose = (t: InboxTab) => {
    if (t === tab) return;
    setDir(TABS.findIndex((x) => x.id === t) > TABS.findIndex((x) => x.id === tab) ? 1 : -1);
    setTab(t);
    setActive(null);
  };
  const patch = (id: string, change: Partial<InboxItem>) => setItems(items.map((i) => (i.id === id ? { ...i, ...change } : i)));
  const rowEl = (id: string | undefined) => (id ? card.current?.querySelector<HTMLElement>(`[data-row="${CSS.escape(id)}"]`) : null);
  const tabEl = (t: InboxTab) => document.getElementById(`${uid}-tab-${t}`);

  /* After a row leaves this tab, the one below it (or above) takes focus, so the keyboard isn't dropped. */
  const handOff = (id: string) => {
    const i = ids.indexOf(id);
    const next = ids[i + 1] ?? ids[i - 1];
    if (next) {
      setActive(next);
      rowEl(next)?.focus();
    } else tabEl(tab)?.focus();
  };

  const toggle = (item: InboxItem, fromKeys = false) => {
    const read = !item.read;
    if (fromKeys && read && tab === "unread") handOff(item.id);
    patch(item.id, { read });
    setSaid(read ? "Marked read." : "Marked unread.");
  };
  const open = (item: InboxItem) => {
    if (!item.read) patch(item.id, { read: true });
    onOpenItem?.(item);
  };
  const act = (item: InboxItem, a: InboxAction) => {
    const change = a.onClick?.(item);
    patch(item.id, { read: true, ...(change ?? {}) });
  };
  const markAll = () => {
    if (!unread) return;
    setItems(items.map((i) => (i.read ? i : { ...i, read: true })));
    setSaid(`Marked ${unread} read.`);
    if (tab === "unread") tabEl(tab)?.focus();
  };

  const onRowKey = (e: ReactKeyboardEvent<HTMLDivElement>, item: InboxItem) => {
    if (e.target !== e.currentTarget) return;
    const i = ids.indexOf(item.id);
    const go = (id: string | undefined) => {
      if (!id) return;
      e.preventDefault();
      setActive(id);
      rowEl(id)?.focus();
    };
    if (e.key === "ArrowDown") go(ids[i + 1]);
    else if (e.key === "ArrowUp") {
      if (i === 0) {
        e.preventDefault();
        tabEl(tab)?.focus();
      } else go(ids[i - 1]);
    } else if (e.key === "Home") go(ids[0]);
    else if (e.key === "End") go(ids.at(-1));
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (tab === "unread" && !item.read) handOff(item.id);
      open(item);
    } else if ((e.key === "r" || e.key === "R") && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      toggle(item, true);
    }
  };

  const onTabKey = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    const i = TABS.findIndex((t) => t.id === tab);
    const to = e.key === "ArrowRight" ? TABS[(i + 1) % 3] : e.key === "ArrowLeft" ? TABS[(i + 2) % 3] : e.key === "Home" ? TABS[0] : e.key === "End" ? TABS[2] : null;
    if (to) {
      e.preventDefault();
      choose(to.id);
      tabEl(to.id)?.focus();
    } else if (e.key === "ArrowDown" && tabbable) {
      e.preventDefault();
      rowEl(tabbable)?.focus();
    }
  };

  const Empty = EMPTY[tab].icon;
  const words = { ...EMPTY[tab], ...empty?.[tab] };

  return (
    <div
      ref={card}
      className={cx("flex min-h-0 flex-col overflow-hidden rounded-[22px] bg-[var(--bd-surface)] text-[var(--bd-fg)]", elevated ? "shadow-[var(--bd-shadow-float),0_0_0_1px_rgb(var(--bd-ink)/0.08)]" : "shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.07),var(--bd-shadow-resting)]", className)}
      style={style}
    >
      <p id={`${uid}-how`} className="sr-only">
        Enter opens it and marks it read. R marks it read or unread.
      </p>
      <p aria-live="polite" className="sr-only">
        {said}
      </p>
      <header className="flex items-center gap-2 pl-5 pr-3 pt-4">
        <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
        <button type="button" onClick={markAll} disabled={!unread} className="flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium text-[var(--bd-muted)] outline-none transition-[color,background-color,opacity] duration-150 hover:bg-[color-mix(in_oklab,var(--bd-ui-track)_60%,var(--bd-surface))] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)] disabled:pointer-events-none disabled:opacity-40">
          <ChecksIcon weight="bold" className="size-3.5" /> Mark all read
        </button>
      </header>
      <div role="tablist" aria-label="Show" className="mx-4 mb-1 mt-3 grid shrink-0 grid-cols-3 rounded-full bg-[var(--bd-ui-track)] p-1">
        {TABS.map((t) => {
          const on = t.id === tab;
          const n = counts[t.id];
          return (
            <button
              key={t.id}
              id={`${uid}-tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`${uid}-panel`}
              tabIndex={on ? 0 : -1}
              data-autofocus={on || undefined}
              onClick={() => choose(t.id)}
              onKeyDown={onTabKey}
              className={cx("relative h-8 rounded-full text-[12.5px] font-medium outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--bd-ui-focus)]", on ? "text-[var(--bd-fg)]" : "text-[var(--bd-muted)] hover:text-[var(--bd-fg)]")}
            >
              {on && <motion.span layoutId={`${uid}-thumb`} transition={reduce ? { duration: 0 } : SNAPPY} className="absolute inset-0 rounded-full [background:var(--bd-ui-raised)] shadow-[var(--bd-ui-lift),0_0_0_1px_rgb(var(--bd-ink)/0.06)]" />}
              <span className="relative flex items-center justify-center gap-1.5">
                {t.label}
                {n > 0 && (
                  <span className="grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]">
                    <Rolling value={n} />
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <div className="relative min-h-0 flex-1">
        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={tab}
            id={`${uid}-panel`}
            role="tabpanel"
            aria-labelledby={`${uid}-tab-${tab}`}
            custom={dir}
            variants={SLIDE}
            initial={reduce ? { opacity: 0 } : "enter"}
            animate="still"
            exit={reduce ? { opacity: 0 } : "leave"}
            transition={SOFT}
            className="no-scrollbar absolute inset-0 overflow-y-auto overscroll-contain pb-2"
          >
            <AnimatePresence initial={false} mode="popLayout">
              {groups.map((g) => (
                <motion.section key={g.day} layout="position" layoutDependency={layoutKey} exit={{ opacity: 0, transition: { duration: 0.18 } }} transition={reduce ? { duration: 0 } : SNAPPY} aria-label={g.day} className="relative">
                  <h3 className="sticky top-0 z-10 bg-[var(--bd-surface)] px-5 pb-1 pt-3 text-[12px] font-medium text-[var(--bd-subtle)]">{g.day}</h3>
                  <ul className="relative">
                    <AnimatePresence initial={false} mode="popLayout">
                      {g.items.map((item) => (
                        <motion.li key={item.id} layout="position" layoutDependency={layoutKey} initial={{ opacity: 0, y: reduce ? 0 : -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.2 } }} transition={reduce ? { duration: 0.15 } : SNAPPY}>
                          <Row
                            item={item}
                            tabbable={item.id === tabbable}
                            leaves={tab === "unread" && !item.read}
                            describedBy={`${uid}-how`}
                            onOpen={() => open(item)}
                            onToggle={() => toggle(item)}
                            onAction={(a) => act(item, a)}
                            onKey={(e) => onRowKey(e, item)}
                            onFocus={() => setActive(item.id)}
                          />
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </motion.section>
              ))}
            </AnimatePresence>
            {shown.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, delay: 0.12 }} className="grid h-full place-items-center px-8 pb-6 text-center">
                <div className="grid justify-items-center gap-3">
                  <span className="relative grid size-12 place-items-center">
                    <span aria-hidden className="absolute -inset-6 [background:var(--bd-ui-dots)] [mask-image:radial-gradient(closest-side,black,transparent)]" />
                    <span className="relative grid size-12 place-items-center rounded-full text-[var(--bd-fg)] [background:var(--bd-ui-raised)] shadow-[var(--bd-ui-lift),0_0_0_1px_rgb(var(--bd-ink)/0.07)]">
                      <Empty weight="duotone" className="size-5" />
                    </span>
                  </span>
                  <div>
                    <p className="text-[14px] font-medium">{words.title}</p>
                    {words.note && <p className="mx-auto mt-1 max-w-[240px] text-[12.5px] leading-[1.5] text-[var(--bd-muted)]">{words.note}</p>}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      {footer && <div className="shrink-0 border-t border-[var(--bd-line-subtle)] px-3 py-2">{footer}</div>}
    </div>
  );
}

/* ---------- the bell ---------- */

export type InboxProps = Omit<InboxPanelProps, "className" | "style"> & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Which side of the bell the card opens on; it flips when there's no room. */
  side?: Side;
  align?: Align;
  /** The bell's name for screen readers, with the unread count added. "Notifications" by default. */
  label?: string;
  /** Classes for the bell. */
  className?: string;
  /** Classes for the card: its width and height. */
  panelClassName?: string;
};

/** A bell with a rolling unread count that opens the card beside it. */
export function Inbox({ open: openProp, defaultOpen = false, onOpenChange, side = "bottom", align = "end", label = "Notifications", className, panelClassName, ...panel }: InboxProps) {
  const [items, setItems] = useItems(panel.items, panel.defaultItems, panel.onItemsChange);
  const [own, setOwn] = useState(defaultOpen);
  const open = openProp ?? own;
  const setOpen = (o: boolean) => {
    if (openProp === undefined) setOwn(o);
    onOpenChange?.(o);
  };
  const shut = useRef(setOpen);
  useEffect(() => {
    shut.current = setOpen;
  });
  const bell = useRef<HTMLButtonElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<ReturnType<typeof place> | null>(null);
  // A place that hasn't changed keeps the same object, so nothing re-renders for it.
  const keep = (next: ReturnType<typeof place>) => (p: ReturnType<typeof place> | null) => (p && p.top === next.top && p.left === next.left && p.side === next.side ? p : next);
  const [scope, setScope] = useState<Scope>({});
  const mounted = useMounted();
  const reduce = useReducedMotion();
  const id = useId();

  const unread = items.filter((i) => !i.read).length;
  // The bell rings when the count goes up, not when it first shows.
  const [seen, setSeen] = useState(unread);
  const [rings, setRings] = useState(0);
  if (unread !== seen) {
    if (unread > seen) setRings(rings + 1);
    setSeen(unread);
  }

  // Placed beside the bell before it's ever painted, in the bell's light or dark, so it opens where it belongs.
  useLayoutEffect(() => {
    if (!open) return;
    const t = bell.current?.getBoundingClientRect();
    const c = card.current;
    setScope(scopeOf(bell.current));
    if (t && c) setPos(keep(place(t, c.offsetWidth, c.offsetHeight, side, align, 10)));
  }, [open, side, align]);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const t = bell.current?.getBoundingClientRect();
      const c = card.current;
      if (t && c) setPos(keep(place(t, c.offsetWidth, c.offsetHeight, side, align, 10)));
    };
    // Then kept beside the bell as the page moves.
    const frame = requestAnimationFrame(() => card.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true }));
    const ro = new ResizeObserver(update);
    if (card.current) ro.observe(card.current);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    const away = (e: PointerEvent) => {
      const n = e.target as Node;
      if (!card.current?.contains(n) && !bell.current?.contains(n)) shut.current(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      shut.current(false);
      bell.current?.focus();
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, side, align]);

  const below = (pos?.side ?? side) === "bottom";
  return (
    <>
      <button
        ref={bell}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={unread ? `${label}, ${unread} unread` : label}
        onClick={() => setOpen(!open)}
        className={cx(
          "relative grid size-10 shrink-0 place-items-center rounded-full text-[var(--bd-fg)] outline-none transition-[scale,box-shadow] duration-150 [background:var(--bd-ui-raised)] shadow-[var(--bd-ui-lift),0_0_0_1px_rgb(var(--bd-ink)/0.08)] hover:shadow-[var(--bd-ui-lift),0_0_0_1px_rgb(var(--bd-ink)/0.16)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)] active:scale-[0.95]",
          className,
        )}
      >
        <motion.span key={rings} animate={rings && !reduce ? { rotate: [0, 16, -12, 8, -4, 0] } : undefined} transition={{ duration: 0.6, ease: "easeOut" }} style={{ originY: 0.15 }} className="grid place-items-center">
          <BellIcon weight="duotone" className="size-[18px]" />
        </motion.span>
        <AnimatePresence initial={false}>
          {unread > 0 && (
            <motion.span
              aria-hidden
              initial={reduce ? { opacity: 0 } : { scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { scale: 0.4, opacity: 0 }}
              transition={SNAPPY}
              className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10.5px] font-semibold text-[var(--bd-ui-ink-text)] ring-2 ring-[var(--bd-surface)] [background:var(--bd-ui-ink)]"
            >
              <Rolling value={unread} />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      {mounted &&
        createPortal(
          <div {...scope} style={{ display: "contents" }}>
            <AnimatePresence>
              {open && (
                <motion.div
                  ref={card}
                  id={id}
                  role="dialog"
                  aria-label={label}
                  // Tabbing out of it closes it, the way leaving a field does.
                  onBlur={(e) => {
                    const next = e.relatedTarget as Node | null;
                    if (next && !e.currentTarget.contains(next) && !bell.current?.contains(next)) setOpen(false);
                  }}
                  // Its rows measure themselves against the card, so the card moving (as the page scrolls) never sends them sliding.
                  layoutRoot
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: below ? -10 : 10 }}
                  animate={pos ? { opacity: 1, scale: 1, y: 0 } : undefined}
                  exit={reduce ? { opacity: 0, transition: { duration: 0.12 } } : { opacity: 0, scale: 0.96, y: below ? -6 : 6, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } }}
                  transition={reduce ? { duration: 0.12 } : { type: "spring", stiffness: 300, damping: 30, opacity: { duration: 0.18, ease: "easeOut" } }}
                  style={{ position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0, zIndex: 90, visibility: pos ? undefined : "hidden", transformOrigin: `${align === "start" ? "left" : align === "end" ? "right" : "center"} ${below ? "top" : "bottom"}` }}
                >
                  <InboxPanel {...panel} items={items} onItemsChange={setItems} elevated className={cx("h-[min(500px,calc(100dvh-88px))] w-[min(384px,calc(100vw-16px))]", panelClassName)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>,
          document.body,
        )}
    </>
  );
}
