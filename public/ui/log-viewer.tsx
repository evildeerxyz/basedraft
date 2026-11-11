"use client";

import { ArrowDownIcon, CaretRightIcon, CheckIcon, CopyIcon, MagnifyingGlassIcon, TextAlignLeftIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

/*
 * A stream of log lines, the way a deploy or a server shows them: time, level and message in
 * monospace, errors and warnings marked down the edge, chips that filter by level with their counts,
 * and a search that narrows to what matches and marks it. Live, it keeps to the newest line as they
 * come in, unless you've scrolled up to read, when a pill counts what's new and takes you back down.
 * A line with fields opens to show them.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogLine = {
  /** A key that stays with the line; its index otherwise. */
  id?: string | number;
  /** When: a Date, a time in ms, or a date string. */
  time: Date | number | string;
  level?: LogLevel;
  message: string;
  /** Where it came from: a service, a step, a file. */
  source?: string;
  /** More about it, shown when the line is opened. */
  fields?: Record<string, unknown>;
};

const LEVELS: LogLevel[] = ["error", "warn", "info", "debug"];
const LEVEL: Record<LogLevel, { label: string; ink: string; row: string; edge: string }> = {
  error: { label: "ERR", ink: "text-[var(--bd-ui-stop)]", row: "bg-[color-mix(in_oklab,var(--bd-ui-stop)_8%,transparent)]", edge: "bg-[var(--bd-ui-stop)]" },
  warn: { label: "WRN", ink: "text-[color-mix(in_oklab,var(--bd-ui-wait)_80%,var(--bd-fg))]", row: "bg-[color-mix(in_oklab,var(--bd-ui-wait)_9%,transparent)]", edge: "bg-[var(--bd-ui-wait)]" },
  info: { label: "INF", ink: "text-[color-mix(in_oklab,var(--bd-ui-viz-4)_75%,var(--bd-fg))]", row: "", edge: "" },
  debug: { label: "DBG", ink: "text-[var(--bd-subtle)]", row: "", edge: "" },
};
const CHIP_DOT: Record<LogLevel, string> = { error: "bg-[var(--bd-ui-stop)]", warn: "bg-[var(--bd-ui-wait)]", info: "bg-[var(--bd-ui-viz-4)]", debug: "bg-[var(--bd-subtle)]" };

/** The message with what the search found marked. */
function marked(text: string, q: string): ReactNode {
  if (!q) return text;
  const out: ReactNode[] = [];
  const low = text.toLowerCase();
  let at = 0;
  for (let i = low.indexOf(q); i !== -1; i = low.indexOf(q, i + q.length)) {
    if (i > at) out.push(text.slice(at, i));
    out.push(
      <mark key={i} className="rounded-[3px] bg-[color-mix(in_oklab,var(--bd-ui-wait)_42%,transparent)] text-inherit">
        {text.slice(i, i + q.length)}
      </mark>,
    );
    at = i + q.length;
  }
  if (at < text.length) out.push(text.slice(at));
  return out;
}

const show = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v));

export type LogViewerProps = {
  lines: LogLine[];
  /** What the logs are of, in the header: "Build", "api-7f9c". */
  title?: string;
  /** Lines are still coming: a live dot, and it keeps to the newest. */
  live?: boolean;
  /** How tall the lines' box is. */
  height?: number | string;
  /** Long lines wrap to start; the button in the header switches. */
  wrap?: boolean;
  /** The time zone the times are shown in. UTC unless given, so the server and the browser agree. */
  timeZone?: string;
  /** At most this many lines are kept, the newest. */
  max?: number;
  className?: string;
};

export function LogViewer({ lines, title = "Logs", live = false, height = 360, wrap: startWrap = false, timeZone = "UTC", max = 1000, className }: LogViewerProps) {
  const [query, setQuery] = useState("");
  const [off, setOff] = useState<Set<LogLevel>>(() => new Set());
  const [wrap, setWrap] = useState(startWrap);
  const [open, setOpen] = useState<Set<string | number>>(() => new Set());
  const [pinned, setPinned] = useState(true);
  const [seenAt, setSeenAt] = useState(0);
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();

  const clock = useMemo(() => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3, hour12: false, timeZone }), [timeZone]);
  const kept = lines.length > max ? lines.slice(-max) : lines;
  const start = lines.length - kept.length;
  const counts = useMemo(() => {
    const c: Record<LogLevel, number> = { error: 0, warn: 0, info: 0, debug: 0 };
    for (const l of kept) c[l.level ?? "info"]++;
    return c;
  }, [kept]);
  const q = query.trim().toLowerCase();
  const visible = kept.map((l, i) => ({ l, n: start + i + 1, key: l.id ?? start + i })).filter(({ l }) => !off.has(l.level ?? "info") && (!q || l.message.toLowerCase().includes(q) || l.source?.toLowerCase().includes(q)));
  const unseen = pinned ? 0 : Math.max(0, visible.length - seenAt);
  const digits = String(start + kept.length).length;

  // Kept to the newest line while it's pinned there.
  useLayoutEffect(() => {
    const el = box.current;
    if (el && pinned) el.scrollTop = el.scrollHeight;
  }, [visible.length, pinned, wrap]);

  const toBottom = () => {
    const el = box.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: still ? "auto" : "smooth" });
    setPinned(true);
  };
  const copy = async () => {
    const text = visible.map(({ l }) => `${clock.format(new Date(l.time))} ${(l.level ?? "info").toUpperCase().padEnd(5)} ${l.source ? `[${l.source}] ` : ""}${l.message}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };
  const toggle = (lv: LogLevel) =>
    setOff((s) => {
      const n = new Set(s);
      if (n.has(lv)) n.delete(lv);
      else n.add(lv);
      return n;
    });

  const ICON_BTN = "grid size-8 place-items-center rounded-full text-[var(--bd-muted)] outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]";

  return (
    <section aria-label={`${title} logs`} className={cx("relative overflow-hidden rounded-[20px] bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]", className)}>
      <header className="grid gap-2.5 px-3 pb-2.5 pt-3 shadow-[inset_0_-1px_0_var(--bd-line-subtle)]">
        <div className="flex items-center gap-2 pl-1">
          {live && (
            <span className="relative grid size-2 place-items-center" aria-hidden>
              <span className="absolute inset-0 animate-ping rounded-full bg-[var(--bd-ui-ok)] opacity-60 motion-reduce:hidden" />
              <span className="relative size-2 rounded-full bg-[var(--bd-ui-ok)]" />
            </span>
          )}
          <h3 className="text-[13.5px] font-medium">{title}</h3>
          {live && <span className="text-[12px] text-[var(--bd-ui-ok)]">Live</span>}
          <span className="text-[12px] tabular-nums text-[var(--bd-subtle)]">
            {visible.length === kept.length ? `${kept.length} lines` : `${visible.length} of ${kept.length}`}
          </span>
          <span className="ml-auto flex items-center gap-0.5">
            <button type="button" aria-pressed={wrap} aria-label="Wrap long lines" onClick={() => setWrap((w) => !w)} className={cx(ICON_BTN, wrap && "bg-[rgb(var(--bd-ink)/0.07)] text-[var(--bd-fg)]")}>
              <TextAlignLeftIcon weight="bold" className="size-4" />
            </button>
            <button type="button" aria-label={copied ? "Copied" : "Copy the lines shown"} onClick={copy} className={ICON_BTN}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={copied ? "y" : "n"} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.16 }}>
                  {copied ? <CheckIcon weight="bold" className="size-4 text-[var(--bd-ui-ok)]" /> : <CopyIcon weight="bold" className="size-4" />}
                </motion.span>
              </AnimatePresence>
            </button>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-8 min-w-[150px] flex-1 items-center gap-2 rounded-full bg-[var(--bd-ui-field)] pl-3 pr-1 shadow-[var(--bd-ui-well)] focus-within:shadow-[var(--bd-ui-well),0_0_0_3px_var(--bd-ui-focus)]">
            <MagnifyingGlassIcon weight="bold" className="size-3.5 shrink-0 text-[var(--bd-subtle)]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setQuery("")} placeholder="Search the logs" aria-label="Search the logs" className="h-full min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--bd-subtle)]" />
            {query && (
              <button type="button" aria-label="Clear the search" onClick={() => setQuery("")} className="grid size-6 shrink-0 place-items-center rounded-full text-[var(--bd-subtle)] outline-none hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]">
                <XIcon weight="bold" className="size-3" />
              </button>
            )}
          </label>
          <div role="group" aria-label="Levels" className="flex gap-1">
            {LEVELS.map((lv) => (
              <button
                key={lv}
                type="button"
                aria-pressed={!off.has(lv)}
                onClick={() => toggle(lv)}
                className={cx(
                  "flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium capitalize outline-none transition-[background,color,box-shadow] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]",
                  off.has(lv) ? "text-[var(--bd-subtle)] shadow-[inset_0_0_0_1px_var(--bd-line-subtle)] hover:text-[var(--bd-muted)]" : "bg-[rgb(var(--bd-ink)/0.06)] text-[var(--bd-fg)] hover:bg-[rgb(var(--bd-ink)/0.09)]",
                )}
              >
                <span className={cx("size-1.5 rounded-full transition-opacity", CHIP_DOT[lv], off.has(lv) && "opacity-30")} />
                {lv}
                <span className="tabular-nums text-[var(--bd-subtle)]">{counts[lv]}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div
        ref={box}
        role="log"
        aria-live={live ? "polite" : "off"}
        aria-label={`${title}, ${visible.length} lines`}
        tabIndex={0}
        onScroll={(e) => {
          const el = e.currentTarget;
          const atEnd = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
          if (atEnd !== pinned) {
            setPinned(atEnd);
            if (!atEnd) setSeenAt(visible.length);
          }
        }}
        className="overflow-auto py-1.5 font-mono text-[12px] leading-5 outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--bd-ui-focus)]"
        style={{ height }}
      >
        <div className={cx(!wrap && "w-max min-w-full")}>
          {!visible.length && <p className="px-4 py-6 text-center font-sans text-[13px] text-[var(--bd-subtle)]">{kept.length ? "No lines match." : "No lines yet."}</p>}
          <AnimatePresence initial={false}>
            {visible.map(({ l, n, key }) => {
              const lv = l.level ?? "info";
              const has = !!l.fields && Object.keys(l.fields).length > 0;
              const isOpen = open.has(key);
              const row = (
                <>
                  <span aria-hidden className={cx("absolute inset-y-0 left-0 w-[2px]", LEVEL[lv].edge)} />
                  <span aria-hidden className="w-[var(--n)] shrink-0 select-none pr-3 text-right tabular-nums text-[var(--bd-subtle)] opacity-70">
                    {n}
                  </span>
                  <time className="shrink-0 select-none pr-3 tabular-nums text-[var(--bd-subtle)]">{clock.format(new Date(l.time))}</time>
                  <span className={cx("w-9 shrink-0 select-none font-medium", LEVEL[lv].ink)}>
                    <span className="sr-only">{lv} </span>
                    <span aria-hidden>{LEVEL[lv].label}</span>
                  </span>
                  <span className={cx("min-w-0 flex-1 pr-4", wrap ? "whitespace-pre-wrap [overflow-wrap:anywhere]" : "whitespace-pre")}>
                    {l.source && <span className="text-[var(--bd-subtle)]">[{marked(l.source, q)}] </span>}
                    {marked(l.message, q)}
                    {has && <CaretRightIcon weight="bold" aria-hidden className={cx("ml-1.5 inline size-2.5 text-[var(--bd-subtle)] transition-transform duration-200", isOpen && "rotate-90")} />}
                  </span>
                </>
              );
              const base = cx("relative flex w-full pl-3 text-left", LEVEL[lv].row);
              return (
                <motion.div key={key} initial={still ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} style={{ "--n": `${digits + 2}ch` } as CSSProperties}>
                  {has ? (
                    <button type="button" aria-expanded={isOpen} onClick={() => setOpen((s) => (s.has(key) ? new Set([...s].filter((k) => k !== key)) : new Set(s).add(key)))} className={cx(base, "outline-none hover:bg-[rgb(var(--bd-ink)/0.04)] focus-visible:shadow-[inset_0_0_0_2px_var(--bd-ui-focus)]")}>
                      {row}
                    </button>
                  ) : (
                    <div className={cx(base, "hover:bg-[rgb(var(--bd-ink)/0.03)]")}>{row}</div>
                  )}
                  <AnimatePresence initial={false}>
                    {has && isOpen && (
                      <motion.dl initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={still ? { duration: 0 } : { height: { type: "spring", stiffness: 420, damping: 40 }, opacity: { duration: 0.15 } }} className={cx("overflow-hidden", LEVEL[lv].row)}>
                        <div className="grid grid-cols-[max-content_1fr] gap-x-4 pb-2 pt-0.5" style={{ paddingLeft: `calc(${digits + 2}ch + 12px)` }}>
                          {Object.entries(l.fields!).map(([k, v]) => (
                            <div key={k} className="contents">
                              <dt className="text-[var(--bd-subtle)]">{k}</dt>
                              <dd className="min-w-0 pr-4 [overflow-wrap:anywhere]">{show(v)}</dd>
                            </div>
                          ))}
                        </div>
                      </motion.dl>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Scrolled up while lines came in: how many, and the way back down. */}
      <AnimatePresence>
        {!pinned && (
          <motion.button
            type="button"
            onClick={toBottom}
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 480, damping: 32 }}
            className="absolute bottom-3 left-1/2 flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-medium text-[var(--bd-ui-ink-text)] outline-none [background:var(--bd-ui-ink)] shadow-[0_8px_20px_-8px_rgb(0_0_0/0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
          >
            <ArrowDownIcon weight="bold" className="size-3.5" />
            {unseen ? `${unseen} new ${unseen === 1 ? "line" : "lines"}` : "Latest"}
          </motion.button>
        )}
      </AnimatePresence>
    </section>
  );
}
