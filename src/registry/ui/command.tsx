"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

/*
 * A search that does things: type to narrow a list of pages and actions, arrows to move, Enter
 * to go. Use it in place, or as a palette over the page that opens with ⌘K (Ctrl K elsewhere),
 * a white card with the hero's light at its head like basedraft's own. Groups with nothing left
 * in them step aside, and when nothing matches it says so.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* True once it's running in the browser: the server and the first render agree on false, so the portal never trips hydration. */
const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

type Ctx = {
  query: string;
  setQuery: (q: string) => void;
  active: string | null;
  setActive: (v: string | null) => void;
  listId: string;
  /* Each item's way to run, by its value, so Enter can run the one that's active. */
  actions: { current: Map<string, () => void> };
  root: { current: HTMLDivElement | null };
  onEscape?: () => void;
};
const CommandContext = createContext<Ctx | null>(null);
const useCommand = () => {
  const c = useContext(CommandContext);
  if (!c) throw new Error("Command parts go inside <Command>.");
  return c;
};

const words = (q: string) => q.trim().toLowerCase().split(/\s+/).filter(Boolean);
const slug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const ITEM = "[data-cmd-item]";

/* The items still showing, in the order they're drawn. */
const visible = (root: HTMLElement | null) => [...(root?.querySelectorAll<HTMLElement>(ITEM) ?? [])];

/** The palette itself: the field, the list, and what they share. Give it a `label` for screen readers. */
export function Command({ label = "Search", bare, className, children, onEscape }: { label?: string; /** No card of its own, for a palette set inside another surface. */ bare?: boolean; className?: string; children: ReactNode; /** Called on Escape, as CommandDialog does to close itself. */ onEscape?: () => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const listId = useId();
  const actions = useRef(new Map<string, () => void>());
  const root = useRef<HTMLDivElement | null>(null);
  // Starts on the first item.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setActive((a) => a ?? visible(root.current)[0]?.dataset.value ?? null));
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <CommandContext.Provider value={{ query, setQuery, active, setActive, listId, actions, root, onEscape }}>
      <div ref={root} aria-label={label} className={cx("flex w-full flex-col overflow-hidden text-[var(--bd-fg)]", !bare && "rounded-[20px] bg-[var(--bd-surface)] shadow-[var(--bd-shadow-raised),0_0_0_1px_rgb(var(--bd-ink)/0.08)]", className)}>
        {children}
      </div>
    </CommandContext.Provider>
  );
}

/** The field you type in. Arrows move through what's showing, Enter runs it, Escape clears it (or closes the palette). */
export function CommandInput({ placeholder = "Search", className, ...props }: Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange">) {
  const { query, setQuery, active, setActive, listId, actions, root, onEscape } = useCommand();
  const move = (by: number) => {
    const all = visible(root.current);
    if (!all.length) return;
    const at = all.findIndex((el) => el.dataset.value === active);
    const next = by === Infinity ? all.length - 1 : by === -Infinity ? 0 : (at + by + all.length) % all.length;
    setActive(all[next].dataset.value ?? null);
  };
  const onKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") move(1);
    else if (e.key === "ArrowUp") move(-1);
    else if (e.key === "Home" && e.ctrlKey) move(-Infinity);
    else if (e.key === "End" && e.ctrlKey) move(Infinity);
    else if (e.key === "Enter" && active) actions.current.get(active)?.();
    else if (e.key === "Escape") {
      if (query && !onEscape) setQuery("");
      else onEscape?.();
    } else return;
    e.preventDefault();
  };
  return (
    <div className="flex items-center gap-3 border-b border-[var(--bd-line-subtle)] px-4">
      <MagnifyingGlassIcon weight="duotone" className="size-[18px] shrink-0 text-[var(--bd-subtle)]" />
      <input
        role="combobox"
        aria-expanded="true"
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active ? `${listId}-${slug(active)}` : undefined}
        autoComplete="off"
        spellCheck={false}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          // The first match becomes the active one, once the list has redrawn.
          requestAnimationFrame(() => setActive(visible(root.current)[0]?.dataset.value ?? null));
        }}
        onKeyDown={onKey}
        placeholder={placeholder}
        className={cx("h-[52px] min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[var(--bd-subtle)]", className)}
        {...props}
      />
    </div>
  );
}

/** The list of groups and items. It scrolls on its own when it's long. */
export function CommandList({ label = "Results", className, children }: { label?: string; className?: string; children: ReactNode }) {
  const { listId } = useCommand();
  return (
    <div id={listId} role="listbox" aria-label={label} className={cx("group/list max-h-[320px] scroll-py-1.5 overflow-y-auto overscroll-contain p-1.5", className)}>
      {children}
    </div>
  );
}

/** What it says when nothing matches. It only shows then. */
export function CommandEmpty({ className, children = "Nothing matches that." }: { className?: string; children?: ReactNode }) {
  return <p className={cx("px-4 py-10 text-center text-sm text-[var(--bd-muted)] group-has-[[data-cmd-item]]/list:hidden", className)}>{children}</p>;
}

/** A group of items under a small heading. With nothing left in it, it steps aside. */
export function CommandGroup({ heading, className, children }: { heading?: ReactNode; className?: string; children: ReactNode }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={heading ? id : undefined} className={cx("hidden has-[[data-cmd-item]]:block [&+&]:mt-1", className)}>
      {heading && (
        <p id={id} className="px-2.5 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--bd-subtle)]">
          {heading}
        </p>
      )}
      {children}
    </div>
  );
}

/**
 * One item. `value` is what it's found by, with `keywords` for other words that should find it;
 * `onSelect` runs on a click or Enter. Its icon sits on a small tile; a shortcut or a hint at the end.
 */
export function CommandItem({ value, keywords = [], icon, shortcut, hint, onSelect, disabled, className, children }: { value: string; keywords?: string[]; icon?: ReactNode; /** Shown, not bound: ["⌘", "P"]. */ shortcut?: string[]; hint?: ReactNode; onSelect?: () => void; disabled?: boolean; className?: string; children: ReactNode }) {
  const { query, active, setActive, listId, actions } = useCommand();
  const ref = useRef<HTMLDivElement>(null);
  const run = useCallback(() => {
    if (!disabled) onSelect?.();
  }, [disabled, onSelect]);
  useEffect(() => {
    const map = actions.current;
    map.set(value, run);
    return () => {
      map.delete(value);
    };
  }, [actions, value, run]);
  const on = active === value;
  useEffect(() => {
    if (on) ref.current?.scrollIntoView({ block: "nearest" });
  }, [on]);
  const hay = `${value} ${keywords.join(" ")} ${typeof children === "string" ? children : ""}`.toLowerCase();
  if (!words(query).every((w) => hay.includes(w))) return null;
  return (
    <div
      ref={ref}
      id={`${listId}-${slug(value)}`}
      role="option"
      aria-selected={on}
      aria-disabled={disabled || undefined}
      data-cmd-item=""
      data-value={value}
      onPointerMove={() => !on && setActive(value)}
      onClick={run}
      className={cx("relative flex h-11 cursor-default select-none items-center gap-3 rounded-[12px] px-2.5 text-sm transition-colors duration-100 aria-disabled:opacity-45", on ? "bg-[rgb(var(--bd-ink)/0.06)] text-[var(--bd-fg)]" : "text-[color-mix(in_oklab,var(--bd-fg)_86%,transparent)]", className)}
    >
      {/* The active one carries a short ink mark at its edge. */}
      <span aria-hidden className={cx("absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full transition-opacity duration-150 [background:var(--bd-ui-ink)]", on ? "opacity-100" : "opacity-0")} />
      {icon && <span className={cx("grid size-7 shrink-0 place-items-center rounded-[8px] transition-colors [&_svg]:size-4", on ? "bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[var(--bd-ui-lift)]" : "bg-[rgb(var(--bd-ink)/0.05)] text-[var(--bd-muted)]")}>{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {hint && <span className="shrink-0 text-xs text-[var(--bd-subtle)]">{hint}</span>}
      {shortcut && (
        <span aria-hidden className="flex shrink-0 gap-0.5">
          {shortcut.map((k) => (
            <kbd key={k} className="grid h-5 min-w-5 place-items-center rounded-[5px] bg-[rgb(var(--bd-ink)/0.05)] px-1 font-sans text-[11px] font-medium text-[var(--bd-subtle)] shadow-[inset_0_-1px_0_rgb(var(--bd-ink)/0.08)]">
              {k}
            </kbd>
          ))}
        </span>
      )}
    </div>
  );
}

/** The foot: the keys that work here, small, so the palette teaches itself. */
export function CommandFooter({ className, children }: { className?: string; children?: ReactNode }) {
  const cap = "grid h-[18px] min-w-[18px] place-items-center rounded-[5px] bg-[rgb(var(--bd-ink)/0.05)] px-1 font-sans text-[10.5px] font-medium shadow-[inset_0_-1px_0_rgb(var(--bd-ink)/0.08)]";
  return (
    <div className={cx("flex items-center gap-4 border-t border-[var(--bd-line-subtle)] px-4 py-2.5 text-xs text-[var(--bd-subtle)]", className)}>
      <span className="flex items-center gap-1.5">
        <kbd className={cap}>↑</kbd>
        <kbd className={cap}>↓</kbd> to move
      </span>
      <span className="flex items-center gap-1.5">
        <kbd className={cap}>↵</kbd> to open
      </span>
      {children && <span className="ml-auto">{children}</span>}
    </div>
  );
}

/* The light or dark of the page, carried into the portal. */
function scopeOf(el: Element | null): { "data-theme"?: string; className?: string } {
  if (!el) return {};
  const byAttr = el.closest("[data-theme]");
  const byClass = el.closest(".dark, .light, .bd-light");
  const near = byAttr && byClass ? (byAttr.contains(byClass) ? byClass : byAttr) : (byAttr ?? byClass);
  if (!near) return {};
  if (near === byAttr) return { "data-theme": near.getAttribute("data-theme") ?? undefined };
  return { className: ["dark", "bd-light", "light"].find((c) => near.classList.contains(c)) };
}

/**
 * The palette as a dialog over the page, the way ⌘K works in basedraft: it opens with the
 * shortcut (or `open`), closes on Escape, a click behind it, or choosing an item, and hands
 * focus back to where it was.
 */
export function CommandDialog({ open, defaultOpen = false, onOpenChange, shortcut = "k", label = "Search", className, children }: { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void; /** The letter that, with ⌘ or Ctrl, opens and closes it. false for none. */ shortcut?: string | false; label?: string; className?: string; children: ReactNode }) {
  const [inner, setInner] = useState(defaultOpen);
  const shown = open ?? inner;
  const still = useReducedMotion();
  const mounted = useMounted();
  const card = useRef<HTMLDivElement>(null);
  const [scope, setScope] = useState<ReturnType<typeof scopeOf>>({});
  const setOpen = useCallback(
    (o: boolean) => {
      if (o) setScope(scopeOf(document.activeElement));
      setInner(o);
      onOpenChange?.(o);
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (!shortcut) return;
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === shortcut) {
        e.preventDefault();
        setOpen(!shown);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [shortcut, shown, setOpen]);

  useEffect(() => {
    if (!shown) return;
    const back = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => card.current?.querySelector("input")?.focus());
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      root.style.overflow = overflow;
      if (back?.isConnected) back.focus();
    };
  }, [shown]);

  if (!mounted) return null;
  return createPortal(
    <div {...scope} style={{ display: "contents" }}>
      <AnimatePresence>
        {shown && (
          <motion.div key="command" className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh] text-[var(--bd-fg)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }}>
            <div aria-hidden className="fixed inset-0 bg-[rgb(var(--bd-shade)/0.38)] backdrop-blur-[3px]" onClick={() => setOpen(false)} />
            <motion.div
              ref={card}
              role="dialog"
              aria-modal="true"
              aria-label={label}
              initial={still ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={still ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.985 }}
              transition={{ type: "spring", stiffness: 480, damping: 38 }}
              // Choosing an item closes it.
              onClickCapture={(e) => (e.target as HTMLElement).closest(ITEM) && setOpen(false)}
              onKeyDownCapture={(e) => {
                if (e.key === "Enter") setTimeout(() => setOpen(false));
                // The field is the one thing to focus here; Tab stays put rather than leaving for the page behind.
                if (e.key === "Tab") e.preventDefault();
              }}
              className={cx("relative isolate w-full max-w-[600px] overflow-hidden rounded-[22px] bg-[var(--bd-surface)] shadow-[0_30px_80px_-20px_rgb(var(--bd-shade)/0.45),0_0_0_1px_rgb(var(--bd-ink)/0.07)]", className)}
            >
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 [background:radial-gradient(55%_100%_at_92%_0%,var(--bd-glow-blue),transparent_72%),radial-gradient(50%_100%_at_8%_0%,var(--bd-glow-lilac),transparent_72%),radial-gradient(45%_90%_at_50%_0%,var(--bd-glow-mint),transparent_72%)]" />
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 opacity-70 [background:var(--bd-ui-dots)] [mask-image:linear-gradient(180deg,#000,transparent_90%)]" />
              <Command label={label} bare onEscape={() => setOpen(false)}>
                {children}
              </Command>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
