"use client";

import { CheckIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";

/*
 * A plan over time: each piece of work a bar across the days it takes, in groups, with today
 * ruled in ink. Drag a bar to move it, or either end to change how long it runs, and it snaps to
 * days; the arrow keys do the same (Shift changes the length). A bar says how it's going: planned
 * in outline, under way with its progress filled in, at risk in amber, and done in solid ink. The
 * days stretch to fill its width; where they can't, it scrolls sideways, the names staying put.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export type RoadmapItem = {
  id: string;
  title: string;
  /** First and last day, YYYY-MM-DD, both included. */
  start: string;
  end: string;
  group?: string;
  status?: "planned" | "active" | "risk" | "done";
  /** How far along, 0 to 1, drawn inside the bar. */
  progress?: number;
  /** Who has it, by name: their face shows beside the item's. */
  owner?: string;
};

export type RoadmapProps = {
  items?: RoadmapItem[];
  defaultItems?: RoadmapItem[];
  onItemsChange?: (items: RoadmapItem[], changed: RoadmapItem) => void;
  /** The first day shown, YYYY-MM-DD. */
  from: string;
  /** How many days it shows. */
  days?: number;
  /** Today, ruled in ink. */
  today?: string;
  /** Week: a day is wide enough to drag by. Month: a quarter fits. */
  scale?: "week" | "month";
  selected?: string | null;
  onSelect?: (item: RoadmapItem) => void;
  label?: string;
  className?: string;
};

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

const DAY = 864e5;
const dayOf = (iso: string) => Math.round(Date.parse(`${iso}T00:00:00Z`) / DAY);
const isoOf = (n: number) => new Date(n * DAY).toISOString().slice(0, 10);
const short = (n: number) => new Date(n * DAY).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const NAME = 232;
const ROW = 44;

type Drag = { id: string; mode: "move" | "start" | "end"; x: number; start: number; end: number; moved: boolean };

export function Roadmap({ items, defaultItems = [], onItemsChange, from, days = 84, today, scale = "week", selected, onSelect, label = "Roadmap", className }: RoadmapProps) {
  const [inner, setInner] = useState(defaultItems);
  const list = items ?? inner;
  const [drag, setDrag] = useState<Drag | null>(null);
  const moved = useRef(false);
  const box = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState(0);
  // The days stretch to fill the width it's given, down to a floor; under that, it scrolls sideways.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setRoom(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const w = Math.max(scale === "week" ? 10 : 5, room ? (room - NAME) / days : scale === "week" ? 22 : 9);
  const first = dayOf(from);
  const width = days * w;

  const change = (id: string, start: number, end: number) => {
    const next = list.map((i) => (i.id === id ? { ...i, start: isoOf(start), end: isoOf(end) } : i));
    setInner(next);
    onItemsChange?.(next, next.find((i) => i.id === id)!);
  };

  const down = (e: ReactPointerEvent<HTMLElement>, item: RoadmapItem, mode: Drag["mode"]) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    moved.current = false;
    setDrag({ id: item.id, mode, x: e.clientX, start: dayOf(item.start), end: dayOf(item.end), moved: false });
  };
  const move = (e: ReactPointerEvent<HTMLElement>) => {
    if (!drag) return;
    const d = Math.round((e.clientX - drag.x) / w);
    if (!d && !drag.moved) return;
    moved.current = true;
    if (!drag.moved) setDrag({ ...drag, moved: true });
    if (drag.mode === "move") change(drag.id, drag.start + d, drag.end + d);
    else if (drag.mode === "start") change(drag.id, Math.min(drag.start + d, drag.end), drag.end);
    else change(drag.id, drag.start, Math.max(drag.end + d, drag.start));
  };
  const up = (item: RoadmapItem) => {
    if (!drag) return;
    setDrag(null);
    if (!moved.current) onSelect?.(item);
  };
  const key = (e: KeyboardEvent, item: RoadmapItem) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (e.key === "Enter") return onSelect?.(item);
    if (!step) return;
    e.preventDefault();
    const s = dayOf(item.start);
    const en = dayOf(item.end);
    if (e.shiftKey) change(item.id, s, Math.max(en + step, s));
    else change(item.id, s + step, en + step);
  };

  // The header: months, and a tick for each Monday.
  const months: Array<{ at: number; label: string }> = [];
  const weeks: number[] = [];
  for (let d = 0; d < days; d++) {
    const date = new Date((first + d) * DAY);
    if (date.getUTCDate() === 1 || d === 0) months.push({ at: d, label: date.toLocaleDateString("en-US", { month: "long", year: d === 0 || date.getUTCMonth() === 0 ? "numeric" : undefined, timeZone: "UTC" }) });
    if (date.getUTCDay() === 1) weeks.push(d);
  }
  const groups = [...new Set(list.map((i) => i.group ?? ""))];
  const now = today ? dayOf(today) - first : -1;

  return (
    <div ref={box} role="group" aria-label={label} className={cx("relative overflow-x-auto rounded-[16px] bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[0_0_0_1px_var(--bd-line-subtle),0_1px_2px_rgb(var(--bd-shade)/0.05)] [scrollbar-width:thin]", className)}>
      <div className="relative" style={{ width: NAME + width }}>
        {/* Week rules and today, under everything. */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0" style={{ left: NAME, width }}>
          {weeks.map((d) => (
            <span key={d} className="absolute inset-y-0 w-px bg-[var(--bd-line-subtle)]" style={{ left: d * w }} />
          ))}
          {now >= 0 && now < days && (
            <span className="absolute inset-y-0 z-20 w-[1.5px] bg-[var(--bd-fg)]" style={{ left: now * w + w / 2 }}>
              <span className="absolute left-1/2 top-[29px] -translate-x-1/2 whitespace-nowrap rounded-full px-1.5 py-0.5 font-mono text-[10px] font-medium text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]">{short(first + now)}</span>
            </span>
          )}
        </div>

        <div className="relative flex h-[52px] border-b border-[var(--bd-line-subtle)]">
          <div className="sticky left-0 z-30 flex shrink-0 items-end bg-[var(--bd-surface)] px-4 pb-2 text-[11.5px] font-medium text-[var(--bd-subtle)]" style={{ width: NAME }}>
            Work
          </div>
          <div className="relative" style={{ width }}>
            {months.map((m) => (
              <span key={m.at} className="absolute top-2.5 whitespace-nowrap pl-2 text-[12px] font-medium" style={{ left: m.at * w }}>
                {m.label}
              </span>
            ))}
            {scale === "week" &&
              weeks.map((d) => (
                <span key={d} className="absolute bottom-2 pl-1.5 font-mono text-[10.5px] tabular-nums text-[var(--bd-subtle)]" style={{ left: d * w }}>
                  {new Date((first + d) * DAY).getUTCDate()}
                </span>
              ))}
          </div>
        </div>

        {groups.map((g) => (
          <div key={g || "all"} role="rowgroup">
            {g && (
              <div className="sticky left-0 z-10 flex h-8 w-fit items-end px-4 pb-1 font-mono text-[10.5px] uppercase tracking-[0.09em] text-[var(--bd-subtle)]">
                {g} <span className="ml-1.5 opacity-70">{list.filter((i) => (i.group ?? "") === g).length}</span>
              </div>
            )}
            {list
              .filter((i) => (i.group ?? "") === g)
              .map((item) => {
                const s = dayOf(item.start) - first;
                const e = dayOf(item.end) - first;
                const status = item.status ?? (item.progress ? "active" : "planned");
                const on = selected === item.id;
                const dragging = drag?.id === item.id && drag.moved;
                const bar = cx(
                  "group/bar absolute top-[7px] flex h-[30px] touch-none select-none items-center overflow-hidden rounded-[9px] text-[12.5px] outline-none transition-shadow focus-visible:shadow-[0_0_0_2px_var(--bd-fg)]",
                  status === "done" && "text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]",
                  status === "planned" && "border border-dashed border-[var(--bd-line-strong)] bg-[var(--bd-surface)] text-[var(--bd-muted)]",
                  status === "active" && "bg-[var(--bd-surface)] shadow-[inset_0_0_0_1px_var(--bd-line-strong),0_1px_2px_rgb(var(--bd-shade)/0.08)]",
                  status === "risk" && "bg-[var(--bd-surface)] shadow-[inset_0_0_0_1.5px_var(--bd-ui-wait),0_1px_2px_rgb(var(--bd-shade)/0.08)]",
                  on && "shadow-[0_0_0_2px_var(--bd-fg)]",
                  dragging ? "z-10 cursor-grabbing shadow-[0_0_0_1px_var(--bd-line-strong),0_10px_24px_-10px_rgb(var(--bd-shade)/0.5)]" : "cursor-grab",
                );
                return (
                  <div key={item.id} role="row" className="relative flex border-b border-[var(--bd-line-subtle)] last:border-b-0" style={{ height: ROW }}>
                    <div role="rowheader" className="sticky left-0 z-10 flex shrink-0 items-center gap-2 bg-[var(--bd-surface)] px-4 text-[13px]" style={{ width: NAME }}>
                      <span className="min-w-0 flex-1 truncate">{item.title}</span>
                      {item.owner && (
                        <span role="img" aria-label={item.owner} title={item.owner} className="size-6 shrink-0 overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]">
                          <Face name={item.owner} />
                        </span>
                      )}
                    </div>
                    <div className="relative" style={{ width }}>
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label={`${item.title}, ${short(dayOf(item.start))} to ${short(dayOf(item.end))}${item.progress !== undefined ? `, ${Math.round(item.progress * 100)}% done` : ""}. Arrow keys move it; Shift and the arrows change its length.`}
                        aria-pressed={on}
                        onPointerDown={(ev) => down(ev, item, "move")}
                        onPointerMove={move}
                        onPointerUp={() => up(item)}
                        onKeyDown={(ev) => key(ev, item)}
                        className={bar}
                        style={{ left: s * w + 1, width: Math.max((e - s + 1) * w - 2, 10) }}
                      >
                        {(status === "active" || status === "risk") && item.progress !== undefined && <span aria-hidden className={cx("absolute inset-y-0 left-0", status === "risk" ? "bg-[color-mix(in_oklab,var(--bd-ui-wait)_22%,transparent)]" : "bg-[rgb(var(--bd-ink)/0.1)]")} style={{ width: `${item.progress * 100}%` }} />}
                        <span className="relative flex min-w-0 flex-1 items-center gap-1.5 px-2.5">
                          {status === "done" && <CheckIcon size={12} weight="bold" className="shrink-0" />}
                          {status === "risk" && <span className="size-1.5 shrink-0 rounded-full bg-[var(--bd-ui-wait)]" />}
                          <span className="truncate font-medium">{item.title}</span>
                          {item.progress !== undefined && status !== "done" && <span className="ml-auto shrink-0 pl-2 font-mono text-[10.5px] tabular-nums opacity-60">{Math.round(item.progress * 100)}%</span>}
                        </span>
                        {/* The ends, to change how long it runs. */}
                        <span aria-hidden onPointerDown={(ev) => down(ev, item, "start")} onPointerMove={move} onPointerUp={() => up(item)} className="absolute inset-y-0 left-0 w-2 cursor-ew-resize after:absolute after:inset-y-2 after:left-[3px] after:w-[2px] after:rounded-full after:bg-current after:opacity-0 group-hover/bar:after:opacity-30" />
                        <span aria-hidden onPointerDown={(ev) => down(ev, item, "end")} onPointerMove={move} onPointerUp={() => up(item)} className="absolute inset-y-0 right-0 w-2 cursor-ew-resize after:absolute after:inset-y-2 after:right-[3px] after:w-[2px] after:rounded-full after:bg-current after:opacity-0 group-hover/bar:after:opacity-30" />
                      </div>
                      {dragging && (
                        <span className="pointer-events-none absolute -top-1 z-30 -translate-y-full whitespace-nowrap rounded-[7px] px-2 py-1 font-mono text-[10.5px] text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]" style={{ left: s * w }}>
                          {short(dayOf(item.start))} to {short(dayOf(item.end))}, {e - s + 1} days
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
