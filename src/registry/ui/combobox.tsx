"use client";

import { CaretUpDownIcon, CheckIcon, MagnifyingGlassIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

/*
 * A select you can type into: a field pressed into the page, and as you type, a card of the
 * choices that match, in their groups, the matching letters drawn in ink. The arrows move a soft
 * highlight through the list while focus stays in the field; Enter picks. It can hold one choice,
 * or several as chips inside the field, take its choices from a search of your own as you type,
 * and offer to create what you typed when nothing matches it.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* True once it's running in the browser, so the server and the first render agree and the card's portal never trips hydration. */
const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

const SNAPPY = { type: "spring", stiffness: 520, damping: 42 } as const;
const SOFT = { type: "spring", stiffness: 300, damping: 30 } as const;
const GAP = 6;

export type ComboboxOption = { value: string; label: string; icon?: ReactNode; hint?: ReactNode; /** More words it answers to, besides its label. */ keywords?: string[]; disabled?: boolean };
export type ComboboxGroup = { label: string; options: ComboboxOption[] };
const isGroup = (x: ComboboxOption | ComboboxGroup): x is ComboboxGroup => "options" in x;

type Shared = {
  /** The choices: options, or groups of them under a name. */
  options: Array<ComboboxOption | ComboboxGroup>;
  /** Shown in the field while it's empty. */
  placeholder?: string;
  /** Names it for screen readers when no Field or label does. */
  label?: string;
  size?: "sm" | "md";
  disabled?: boolean;
  /** Called with what's typed as it changes, for choices that come from a search of your own. */
  onSearch?: (query: string) => void;
  /** Narrows the options to what's typed. Turn it off when onSearch already does. */
  filter?: boolean;
  /** Shows a row that says it's searching, while results are on their way. */
  loading?: boolean;
  /** Offers to create what's typed when no choice is called that, and is called with it. The new choice is picked. */
  onCreate?: (query: string) => void;
  /** What the list says when nothing matches. */
  empty?: ReactNode;
  /** With a name, hidden inputs carry the choice (or each choice) in a form. */
  name?: string;
  id?: string;
  className?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-labelledby"?: string;
  "aria-required"?: boolean | "true" | "false";
};

type One = { multiple?: false; value?: string | null; defaultValue?: string | null; onValueChange?: (value: string | null) => void };
type Many = { multiple: true; value?: string[]; defaultValue?: string[]; onValueChange?: (value: string[]) => void };
export type ComboboxProps = Shared & (One | Many);

/* The field's padding is set so a chip sits as far from the field's left edge as from its top. */
const SIZES = {
  sm: { field: "min-h-9 py-1 pr-1 text-[13px]", start: "pl-3", chips: "pl-1.5", chip: "h-6 text-[12px]", icon: "size-3.5" },
  md: { field: "min-h-11 py-2 pr-1.5 text-sm", start: "pl-3.5", chips: "pl-2", chip: "h-7 text-[13px]", icon: "size-4" },
} as const;

const toList = (v: string | string[] | null | undefined) => (v == null ? [] : Array.isArray(v) ? v : [v]);

/** A label with the part that matches what's typed drawn in ink, and the rest quieter. */
function Match({ text, query }: { text: string; query: string }) {
  const q = query.trim().toLowerCase();
  const at = q ? text.toLowerCase().indexOf(q.split(/\s+/)[0]) : -1;
  if (at < 0) return <>{text}</>;
  const end = at + q.split(/\s+/)[0].length;
  return (
    <>
      <span className="text-[var(--bd-muted)]">{text.slice(0, at)}</span>
      <span className="font-semibold text-[var(--bd-fg)]">{text.slice(at, end)}</span>
      <span className="text-[var(--bd-muted)]">{text.slice(end)}</span>
    </>
  );
}

export function Combobox(props: ComboboxProps) {
  const { options, placeholder = "Search", label, size = "md", disabled, onSearch, filter = true, loading, onCreate, empty = "Nothing matches that.", name, id, className } = props;
  const multiple = props.multiple === true;
  const reduced = useReducedMotion();
  const mounted = useMounted();
  const auto = useId();
  const listId = `${auto}-list`;
  const optionId = (i: number) => `${auto}-option-${i}`;

  const [inner, setInner] = useState<string[]>(() => toList(props.defaultValue));
  const chosen = props.value !== undefined ? toList(props.value) : inner;
  const [created, setCreated] = useState<ComboboxOption[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [armed, setArmed] = useState(false);
  const [place, setPlace] = useState<{ style: CSSProperties; up: boolean; scope: { theme?: string; light?: boolean } } | null>(null);
  const field = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const byKeys = useRef(false);
  const keepSelected = useRef(false);
  // The highlight is one soft bar that slides to the row it's on, measured within the list, so it
  // never trails behind when the card moves with the field.
  const lightY = useMotionValue(0);
  const lit = useRef<number | null>(null);

  const all: Array<ComboboxOption | ComboboxGroup> = created.length ? [...options, ...created.filter((c) => !options.some((o) => (isGroup(o) ? o.options : [o]).some((x) => x.value === c.value)))] : options;
  const everything = all.flatMap((o) => (isGroup(o) ? o.options : [o]));
  const labelOf = (v: string) => everything.find((o) => o.value === v)?.label ?? v;

  // What's shown: every choice that has each typed word in its label or keywords, in its group.
  const words = editing || multiple ? query.trim().toLowerCase().split(/\s+/).filter(Boolean) : [];
  const fits = (o: ComboboxOption) => !filter || words.every((w) => `${o.label} ${(o.keywords ?? []).join(" ")}`.toLowerCase().includes(w));
  const sections = all.map((o) => (isGroup(o) ? { ...o, options: o.options.filter(fits) } : o)).filter((o) => (isGroup(o) ? o.options.length > 0 : fits(o)));
  const rows = sections.flatMap((o) => (isGroup(o) ? o.options : [o]));
  const typed = query.trim();
  const canCreate = !!onCreate && !!typed && !everything.some((o) => o.label.toLowerCase() === typed.toLowerCase());
  const count = rows.length + (canCreate ? 1 : 0);
  const usable = (i: number) => (i === rows.length ? canCreate : !!rows[i] && !rows[i].disabled);
  const first = () => Array.from({ length: count }, (_, i) => i).find(usable) ?? -1;
  // The highlight stays on a row that's there; when the list changes under it, it goes to the first.
  const at = usable(active) ? active : first();

  const emit = (next: string[]) => {
    setInner(next);
    if (props.multiple === true) props.onValueChange?.(next);
    else props.onValueChange?.(next[0] ?? null);
  };

  // Under the field, or over it when the window has no room below; in the field's own light or dark.
  const measure = () => {
    const el = field.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const tall = list.current?.offsetHeight ?? 300;
    const up = innerHeight - r.bottom < tall + GAP + 8 && r.top > innerHeight - r.bottom;
    const scope = el.closest<HTMLElement>("[data-theme], .dark, .light, .bd-light");
    const width = Math.max(r.width, 240);
    setPlace({
      up,
      style: { position: "fixed", left: Math.max(8, Math.min(r.left, innerWidth - width - 8)), width, ...(up ? { bottom: innerHeight - r.top + GAP } : { top: r.bottom + GAP }) },
      scope: { theme: scope?.dataset.theme ?? (scope?.classList.contains("dark") ? "dark" : undefined), light: !!scope && (scope.classList.contains("light") || scope.classList.contains("bd-light")) },
    });
  };

  const show = () => {
    if (disabled || open) return;
    setActive(Math.max(0, rows.findIndex((o) => chosen.includes(o.value))));
    setOpen(true);
  };
  const hide = () => {
    setOpen(false);
    setEditing(false);
    if (!multiple) setQuery("");
  };

  // Measured before paint, so the card moves in the same frame as a field that grows a row of chips.
  useLayoutEffect(() => {
    if (open) measure();
  }, [open, chosen.length]);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!field.current?.contains(t) && !list.current?.contains(t)) hide();
    };
    const follow = () => measure();
    document.addEventListener("pointerdown", away);
    addEventListener("scroll", follow, true);
    addEventListener("resize", follow);
    const frame = requestAnimationFrame(follow);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", away);
      removeEventListener("scroll", follow, true);
      removeEventListener("resize", follow);
    };
  }, [open, query, chosen.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    const el = open && at >= 0 ? list.current?.querySelector<HTMLElement>(`#${CSS.escape(optionId(at))}`) : null;
    const top = el ? el.offsetTop : null;
    if (top === lit.current) return;
    if (top !== null && lit.current !== null && !reduced) animate(lightY, top, SNAPPY);
    else if (top !== null) lightY.set(top);
    lit.current = top;
  });

  // The highlighted row stays in view as the arrows move through a long list; the pointer moves it without scrolling.
  useEffect(() => {
    if (open && at >= 0 && byKeys.current) list.current?.querySelector(`#${CSS.escape(optionId(at))}`)?.scrollIntoView({ block: "nearest" });
  }, [open, at]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (i: number) => {
    if (!usable(i)) return;
    let value: string;
    if (i === rows.length) {
      value = typed;
      onCreate?.(typed);
      setCreated((c) => (c.some((x) => x.value === value) ? c : [...c, { value, label: value }]));
    } else value = rows[i].value;
    if (multiple) {
      emit(chosen.includes(value) ? chosen.filter((v) => v !== value) : [...chosen, value]);
      setQuery("");
      onSearch?.("");
      // The whole list comes back; the highlight stays on what was just picked.
      const back = everything.findIndex((o) => o.value === value);
      setActive(back >= 0 ? back : everything.length);
    } else {
      emit([value]);
      hide();
    }
    input.current?.focus();
  };

  const remove = (value: string) => {
    emit(chosen.filter((v) => v !== value));
    setArmed(false);
    input.current?.focus();
  };

  const step = (from: number, by: number) => {
    for (let n = 1; n <= count; n++) {
      const i = (((from + by * n) % count) + count) % count;
      if (usable(i)) return i;
    }
    return from;
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    keepSelected.current = false;
    if (e.key !== "Backspace") setArmed(false);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      byKeys.current = true;
      if (!open) return show();
      setActive(step(at < 0 ? (e.key === "ArrowDown" ? -1 : 0) : at, e.key === "ArrowDown" ? 1 : -1));
    } else if (e.key === "Enter") {
      if (!open) return;
      e.preventDefault();
      byKeys.current = true;
      choose(at);
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        hide();
      } else if (query) {
        e.preventDefault();
        setQuery("");
        onSearch?.("");
      }
    } else if (e.key === "Tab") {
      if (open) hide();
    } else if (e.key === "Backspace" && multiple && !query && chosen.length) {
      // The first Backspace marks the last chip; the second takes it away.
      e.preventDefault();
      if (armed) remove(chosen[chosen.length - 1]);
      else setArmed(true);
    }
  };

  const s = SIZES[size];
  const invalid = props["aria-invalid"] === true || props["aria-invalid"] === "true";
  const shownText = multiple || editing ? query : chosen[0] ? labelOf(chosen[0]) : "";
  const spring = reduced ? { duration: 0 } : SNAPPY;

  const row = (o: ComboboxOption) => {
    const i = rows.indexOf(o);
    const on = chosen.includes(o.value);
    return (
      <div
        key={o.value}
        id={optionId(i)}
        role="option"
        aria-selected={on}
        aria-disabled={o.disabled || undefined}
        onPointerMove={() => {
          byKeys.current = false;
          if (!o.disabled && at !== i) setActive(i);
        }}
        // Pressing a row mustn't take focus from the field.
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => choose(i)}
        className={cx("relative flex h-9 cursor-pointer select-none items-center gap-2.5 rounded-[11px] px-2.5 text-sm text-[var(--bd-fg)]", o.disabled && "cursor-not-allowed opacity-40")}
      >
        {o.icon && <span className="relative flex shrink-0 text-[var(--bd-muted)] [&_svg]:size-4">{o.icon}</span>}
        <span className="relative min-w-0 flex-1 truncate">
          <Match text={o.label} query={words.length ? query : ""} />
        </span>
        {o.hint && <span className="relative shrink-0 text-[12px] text-[var(--bd-subtle)]">{o.hint}</span>}
        {multiple ? (
          <span aria-hidden className={cx("relative grid size-4 shrink-0 place-items-center rounded-[5px] transition-[background-color,box-shadow] duration-200", on ? "text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]" : "shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.2)]")}>
            {on && <CheckIcon size={10} weight="bold" />}
          </span>
        ) : (
          <span className="relative grid w-4 shrink-0 place-items-center">{on && <CheckIcon size={14} weight="bold" />}</span>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        ref={field}
        onPointerDown={(e) => {
          if (disabled || e.button !== 0) return;
          // A press on the field (not on a chip's cross) puts the caret in it and opens the list.
          if (e.target !== input.current) e.preventDefault();
          input.current?.focus();
          if (open && e.target !== input.current) hide();
          else show();
        }}
        className={cx(
          "flex w-full cursor-text items-start gap-1.5 rounded-[22px] text-[var(--bd-fg)] transition-[background-color,box-shadow] duration-200 ease-[var(--bd-ease)]",
          open ? "bg-[var(--bd-surface)] shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.4),0_0_0_4px_rgb(var(--bd-ink)/0.06)]" : "bg-[var(--bd-ui-field)] shadow-[var(--bd-ui-well)] hover:shadow-[inset_0_1px_2px_rgb(var(--bd-shade)/0.09),inset_0_0_0_1px_rgb(var(--bd-ink)/0.16)] focus-within:bg-[var(--bd-surface)] focus-within:shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.4),0_0_0_4px_rgb(var(--bd-ink)/0.06)]",
          invalid && "shadow-[inset_0_0_0_1px_var(--bd-ui-stop),0_0_0_4px_color-mix(in_oklab,var(--bd-ui-stop)_14%,transparent)]",
          disabled && "cursor-not-allowed opacity-50",
          s.field,
          multiple && chosen.length ? s.chips : s.start,
          className,
        )}
      >
        {!multiple && (
          <span aria-hidden className="grid h-7 shrink-0 place-items-center text-[var(--bd-subtle)]">
            <MagnifyingGlassIcon weight="duotone" className={s.icon} />
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <AnimatePresence initial={false} mode="popLayout">
            {multiple &&
              chosen.map((v, i) => (
                <motion.span
                  key={v}
                  layout="position"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8, transition: { duration: 0.12 } }}
                  transition={spring}
                  className={cx(
                    "inline-flex max-w-full shrink-0 items-center gap-1 rounded-full bg-[var(--bd-ui-track)] pl-2.5 pr-1 font-medium text-[var(--bd-fg)] transition-shadow duration-200",
                    s.chip,
                    armed && i === chosen.length - 1 && "shadow-[0_0_0_1.5px_rgb(var(--bd-ink)/0.55)]",
                  )}
                >
                  <span className="truncate">{labelOf(v)}</span>
                  <button
                    type="button"
                    tabIndex={-1}
                    disabled={disabled}
                    aria-label={`Remove ${labelOf(v)}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => remove(v)}
                    className="grid size-5 place-items-center rounded-full text-[var(--bd-muted)] transition-[color,background-color,scale] duration-150 hover:bg-[var(--bd-surface)] hover:text-[var(--bd-fg)] active:scale-90"
                  >
                    <XIcon size={10} weight="regular" />
                  </button>
                </motion.span>
              ))}
          </AnimatePresence>
          <input
            ref={input}
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-controls={open ? listId : undefined}
            aria-activedescendant={open && at >= 0 ? optionId(at) : undefined}
            aria-autocomplete="list"
            aria-label={label}
            aria-labelledby={props["aria-labelledby"]}
            aria-describedby={props["aria-describedby"]}
            aria-invalid={invalid || undefined}
            aria-required={props["aria-required"]}
            disabled={disabled}
            value={shownText}
            placeholder={multiple && chosen.length ? "" : placeholder}
            autoComplete="off"
            spellCheck={false}
            onFocus={(e) => {
              if (!multiple && chosen.length && !editing) {
                e.currentTarget.select();
                keepSelected.current = true;
              }
            }}
            // The press that focused it would put the caret down and lose the selection; typing should replace the choice.
            onMouseUp={(e) => {
              if (keepSelected.current) e.preventDefault();
              keepSelected.current = false;
            }}
            onBlur={() => {
              keepSelected.current = false;
              setArmed(false);
              if (open) hide();
            }}
            onChange={(e) => {
              const next = e.target.value;
              setQuery(next);
              setEditing(true);
              setArmed(false);
              setActive(-1);
              if (!open) setOpen(true);
              onSearch?.(next);
            }}
            onKeyDown={onKey}
            className="h-7 min-w-[60px] flex-1 bg-transparent outline-none placeholder:text-[var(--bd-subtle)] disabled:cursor-not-allowed"
          />
        </div>
        <span aria-hidden className="grid size-7 shrink-0 place-items-center text-[var(--bd-subtle)]">
          <CaretUpDownIcon weight="regular" className={s.icon} />
        </span>
      </div>
      {name && chosen.map((v) => <input key={v} type="hidden" name={name} value={v} disabled={disabled} />)}
      {mounted &&
        place &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div data-theme={place.scope.theme} className={place.scope.light ? "light bd-light" : undefined} style={{ display: "contents" }}>
                <motion.div
                  ref={list}
                  id={listId}
                  role="listbox"
                  aria-multiselectable={multiple || undefined}
                  aria-label={label}
                  aria-labelledby={props["aria-labelledby"]}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: place.up ? 6 : -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: reduced ? 0 : place.up ? 4 : -4, scale: reduced ? 1 : 0.98, transition: { duration: 0.12 } }}
                  transition={reduced ? { duration: 0.12 } : SOFT}
                  style={{ ...place.style, transformOrigin: place.up ? "bottom left" : "top left" }}
                  className="z-[1000] max-h-[min(320px,60vh)] overflow-y-auto overscroll-contain rounded-[18px] bg-[var(--bd-surface)] p-1.5 text-[var(--bd-fg)] shadow-[var(--bd-shadow-float),0_0_0_1px_var(--bd-line)]"
                >
                  <motion.span aria-hidden style={{ y: lightY }} className={cx("pointer-events-none absolute inset-x-1.5 top-0 h-9 rounded-[11px] bg-[rgb(var(--bd-ink)/0.055)] transition-opacity duration-150", at >= 0 ? "opacity-100" : "opacity-0")} />
                  {sections.map((o, g) =>
                    isGroup(o) ? (
                      <div key={o.label} role="group" aria-labelledby={`${auto}-group-${g}`} className={cx(g > 0 && "mt-1 border-t border-[var(--bd-line-subtle)] pt-1")}>
                        <div id={`${auto}-group-${g}`} className="px-2.5 pb-1 pt-1.5 text-[11.5px] font-medium text-[var(--bd-subtle)]">
                          {o.label}
                        </div>
                        {o.options.map(row)}
                      </div>
                    ) : (
                      row(o)
                    ),
                  )}
                  {canCreate && (
                    <div
                      id={optionId(rows.length)}
                      role="option"
                      aria-selected={false}
                      onPointerMove={() => {
                        byKeys.current = false;
                        if (at !== rows.length) setActive(rows.length);
                      }}
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={() => choose(rows.length)}
                      className={cx("relative flex h-9 cursor-pointer select-none items-center gap-2.5 rounded-[11px] px-2.5 text-sm text-[var(--bd-fg)]", rows.length > 0 && "mt-1")}
                    >
                      <span className="relative grid size-5 shrink-0 place-items-center rounded-full bg-[var(--bd-ui-track)]">
                        <PlusIcon size={11} weight="regular" />
                      </span>
                      <span className="relative min-w-0 flex-1 truncate">
                        Create <span className="font-semibold">&ldquo;{typed}&rdquo;</span>
                      </span>
                      <span className="relative text-[11px] text-[var(--bd-subtle)]">Enter</span>
                    </div>
                  )}
                  {loading && (
                    <div role="status" className="flex h-9 items-center gap-2.5 px-2.5 text-sm text-[var(--bd-muted)]">
                      <span aria-hidden className="flex gap-[3px]">
                        {[0, 1, 2].map((d) => (
                          <span key={d} className="size-[5px] animate-[bd-ui-dither_0.9s_ease-in-out_infinite] rounded-full bg-[var(--bd-fg)]" style={{ animationDelay: `${d * 0.15}s` }} />
                        ))}
                      </span>
                      Searching
                    </div>
                  )}
                  {!loading && count === 0 && (
                    <div role="status" className="px-2.5 py-3 text-sm text-[var(--bd-muted)]">
                      {empty}
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
