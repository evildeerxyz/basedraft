"use client";

import { DesktopIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useId, useRef, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";

/*
 * Light and dark, switched with a circle of the new theme opening out from the button you
 * pressed (the View Transitions API, where the browser has it; elsewhere a plain cross-fade, or
 * an instant change when motion is reduced). Two forms: a button whose sun turns into a moon, and
 * a three-way switch with System. Neither applies or remembers the theme: they take a value and
 * call onChange inside the transition, so whatever onChange changes is what the circle reveals.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const SNAPPY = { type: "spring", stiffness: 520, damping: 42 } as const;

export type Theme = "light" | "dark";
export type ThemeChoice = Theme | "system";

/* While a reveal runs, the two pictures of the page stop cross-fading so the circle can cut the new one in. */
const STYLE = "bd-ui-theme-reveal";
const REVEAL_CSS = ":root.bd-ui-revealing::view-transition-old(root),:root.bd-ui-revealing::view-transition-new(root){animation:none;mix-blend-mode:normal}";

type ViewTransitionDoc = Document & { startViewTransition?: (update: () => void) => { ready: Promise<void>; finished: Promise<void> } };

/**
 * Runs `apply` inside a view transition: a circle opening from `from` (a point on screen) when
 * there is one, a cross-fade when not, or no transition at all when motion is reduced or the
 * browser can't. `apply` must change the page synchronously, as setting a class on <html> does.
 */
export function switchTheme(apply: () => void, from?: { x: number; y: number }) {
  const doc = document as ViewTransitionDoc;
  if (!doc.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return apply();
  const root = document.documentElement;
  if (from) {
    if (!document.getElementById(STYLE)) {
      const s = document.createElement("style");
      s.id = STYLE;
      s.textContent = REVEAL_CSS;
      document.head.append(s);
    }
    root.classList.add("bd-ui-revealing");
  }
  try {
    const t = doc.startViewTransition(() => flushSync(apply));
    if (from) {
      const r = Math.hypot(Math.max(from.x, innerWidth - from.x), Math.max(from.y, innerHeight - from.y));
      t.ready
        .then(() => root.animate({ clipPath: [`circle(0px at ${from.x}px ${from.y}px)`, `circle(${r}px at ${from.x}px ${from.y}px)`] }, { duration: 620, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" }))
        .catch(() => {});
      t.finished.finally(() => root.classList.remove("bd-ui-revealing"));
    }
  } catch {
    // Another transition was already running: just change it.
    root.classList.remove("bd-ui-revealing");
    apply();
  }
}

const center = (el: Element) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

const dark = () => matchMedia("(prefers-color-scheme: dark)");
const onScheme = (cb: () => void) => {
  const m = dark();
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

/** The theme the system prefers right now, following it as it changes. Light on the server. */
export function useSystemTheme(): Theme {
  return useSyncExternalStore(onScheme, () => (dark().matches ? "dark" : "light"), () => "light");
}

/* The sun and the moon in one drawing: a bite slides across the disc to make the crescent, and the rays fold away. */
function SunMoon({ night }: { night: boolean }) {
  const id = useId();
  const still = useReducedMotion();
  const t = still ? { duration: 0 } : SNAPPY;
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
      <mask id={id}>
        <rect width="24" height="24" fill="white" />
        <motion.circle cx="16.5" cy="7.5" r="7" fill="black" initial={false} animate={{ x: night ? 0 : 9, y: night ? 0 : -9 }} transition={t} />
      </mask>
      <motion.circle cx="12" cy="12" r="8.5" fill="currentColor" mask={`url(#${id})`} initial={false} animate={{ scale: night ? 1 : 0.52 }} transition={t} style={{ transformOrigin: "12px 12px" }} />
      <motion.g initial={false} animate={{ opacity: night ? 0 : 1, scale: night ? 0.4 : 1, rotate: night ? -45 : 0 }} transition={t} style={{ transformOrigin: "12px 12px" }}>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          return <line key={i} x1={12 + Math.cos(a) * 8} y1={12 + Math.sin(a) * 8} x2={12 + Math.cos(a) * 10.4} y2={12 + Math.sin(a) * 10.4} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />;
        })}
      </motion.g>
    </svg>
  );
}

/**
 * A round button between light and dark: pressed, its sun turns into a moon while the new theme
 * opens out in a circle from it. `value` is the theme showing now.
 */
export function ThemeToggle({ value, onChange, reveal = true, label = "Dark mode", className }: { value: Theme; onChange: (theme: Theme) => void; /** Open the new theme in a circle from the button. Off, it cross-fades. */ reveal?: boolean; label?: string; className?: string }) {
  const night = value === "dark";
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={night}
      onClick={(e) => switchTheme(() => onChange(night ? "light" : "dark"), reveal ? center(e.currentTarget) : undefined)}
      className={cx(
        "relative grid size-10 shrink-0 place-items-center rounded-full bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)] outline-none transition-[scale,box-shadow] duration-150 hover:shadow-[0_0_0_1px_var(--bd-line-strong),var(--bd-shadow-raised)] active:scale-[0.94] focus-visible:shadow-[0_0_0_1px_var(--bd-line),0_0_0_4px_var(--bd-ui-focus)]",
        className,
      )}
    >
      <SunMoon night={night} />
    </button>
  );
}

const CHOICES: Array<{ value: ThemeChoice; label: string; icon: ReactNode }> = [
  { value: "light", label: "Light", icon: <SunIcon weight="duotone" /> },
  { value: "dark", label: "Dark", icon: <MoonIcon weight="duotone" /> },
  { value: "system", label: "System", icon: <DesktopIcon weight="duotone" /> },
];

/**
 * Light, dark or the system's, as a small track with a thumb that slides to the choice. The
 * change runs in the same circle as the toggle, from the choice you picked. Words show with
 * `labels`; without them each is a named icon.
 */
export function ThemeSwitcher({ value, onChange, labels = false, reveal = true, className }: { value: ThemeChoice; onChange: (choice: ThemeChoice) => void; labels?: boolean; reveal?: boolean; className?: string }) {
  const id = useId();
  const track = useRef<HTMLDivElement>(null);
  const pick = (v: ThemeChoice, el: Element) => {
    if (v === value) return;
    switchTheme(() => onChange(v), reveal ? center(el) : undefined);
  };
  const onKey = (e: KeyboardEvent) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const i = CHOICES.findIndex((c) => c.value === value);
    const next = CHOICES[(i + step + CHOICES.length) % CHOICES.length];
    const el = track.current?.querySelector<HTMLElement>(`[data-value="${next.value}"]`);
    if (!el) return;
    el.focus();
    pick(next.value, el);
  };
  return (
    <LayoutGroup id={id}>
      <div ref={track} role="radiogroup" aria-label="Theme" onKeyDown={onKey} className={cx("inline-flex w-fit items-center gap-0.5 rounded-full bg-[var(--bd-ui-track)] p-1 shadow-[var(--bd-ui-well)]", className)}>
        {CHOICES.map((c) => {
          const on = c.value === value;
          return (
            <button
              key={c.value}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={labels ? undefined : c.label}
              tabIndex={on ? 0 : -1}
              data-value={c.value}
              onClick={(e) => pick(c.value, e.currentTarget)}
              className={cx(
                "relative flex h-8 items-center justify-center gap-1.5 rounded-full text-[13px] font-medium outline-none transition-[color,scale] duration-150 active:scale-[0.95] focus-visible:shadow-[0_0_0_2px_var(--bd-ui-focus)] [&_svg]:relative [&_svg]:size-4",
                labels ? "px-3" : "w-9",
                on ? "text-[var(--bd-fg)]" : "text-[var(--bd-subtle)] hover:text-[var(--bd-fg)]",
              )}
            >
              {on && <motion.span layoutId="theme" aria-hidden className="absolute inset-0 rounded-full [background:var(--bd-ui-raised)] shadow-[var(--bd-ui-lift),inset_0_0_0_1px_rgb(var(--bd-ink)/0.06)]" transition={SNAPPY} />}
              {c.icon}
              {labels && <span className="relative">{c.label}</span>}
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
