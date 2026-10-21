"use client";

import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { LayoutGroup, motion } from "motion/react";
import { useId, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { COLOR_MODE_KEY } from "./color-mode-script";

/*
 * Light and dark for basedraft's own chrome, the site and Studio alike. The mode lives on
 * <html data-theme>, so the color tokens in globals.css flip in one place. Your pick is kept in
 * this browser; until you pick, it follows the system. Templates keep their own colors either way.
 */

export type ColorMode = "light" | "dark";
const KEY = COLOR_MODE_KEY;
const EVENT = "bd-theme-change";

const read = (): ColorMode => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

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
 * Switches mode and keeps it. Given where the switch is, the new mode grows out of it in a circle
 * over the old one; without View Transitions, or with reduced motion, it simply switches.
 */
export function setColorMode(mode: ColorMode, from?: { x: number; y: number }) {
  try {
    localStorage.setItem(KEY, mode);
  } catch {}
  if (read() === mode) return;
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
  // Only while you haven't picked: then the system decides.
  const follow = () => {
    let picked: string | null = null;
    try {
      picked = localStorage.getItem(KEY);
    } catch {}
    if (picked !== "light" && picked !== "dark") apply(system.matches ? "dark" : "light");
  };
  // Another tab switched.
  const other = (e: StorageEvent) => e.key === KEY && (e.newValue === "light" || e.newValue === "dark") && apply(e.newValue);
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

const OPTIONS = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
] as const;

/** Sun and moon side by side, the current one raised. 32px tall, to sit in any toolbar row. */
export function ColorModeSwitch({ className }: { className?: string }) {
  const mode = useColorMode();
  const id = useId();
  return (
    <LayoutGroup id={id}>
      <div
        role="radiogroup"
        aria-label="Color mode"
        className={cn("inline-flex h-8 shrink-0 items-center gap-0.5 rounded-[7px] bg-fg/[0.06] p-0.5", className)}
        onKeyDown={(e) => {
          if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
          e.preventDefault();
          const next = mode === "light" ? "dark" : "light";
          const target = e.currentTarget.querySelector<HTMLElement>(`[data-mode="${next}"]`);
          setColorMode(next, target ? centerOf(target) : undefined);
          target?.focus();
        }}
      >
        {OPTIONS.map(({ value, label, icon: I }) => {
          const on = mode === value;
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

/** One button: the sun in dark mode, the moon in light, switching to the other. For the site's header. */
export function ColorModeToggle({ className }: { className?: string }) {
  const mode = useColorMode();
  const next = mode === "dark" ? "light" : "dark";
  const I = mode === "dark" ? SunIcon : MoonIcon;
  return (
    <button
      type="button"
      onClick={(e) => setColorMode(next, centerOf(e.currentTarget))}
      aria-label={`Switch to ${next} mode`}
      title={`${next[0].toUpperCase()}${next.slice(1)} mode`}
      className={cn("grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-fg", className)}
    >
      <I weight="duotone" size={17} />
    </button>
  );
}
