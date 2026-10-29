"use client";

import { CaretRightIcon, CheckIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { createContext, use, useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

/*
 * The actions for a thing, opened where you right-click it: a card of actions that grows from the
 * pointer, a small ring marking where you pressed. It turns to keep on screen, and submenus open
 * beside their row after a beat, staying open while the pointer crosses over to them. Shift+F10 or
 * the menu key opens it from the keyboard, a long press opens it on touch, and the keys run it the
 * way they run any menu: arrows, Home and End, a letter, Enter, and Escape back out.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* True once it's running in the browser: the server and the first render agree on false, so the portal never trips hydration. */
const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

type Scope = { "data-theme"?: string; className?: string };
/* The light or dark the right-clicked thing sits in, so the menu in a portal on body matches it. */
function scopeOf(el: Element | null): Scope {
  if (!el) return {};
  const byAttr = el.closest("[data-theme]");
  const byClass = el.closest(".dark, .light, .bd-light");
  const near = byAttr && byClass ? (byAttr.contains(byClass) ? byClass : byAttr) : (byAttr ?? byClass);
  if (!near) return {};
  if (near === byAttr) return { "data-theme": near.getAttribute("data-theme") ?? undefined };
  return { className: ["dark", "bd-light", "light"].find((c) => near.classList.contains(c)) };
}

type Point = { x: number; y: number; byKeys: boolean };
type Root = { at: Point | null; openAt: (p: Point, from: Element) => void; close: (refocus?: boolean) => void; scope: Scope };
const RootContext = createContext<Root | null>(null);
const useRoot = () => {
  const c = use(RootContext);
  if (!c) throw new Error("ContextMenu parts go inside <ContextMenu>.");
  return c;
};

/* One level of the menu: which of its submenus is open, set after a short pause so a pointer passing over doesn't flicker them. */
type Level = { sub: string | null; hover: (id: string | null) => void; openNow: (id: string | null) => void; keys: boolean };
const LevelContext = createContext<Level>({ sub: null, hover: () => {}, openNow: () => {}, keys: false });

function useLevel(keys: boolean): Level {
  const [sub, setSub] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  const hover = useCallback((id: string | null) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSub(id), id ? 110 : 220);
  }, []);
  const openNow = useCallback((id: string | null) => {
    if (timer.current) clearTimeout(timer.current);
    setSub(id);
  }, []);
  return { sub, hover, openNow, keys };
}

/** Holds whether it's open and where. */
export function ContextMenu({ onOpenChange, children }: { onOpenChange?: (open: boolean) => void; children: ReactNode }) {
  const [at, setAt] = useState<Point | null>(null);
  const [scope, setScope] = useState<Scope>({});
  // Where it was opened from, so closing by key can put focus back there.
  const from = useRef<HTMLElement | null>(null);
  const openAt = useCallback(
    (p: Point, el: Element) => {
      from.current = el as HTMLElement;
      setScope(scopeOf(el));
      setAt(p);
      onOpenChange?.(true);
    },
    [onOpenChange],
  );
  const close = useCallback(
    (refocus = false) => {
      setAt(null);
      onOpenChange?.(false);
      if (refocus) from.current?.focus({ preventScroll: true });
    },
    [onOpenChange],
  );
  return <RootContext value={{ at, openAt, close, scope }}>{children}</RootContext>;
}

/** The area that opens it: right-click, Shift+F10 or the menu key when it's focused, or a long press. Give it an aria-label. */
export function ContextMenuTrigger({ className, children, onContextMenu, onKeyDown, onPointerDown, onPointerUp, onPointerMove, onPointerCancel, ...props }: Omit<ComponentProps<"div">, "ref">) {
  const root = useRoot();
  const press = useRef<{ t: ReturnType<typeof setTimeout>; x: number; y: number } | null>(null);
  const cancel = () => {
    if (press.current) clearTimeout(press.current.t);
    press.current = null;
  };
  return (
    <div
      tabIndex={0}
      aria-keyshortcuts="Shift+F10"
      onContextMenu={(e) => {
        onContextMenu?.(e);
        if (e.defaultPrevented) return;
        e.preventDefault();
        cancel();
        root.openAt({ x: e.clientX, y: e.clientY, byKeys: false }, e.currentTarget);
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented || !((e.key === "F10" && e.shiftKey) || e.key === "ContextMenu")) return;
        e.preventDefault();
        const r = e.currentTarget.getBoundingClientRect();
        root.openAt({ x: r.left + Math.min(28, r.width / 2), y: r.top + Math.min(28, r.height / 2), byKeys: true }, e.currentTarget);
      }}
      onPointerDown={(e) => {
        onPointerDown?.(e);
        if (e.pointerType !== "touch") return;
        const el = e.currentTarget;
        const { clientX: x, clientY: y } = e;
        press.current = { t: setTimeout(() => root.openAt({ x, y, byKeys: false }, el), 500), x, y };
      }}
      onPointerMove={(e) => {
        onPointerMove?.(e);
        if (press.current && Math.hypot(e.clientX - press.current.x, e.clientY - press.current.y) > 8) cancel();
      }}
      onPointerUp={(e) => {
        onPointerUp?.(e);
        cancel();
      }}
      onPointerCancel={(e) => {
        onPointerCancel?.(e);
        cancel();
      }}
      className={cx("outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)] [-webkit-touch-callout:none]", className)}
      {...props}
    >
      {children}
    </div>
  );
}

const ITEM = ':scope > [role="menuitem"]:not([aria-disabled="true"]), :scope > [role="menuitemcheckbox"]:not([aria-disabled="true"]), :scope > [role="group"] > [role="menuitem"]:not([aria-disabled="true"]), :scope > [role="group"] > [role="menuitemcheckbox"]:not([aria-disabled="true"])';
const CARD = "z-[90] min-w-[220px] max-w-[calc(100vw-16px)] rounded-[16px] bg-[var(--bd-surface)] p-1.5 text-[var(--bd-fg)] outline-none shadow-[var(--bd-shadow-float),0_0_0_1px_rgb(var(--bd-ink)/0.08)]";

/** The keys for one level: arrows, Home and End, a letter to jump. */
function useLevelKeys(list: RefObject<HTMLDivElement | null>) {
  const typed = useRef({ text: "", at: 0 });
  return (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const all = [...(list.current?.querySelectorAll<HTMLElement>(ITEM) ?? [])];
    const at = all.indexOf(document.activeElement as HTMLElement);
    const go = (i: number) => all[(i + all.length) % all.length]?.focus();
    if (e.key === "ArrowDown") go(at + 1);
    else if (e.key === "ArrowUp") go(at < 0 ? all.length - 1 : at - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(all.length - 1);
    else if (e.key.length === 1 && /\S/.test(e.key) && !e.metaKey && !e.ctrlKey) {
      const now = Date.now();
      typed.current = { text: now - typed.current.at < 600 ? typed.current.text + e.key.toLowerCase() : e.key.toLowerCase(), at: now };
      const from = [...all.slice(at + 1), ...all.slice(0, at + 1)];
      from.find((el) => (el.dataset.label ?? el.textContent ?? "").trim().toLowerCase().startsWith(typed.current.text))?.focus();
    } else return false;
    e.preventDefault();
    e.stopPropagation();
    return true;
  };
}

/** The menu, in a portal, at the pointer. */
export function ContextMenuContent({ label, className, children }: { /** What the menu is for, for a screen reader. */ label?: string; className?: string; children: ReactNode }) {
  const root = useRoot();
  const mounted = useMounted();
  const list = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const [pos, setPos] = useState<{ left: number; top: number; origin: string } | null>(null);
  const level = useLevel(!!root.at?.byKeys);
  const keys = useLevelKeys(list);
  const { at, close } = root;

  useEffect(() => {
    if (!at) return;
    // Placed once it has a size: from the pointer, turned left or up when there isn't room.
    const frame = requestAnimationFrame(() => {
      const el = list.current;
      if (!el) return;
      const pad = 8;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const left = at.x + w > innerWidth - pad;
      const up = at.y + h > innerHeight - pad && at.y - h > pad;
      setPos({ left: left ? Math.max(pad, at.x - w) : at.x, top: up ? at.y - h : Math.min(at.y, innerHeight - pad - h), origin: `${left ? "right" : "left"} ${up ? "bottom" : "top"}` });
      if (at.byKeys) el.querySelector<HTMLElement>(ITEM)?.focus({ preventScroll: true });
      else el.focus({ preventScroll: true });
    });
    const away = (e: PointerEvent) => !(e.target as Element).closest?.("[data-bd-context-menu]") && close();
    const gone = () => close();
    document.addEventListener("pointerdown", away, true);
    addEventListener("scroll", gone, true);
    addEventListener("resize", gone);
    addEventListener("blur", gone);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", away, true);
      removeEventListener("scroll", gone, true);
      removeEventListener("resize", gone);
      removeEventListener("blur", gone);
      setPos(null);
    };
  }, [at, close]);

  if (!mounted) return null;
  return createPortal(
    <div {...root.scope} style={{ display: "contents" }}>
      <AnimatePresence>
        {at && !at.byKeys && !still && (
          <motion.span
            key={`${at.x},${at.y}`}
            aria-hidden
            initial={{ scale: 0.2, opacity: 0.45 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none fixed z-[89] size-9 rounded-full shadow-[0_0_0_1.5px_rgb(var(--bd-ink)/0.35)]"
            style={{ left: at.x - 18, top: at.y - 18 }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {at && (
          <motion.div
            key={`${at.x},${at.y}`}
            ref={list}
            data-bd-context-menu=""
            role="menu"
            aria-label={label}
            tabIndex={-1}
            onKeyDown={(e) => {
              if (keys(e)) return;
              if (e.key === "Escape" || e.key === "Tab") {
                e.preventDefault();
                close(true);
              }
            }}
            initial={still ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: pos ? 1 : 0, scale: 1 }}
            exit={still ? { opacity: 0 } : { opacity: 0, scale: 0.96, transition: { duration: 0.1 } }}
            transition={{ type: "spring", stiffness: 600, damping: 36 }}
            style={{ position: "fixed", left: pos?.left ?? at.x, top: pos?.top ?? at.y, transformOrigin: pos?.origin ?? "left top" }}
            className={cx(CARD, className)}
          >
            <LevelContext value={level}>{children}</LevelContext>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}

/** A section's name, small and quiet. */
export function ContextMenuLabel({ className, ...props }: ComponentProps<"div">) {
  return <div role="presentation" className={cx("px-2.5 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--bd-subtle)]", className)} {...props} />;
}

/** A hairline between sections. */
export function ContextMenuSeparator({ className }: { className?: string }) {
  return <div role="separator" className={cx("mx-1 my-1.5 h-px bg-[var(--bd-line-subtle)]", className)} />;
}

/* An action's shortcut, a small key each. */
function Keys({ keys }: { keys: string[] }) {
  return (
    <span aria-hidden className="ml-auto flex shrink-0 gap-0.5 pl-4">
      {keys.map((k) => (
        <kbd key={k} className="grid h-5 min-w-5 place-items-center rounded-[5px] bg-[rgb(var(--bd-ink)/0.05)] px-1 font-sans text-[11px] font-medium text-[var(--bd-subtle)] shadow-[inset_0_-1px_0_rgb(var(--bd-ink)/0.08)]">
          {k}
        </kbd>
      ))}
    </span>
  );
}

const ROW =
  "group/item relative flex h-9 w-full cursor-default select-none items-center gap-2.5 rounded-[10px] px-2.5 text-left text-[13.5px] outline-none transition-colors duration-100 focus:bg-[rgb(var(--bd-ink)/0.06)] aria-disabled:pointer-events-none aria-disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0";

/** One action. It runs onSelect and closes the menu; tone="stop" for the one that can't be undone. */
export function ContextMenuItem({ icon, shortcut, onSelect, disabled, tone = "default", className, children }: { icon?: ReactNode; /** Its keys, one each: ["⌘", "D"]. Shown, not bound. */ shortcut?: string[]; onSelect?: () => void; disabled?: boolean; tone?: "default" | "stop"; className?: string; children: ReactNode }) {
  const { close } = useRoot();
  const level = use(LevelContext);
  const run = () => {
    if (disabled) return;
    close(true);
    onSelect?.();
  };
  return (
    <div
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      onClick={run}
      onPointerMove={(e) => {
        if (document.activeElement !== e.currentTarget) e.currentTarget.focus({ preventScroll: true });
        level.hover(null);
      }}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        run();
      }}
      className={cx(ROW, tone === "stop" ? "text-[var(--bd-ui-stop)] focus:bg-[color-mix(in_oklab,var(--bd-ui-stop)_10%,transparent)]" : "text-[var(--bd-fg)]", className)}
    >
      {icon && <span className={cx("grid place-items-center", tone !== "stop" && "text-[var(--bd-muted)] group-focus/item:text-[var(--bd-fg)]")}>{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut && <Keys keys={shortcut} />}
    </div>
  );
}

/** An option that ticks on and off, and keeps the menu open. */
export function ContextMenuCheckboxItem({ checked, defaultChecked = false, onCheckedChange, disabled, className, children }: { checked?: boolean; defaultChecked?: boolean; onCheckedChange?: (checked: boolean) => void; disabled?: boolean; className?: string; children: ReactNode }) {
  const [inner, setInner] = useState(defaultChecked);
  const level = use(LevelContext);
  const on = checked ?? inner;
  const flip = () => {
    if (disabled) return;
    setInner(!on);
    onCheckedChange?.(!on);
  };
  return (
    <div
      role="menuitemcheckbox"
      aria-checked={on}
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      onClick={flip}
      onPointerMove={(e) => {
        if (document.activeElement !== e.currentTarget) e.currentTarget.focus({ preventScroll: true });
        level.hover(null);
      }}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        flip();
      }}
      className={cx(ROW, "text-[var(--bd-fg)]", className)}
    >
      <span aria-hidden className={cx("grid size-4 place-items-center rounded-full transition-[background,box-shadow] duration-150", on ? "text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]" : "shadow-[inset_0_0_0_1.5px_rgb(var(--bd-ink)/0.2)]")}>
        <AnimatePresence initial={false}>
          {on && (
            <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ type: "spring", stiffness: 700, damping: 30 }} className="grid place-items-center [&_svg]:!size-2.5">
              <CheckIcon weight="bold" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </div>
  );
}

/** A row that opens more actions beside it: on hover after a beat, or with → or Enter. */
export function ContextMenuSub({ label, icon, disabled, children }: { label: string; icon?: ReactNode; disabled?: boolean; children: ReactNode }) {
  const root = useRoot();
  const parent = use(LevelContext);
  const id = useId();
  const row = useRef<HTMLDivElement>(null);
  const open = parent.sub === id;
  const [byKeys, setByKeys] = useState(false);
  const show = (keys: boolean) => {
    setByKeys(keys);
    parent.openNow(id);
  };
  return (
    <>
      <div
        ref={row}
        role="menuitem"
        tabIndex={-1}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-disabled={disabled || undefined}
        data-label={label}
        onPointerMove={(e) => {
          if (document.activeElement !== e.currentTarget) e.currentTarget.focus({ preventScroll: true });
          if (!open) setByKeys(false);
          parent.hover(id);
        }}
        onClick={() => show(false)}
        onKeyDown={(e) => {
          if (e.key !== "ArrowRight" && e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          e.stopPropagation();
          show(true);
        }}
        className={cx(ROW, "text-[var(--bd-fg)]", open && "bg-[rgb(var(--bd-ink)/0.06)]")}
      >
        {icon && <span className="grid place-items-center text-[var(--bd-muted)] group-focus/item:text-[var(--bd-fg)]">{icon}</span>}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <CaretRightIcon weight="regular" className="!size-3.5 text-[var(--bd-subtle)]" />
      </div>
      <AnimatePresence>
        {open && (
          <SubPanel
            row={row}
            byKeys={byKeys}
            scope={root.scope}
            onEnter={() => parent.hover(id)}
            onBack={() => {
              parent.openNow(null);
              row.current?.focus({ preventScroll: true });
            }}
            label={label}
          >
            {children}
          </SubPanel>
        )}
      </AnimatePresence>
    </>
  );
}

/** A submenu's card, beside its row, turned to the left when there isn't room on the right. */
function SubPanel({ row, byKeys, scope, onEnter, onBack, label, children }: { row: RefObject<HTMLDivElement | null>; byKeys: boolean; scope: Scope; onEnter: () => void; onBack: () => void; label: string; children: ReactNode }) {
  const list = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const [pos, setPos] = useState<{ left: number; top: number; leftSide: boolean } | null>(null);
  const level = useLevel(byKeys);
  const keys = useLevelKeys(list);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const r = row.current?.getBoundingClientRect();
      const el = list.current;
      if (!r || !el) return;
      const pad = 8;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const leftSide = r.right + w + 4 > innerWidth - pad;
      setPos({ left: leftSide ? r.left - w - 4 : r.right + 4, top: Math.min(Math.max(pad, r.top - 6), innerHeight - pad - h), leftSide });
      if (byKeys) el.querySelector<HTMLElement>(ITEM)?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [row, byKeys]);
  return createPortal(
    <div {...scope} style={{ display: "contents" }}>
      <motion.div
        ref={list}
        data-bd-context-menu=""
        role="menu"
        aria-label={label}
        tabIndex={-1}
        onPointerEnter={onEnter}
        onKeyDown={(e) => {
          if (keys(e)) return;
          if (e.key === "ArrowLeft" || e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onBack();
          }
        }}
        initial={still ? { opacity: 0 } : { opacity: 0, x: -6 }}
        animate={{ opacity: pos ? 1 : 0, x: 0 }}
        exit={{ opacity: 0, transition: { duration: 0.08 } }}
        transition={{ type: "spring", stiffness: 600, damping: 38 }}
        style={{ position: "fixed", left: pos?.left ?? 0, top: pos?.top ?? 0 }}
        className={CARD}
      >
        <LevelContext value={level}>{children}</LevelContext>
      </motion.div>
    </div>,
    document.body,
  );
}
