"use client";

import { XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

/*
 * A bar of ink that rises from the bottom while something is selected: how many, rolling as the
 * number changes, the actions that apply to all of them, and a way to let them go. The selection
 * is yours; the bar only shows it. It never takes focus on its own, so picking rows or typing
 * carries on undisturbed: F6 brings focus to it, Escape clears the selection, and focus goes back
 * to where it was.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const SOFT = { type: "spring", stiffness: 300, damping: 30 } as const;

/* True once it's running in the browser: the server and the first render agree on false, so the portal never trips hydration. */
const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

function scopeOf(el: Element | null): { "data-theme"?: string; className?: string } {
  if (!el) return {};
  const byAttr = el.closest("[data-theme]");
  const byClass = el.closest(".dark, .light, .bd-light");
  const near = byAttr && byClass ? (byAttr.contains(byClass) ? byClass : byAttr) : (byAttr ?? byClass);
  if (!near) return {};
  if (near === byAttr) return { "data-theme": near.getAttribute("data-theme") ?? undefined };
  return { className: ["dark", "bd-light", "light"].find((c) => near.classList.contains(c)) };
}

/* Somewhere text is being typed, where F6 and Escape belong to what's typed in. */
const typing = (el: Element | null) => !!el && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement || (el as HTMLElement).isContentEditable);

/*
 * Every bar that's showing. When there's more than one, the keys go to one of them: the bar focus
 * is in, else the one whose container holds focus (the innermost, for bars kept in a container),
 * else one that sits over the whole window.
 */
type Shown = { bar: RefObject<HTMLDivElement | null>; region: () => Element | null };
const showing = new Set<Shown>();
const depth = (el: Element) => {
  let n = 0;
  for (let p: Element | null = el; p; p = p.parentElement) n++;
  return n;
};
function owner(at: Element | null): Shown | undefined {
  let best: Shown | undefined;
  let deepest = -1;
  for (const s of showing) {
    if (at && s.bar.current?.contains(at)) return s;
    const region = s.region();
    const d = !region ? 0 : at && region.contains(at) ? depth(region) : -1;
    if (d >= 0 && d >= deepest) [best, deepest] = [s, d];
  }
  // Nothing focused: the bar that rose last.
  if (!best && (!at || at === document.body)) best = [...showing].at(-1);
  return best;
}

/** The count, its digits rolling up as it grows and down as it shrinks. */
function Count({ value }: { value: number }) {
  const [prev, setPrev] = useState(value);
  const [dir, setDir] = useState(1);
  if (prev !== value) {
    setDir(value > prev ? 1 : -1);
    setPrev(value);
  }
  const still = useReducedMotion();
  return (
    <span className="relative inline-grid h-5 min-w-[2ch] overflow-hidden text-center tabular-nums">
      <AnimatePresence initial={false} mode="popLayout" custom={dir}>
        <motion.span
          key={value}
          custom={dir}
          variants={{ enter: (d: number) => ({ y: still ? 0 : d * 14, opacity: 0 }), at: { y: 0, opacity: 1 }, leave: (d: number) => ({ y: still ? 0 : d * -14, opacity: 0 }) }}
          initial="enter"
          animate="at"
          exit="leave"
          transition={{ type: "spring", stiffness: 520, damping: 42 }}
          className="col-start-1 row-start-1"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/**
 * The bar. Pass how many are selected and what clears them; put its actions inside. It rises when
 * the count goes above zero and sinks when it's back to zero. `position="absolute"` keeps it
 * inside a container of yours instead of the window.
 */
export function ActionBar({ count, onClear, label = "Selection", noun = "selected", position = "fixed", className, children }: { count: number; onClear: () => void; /** What's selected, for screen readers: "Sections". */ label?: string; /** The word after the count. */ noun?: string; position?: "fixed" | "absolute"; className?: string; children: ReactNode }) {
  const mounted = useMounted();
  const anchor = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLElement | null>(null);
  const still = useReducedMotion();
  const [scope, setScope] = useState<ReturnType<typeof scopeOf>>({});
  // The last number above zero, so the bar keeps showing it while it sinks away.
  const [shown, setShown] = useState(count);
  if (count > 0 && shown !== count) setShown(count);
  const open = count > 0;
  const clear = useRef(onClear);
  useLayoutEffect(() => {
    clear.current = onClear;
  });
  const me = useMemo<Shown>(() => ({ bar, region: () => (position === "absolute" ? (anchor.current?.parentElement ?? null) : null) }), [position]);

  useEffect(() => {
    if (open) setScope(scopeOf(anchor.current));
  }, [open]);

  // F6 brings focus to the bar; Escape lets the selection go. Neither interrupts typing.
  useEffect(() => {
    if (!open) return;
    showing.add(me);
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.defaultPrevented || owner(document.activeElement) !== me) return;
      const inBar = !!bar.current?.contains(document.activeElement);
      if (e.key === "F6" && !inBar && !typing(document.activeElement)) {
        e.preventDefault();
        back.current = document.activeElement as HTMLElement | null;
        bar.current?.querySelector<HTMLElement>("button:not([disabled])")?.focus();
      } else if (e.key === "Escape" && (inBar || !typing(document.activeElement))) {
        e.preventDefault();
        clear.current();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      showing.delete(me);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, me]);

  // When the selection's gone and focus was in the bar, it goes back to where it came from.
  useEffect(() => {
    if (open) return;
    if (bar.current?.contains(document.activeElement) || document.activeElement === document.body) {
      if (back.current?.isConnected) back.current.focus();
    }
    back.current = null;
  }, [open]);

  const onBarKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    const items = [...(bar.current?.querySelectorAll<HTMLElement>("button:not([disabled])") ?? [])];
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (at < 0) return;
    e.preventDefault();
    items[(at + step + items.length) % items.length]?.focus();
  };

  const body = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="bar"
          ref={bar}
          role="toolbar"
          aria-label={`${label}: ${shown} ${noun}`}
          onKeyDown={onBarKey}
          onFocus={(e) => {
            // Reached by Tab rather than F6: remember where focus came from all the same.
            if (!back.current && e.relatedTarget instanceof HTMLElement && !bar.current?.contains(e.relatedTarget)) back.current = e.relatedTarget;
          }}
          initial={still ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={still ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98, transition: { type: "spring", stiffness: 420, damping: 40 } }}
          transition={SOFT}
          className={cx("pointer-events-auto flex max-w-full items-center gap-1 rounded-[18px] p-1.5 text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.12),var(--bd-shadow-float)]", className)}
        >
          <span className="flex shrink-0 items-center gap-1.5 pl-3 pr-2 text-[13px] font-medium">
            <Count value={shown} />
            <span className="opacity-70">{noun}</span>
          </span>
          <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-[color-mix(in_oklab,var(--bd-ui-ink-text)_18%,transparent)]" />
          <div className="flex min-w-0 items-center gap-0.5">{children}</div>
          <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-[color-mix(in_oklab,var(--bd-ui-ink-text)_18%,transparent)]" />
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear the selection"
            title="Clear (Esc)"
            className="grid size-9 shrink-0 place-items-center rounded-[11px] opacity-70 outline-none transition-[opacity,background-color,scale] duration-150 hover:bg-[color-mix(in_oklab,var(--bd-ui-ink-text)_12%,transparent)] hover:opacity-100 active:scale-[0.94] focus-visible:shadow-[0_0_0_2px_color-mix(in_oklab,var(--bd-ui-ink-text)_45%,transparent)] focus-visible:opacity-100"
          >
            <XIcon weight="regular" size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <span ref={anchor} hidden />
      {/* What a screen reader hears as the count changes. */}
      <span className="sr-only" aria-live="polite">
        {open ? `${count} ${noun}` : ""}
      </span>
      {position === "absolute" ? (
        <div className="@container pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center px-3">{body}</div>
      ) : (
        mounted &&
        createPortal(
          <div {...scope} className={cx("@container pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex justify-center px-3 pb-[max(20px,env(safe-area-inset-bottom))]", scope.className)}>
            {body}
          </div>,
          document.body,
        )
      )}
    </>
  );
}

/** One action on the bar: its icon, and a word that hides when the bar's space is narrow (the button keeps it as its name). */
export function ActionBarButton({ icon, tone, onClick, disabled, children }: { icon: ReactNode; /** "stop" for what can't be undone. */ tone?: "stop"; onClick?: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={typeof children === "string" ? children : undefined}
      title={typeof children === "string" ? children : undefined}
      className={cx(
        "flex h-9 shrink-0 items-center gap-2 rounded-[11px] px-3 text-[13px] font-medium outline-none transition-[background-color,scale,opacity] duration-150 hover:bg-[color-mix(in_oklab,var(--bd-ui-ink-text)_12%,transparent)] active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 focus-visible:shadow-[0_0_0_2px_color-mix(in_oklab,var(--bd-ui-ink-text)_45%,transparent)] @max-[480px]:w-9 @max-[480px]:justify-center @max-[480px]:px-0 [&_svg]:size-4 [&_svg]:shrink-0",
        tone === "stop" && "[&_svg]:text-[var(--bd-ui-stop)]",
      )}
    >
      {icon}
      <span className="@max-[480px]:sr-only">{children}</span>
    </button>
  );
}
