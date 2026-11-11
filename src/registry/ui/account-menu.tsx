"use client";

import { ChatTextIcon, CheckIcon, SignOutIcon, SlidersHorizontalIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

/*
 * You, as the others in the workspace see you. Your face (with your name and what you're on beside
 * it, in a sidebar's foot) opens a panel to say where you are: here, focusing, or away, the dot
 * on your face following, with a line about what you're on. From the same panel, switch to
 * another of your workspaces, open your preferences, or sign out. It opens over the page in the
 * theme of where its button is; Escape hands the focus back.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/*
 * A face for someone without a picture, the way Vercel draws them: two colors picked by their name,
 * one dithered into the other through a 4 by 4 ordered matrix, so the same name always gets the
 * same face.
 */
const FACE_BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const FACE_CELLS = 12;
/** The second color's cells, as one path, for each way the gradient can run. */
const FACE_RAMPS = [0, 1, 2, 3].map((dir) => {
  const n = FACE_CELLS - 1;
  let d = "";
  for (let y = 0; y < FACE_CELLS; y++)
    for (let x = 0; x < FACE_CELLS; x++) {
      const t = dir === 0 ? x / n : dir === 1 ? y / n : dir === 2 ? (x + y) / (2 * n) : (x + n - y) / (2 * n);
      if ((FACE_BAYER[(y % 4) * 4 + (x % 4)] + 0.5) / 16 < t * 1.25 - 0.12) d += `M${x} ${y}h1v1h-1z`;
    }
  return d;
});
/** Light and deep, in the muted colors basedraft uses: ocean, pine, moss, ochre, clay, rose, plum, slate. */
const FACE_COLORS: Array<[string, string]> = [
  ["oklch(0.86 0.07 235)", "oklch(0.47 0.13 252)"],
  ["oklch(0.87 0.07 170)", "oklch(0.46 0.09 172)"],
  ["oklch(0.9 0.08 128)", "oklch(0.55 0.12 138)"],
  ["oklch(0.91 0.09 88)", "oklch(0.64 0.14 62)"],
  ["oklch(0.87 0.07 45)", "oklch(0.55 0.14 35)"],
  ["oklch(0.87 0.08 8)", "oklch(0.52 0.16 2)"],
  ["oklch(0.86 0.09 330)", "oklch(0.48 0.15 318)"],
  ["oklch(0.89 0.02 255)", "oklch(0.44 0.04 258)"],
];
const faceSeed = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

/** Someone's dithered face, filling its box; give it colors to draw it in theirs. */
function Face({ name, colors }: { name: string; colors?: [string, string] }) {
  const seed = faceSeed(name);
  const [light, deep] = colors ?? FACE_COLORS[seed % FACE_COLORS.length];
  return (
    <svg viewBox={`0 0 ${FACE_CELLS} ${FACE_CELLS}`} shapeRendering="crispEdges" aria-hidden className="block size-full">
      <rect width={FACE_CELLS} height={FACE_CELLS} style={{ fill: light }} />
      <path d={FACE_RAMPS[(seed >>> 5) % 4]} style={{ fill: deep }} />
    </svg>
  );
}

export type AccountStatus = "here" | "focus" | "away";
export type AccountWorkspace = { id: string; name: string; logo?: ReactNode; role?: string };

export type AccountMenuProps = {
  user: { name: string; email?: string; avatar?: string };
  /** Where you are: here, focusing, or away. Your face wears it as a dot. */
  status?: AccountStatus;
  defaultStatus?: AccountStatus;
  onStatusChange?: (status: AccountStatus) => void;
  /** A line about what you're on, shown to the others beside your name. */
  note?: string;
  defaultNote?: string;
  onNoteChange?: (note: string) => void;
  /** The workspaces you're in, to switch between from here. */
  workspaces?: AccountWorkspace[];
  workspace?: string;
  onWorkspaceChange?: (id: string) => void;
  /** Adds Preferences to the foot. */
  onPreferences?: () => void;
  /** Adds Sign out to the foot. */
  onSignOut?: () => void;
  /** Row: your face, name and status, for a sidebar's foot. Face: just your face, for a header or a rail. */
  trigger?: "row" | "face";
  side?: "top" | "bottom";
  align?: "start" | "end";
  className?: string;
};

const W = 288;
const STATUS: Array<{ id: AccountStatus; label: string; hint: string; dot: string }> = [
  { id: "here", label: "Here", hint: "Around and reachable", dot: "bg-[var(--bd-ui-ok)]" },
  { id: "focus", label: "Focus", hint: "Heads down, notifications held", dot: "bg-[var(--bd-ui-wait)]" },
  { id: "away", label: "Away", hint: "Back later", dot: "bg-[var(--bd-subtle)]" },
];

export function AccountMenu({ user, status, defaultStatus = "here", onStatusChange, note, defaultNote = "", onNoteChange, workspaces = [], workspace, onWorkspaceChange, onPreferences, onSignOut, trigger = "row", side = "top", align = "start", className }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [innerStatus, setInnerStatus] = useState(defaultStatus);
  const [innerNote, setInnerNote] = useState(defaultNote);
  const [place, setPlace] = useState<{ style: CSSProperties; theme?: string; light: boolean } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const now = status ?? innerStatus;
  const said = note ?? innerNote;
  const dot = STATUS.find((s) => s.id === now)!;
  const ws = workspaces.find((w) => w.id === workspace) ?? workspaces[0];

  const setStatus = (s: AccountStatus) => {
    setInnerStatus(s);
    onStatusChange?.(s);
  };
  const setNote = (n: string) => {
    setInnerNote(n);
    onNoteChange?.(n);
  };
  const show = () => {
    const b = button.current!;
    const r = b.getBoundingClientRect();
    const left = align === "start" ? Math.min(Math.max(8, r.left), innerWidth - W - 8) : Math.max(8, r.right - W);
    const up = side === "top" ? r.top > 420 : r.bottom + 420 > innerHeight;
    const scope = b.closest<HTMLElement>("[data-theme], .dark, .light, .bd-light");
    setPlace({ style: up ? { left, bottom: innerHeight - r.top + 8, width: W } : { left, top: r.bottom + 8, width: W }, theme: scope?.dataset.theme ?? (scope?.classList.contains("dark") ? "dark" : undefined), light: !!scope && (scope.classList.contains("light") || scope.classList.contains("bd-light")) });
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus());
    const away = (e: PointerEvent) => !panel.current?.contains(e.target as Node) && !button.current?.contains(e.target as Node) && setOpen(false);
    const drift = (e: Event) => !panel.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", away, true);
    window.addEventListener("scroll", drift, { capture: true, passive: true });
    window.addEventListener("resize", drift);
    return () => {
      document.removeEventListener("pointerdown", away, true);
      window.removeEventListener("scroll", drift, { capture: true });
      window.removeEventListener("resize", drift);
    };
  }, [open]);

  // Escape closes and hands the focus back; Tab moves through it as a page would.
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    close();
  };
  // The three statuses are one radio group: the arrows move between them.
  const statusKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const i = STATUS.findIndex((s) => s.id === now);
    const next = STATUS[(i + step + STATUS.length) % STATUS.length];
    setStatus(next.id);
    e.currentTarget.querySelector<HTMLElement>(`[data-status="${next.id}"]`)?.focus();
  };

  const face = (size: string, ring = "ring-[var(--bd-surface)]") => (
    <span className={cx("relative shrink-0", size)}>
      <span className="grid size-full place-items-center overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {user.avatar ? <img src={user.avatar} alt="" className="size-full object-cover" /> : <Face name={user.name} />}
      </span>
      <span aria-hidden className={cx("absolute -bottom-px -right-px size-2.5 rounded-full ring-2 transition-colors", ring, dot.dot)} />
    </span>
  );

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={trigger === "face" ? `${user.name}, ${dot.label.toLowerCase()}` : undefined}
        title={trigger === "face" ? user.name : undefined}
        onClick={() => (open ? close() : show())}
        className={cx(
          "outline-none transition-[background-color,scale] duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]",
          trigger === "row" ? "flex h-11 w-full items-center gap-2.5 overflow-hidden rounded-[11px] px-[5px] text-left hover:bg-[rgb(var(--bd-ink)/0.045)] aria-expanded:bg-[rgb(var(--bd-ink)/0.06)]" : "grid h-11 w-full place-items-center rounded-[11px] hover:bg-[rgb(var(--bd-ink)/0.045)] aria-expanded:bg-[rgb(var(--bd-ink)/0.06)]",
          className,
        )}
      >
        {face("size-[30px]")}
        {trigger === "row" && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-[var(--bd-fg)]">{user.name}</span>
            <span className="block truncate text-[12px] text-[var(--bd-subtle)]">{said || dot.label}</span>
          </span>
        )}
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && place && (
              <div data-theme={place.theme} className={place.light ? "light bd-light" : undefined} style={{ display: "contents" }}>
                <motion.div
                  ref={panel}
                  role="dialog"
                  aria-label="You"
                  onKeyDown={key}
                  initial={{ opacity: 0, scale: 0.97, y: side === "top" ? 6 : -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.1 } }}
                  transition={still ? { duration: 0 } : { type: "spring", stiffness: 560, damping: 38 }}
                  style={{ ...place.style, transformOrigin: `${side === "top" ? "bottom" : "top"} ${align === "start" ? "left" : "right"}` }}
                  className="fixed z-[95] overflow-hidden rounded-[20px] bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.1),0_22px_48px_-20px_rgb(var(--bd-shade)/0.55),0_2px_6px_rgb(var(--bd-shade)/0.08)]"
                >
                  {/* You, as the others see you. */}
                  <div className="flex items-center gap-3 px-4 pb-3 pt-4">
                    {face("size-10")}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold tracking-[-0.01em]">{user.name}</span>
                      {user.email && <span className="block truncate font-mono text-[11.5px] text-[var(--bd-muted)]">{user.email}</span>}
                    </span>
                  </div>

                  {/* Where you are: three to choose from, and a line about what you're on. */}
                  <div className="px-3 pb-3">
                    <div role="radiogroup" aria-label="Your status" onKeyDown={statusKey} className="grid grid-cols-3 gap-0.5 rounded-full bg-[var(--bd-ui-track)] p-1 shadow-[var(--bd-ui-well)]">
                      {STATUS.map((s) => {
                        const on = s.id === now;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            data-status={s.id}
                            tabIndex={on ? 0 : -1}
                            onClick={() => setStatus(s.id)}
                            title={s.hint}
                            className={cx("relative flex h-8 items-center justify-center gap-1.5 rounded-full text-[12.5px] outline-none transition-colors focus-visible:shadow-[0_0_0_2px_var(--bd-ui-focus)]", on ? "font-medium text-[var(--bd-fg)]" : "text-[var(--bd-muted)] hover:text-[var(--bd-fg)]")}
                          >
                            {on && <motion.span layoutId="account-status" aria-hidden className="absolute inset-0 rounded-full [background:var(--bd-ui-raised)] shadow-[var(--bd-ui-lift),inset_0_0_0_1px_rgb(var(--bd-ink)/0.06)]" transition={still ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 40 }} />}
                            <span className={cx("relative size-1.5 rounded-full", s.dot)} />
                            <span className="relative">{s.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <label className="mt-2 flex h-9 items-center gap-2 rounded-full px-3 text-[13px] shadow-[inset_0_0_0_1px_var(--bd-line)] focus-within:shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.4),0_0_0_3px_rgb(var(--bd-ink)/0.06)]">
                      <ChatTextIcon weight="duotone" className="size-4 shrink-0 text-[var(--bd-subtle)]" />
                      <input value={said} onChange={(e) => setNote(e.target.value)} maxLength={60} placeholder="What are you on?" aria-label="What you're on" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--bd-subtle)]" />
                      {said && (
                        <button type="button" onClick={() => setNote("")} aria-label="Clear it" className="grid size-6 place-items-center rounded-[7px] text-[var(--bd-subtle)] hover:text-[var(--bd-fg)]">
                          <XIcon weight="regular" className="size-3" />
                        </button>
                      )}
                    </label>
                  </div>

                  {/* Your workspaces, to switch from here. */}
                  {workspaces.length > 1 && (
                    <div className="border-t border-[var(--bd-line-subtle)] p-1.5">
                      <p className="px-2.5 pb-1 pt-1.5 text-[11.5px] text-[var(--bd-subtle)]">Workspaces</p>
                      {workspaces.map((w) => {
                        const on = w.id === ws?.id;
                        return (
                          <button key={w.id} type="button" onClick={() => (onWorkspaceChange?.(w.id), close())} aria-current={on ? "true" : undefined} className="flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2 text-left text-[13px] outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.05)] focus-visible:bg-[rgb(var(--bd-ink)/0.06)]">
                            <span className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-[7px] text-[11px] font-semibold text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]">{w.logo ?? w.name.charAt(0)}</span>
                            <span className="min-w-0 flex-1 truncate">{w.name}</span>
                            {w.role && <span className="text-[12px] text-[var(--bd-subtle)]">{w.role}</span>}
                            <CheckIcon weight="bold" className={cx("size-3.5 shrink-0", on ? "opacity-100" : "opacity-0")} />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {(onPreferences || onSignOut) && (
                    <div className="flex items-center gap-1 border-t border-[var(--bd-line-subtle)] bg-[rgb(var(--bd-ink)/0.02)] p-1.5">
                      {onPreferences && (
                        <button type="button" onClick={() => (close(), onPreferences())} className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[9px] text-[12.5px] font-medium outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] focus-visible:bg-[rgb(var(--bd-ink)/0.07)] [&_svg]:size-3.5">
                          <SlidersHorizontalIcon weight="duotone" /> Preferences
                        </button>
                      )}
                      {onSignOut && (
                        <button type="button" onClick={() => (close(), onSignOut())} className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[9px] text-[12.5px] font-medium text-[var(--bd-muted)] outline-none transition-colors hover:bg-[color-mix(in_oklab,var(--bd-ui-stop)_10%,transparent)] hover:text-[var(--bd-ui-stop)] focus-visible:bg-[rgb(var(--bd-ink)/0.07)] [&_svg]:size-3.5">
                          <SignOutIcon weight="duotone" /> Sign out
                        </button>
                      )}
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
