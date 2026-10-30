"use client";

import { CaretRightIcon, CheckIcon, FunnelSimpleIcon, MagnifyingGlassIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

/*
 * Filters read as a sentence you edit in place: Showing deploys where status is not failed and
 * region is any of Frankfurt or Tokyo. Every dashed word answers a click: "is" flips to "is not",
 * a value opens the values to tick, with a search; a condition's cross takes it away. "Where" and
 * "And" add one, a part then its values. The lists open under their words, and the arrow keys,
 * Enter and Escape drive them.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export type FilterOption = { value: string; label: string; icon?: ReactNode };
export type FilterField = { id: string; label: string; icon?: ReactNode; options: FilterOption[]; /** A word for several of its values: "3 regions". */ plural?: string };
export type Filter = { field: string; values: string[]; not?: boolean };

export type FilterBarProps = {
  fields: FilterField[];
  value?: Filter[];
  defaultValue?: Filter[];
  onValueChange?: (filters: Filter[]) => void;
  /** What's being filtered, for the sentence: "Showing all deploys", "Showing deploys where…". */
  noun?: string;
  /** After the sentence, at the far end: a view switch, a count. */
  children?: ReactNode;
  label?: string;
  className?: string;
};

type Open = { kind: "add"; field?: string } | { kind: "values"; field: string } | null;

/** The list under a chip: a search, then options to tick (or fields to pick), driven by the keys. */
function List({ items, picked, onPick, onClose, search, title }: { items: Array<{ id: string; label: string; icon?: ReactNode; more?: boolean }>; picked?: string[]; onPick: (id: string) => void; onClose: () => void; search: string; title: string }) {
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);
  const shown = items.filter((i) => i.label.toLowerCase().includes(q.trim().toLowerCase()));
  const still = useReducedMotion();
  const key = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setAt((a) => (a + (e.key === "ArrowDown" ? 1 : -1) + shown.length) % Math.max(shown.length, 1));
    } else if (e.key === "Enter" && shown[at]) {
      e.preventDefault();
      onPick(shown[at].id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: -4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.1 } }}
      transition={still ? { duration: 0 } : { type: "spring", stiffness: 560, damping: 38 }}
      className="absolute left-0 top-full z-40 mt-1.5 w-[248px] origin-top-left overflow-hidden rounded-[14px] bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.1),0_12px_32px_-12px_rgb(var(--bd-shade)/0.45),0_2px_6px_rgb(var(--bd-shade)/0.08)]"
    >
      <label className="flex h-10 items-center gap-2 border-b border-[var(--bd-line-subtle)] px-3 text-[13px]">
        <MagnifyingGlassIcon size={14} className="shrink-0 text-[var(--bd-subtle)]" />
        <input
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAt(0);
          }}
          onKeyDown={key}
          placeholder={search}
          aria-label={title}
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--bd-subtle)]"
        />
      </label>
      <ul role="listbox" aria-label={title} aria-multiselectable={!!picked} className="max-h-[260px] overflow-y-auto p-1">
        {shown.map((i, n) => {
          const on = picked?.includes(i.id);
          return (
            <li
              key={i.id}
              role="option"
              aria-selected={!!on}
              onPointerMove={() => setAt(n)}
              onClick={() => onPick(i.id)}
              className={cx("flex h-8 cursor-pointer select-none items-center gap-2.5 rounded-[9px] px-2.5 text-[13px] [&_svg]:size-3.5 [&_svg]:shrink-0", n === at && "bg-[rgb(var(--bd-ink)/0.06)]")}
            >
              {picked && <span className={cx("grid size-4 shrink-0 place-items-center rounded-[5px] transition-colors", on ? "text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]" : "shadow-[inset_0_0_0_1px_var(--bd-line-strong)]")}>{on && <CheckIcon weight="bold" className="!size-2.5" />}</span>}
              {i.icon && <span className="flex text-[var(--bd-muted)]">{i.icon}</span>}
              <span className="min-w-0 flex-1 truncate">{i.label}</span>
              {i.more && <CaretRightIcon weight="regular" className="text-[var(--bd-subtle)]" />}
            </li>
          );
        })}
        {!shown.length && <li className="px-2.5 py-2 text-[12.5px] text-[var(--bd-subtle)]">Nothing matches.</li>}
      </ul>
    </motion.div>
  );
}

export function FilterBar({ fields, value, defaultValue = [], onValueChange, noun, children, label = "Filters", className }: FilterBarProps) {
  const [inner, setInner] = useState(defaultValue);
  const filters = value ?? inner;
  const [open, setOpen] = useState<Open>(null);
  const root = useRef<HTMLDivElement>(null);
  const set = (next: Filter[]) => {
    setInner(next);
    onValueChange?.(next);
  };
  const fieldOf = (id: string) => fields.find((f) => f.id === id)!;

  // A click anywhere else closes the list.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(null);
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  const toggle = (field: string, v: string) => {
    const has = filters.find((f) => f.field === field);
    if (!has) return set([...filters, { field, values: [v] }]);
    const values = has.values.includes(v) ? has.values.filter((x) => x !== v) : [...has.values, v];
    set(values.length ? filters.map((f) => (f.field === field ? { ...f, values } : f)) : filters.filter((f) => f.field !== field));
  };
  const words = (f: Filter) => {
    const fd = fieldOf(f.field);
    if (f.values.length === 1) return fd.options.find((o) => o.value === f.values[0])?.label ?? f.values[0];
    if (f.values.length === 2) return f.values.map((v) => fd.options.find((o) => o.value === v)?.label ?? v).join(" or ");
    return `${f.values.length} ${fd.plural ?? fd.label.toLowerCase()}`;
  };
  const free = fields.filter((f) => !filters.some((x) => x.field === f.id));
  // Each editable word: dashed underlined, a soft wash where it's pointed at.
  const word = "inline-flex h-7 items-center gap-1 rounded-[7px] px-1.5 underline decoration-dashed decoration-[color:var(--bd-line-strong)] underline-offset-[5px] outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.05)] hover:decoration-[color:var(--bd-fg)] focus-visible:bg-[rgb(var(--bd-ink)/0.06)] aria-expanded:bg-[rgb(var(--bd-ink)/0.06)] [&_svg]:size-3.5";

  return (
    <div ref={root} role="group" aria-label={label} className={cx("flex flex-wrap items-center gap-x-0.5 gap-y-1 text-[13px] text-[var(--bd-muted)]", className)}>
      <span className="mr-1 inline-flex h-7 items-center gap-2">
        <FunnelSimpleIcon weight="duotone" className="size-4 text-[var(--bd-subtle)]" />
        Showing {filters.length ? noun ?? "what" : `all ${noun ?? "of it"}`}
      </span>
      <AnimatePresence initial={false}>
        {filters.map((f, i) => {
          const fd = fieldOf(f.field);
          const icon = fd.options.find((o) => o.value === f.values[0])?.icon;
          return (
            <motion.span key={f.field} layout initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 560, damping: 40 }} className="group/cond relative inline-flex items-center gap-0.5">
              <span className="px-0.5">{i === 0 ? (noun ? "where" : "has") : "and"}</span>
              <span className="px-0.5 font-medium text-[var(--bd-fg)]">{fd.label.toLowerCase()}</span>
              <button type="button" onClick={() => set(filters.map((x) => (x.field === f.field ? { ...x, not: !x.not } : x)))} aria-label={`${fd.label} ${f.not ? "is not" : "is"}: switch`} className={word}>
                {f.not ? "is not" : f.values.length > 1 ? "is any of" : "is"}
              </button>
              <button type="button" onClick={() => setOpen(open?.kind === "values" && open.field === f.field ? null : { kind: "values", field: f.field })} aria-expanded={open?.kind === "values" && open.field === f.field} className={cx(word, "font-medium text-[var(--bd-fg)]")}>
                {icon && f.values.length === 1 && <span className="flex text-[var(--bd-muted)]">{icon}</span>}
                {words(f)}
              </button>
              <button type="button" onClick={() => set(filters.filter((x) => x.field !== f.field))} aria-label={`Take away the ${fd.label.toLowerCase()} condition`} className="grid size-5 place-items-center rounded-full text-[var(--bd-subtle)] opacity-0 outline-none transition-opacity hover:bg-[rgb(var(--bd-ink)/0.07)] hover:text-[var(--bd-fg)] focus-visible:opacity-100 group-hover/cond:opacity-100 [&_svg]:size-3">
                <XIcon weight="regular" />
              </button>
              <AnimatePresence>
                {open?.kind === "values" && open.field === f.field && <List title={fd.label} search={`Find ${fd.plural ?? fd.label.toLowerCase()}`} items={fd.options.map((o) => ({ id: o.value, label: o.label, icon: o.icon }))} picked={f.values} onPick={(v) => toggle(f.field, v)} onClose={() => setOpen(null)} />}
              </AnimatePresence>
            </motion.span>
          );
        })}
      </AnimatePresence>

      {free.length > 0 && (
        <span className="relative ml-1">
          <button type="button" onClick={() => setOpen(open?.kind === "add" ? null : { kind: "add" })} aria-expanded={open?.kind === "add"} className="inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[12.5px] font-medium text-[var(--bd-muted)] shadow-[inset_0_0_0_1px_var(--bd-line)] outline-none transition-colors hover:text-[var(--bd-fg)] hover:shadow-[inset_0_0_0_1px_var(--bd-line-strong)] focus-visible:shadow-[inset_0_0_0_1px_var(--bd-fg)] aria-expanded:text-[var(--bd-fg)] [&_svg]:size-3">
            <PlusIcon weight="regular" />
            {filters.length ? "And" : "Where"}
          </button>
          <AnimatePresence mode="wait">
            {open?.kind === "add" &&
              (open.field ? (
                <List key={open.field} title={fieldOf(open.field).label} search={`Find ${fieldOf(open.field).plural ?? fieldOf(open.field).label.toLowerCase()}`} items={fieldOf(open.field).options.map((o) => ({ id: o.value, label: o.label, icon: o.icon }))} picked={filters.find((x) => x.field === open.field)?.values ?? []} onPick={(v) => toggle(open.field!, v)} onClose={() => setOpen(null)} />
              ) : (
                <List key="fields" title="Where" search="Which part" items={free.map((f) => ({ id: f.id, label: f.label, icon: f.icon, more: true }))} onPick={(id) => setOpen({ kind: "add", field: id })} onClose={() => setOpen(null)} />
              ))}
          </AnimatePresence>
        </span>
      )}

      {filters.length > 0 && (
        <button type="button" onClick={() => set([])} className="ml-1 h-7 rounded-full px-2 text-[12.5px] text-[var(--bd-muted)] outline-none transition-colors hover:text-[var(--bd-fg)] focus-visible:bg-[rgb(var(--bd-ink)/0.06)]">
          Show all
        </button>
      )}
      {children && <span className="ml-auto flex items-center gap-2">{children}</span>}
    </div>
  );
}
