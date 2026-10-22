"use client";

import { CaretUpDownIcon, CheckIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

/*
 * One choice from a longer list: a pill pressed into the page like the input, that opens a card
 * of choices over everything else, grouped under small names, the chosen one ticked in ink. Focus
 * stays on the pill while the list is open, as a select's does: the arrows move through it, Enter
 * picks, Escape closes, and typing the start of a name jumps to it. The card follows the pill
 * when the page scrolls, opens upward when there's no room below, and wears the same light or
 * dark as the pill does.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export type SelectOption = { value: string; label: string; icon?: ReactNode; hint?: ReactNode; disabled?: boolean };
export type SelectGroup = { label: string; options: SelectOption[] };
const isGroup = (x: SelectOption | SelectGroup): x is SelectGroup => "options" in x;

export type SelectProps = {
  /** The choices: options, or groups of them under a name. */
  options: Array<SelectOption | SelectGroup>;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Shown while nothing is chosen. */
  placeholder?: string;
  /** Names it for screen readers when no Field or label does. */
  label?: string;
  size?: "sm" | "md";
  disabled?: boolean;
  /** With a name, a hidden input carries the choice in a form. */
  name?: string;
  id?: string;
  className?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-labelledby"?: string;
};

const SIZES = { sm: "h-9 pl-3.5 pr-2.5 text-[13px] [&_svg]:size-3.5", md: "h-11 pl-4 pr-3 text-sm [&_svg]:size-4" } as const;
const GAP = 6;

export function Select({ options, value, defaultValue, onValueChange, placeholder = "Choose one", label, size = "md", disabled, name, id, className, ...aria }: SelectProps) {
  const [inner, setInner] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [place, setPlace] = useState<{ style: CSSProperties; up: boolean; scope: { theme?: string; light?: boolean } } | null>(null);
  const auto = useId();
  const listId = `${auto}-list`;
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: "", at: 0 });

  const current = value ?? inner;
  const flat = options.flatMap((o) => (isGroup(o) ? o.options : [o]));
  const chosen = flat.find((o) => o.value === current);
  const optionId = (i: number) => `${auto}-option-${i}`;
  const enabled = (i: number) => !!flat[i] && !flat[i].disabled;

  const pick = (v: string) => {
    setInner(v);
    onValueChange?.(v);
  };

  // Under the pill, or over it when the window has no room below; in the pill's own light or dark.
  const measure = () => {
    const el = trigger.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const tall = list.current?.offsetHeight ?? 280;
    const up = innerHeight - r.bottom < tall + GAP + 8 && r.top > innerHeight - r.bottom;
    const scope = el.closest<HTMLElement>("[data-theme], .dark, .light, .bd-light");
    setPlace({
      up,
      style: { position: "fixed", left: Math.max(8, Math.min(r.left, innerWidth - Math.max(r.width, 200) - 8)), minWidth: Math.max(r.width, 200), ...(up ? { bottom: innerHeight - r.top + GAP } : { top: r.bottom + GAP }) },
      scope: { theme: scope?.dataset.theme ?? (scope?.classList.contains("dark") ? "dark" : undefined), light: !!scope && (scope.classList.contains("light") || scope.classList.contains("bd-light")) },
    });
  };

  const show = (at?: number) => {
    if (disabled) return;
    const sel = flat.findIndex((o) => o.value === current);
    setActive(at ?? (sel >= 0 ? sel : flat.findIndex((_, i) => enabled(i))));
    setOpen(true);
  };
  const hide = () => setOpen(false);

  useLayoutEffect(() => {
    if (open) measure();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!trigger.current?.contains(t) && !list.current?.contains(t)) hide();
    };
    // Measured again on the next frame, once the card has its height, to know whether it fits below.
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
  }, [open]);

  // The active choice stays in view as the arrows move through a long list.
  useEffect(() => {
    if (open && active >= 0) list.current?.querySelector(`#${CSS.escape(optionId(active))}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]); // eslint-disable-line react-hooks/exhaustive-deps

  const move = (from: number, step: number) => {
    for (let n = 1; n <= flat.length; n++) {
      const i = (from + step * n + flat.length * n) % flat.length;
      if (enabled(i)) return i;
    }
    return from;
  };

  // Typing the start of a name jumps to it; letters typed close together read as one word.
  const typeAhead = (key: string, now: number) => {
    typed.current = { text: now - typed.current.at < 600 ? typed.current.text + key.toLowerCase() : key.toLowerCase(), at: now };
    const from = open ? active : flat.findIndex((o) => o.value === current);
    const order = flat.map((_, n) => (from + 1 + n) % flat.length);
    const hit = order.find((i) => enabled(i) && flat[i].label.toLowerCase().startsWith(typed.current.text)) ?? order.find((i) => enabled(i) && flat[i].label.toLowerCase().startsWith(typed.current.text[0]));
    if (hit === undefined) return;
    if (open) setActive(hit);
    else pick(flat[hit].value);
  };

  const onKey = (e: KeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        show();
      } else if (e.key.length === 1 && /\S/.test(e.key) && !e.metaKey && !e.ctrlKey) typeAhead(e.key, e.timeStamp);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => move(a < 0 ? (e.key === "ArrowDown" ? -1 : 0) : a, e.key === "ArrowDown" ? 1 : -1));
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      setActive(e.key === "Home" ? move(-1, 1) : move(0, -1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (enabled(active)) pick(flat[active].value);
      hide();
    } else if (e.key === "Escape") {
      e.preventDefault();
      hide();
    } else if (e.key === "Tab") hide();
    else if (e.key.length === 1 && /\S/.test(e.key) && !e.metaKey && !e.ctrlKey) typeAhead(e.key, e.timeStamp);
  };

  const indexOf = new Map(flat.map((o, i) => [o.value, i]));
  const row = (o: SelectOption) => {
    const i = indexOf.get(o.value) ?? -1;
    const on = o.value === current;
    return (
      <div
        key={o.value}
        id={optionId(i)}
        role="option"
        aria-selected={on}
        aria-disabled={o.disabled || undefined}
        onPointerMove={() => !o.disabled && active !== i && setActive(i)}
        onClick={() => {
          if (o.disabled) return;
          pick(o.value);
          hide();
          trigger.current?.focus();
        }}
        className={cx("flex h-9 cursor-pointer select-none items-center gap-2.5 rounded-[11px] px-2.5 text-sm text-[var(--bd-fg)] transition-colors duration-100", i === active && "bg-[var(--bd-surface-2)]", o.disabled && "cursor-not-allowed opacity-40")}
      >
        {o.icon && <span className="flex shrink-0 text-[var(--bd-muted)] [&_svg]:size-4">{o.icon}</span>}
        <span className="min-w-0 flex-1 truncate">{o.label}</span>
        {o.hint && <span className="shrink-0 text-[12px] text-[var(--bd-subtle)]">{o.hint}</span>}
        <span className="grid w-4 shrink-0 place-items-center">{on && <CheckIcon size={14} weight="bold" />}</span>
      </div>
    );
  };

  return (
    <MotionConfig reducedMotion="user">
      <>
        <button
          ref={trigger}
          id={id}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
          aria-label={label}
          disabled={disabled}
          onClick={() => (open ? hide() : show())}
          onKeyDown={onKey}
          className={cx(
            "flex w-full items-center gap-2.5 rounded-full text-left text-[var(--bd-fg)] transition-[background-color,box-shadow] duration-200 ease-[var(--bd-ease)] disabled:cursor-not-allowed disabled:opacity-50",
            "focus-visible:outline-none",
            open
              ? "bg-[var(--bd-surface)] shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.4),0_0_0_4px_rgb(var(--bd-ink)/0.06)]"
              : "bg-[var(--bd-ui-field)] shadow-[var(--bd-ui-well)] hover:shadow-[inset_0_1px_2px_rgb(var(--bd-shade)/0.09),inset_0_0_0_1px_rgb(var(--bd-ink)/0.16)] focus-visible:bg-[var(--bd-surface)] focus-visible:shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.4),0_0_0_4px_rgb(var(--bd-ink)/0.06)]",
            "aria-[invalid=true]:shadow-[inset_0_0_0_1px_var(--bd-ui-stop),0_0_0_4px_color-mix(in_oklab,var(--bd-ui-stop)_14%,transparent)]",
            SIZES[size],
            className,
          )}
          {...aria}
        >
          {chosen?.icon && <span className="flex shrink-0 text-[var(--bd-muted)]">{chosen.icon}</span>}
          <span className={cx("min-w-0 flex-1 truncate", !chosen && "text-[var(--bd-subtle)]")}>{chosen?.label ?? placeholder}</span>
          <CaretUpDownIcon weight="regular" className="shrink-0 text-[var(--bd-subtle)]" />
        </button>
        {name && <input type="hidden" name={name} value={current ?? ""} disabled={disabled} />}
        {/* The card goes to the end of the page, above everything; only ever after a first open, so the server draws none. */}
        {place &&
          createPortal(
            <AnimatePresence>
              {open && place && (
                <div data-theme={place.scope.theme} className={place.scope.light ? "light bd-light" : undefined} style={{ display: "contents" }}>
                  <motion.div
                    ref={list}
                    id={listId}
                    role="listbox"
                    aria-label={label}
                    aria-labelledby={aria["aria-labelledby"]}
                    initial={{ opacity: 0, y: place.up ? 6 : -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: place.up ? 4 : -4, scale: 0.98, transition: { duration: 0.12 } }}
                    transition={{ type: "spring", stiffness: 560, damping: 38 }}
                    style={{ ...place.style, transformOrigin: place.up ? "bottom left" : "top left" }}
                    className="z-[1000] max-h-[min(320px,60vh)] max-w-[calc(100vw-16px)] overflow-y-auto rounded-[18px] bg-[var(--bd-surface)] p-1.5 text-[var(--bd-fg)] shadow-[var(--bd-shadow-float),0_0_0_1px_var(--bd-line)]"
                  >
                    {options.map((o, g) =>
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
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body,
          )}
      </>
    </MotionConfig>
  );
}
