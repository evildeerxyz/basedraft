"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { COLOR_MODE_KEY } from "./color-mode-script";

/*
 * Light and dark for basedraft's own chrome, the site and Studio alike. The mode lives on
 * <html data-theme>, so the color tokens in globals.css flip in one place. Your pick (light, dark,
 * or the system's) is kept in this browser; until you pick, it's the system's, and it follows the
 * system as that changes. Templates keep their own colors either way.
 */

export type ColorMode = "light" | "dark";
/** What you picked: a mode, or whatever the system is in. */
export type ColorPick = ColorMode | "system";
const KEY = COLOR_MODE_KEY;
const EVENT = "bd-theme-change";

const read = (): ColorMode => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");
const readPick = (): ColorPick => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
};
const systemMode = (): ColorMode => (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

function apply(mode: ColorMode) {
  const root = document.documentElement;
  // Switch in one frame: with transitions on, some colors would fade and others snap.
  const still = document.createElement("style");
  still.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(still);
  root.dataset.theme = mode;
  root.style.colorScheme = mode;
  void root.offsetHeight;
  requestAnimationFrame(() => still.remove());
  window.dispatchEvent(new Event(EVENT));
}

/**
 * Keeps your pick and switches to its mode. Given where the switch is, the new mode grows out of it
 * in a circle over the old one; without View Transitions, or with reduced motion, it simply switches.
 */
export function setColorMode(pick: ColorPick, from?: { x: number; y: number }) {
  try {
    localStorage.setItem(KEY, pick);
  } catch {}
  const mode = pick === "system" ? systemMode() : pick;
  // The pick changed though the mode didn't (the system is already in it): the controls still move.
  if (read() === mode) return void window.dispatchEvent(new Event(EVENT));
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!("startViewTransition" in document) || still) return apply(mode);
  const x = from?.x ?? innerWidth / 2;
  const y = from?.y ?? 0;
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const t = document.startViewTransition(() => apply(mode));
  t.ready
    .then(() =>
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 560, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" },
      ),
    )
    .catch(() => {});
}

const centerOf = (el: Element) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

function subscribe(onChange: () => void) {
  const system = matchMedia("(prefers-color-scheme: dark)");
  // Only while the pick is the system's: then the system decides.
  const follow = () => readPick() === "system" && apply(systemMode());
  // Another tab picked.
  const other = (e: StorageEvent) => e.key === KEY && apply(e.newValue === "light" || e.newValue === "dark" ? e.newValue : systemMode());
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", other);
  system.addEventListener("change", follow);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", other);
    system.removeEventListener("change", follow);
  };
}

export function useColorMode(): ColorMode {
  return useSyncExternalStore(subscribe, read, () => "light");
}

/** Your pick, the system's until you make one. */
export function useColorPick(): ColorPick {
  return useSyncExternalStore(subscribe, readPick, () => "system");
}

const OPTIONS = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
] as const;

/** Sun, moon and screen side by side, your pick raised. 32px tall, to sit in any toolbar row. */
export function ColorModeSwitch({ className }: { className?: string }) {
  const pick = useColorPick();
  const id = useId();
  return (
    <LayoutGroup id={id}>
      <div
        role="radiogroup"
        aria-label="Color mode"
        className={cn("inline-flex h-8 shrink-0 items-center gap-0.5 rounded-[7px] bg-fg/[0.06] p-0.5", className)}
        onKeyDown={(e) => {
          const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
          if (!step) return;
          e.preventDefault();
          const next = OPTIONS[(OPTIONS.findIndex((o) => o.value === pick) + step + OPTIONS.length) % OPTIONS.length].value;
          const target = e.currentTarget.querySelector<HTMLElement>(`[data-mode="${next}"]`);
          setColorMode(next, target ? centerOf(target) : undefined);
          target?.focus();
        }}
      >
        {OPTIONS.map(({ value, label, icon: I }) => {
          const on = pick === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={label}
              title={label}
              data-mode={value}
              tabIndex={on ? 0 : -1}
              onClick={(e) => setColorMode(value, centerOf(e.currentTarget))}
              className={cn("relative grid h-7 w-7 place-items-center rounded-[5px] transition-colors", on ? "text-fg" : "text-subtle hover:text-fg")}
            >
              {on && <motion.span layoutId="mode" className="absolute inset-0 rounded-[6px] bg-raised shadow-[0_1px_2px_rgb(var(--bd-shade)/0.16),0_0_0_1px_rgb(var(--bd-ink)/0.06)]" transition={{ type: "spring", stiffness: 520, damping: 36 }} />}
              <I size={15} weight="duotone" className="relative" />
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

/* The system's own mode, for saying what System means right now. */
const darkQuery = () => matchMedia("(prefers-color-scheme: dark)");
function onSystem(change: () => void) {
  const q = darkQuery();
  q.addEventListener("change", change);
  return () => q.removeEventListener("change", change);
}
const useSystemMode = () => useSyncExternalStore(onSystem, systemMode, () => "light" as ColorMode);

/**
 * basedraft in miniature, in a mode's own colors: the header's capsule with its button, and the
 * hero's card under it, light paper in both modes as on the site, with its two buttons. The main
 * buttons wear the real edge, so they run rainbow on light and metal on dark, as on the site.
 */
function MiniSite({ mode }: { mode: ColorMode }) {
  return (
    <span aria-hidden data-theme={mode === "dark" ? "dark" : undefined} className={cn("absolute inset-0 block bg-canvas", mode === "light" && "bd-light")}>
      <span className="absolute inset-x-5 top-2.5 flex h-[22px] items-center gap-2 rounded-full bg-surface pl-2 pr-1 shadow-[0_0_0_1px_var(--bd-line),0_1px_2px_rgb(var(--bd-shade)/0.08)]">
        <span className="size-2.5 rounded-[3px] bg-fg" />
        <span className="mx-auto flex items-center gap-2">
          {[16, 20, 12, 14].map((w, k) => (
            <span key={k} className="h-1 rounded-full bg-fg/25" style={{ width: w }} />
          ))}
        </span>
        <span className="btn-metal h-3.5 w-9 rounded-full" />
      </span>
      <span
        className="bd-light absolute inset-x-2.5 bottom-2.5 top-[42px] flex flex-col items-center justify-center overflow-hidden rounded-[12px] bg-paper shadow-[0_0_0_1px_color-mix(in_oklab,var(--bd-paper-ink)_8%,transparent)]"
        style={{ backgroundImage: "radial-gradient(55% 75% at 0% 0%, var(--bd-glow-blue), transparent), radial-gradient(45% 70% at 100% 0%, var(--bd-glow-lilac), transparent), radial-gradient(55% 70% at 75% 115%, var(--bd-glow-mint), transparent)" }}
      >
        <span className="h-2 w-[56%] rounded-full bg-paper-ink" />
        <span className="mt-1.5 h-2 w-[38%] rounded-full bg-paper-ink/35" />
        <span className="mt-2.5 h-1 w-[46%] rounded-full bg-paper-ink/20" />
        <span className="mt-3 flex gap-1.5">
          <span className="btn-metal h-4 w-12 rounded-full" />
          <span className="h-4 w-11 rounded-full bg-paper shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--bd-paper-ink)_14%,transparent)]" />
        </span>
      </span>
    </span>
  );
}

/* How much of the picture is dark: none, all of it, or the system's slant, from light into dark. */
const DARK_SHARE: Record<ColorPick, string> = {
  light: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)",
  dark: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
  system: "polygon(60% 0%, 100% 0%, 100% 100%, 40% 100%)",
};

/**
 * The site header's theme: one round button wearing your pick's icon, which turns into the next
 * when you pick. It opens onto basedraft in miniature, over a row of Light, Dark and System, your
 * pick on a charcoal thumb with the main buttons' running edge. Point at a choice, or walk to it
 * with the arrows, and the picture wipes to it first; pick it and the site follows, the new mode
 * growing out of the button, with the menu left open to watch it. A line under says what the
 * choice means. Escape or a click away closes it.
 */
export function ThemeMenu({ className }: { className?: string }) {
  const pick = useColorPick();
  const system = useSystemMode();
  const still = useReducedMotion();
  const id = useId();
  const [open, setOpen] = useState(false);
  // The choice being pointed at or walked to, shown in the picture before it's picked.
  const [peek, setPeek] = useState<ColorPick | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const current = OPTIONS.find((o) => o.value === pick) ?? OPTIONS[2];
  const shown = peek ?? pick;
  const close = () => {
    setOpen(false);
    setPeek(null);
  };
  useEffect(() => {
    if (!open) return;
    // Opened, your pick has focus; a press or a focus outside closes it.
    box.current?.querySelector<HTMLElement>("[aria-checked=true]")?.focus({ preventScroll: true });
    const away = (e: Event) => {
      if (box.current?.contains(e.target as Node)) return;
      setOpen(false);
      setPeek(null);
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("focusin", away);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("focusin", away);
    };
  }, [open]);
  const Current = current.icon;
  const says = shown === "system" ? `Matches your device, ${system} right now.` : `Always ${shown} on this browser.`;
  return (
    <div
      ref={box}
      className={cn("relative shrink-0", className)}
      onKeyDown={(e) => {
        if (!open) return;
        if (e.key === "Escape") {
          close();
          button.current?.focus();
          return;
        }
        const items = [...e.currentTarget.querySelectorAll<HTMLElement>("[role=menuitemradio]")];
        const at = items.indexOf(document.activeElement as HTMLElement);
        const to = e.key === "ArrowRight" || e.key === "ArrowDown" ? at + 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? at - 1 : e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : null;
        if (to === null) return;
        e.preventDefault();
        items[(to + items.length) % items.length]?.focus();
      }}
    >
      <button
        ref={button}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Theme: ${current.label}`}
        title="Theme"
        className="grid size-9 place-items-center overflow-hidden rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-fg aria-expanded:bg-surface-2 aria-expanded:text-fg"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={pick}
            initial={still ? { opacity: 0 } : { opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={still ? { opacity: 0 } : { opacity: 0, rotate: 90, scale: 0.5 }}
            transition={still ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 26 }}
            className="grid place-items-center"
          >
            <Current weight="duotone" size={17} />
          </motion.span>
        </AnimatePresence>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="Theme"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full z-50 mt-2 w-[312px] origin-top-right rounded-[24px] bg-surface p-2 text-fg shadow-[var(--bd-shadow-float),0_0_0_1px_var(--bd-line)]"
          >
            {/* The picture: light under, dark over it, as much of the dark showing as the choice asks. */}
            <div className="relative h-[156px] overflow-hidden rounded-[17px] shadow-[0_0_0_1px_var(--bd-line)]">
              <MiniSite mode="light" />
              <motion.span
                aria-hidden
                className="absolute inset-0 block"
                initial={false}
                animate={{ clipPath: DARK_SHARE[shown] }}
                transition={still ? { duration: 0 } : { duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              >
                <MiniSite mode="dark" />
              </motion.span>
            </div>
            <LayoutGroup id={id}>
              <div className="mt-2 grid grid-cols-3 rounded-full bg-fg/[0.05] p-1" onPointerLeave={() => setPeek(null)}>
                {OPTIONS.map(({ value, label, icon: I }) => {
                  const on = pick === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={on}
                      tabIndex={on ? 0 : -1}
                      onClick={() => setColorMode(value, button.current ? centerOf(button.current) : undefined)}
                      onPointerEnter={() => setPeek(value)}
                      onFocus={() => setPeek(value)}
                      className={cn("relative flex h-9 items-center justify-center gap-1.5 rounded-full text-[13px] font-medium outline-none transition-colors", on ? "text-[oklch(98%_0_0)]" : "text-muted hover:text-fg focus-visible:bg-fg/[0.06] focus-visible:text-fg")}
                    >
                      {/* Your pick's thumb: charcoal in the main buttons' running edge, sliding to a new pick. */}
                      {on && <motion.span layoutId="theme-thumb" aria-hidden className="btn-metal absolute inset-0 rounded-full" transition={still ? { duration: 0 } : { type: "spring", stiffness: 480, damping: 38 }} />}
                      <I weight="duotone" size={15} className="relative shrink-0" />
                      <span className="relative">{label}</span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
            <p aria-live="polite" className="px-2.5 pb-1 pt-2.5 text-meta text-muted">
              {says}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
