"use client";

import { ArrowUpIcon, CaretRightIcon, TrayIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { memo, useCallback, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactElement, type ReactNode } from "react";

/*
 * Rows of things on one white sheet: columns whose headers sort (an arrow turns to show which way,
 * and the rows glide to their new places), a box at the start of each row to pick it (shift picks
 * everything between), a header that stays put while the rows scroll under it, an optional
 * disclosure that opens a row to show more, and a first column that holds still when a narrow
 * screen scrolls the rest sideways. When there are no rows, it says so.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const SNAPPY = { type: "spring", stiffness: 520, damping: 42 } as const;
const SOFT = { type: "spring", stiffness: 300, damping: 30 } as const;
const DRAW = { duration: 0.24, ease: [0.16, 1, 0.3, 1] } as const;

/* Past this many rows a sort lands at once rather than gliding, so a long table stays quick. */
const GLIDE_LIMIT = 80;

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** What the column sorts by. With it, the header becomes a button that sorts. */
  sortBy?: (row: T) => string | number | Date;
  /** End-align numbers and money, so their digits line up. */
  align?: "start" | "end";
  /** A CSS width: "120px", "30%". */
  width?: string;
};

export type DataTableSort = { key: string; direction: "asc" | "desc" } | null;

const DENSITY = {
  compact: "py-2 text-[13px]",
  regular: "py-3 text-sm",
  relaxed: "py-4 text-sm",
} as const;

export type DataTableProps<T> = {
  rows: T[];
  columns: DataTableColumn<T>[];
  /** A stable key for each row: its id. */
  rowKey: (row: T) => string;
  /** What the table is, for screen readers: "Orders". */
  label: string;
  /** Each row's name for its box and its disclosure: "Order BD-1042". Its position by default. */
  rowLabel?: (row: T) => string;
  /** A box at the start of each row, and one in the header over them all. */
  selectable?: boolean;
  selected?: string[];
  defaultSelected?: string[];
  onSelectedChange?: (keys: string[]) => void;
  sort?: DataTableSort;
  defaultSort?: DataTableSort;
  onSortChange?: (sort: DataTableSort) => void;
  /** What a row opens to. With it, each row gets a disclosure at its start. */
  expand?: (row: T) => ReactNode;
  density?: keyof typeof DENSITY;
  /** Shown when there are no rows. */
  empty?: ReactNode;
  /** Past this height the rows scroll under a header that stays put. */
  maxHeight?: number | string;
  /** Hold the first column (and the boxes) still while the rest scrolls sideways. */
  stickyFirstColumn?: boolean;
  /**
   * What can be done to the picked rows: buttons in an ink bar that springs up over the table's foot
   * while any are picked, with their count and a way to clear them.
   */
  actions?: (picked: string[], clear: () => void) => ReactNode;
  className?: string;
};

/** The box a row is picked with, drawn as Checkbox draws it: ink when ticked, the tick drawing in. */
function Pick({ state, label, onPick }: { state: boolean | "mixed"; label: string; onPick: (shift: boolean) => void }) {
  const on = state === true;
  const mixed = state === "mixed";
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={mixed ? "mixed" : on}
      aria-label={label}
      // A shift-click would otherwise select the text between this box and the last.
      onMouseDown={(e: MouseEvent) => e.shiftKey && e.preventDefault()}
      onClick={(e: MouseEvent) => onPick(e.shiftKey)}
      onKeyDown={(e: KeyboardEvent) => {
        // Shift and Space picks a range from the keyboard, as shift-click does.
        if (e.key === " " && e.shiftKey) {
          e.preventDefault();
          onPick(true);
        }
      }}
      className={cx(
        "relative grid size-[18px] shrink-0 place-items-center rounded-[6px] transition-[background-color,box-shadow,scale] duration-200 ease-[var(--bd-ease)] active:scale-[0.88]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]",
        on || mixed ? "[background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(var(--bd-shade)/0.22)]" : "bg-[var(--bd-ui-field)] shadow-[inset_0_1px_2px_rgb(var(--bd-shade)/0.1),inset_0_0_0_1px_rgb(var(--bd-ink)/0.2)] hover:shadow-[inset_0_1px_2px_rgb(var(--bd-shade)/0.1),inset_0_0_0_1px_rgb(var(--bd-ink)/0.34)]",
      )}
    >
      <svg viewBox="0 0 16 16" aria-hidden className="size-[15px] text-[var(--bd-ui-ink-text)]">
        <motion.path d="M3.6 8.5 6.7 11.4 12.5 4.9" fill="none" stroke="currentColor" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" initial={false} animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={DRAW} />
        <motion.path d="M4.4 8h7.2" fill="none" stroke="currentColor" strokeWidth={2.1} strokeLinecap="round" initial={false} animate={{ pathLength: mixed ? 1 : 0, opacity: mixed ? 1 : 0 }} transition={DRAW} />
      </svg>
    </button>
  );
}

const compare = (a: string | number | Date, b: string | number | Date) => (typeof a === "string" && typeof b === "string" ? a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }) : +a - +b);

/* The fixed columns at the start: the box, then the disclosure, then the first column when it's held still. */
const PICK_W = 44;
const OPEN_W = 40;
const stickAt = (sticky: boolean, left: number) => (sticky ? ({ position: "sticky", left, zIndex: 1 } as CSSProperties) : undefined);
// A cell has one box-shadow, so its line underneath and the held-still column's edge are drawn together.
const cellShade = (line: boolean, edge: boolean) =>
  edge ? (line ? "shadow-[inset_0_-1px_0_var(--bd-line-subtle),1px_0_0_var(--bd-line),8px_0_14px_-8px_rgb(var(--bd-shade)/0.22)]" : "shadow-[1px_0_0_var(--bd-line),8px_0_14px_-8px_rgb(var(--bd-shade)/0.22)]") : line ? "shadow-[inset_0_-1px_0_var(--bd-line-subtle)]" : "";
// Row backgrounds are solid mixes, not see-through tints, so the held-still cells match the rest.
const rowBg = (on: boolean) =>
  on
    ? "bg-[color-mix(in_oklab,var(--bd-surface),var(--bd-ui-viz-1,oklch(56%_0.16_290))_7%)] group-hover/row:bg-[color-mix(in_oklab,var(--bd-surface),var(--bd-ui-viz-1,oklch(56%_0.16_290))_10%)]"
    : "bg-[var(--bd-surface)] group-hover/row:bg-[color-mix(in_oklab,var(--bd-surface),var(--bd-fg)_2.5%)]";

type RowProps<T> = {
  row: T;
  id: string;
  name: string;
  columns: DataTableColumn<T>[];
  on: boolean;
  isOpen: boolean;
  last: boolean;
  glide: boolean;
  reduce: boolean;
  selectable: boolean;
  expand?: (row: T) => ReactNode;
  pad: string;
  sticky: boolean;
  edge: boolean;
  detail: string;
  onPick: (id: string, shift: boolean) => void;
  onToggle: (id: string) => void;
};

/*
 * One row and the detail it opens to. It only takes plain values and steady handlers, so picking a
 * row redraws that row alone and a sort only moves rows rather than redrawing them.
 */
const Row = memo(function Row<T>({ row, id, name, columns, on, isOpen, last, glide, reduce, selectable, expand, pad, sticky, edge, detail, onPick, onToggle }: RowProps<T>) {
  const line = !(last && !isOpen);
  const firstLeft = (selectable ? PICK_W : 0) + (expand ? OPEN_W : 0);
  const cells = (
    <>
      {selectable && (
        <td className={cx("pl-4 pr-2 align-middle transition-colors duration-150", pad, rowBg(on), cellShade(line, false))} style={stickAt(sticky, 0)}>
          <Pick state={on} label={`Pick ${name}`} onPick={(shift) => onPick(id, shift)} />
        </td>
      )}
      {expand && (
        <td className={cx("align-middle transition-colors duration-150", pad, rowBg(on), cellShade(line, false))} style={stickAt(sticky, selectable ? PICK_W : 0)}>
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls={detail}
            aria-label={`${isOpen ? "Close" : "Open"} ${name}`}
            onClick={() => onToggle(id)}
            className="grid size-7 place-items-center rounded-full text-[var(--bd-muted)] transition-[background-color,color,scale] duration-150 hover:bg-[color-mix(in_oklab,var(--bd-surface),var(--bd-fg)_6%)] hover:text-[var(--bd-fg)] active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--bd-ui-focus)]"
          >
            <motion.span initial={false} animate={{ rotate: isOpen ? 90 : 0 }} transition={SNAPPY} className="grid">
              <CaretRightIcon size={13} weight="regular" />
            </motion.span>
          </button>
        </td>
      )}
      {columns.map((c, ci) => (
        <td key={c.key} className={cx("px-4 align-middle tabular-nums transition-colors duration-150", pad, rowBg(on), cellShade(line, ci === 0 && edge), c.align === "end" && "text-right")} style={ci === 0 ? stickAt(sticky, firstLeft) : undefined}>
          {c.cell(row)}
        </td>
      ))}
    </>
  );
  return (
    <>
      {/* Gliding rows are motion rows; past the limit they're plain ones, which cost nothing to keep. */}
      {glide ? (
        <motion.tr layout="position" transition={SOFT} className="group/row">
          {cells}
        </motion.tr>
      ) : (
        <tr className="group/row">{cells}</tr>
      )}
      {expand && (
        <tr>
          <td colSpan={columns.length + (selectable ? 1 : 0) + 1} className="p-0">
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={detail}
                  role="region"
                  aria-label={name}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={reduce ? { duration: 0 } : { height: SOFT, opacity: { duration: 0.18 } }}
                  // clip, not hidden: hidden would make its own scroller and the detail couldn't hold still in the table's.
                  className={cx("overflow-clip bg-[color-mix(in_oklab,var(--bd-surface),var(--bd-fg)_2.5%)]", !last && "shadow-[inset_0_-1px_0_var(--bd-line-subtle)]")}
                >
                  <div className="sticky left-0 w-[100cqw] px-5 py-4" style={{ paddingLeft: firstLeft + 16 }}>
                    {expand(row)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </td>
        </tr>
      )}
    </>
  );
}) as <T>(props: RowProps<T>) => ReactElement;

export function DataTable<T>({ rows, columns, rowKey, label, rowLabel, selectable = false, selected, defaultSelected = [], onSelectedChange, sort, defaultSort = null, onSortChange, expand, density = "regular", empty, maxHeight, stickyFirstColumn = false, actions, className }: DataTableProps<T>) {
  const id = useId();
  const reduce = useReducedMotion() ?? false;
  const [innerSort, setInnerSort] = useState<DataTableSort>(defaultSort);
  const [innerSel, setInnerSel] = useState<string[]>(defaultSelected);
  const [open, setOpen] = useState<string[]>([]);
  const [scrolledX, setScrolledX] = useState(false);
  const [said, setSaid] = useState("");
  const anchor = useRef<string | null>(null);
  const current = sort === undefined ? innerSort : sort;
  const picked = selected ?? innerSel;

  const ordered = useMemo(() => {
    const col = current && columns.find((c) => c.key === current.key);
    if (!current || !col?.sortBy) return rows;
    const by = col.sortBy;
    const sign = current.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => sign * compare(by(a), by(b)));
  }, [rows, columns, current]);
  const keys = useMemo(() => ordered.map(rowKey), [ordered, rowKey]);
  const pickedSet = useMemo(() => new Set(picked), [picked]);
  const openSet = useMemo(() => new Set(open), [open]);
  const glide = !reduce && ordered.length <= GLIDE_LIMIT;

  const setSort = (s: DataTableSort) => {
    setInnerSort(s);
    onSortChange?.(s);
  };
  // Each click goes up, then down, then back to the order the rows came in.
  const cycle = (c: DataTableColumn<T>) => {
    const next: DataTableSort = current?.key !== c.key ? { key: c.key, direction: "asc" } : current.direction === "asc" ? { key: c.key, direction: "desc" } : null;
    setSort(next);
    const name = typeof c.header === "string" ? c.header : c.key;
    setSaid(next ? `Sorted by ${name}, ${next.direction === "asc" ? "ascending" : "descending"}` : "Back in the original order");
  };

  const setPicked = (next: string[]) => {
    setInnerSel(next);
    onSelectedChange?.(next);
  };
  // A shift-pick sets every row from the last one picked to this one the way this one is going.
  const pick = (key: string, shift: boolean) => {
    const turnOn = !pickedSet.has(key);
    let span = [key];
    if (shift && anchor.current && keys.includes(anchor.current)) {
      const [a, b] = [keys.indexOf(anchor.current), keys.indexOf(key)].sort((x, y) => x - y);
      span = keys.slice(a, b + 1);
    }
    anchor.current = key;
    const out = new Set(span);
    setPicked(turnOn ? [...new Set([...picked, ...span])] : picked.filter((k) => !out.has(k)));
  };
  // The rows get steady handlers that reach the latest pick, so they don't all redraw when one changes.
  const latest = useRef(pick);
  useLayoutEffect(() => {
    latest.current = pick;
  });
  const onPick = useCallback((key: string, shift: boolean) => latest.current(key, shift), []);
  const onToggle = useCallback((key: string) => setOpen((o) => (o.includes(key) ? o.filter((k) => k !== key) : [...o, key])), []);
  const all = keys.length > 0 && keys.every((k) => pickedSet.has(k));
  const some = !all && keys.some((k) => pickedSet.has(k));

  const pad = DENSITY[density];
  const lead = (selectable ? 1 : 0) + (expand ? 1 : 0);
  const firstLeft = (selectable ? PICK_W : 0) + (expand ? OPEN_W : 0);
  const edge = stickyFirstColumn && scrolledX;
  const bar = !!actions && selectable && picked.length > 0;
  const clear = () => setPicked([]);

  return (
    <div className={cx("relative w-full overflow-hidden rounded-[18px] bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]", className)}>
      {/* A size container, so the empty message and an opened row can be as wide as the view and hold still in it. */}
      <div className={cx("overflow-auto overscroll-x-contain transition-[padding] duration-300 ease-[var(--bd-ease)] [container-type:inline-size] [scrollbar-color:var(--bd-line-strong)_transparent] [scrollbar-width:thin]", bar && "pb-14")} style={{ maxHeight }} onScroll={(e) => setScrolledX(e.currentTarget.scrollLeft > 0)}>
        <table className="w-full min-w-max border-separate border-spacing-0 text-left">
          <caption className="sr-only">{label}</caption>
          <thead>
            <tr>
              {selectable && (
                <th scope="col" className="sticky top-0 z-[2] h-11 bg-[color-mix(in_oklab,var(--bd-ui-track)_35%,var(--bd-surface))] pl-4 pr-2 shadow-[inset_0_-1px_0_var(--bd-line)]" style={{ width: PICK_W, ...stickAt(stickyFirstColumn, 0), zIndex: 3 }}>
                  <Pick state={all ? true : some ? "mixed" : false} label={all ? "Unpick every row" : "Pick every row"} onPick={() => setPicked(all ? picked.filter((k) => !keys.includes(k)) : [...new Set([...picked, ...keys])])} />
                </th>
              )}
              {expand && <th scope="col" aria-label="Open" className="sticky top-0 z-[2] bg-[color-mix(in_oklab,var(--bd-ui-track)_35%,var(--bd-surface))] shadow-[inset_0_-1px_0_var(--bd-line)]" style={{ width: OPEN_W, ...stickAt(stickyFirstColumn, selectable ? PICK_W : 0), zIndex: 3 }} />}
              {columns.map((c, ci) => {
                const on = current?.key === c.key;
                const first = ci === 0;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={on ? (current.direction === "asc" ? "ascending" : "descending") : c.sortBy ? "none" : undefined}
                    className={cx(
                      "sticky top-0 z-[2] h-11 whitespace-nowrap bg-[color-mix(in_oklab,var(--bd-ui-track)_35%,var(--bd-surface))] px-4 text-[12.5px] font-medium text-[var(--bd-muted)]",
                      first && edge ? "shadow-[inset_0_-1px_0_var(--bd-line),1px_0_0_var(--bd-line),8px_0_14px_-8px_rgb(var(--bd-shade)/0.22)]" : "shadow-[inset_0_-1px_0_var(--bd-line)]",
                      c.align === "end" && "text-right",
                    )}
                    style={{ width: c.width, ...(first ? stickAt(stickyFirstColumn, firstLeft) : undefined), ...(first && stickyFirstColumn ? { zIndex: 3 } : undefined) }}
                  >
                    {c.sortBy ? (
                      <button
                        type="button"
                        onClick={() => cycle(c)}
                        className={cx(
                          "group/sort -mx-1.5 inline-flex h-7 items-center gap-1.5 rounded-full px-1.5 transition-[color,scale] duration-150 hover:text-[var(--bd-fg)] active:scale-[0.97]",
                          "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--bd-ui-focus)]",
                          c.align === "end" && "flex-row-reverse",
                          on && "text-[var(--bd-fg)]",
                        )}
                      >
                        {c.header}
                        {/* The arrow points the way the rows run, turning as it flips, and shows faintly on hover before the first sort. */}
                        <motion.span initial={false} animate={{ rotate: on && current.direction === "desc" ? 180 : 0, opacity: on ? 1 : 0 }} transition={SNAPPY} className={cx("grid size-4 place-items-center", !on && "group-hover/sort:!opacity-40")}>
                          <ArrowUpIcon size={12} weight="regular" aria-hidden />
                        </motion.span>
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ordered.length === 0 && (
              <tr>
                <td colSpan={columns.length + lead} className="p-0">
                  {/* As wide as the view and held in it, so a wide table's message isn't centered off screen. */}
                  <div className="sticky left-0 w-[100cqw] px-6 py-14 text-center">
                    {empty ?? (
                      <span className="inline-flex flex-col items-center gap-3 text-sm text-[var(--bd-muted)]">
                        <span className="grid size-11 place-items-center rounded-[14px] bg-[var(--bd-ui-track)] text-[var(--bd-fg)]">
                          <TrayIcon size={20} weight="duotone" />
                        </span>
                        Nothing here yet.
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            )}
            {ordered.map((row, ri) => {
              const key = keys[ri];
              return (
                <Row
                    key={key}
                    row={row}
                    id={key}
                    name={rowLabel?.(row) ?? `Row ${ri + 1}`}
                    columns={columns}
                    on={pickedSet.has(key)}
                    isOpen={!!expand && openSet.has(key)}
                    last={ri === ordered.length - 1}
                    glide={glide}
                    reduce={reduce}
                    selectable={selectable}
                    expand={expand}
                    pad={pad}
                    sticky={stickyFirstColumn}
                    edge={edge}
                    detail={`${id}-${key}`}
                    onPick={onPick}
                    onToggle={onToggle}
                  />
              );
            })}
          </tbody>
        </table>
      </div>
      {/* The picked rows' bar: their count, what can be done to them, and a way to let them go. */}
      <AnimatePresence>
        {bar && (
          <motion.div
            key="bar"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97, transition: { duration: 0.16 } }}
            transition={reduce ? { duration: 0.12 } : SNAPPY}
            className="pointer-events-none absolute inset-x-0 bottom-3 z-[4] flex justify-center px-3"
          >
            <div
              role="toolbar"
              aria-label={`${picked.length} picked`}
              className="pointer-events-auto flex max-w-full items-center gap-1 rounded-full p-1 pl-4 text-[13px] text-[var(--bd-ui-ink-text)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_2px_6px_rgb(var(--bd-shade)/0.2),0_14px_32px_-12px_rgb(var(--bd-shade)/0.55)] [background:var(--bd-ui-ink)] [&_button]:inline-flex [&_button]:h-8 [&_button]:items-center [&_button]:gap-1.5 [&_button]:rounded-full [&_button]:px-3 [&_button]:font-medium [&_button]:transition-[background-color,scale] [&_button]:duration-150 [&_button:active]:scale-[0.96] [&_button:hover]:bg-[color-mix(in_oklab,var(--bd-ui-ink-text)_13%,transparent)] [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-1 [&_button:focus-visible]:outline-[color:var(--bd-ui-ink-text)] [&_svg]:size-4"
            >
              <span className="mr-1.5 whitespace-nowrap font-medium tabular-nums">{picked.length} picked</span>
              <span aria-hidden className="h-4 w-px bg-[color-mix(in_oklab,var(--bd-ui-ink-text)_22%,transparent)]" />
              {actions?.(picked, clear)}
              <button type="button" aria-label="Clear the picked rows" onClick={clear} className="!w-8 !justify-center !px-0">
                <XIcon weight="regular" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <p className="sr-only" aria-live="polite">
        {said}
      </p>
    </div>
  );
}
