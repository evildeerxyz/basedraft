"use client";

import { CheckIcon, DotsThreeIcon } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { Children, createContext, isValidElement, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

/*
 * A row of tools on one white bar, like Studio's text tools: icon buttons, toggles that stay
 * pressed, a group where one choice holds (its chip slides to the next), separators, and a
 * tooltip that glides from tool to tool with each one's shortcut. The bar is one stop for Tab;
 * the arrow keys move along it. When it runs out of room, the tools at its end fold into a More
 * menu, where they keep working.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const SNAPPY = { type: "spring", stiffness: 520, damping: 42 } as const;

/* True once it's running in the browser: the server and the first render agree on false, so the portal never trips hydration. */
const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export type ToolbarOption = { value: string; label: string; icon: ReactNode; keys?: string[] };

/* What each tool tells the bar about itself, so a folded one can stand in the More menu. */
type Entry =
  | { kind: "button"; slot: number; label: string; icon: ReactNode; keys?: string[]; disabled?: boolean; select: () => void }
  | { kind: "toggle"; slot: number; label: string; icon: ReactNode; keys?: string[]; disabled?: boolean; pressed: boolean; select: () => void }
  | { kind: "group"; slot: number; label: string; value: string; options: ToolbarOption[]; select: (v: string) => void };

/* An entry without its slot, kept apart per kind. */
type Tool = Entry extends infer E ? (E extends Entry ? Omit<E, "slot"> : never) : never;

/*
 * The bar's list of tools, outside React's state so tools can update it every render: it tells
 * the bar to draw again only when something the More menu shows has changed.
 */
function createStore() {
  const map = new Map<string, Entry>();
  const listeners = new Set<() => void>();
  let version = 0;
  const sig = (e: Entry) => [e.kind, e.slot, e.label, "pressed" in e ? e.pressed : "", "value" in e ? e.value : "", "disabled" in e ? e.disabled : ""].join("|");
  const emit = () => {
    version++;
    listeners.forEach((l) => l());
  };
  return {
    map,
    version: () => version,
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    register: (id: string, e: Entry) => {
      const was = map.get(id);
      map.set(id, e);
      if (!was || sig(was) !== sig(e)) emit();
    },
    unregister: (id: string) => {
      if (map.delete(id)) emit();
    },
  };
}

type Ctx = {
  active: string | null;
  setActive: (id: string) => void;
  register: (id: string, e: Entry) => void;
  unregister: (id: string) => void;
  tip: (el: HTMLElement, label: string, keys: string[] | undefined, now: boolean) => void;
  untip: () => void;
};
const ToolbarContext = createContext<Ctx | null>(null);
const SlotContext = createContext(0);
const useToolbar = () => {
  const c = useContext(ToolbarContext);
  if (!c) throw new Error("Toolbar parts go inside <Toolbar>.");
  return c;
};

/** A shortcut, a cap each, inside the tooltip. */
function Keys({ keys }: { keys?: string[] }) {
  if (!keys?.length) return null;
  return (
    <span className="flex gap-0.5">
      {keys.map((k) => (
        <kbd key={k} className="grid h-[18px] min-w-[18px] place-items-center rounded-[5px] bg-[color-mix(in_oklab,var(--bd-ui-ink-text)_16%,transparent)] px-1 font-sans text-[10.5px] font-medium">
          {k}
        </kbd>
      ))}
    </span>
  );
}

function scopeOf(el: Element | null): { "data-theme"?: string; className?: string } {
  if (!el) return {};
  const byAttr = el.closest("[data-theme]");
  const byClass = el.closest(".dark, .light, .bd-light");
  const near = byAttr && byClass ? (byAttr.contains(byClass) ? byClass : byAttr) : (byAttr ?? byClass);
  if (!near) return {};
  if (near === byAttr) return { "data-theme": near.getAttribute("data-theme") ?? undefined };
  return { className: ["dark", "bd-light", "light"].find((c) => near.classList.contains(c)) };
}

const ITEM = "[data-tb-item]";
const visible = (el: HTMLElement) => el.offsetParent !== null && !el.hasAttribute("disabled");

/**
 * The bar. Give it a `label` (it's a toolbar to a screen reader) and the tools as children, in
 * order. It folds the tools at its end into a More menu when its container is too narrow.
 */
export function Toolbar({ label, side = "top", className, children }: { label: string; /** Where the tooltips show. */ side?: "top" | "bottom"; className?: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [store] = useState(createStore);
  useSyncExternalStore(store.subscribe, store.version, store.version);
  const slots = Children.toArray(children);
  const isSeparator = slots.map((c) => isValidElement(c) && c.type === ToolbarSeparator);

  // How many slots fit: every one, or as many as leave room for the More button.
  const [cut, setCut] = useState(Infinity);
  const widths = useRef<number[]>([]);
  useIsoLayoutEffect(() => {
    const bar = root.current;
    const host = bar?.parentElement;
    if (!bar || !host) return;
    const fit = () => {
      if (!bar.getClientRects().length) return;
      const els = [...bar.querySelectorAll<HTMLElement>(":scope > [data-tb-slot]")];
      els.forEach((el, i) => {
        if (el.offsetParent !== null) widths.current[i] = el.offsetWidth;
      });
      // The room it has: how wide it would be if it asked its container for every pixel. Measured
      // this way rather than from the container, which may itself be only as wide as the bar.
      const was = bar.style.width;
      bar.style.width = "100000px";
      const cs = getComputedStyle(bar);
      const room = bar.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      bar.style.width = was;
      const gap = parseFloat(cs.columnGap) || 0;
      const need = (n: number) => widths.current.slice(0, n).reduce((s, w) => s + (w ?? 0) + gap, 0) - gap;
      if (need(els.length) <= room) return setCut(Infinity);
      // Leave room for the More button.
      let n = els.length;
      while (n > 0 && need(n) + gap + 32 > room) n--;
      // A separator never ends the bar.
      while (n > 0 && isSeparator[n - 1]) n--;
      setCut(n);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(host);
    ro.observe(bar);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [slots.length]);


  // One stop for Tab: the tool last focused, or the first that shows.
  useIsoLayoutEffect(() => {
    const items = [...(root.current?.querySelectorAll<HTMLElement>(ITEM) ?? [])].filter(visible);
    if (!items.length) return;
    if (!active || !items.some((el) => el.dataset.tbId === active)) setActive(items[0].dataset.tbId ?? null);
  });

  // The tooltip: it waits a moment the first time, then glides from tool to tool while you move along the bar.
  const [tipAt, setTipAt] = useState<{ x: number; label: string; keys?: string[] } | null>(null);
  const warm = useRef(0);
  const wait = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tip = useCallback((el: HTMLElement, label: string, keys: string[] | undefined, now: boolean) => {
    clearTimeout(wait.current);
    const bar = root.current;
    if (!bar) return;
    const show = () => {
      const b = bar.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      setTipAt({ x: r.left - b.left + r.width / 2, label, keys });
    };
    if (now || Date.now() - warm.current < 600) show();
    else wait.current = setTimeout(show, 400);
  }, []);
  const untip = useCallback(() => {
    clearTimeout(wait.current);
    setTipAt((t) => {
      if (t) warm.current = Date.now();
      return null;
    });
  }, []);
  useEffect(() => () => clearTimeout(wait.current), []);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") return untip();
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step && e.key !== "Home" && e.key !== "End") return;
    const items = [...(root.current?.querySelectorAll<HTMLElement>(ITEM) ?? [])].filter(visible);
    if (!items.length) return;
    e.preventDefault();
    const at = items.indexOf(document.activeElement as HTMLElement);
    const next = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : (at + step + items.length) % items.length;
    items[next].focus();
  };

  const folded = Number.isFinite(cut) ? [...store.map.values()].filter((e) => e.slot >= cut).sort((a, b) => a.slot - b.slot) : [];
  const above = side === "top";
  return (
    <ToolbarContext.Provider value={{ active, setActive, register: store.register, unregister: store.unregister, tip, untip }}>
      <div
        ref={root}
        role="toolbar"
        aria-label={label}
        aria-orientation="horizontal"
        onKeyDown={onKey}
        onPointerLeave={untip}
        className={cx("relative inline-flex max-w-full items-center gap-0.5 rounded-[14px] bg-[var(--bd-surface)] p-1 text-[var(--bd-fg)] shadow-[var(--bd-shadow-raised),0_0_0_1px_rgb(var(--bd-ink)/0.08)]", className)}
      >
        {slots.map((child, i) => (
          <SlotContext.Provider key={i} value={i}>
            <div data-tb-slot className={cx("flex items-center", i >= cut && "hidden")}>
              {child}
            </div>
          </SlotContext.Provider>
        ))}
        {folded.length > 0 && (
          <More entries={folded} onOpenChange={(o) => o && untip()} />
        )}
        <AnimatePresence>
          {tipAt && (
            <motion.span
              key="tip"
              role="tooltip"
              initial={{ opacity: 0, x: tipAt.x, y: above ? 4 : -4, scale: 0.96 }}
              animate={{ opacity: 1, x: tipAt.x, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.1 } }}
              transition={SNAPPY}
              className={cx("pointer-events-none absolute left-0 z-20", above ? "bottom-full mb-2" : "top-full mt-2")}
            >
              <span className={cx("flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-[10px] py-1.5 pl-2.5 text-xs font-medium text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.12),var(--bd-shadow-float)]", tipAt.keys?.length ? "pr-1.5" : "pr-2.5")}>
                {tipAt.label}
                <Keys keys={tipAt.keys} />
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </ToolbarContext.Provider>
  );
}

const TOOL =
  "relative grid size-8 shrink-0 place-items-center rounded-[10px] text-[var(--bd-muted)] outline-none transition-[color,background-color,scale] duration-150 hover:text-[var(--bd-fg)] active:scale-[0.92] disabled:pointer-events-none disabled:opacity-40 focus-visible:shadow-[0_0_0_2px_var(--bd-ui-focus)] [&_svg]:relative [&_svg]:size-[18px]";
const HOVER = "hover:bg-[rgb(var(--bd-ink)/0.05)]";

/* What every tool shares: its place in the roving focus, its tooltip, and telling the bar about itself. */
function useTool(entry: Tool) {
  const t = useToolbar();
  const slot = useContext(SlotContext);
  const id = useId();
  useIsoLayoutEffect(() => {
    t.register(id, { ...entry, slot } as Entry);
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => t.unregister(id), [id]);
  return { id, t };
}

/** A tool that does something once: link, undo, comment. Its `icon` is what shows; `label` is its name. */
export function ToolbarButton({ label, icon, keys, disabled, onClick }: { label: string; icon: ReactNode; keys?: string[]; disabled?: boolean; onClick?: () => void }) {
  const { id, t } = useTool({ kind: "button", label, icon, keys, disabled, select: () => onClick?.() });
  return (
    <button
      type="button"
      data-tb-item
      data-tb-id={id}
      aria-label={label}
      aria-keyshortcuts={keys?.join("+")}
      tabIndex={t.active === id ? 0 : -1}
      disabled={disabled}
      onClick={onClick}
      onFocus={(e) => {
        t.setActive(id);
        if (e.currentTarget.matches(":focus-visible")) t.tip(e.currentTarget, label, keys, true);
      }}
      onBlur={t.untip}
      onPointerEnter={(e) => t.tip(e.currentTarget, label, keys, false)}
      onPointerDown={t.untip}
      className={cx(TOOL, HOVER)}
    >
      {icon}
    </button>
  );
}

/** A tool that stays on until pressed again: bold, italic, a grid overlay. Controlled with `pressed`, or left to keep its own. */
export function ToolbarToggle({ label, icon, keys, pressed, defaultPressed = false, onPressedChange, disabled }: { label: string; icon: ReactNode; keys?: string[]; pressed?: boolean; defaultPressed?: boolean; onPressedChange?: (pressed: boolean) => void; disabled?: boolean }) {
  const [inner, setInner] = useState(defaultPressed);
  const on = pressed ?? inner;
  const flip = () => {
    setInner(!on);
    onPressedChange?.(!on);
  };
  const { id, t } = useTool({ kind: "toggle", label, icon, keys, disabled, pressed: on, select: flip });
  const still = useReducedMotion();
  return (
    <button
      type="button"
      data-tb-item
      data-tb-id={id}
      aria-label={label}
      aria-pressed={on}
      aria-keyshortcuts={keys?.join("+")}
      tabIndex={t.active === id ? 0 : -1}
      disabled={disabled}
      onClick={flip}
      onFocus={(e) => {
        t.setActive(id);
        if (e.currentTarget.matches(":focus-visible")) t.tip(e.currentTarget, label, keys, true);
      }}
      onBlur={t.untip}
      onPointerEnter={(e) => t.tip(e.currentTarget, label, keys, false)}
      onPointerDown={t.untip}
      className={cx(TOOL, on ? "text-[var(--bd-fg)]" : HOVER)}
    >
      <AnimatePresence initial={false}>{on && <motion.span aria-hidden initial={still ? { opacity: 0 } : { opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={still ? { opacity: 0 } : { opacity: 0, scale: 0.8 }} transition={SNAPPY} className="absolute inset-0 rounded-[10px] bg-[var(--bd-ui-track)]" />}</AnimatePresence>
      {icon}
    </button>
  );
}

/** One choice of a few that holds, like text alignment: its chip slides from one to the next. */
export function ToolbarGroup({ label, options, value, defaultValue, onValueChange }: { label: string; options: ToolbarOption[]; value?: string; defaultValue?: string; onValueChange?: (value: string) => void }) {
  const [inner, setInner] = useState(defaultValue ?? options[0]?.value ?? "");
  const current = value ?? inner;
  const pick = (v: string) => {
    setInner(v);
    onValueChange?.(v);
  };
  const t = useToolbar();
  const slot = useContext(SlotContext);
  const id = useId();
  useIsoLayoutEffect(() => {
    t.register(id, { kind: "group", slot, label, value: current, options, select: pick });
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => t.unregister(id), [id]);
  return (
    <LayoutGroup id={id}>
      <div role="radiogroup" aria-label={label} className="flex items-center gap-0.5">
        {options.map((o) => {
          const on = o.value === current;
          const oid = `${id}-${o.value}`;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              data-tb-item
              data-tb-id={oid}
              aria-checked={on}
              aria-label={o.label}
              aria-keyshortcuts={o.keys?.join("+")}
              tabIndex={t.active === oid ? 0 : -1}
              onClick={() => pick(o.value)}
              onFocus={(e) => {
                t.setActive(oid);
                if (e.currentTarget.matches(":focus-visible")) t.tip(e.currentTarget, o.label, o.keys, true);
              }}
              onBlur={t.untip}
              onPointerEnter={(e) => t.tip(e.currentTarget, o.label, o.keys, false)}
              onPointerDown={t.untip}
              className={cx(TOOL, on ? "text-[var(--bd-fg)]" : HOVER)}
            >
              {on && <motion.span aria-hidden layoutId="chip" className="absolute inset-0 rounded-[10px] bg-[var(--bd-ui-track)]" transition={SNAPPY} />}
              {o.icon}
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

/** A thin rule between groups of tools. */
export function ToolbarSeparator() {
  return <span role="separator" aria-orientation="vertical" className="mx-1 h-5 w-px shrink-0 bg-[var(--bd-line)]" />;
}

/* Where the More menu goes: under its button if it fits, else above, and never past the window's edge. */
function place(t: DOMRect, w: number, h: number) {
  const pad = 8;
  const below = t.bottom + 6 + h <= innerHeight - pad || t.top - 6 - h < pad;
  return { top: below ? t.bottom + 6 : t.top - 6 - h, left: Math.min(Math.max(pad, t.right - w), innerWidth - pad - w), below };
}

const ROW =
  "group/item relative flex h-9 w-full cursor-default select-none items-center gap-2.5 rounded-[10px] px-2.5 text-left text-[13.5px] text-[var(--bd-fg)] outline-none transition-colors duration-100 focus:bg-[rgb(var(--bd-ink)/0.06)] aria-disabled:pointer-events-none aria-disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0";
const ROWS = '[role="menuitem"]:not([aria-disabled="true"]), [role="menuitemcheckbox"], [role="menuitemradio"]';

/* The tools that didn't fit, as a menu: buttons do their thing and close it, toggles and choices tick and stay. */
function More({ entries, onOpenChange }: { entries: Entry[]; onOpenChange: (open: boolean) => void }) {
  const t = useToolbar();
  const id = useId();
  const [open, setOpenState] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<ReturnType<typeof place> | null>(null);
  const mounted = useMounted();
  const still = useReducedMotion();
  const [scope, setScope] = useState<ReturnType<typeof scopeOf>>({});
  const setOpen = (o: boolean) => {
    setOpenState(o);
    onOpenChange(o);
  };
  const close = (focus = true) => {
    setOpen(false);
    if (focus) button.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const r = button.current?.getBoundingClientRect();
      const l = list.current;
      if (r && l) setPos(place(r, l.offsetWidth, l.offsetHeight));
    };
    const frame = requestAnimationFrame(() => {
      update();
      list.current?.querySelector<HTMLElement>(ROWS)?.focus({ preventScroll: true });
    });
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    const away = (e: PointerEvent) => {
      const n = e.target as Node;
      if (!list.current?.contains(n) && !button.current?.contains(n)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      document.removeEventListener("pointerdown", away);
      setPos(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const rows = [...(list.current?.querySelectorAll<HTMLElement>(ROWS) ?? [])];
    const at = rows.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === "Tab") setOpen(false);
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      rows[(at + (e.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length]?.focus();
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      rows[e.key === "Home" ? 0 : rows.length - 1]?.focus();
    }
  };

  const tool = `${id}-more`;
  return (
    <>
      <button
        ref={button}
        type="button"
        data-tb-item
        data-tb-id={tool}
        aria-label="More tools"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        tabIndex={t.active === tool ? 0 : -1}
        onFocus={() => t.setActive(tool)}
        onClick={(e) => {
          setScope(scopeOf(e.currentTarget));
          setOpen(!open);
        }}
        onKeyDown={(e) => {
          if (e.key !== "ArrowDown") return;
          e.preventDefault();
          e.stopPropagation();
          setScope(scopeOf(e.currentTarget));
          setOpen(true);
        }}
        className={cx(TOOL, HOVER, open && "bg-[rgb(var(--bd-ink)/0.06)] text-[var(--bd-fg)]")}
      >
        <DotsThreeIcon weight="bold" />
      </button>
      {mounted &&
        createPortal(
          <div {...scope} style={{ display: "contents" }}>
            <AnimatePresence>
              {open && (
                <motion.div
                  ref={list}
                  id={id}
                  role="menu"
                  aria-label="More tools"
                  onKeyDown={onKey}
                  initial={still ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: pos ? 1 : 0, scale: 1, y: 0 }}
                  exit={still ? { opacity: 0 } : { opacity: 0, scale: 0.97, transition: { duration: 0.12 } }}
                  transition={{ type: "spring", stiffness: 560, damping: 38 }}
                  style={{ position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0, transformOrigin: pos?.below === false ? "right bottom" : "right top" }}
                  className="z-[90] min-w-[220px] max-w-[calc(100vw-16px)] rounded-[16px] bg-[var(--bd-surface)] p-1.5 text-[var(--bd-fg)] outline-none shadow-[var(--bd-shadow-float),0_0_0_1px_rgb(var(--bd-ink)/0.08)]"
                >
                  {entries.map((e, i) => {
                    const gap = i > 0 && entries[i - 1].slot !== e.slot ? <div role="separator" className="mx-1 my-1.5 h-px bg-[var(--bd-line-subtle)]" /> : null;
                    if (e.kind === "group")
                      return (
                        <div key={`${e.slot}-${e.label}`}>
                          {gap}
                          <div role="group" aria-label={e.label}>
                            <div role="presentation" className="px-2.5 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--bd-subtle)]">
                              {e.label}
                            </div>
                            {e.options.map((o) => (
                              <div key={o.value} role="menuitemradio" aria-checked={e.value === o.value} tabIndex={-1} onClick={() => e.select(o.value)} onKeyDown={(k) => (k.key === "Enter" || k.key === " ") && (k.preventDefault(), e.select(o.value))} className={ROW}>
                                <span className="grid place-items-center text-[var(--bd-muted)]">{o.icon}</span>
                                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                                <span className="grid size-4 place-items-center">{e.value === o.value && <CheckIcon weight="bold" className="!size-3.5" />}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    const toggle = e.kind === "toggle";
                    const act = () => {
                      e.select();
                      if (!toggle) close();
                    };
                    return (
                      <div key={`${e.slot}-${e.label}`}>
                        {gap}
                        <div
                          role={toggle ? "menuitemcheckbox" : "menuitem"}
                          aria-checked={toggle ? e.pressed : undefined}
                          aria-disabled={e.disabled || undefined}
                          tabIndex={-1}
                          onClick={act}
                          onKeyDown={(k) => (k.key === "Enter" || k.key === " ") && (k.preventDefault(), act())}
                          className={ROW}
                        >
                          <span className="grid place-items-center text-[var(--bd-muted)]">{e.icon}</span>
                          <span className="min-w-0 flex-1 truncate">{e.label}</span>
                          {e.keys?.length ? (
                            <span aria-hidden className="flex gap-0.5 pl-3">
                              {e.keys.map((k) => (
                                <kbd key={k} className="grid h-5 min-w-5 place-items-center rounded-[5px] bg-[rgb(var(--bd-ink)/0.05)] px-1 font-sans text-[11px] font-medium text-[var(--bd-subtle)] shadow-[inset_0_-1px_0_rgb(var(--bd-ink)/0.08)]">
                                  {k}
                                </kbd>
                              ))}
                            </span>
                          ) : null}
                          {toggle && <span className="grid size-4 place-items-center">{e.pressed && <CheckIcon weight="bold" className="!size-3.5" />}</span>}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>,
          document.body,
        )}
    </>
  );
}
