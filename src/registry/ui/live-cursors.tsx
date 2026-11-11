"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";

/*
 * Who else is here, and where: each person's cursor glides to where they are on a spring,
 * carrying their name, with the box they've selected and what they're saying in a bubble by
 * their pointer. Press / to say something at your own pointer. Above it, Viewers shows
 * everyone in their color; choose one to follow them, and the surface is framed in theirs.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export type Person = { id: string; name: string; /** Any CSS color: their cursor, ring and dot. */ color: string; avatar?: string };
export type Presence = Person & {
  /** Where their pointer is, from 0 to 1 across and down the surface. */
  x: number;
  y: number;
  /** What they're saying, in a bubble by their pointer. */
  message?: string;
  /** Dots in their bubble while they type. */
  typing?: boolean;
  /** The box they've selected, from 0 to 1, as x, y, width and height. */
  selection?: { x: number; y: number; w: number; h: number };
  /** Away: the cursor fades and its name tucks away. */
  idle?: boolean;
};


/** The arrow, in their color, edged in white so it reads on anything. */
function Arrow({ color }: { color: string }) {
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" className="block drop-shadow-[0_2px_3px_rgb(0_0_0/0.25)]" aria-hidden>
      <path d="M2.2 1.6 15.6 9.4c.9.5.7 1.8-.3 2l-5.6 1.2-2.6 5.2c-.4.9-1.7.8-2-.2L1 2.8C.8 1.9 1.4 1.2 2.2 1.6Z" fill={color} stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function Dots() {
  return (
    <span className="flex h-4 items-center gap-[3px] px-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="size-[5px] rounded-full bg-current" animate={{ y: [0, -3, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
      ))}
    </span>
  );
}

export type LiveCursorsProps = {
  /** Everyone else, where they are. */
  people: Presence[];
  /** You: the name and color your own bubble wears. */
  you?: Person;
  /** Runs with what you said after pressing / and Enter. */
  onMessage?: (text: string) => void;
  /** Whose view you're following: the surface is framed in their color. */
  following?: string | null;
  onStopFollowing?: () => void;
  /** The shared surface. */
  children: ReactNode;
  className?: string;
};

export function LiveCursors({ people, you, onMessage, following = null, onStopFollowing, children, className }: LiveCursorsProps) {
  const [chat, setChat] = useState<null | { x: number; y: number; text: string }>(null);
  const [said, setSaid] = useState<null | { text: string; x: number; y: number }>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const id = useId();
  const led = people.find((p) => p.id === following);
  const glide = still ? { duration: 0 } : { type: "spring" as const, stiffness: 120, damping: 20, mass: 0.7 };

  // What you said stays a moment, then goes.
  useEffect(() => {
    if (!said) return;
    const t = setTimeout(() => setSaid(null), 4000);
    return () => clearTimeout(t);
  }, [said]);

  // With your pointer over the surface, / opens your bubble there, wherever the focus is.
  useEffect(() => {
    if (!you || !pointer || chat) return;
    const slash = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || t?.closest("input, textarea, select, [contenteditable='true']")) return;
      e.preventDefault();
      setChat({ ...pointer, text: "" });
    };
    addEventListener("keydown", slash);
    return () => removeEventListener("keydown", slash);
  }, [you, pointer, chat]);

  const where = (clientX: number, clientY: number) => {
    const r = box.current!.getBoundingClientRect();
    return { x: (clientX - r.left) / r.width, y: (clientY - r.top) / r.height };
  };
  const keys = (e: ReactKeyboardEvent) => {
    const typing = (e.target as HTMLElement).closest("input, textarea, [contenteditable='true']");
    if (e.key === "/" && !chat && !typing) {
      e.preventDefault();
      const at = pointer ?? { x: 0.5, y: 0.5 };
      setChat({ ...at, text: "" });
    } else if (e.key === "Escape") {
      if (chat) setChat(null);
      else if (following) onStopFollowing?.();
    }
  };

  return (
    <div
      ref={box}
      role="region"
      aria-label="Shared surface"
      aria-describedby={you ? `${id}-help` : undefined}
      tabIndex={you ? 0 : -1}
      onKeyDown={keys}
      onPointerMove={(e) => {
        const p = where(e.clientX, e.clientY);
        setPointer(p);
        if (chat) setChat({ ...chat, x: p.x, y: p.y });
      }}
      onPointerLeave={() => setPointer(null)}
      className={cx("relative isolate outline-none focus-visible:shadow-[0_0_0_2px_var(--bd-ui-focus)]", className)}
    >
      {you && (
        <p id={`${id}-help`} className="sr-only">
          Press slash to say something to everyone here.
        </p>
      )}
      {children}

      {/* Everyone else: their selection, then their cursor, name and bubble. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[inherit]">
        <AnimatePresence>
          {people.map((p) =>
            p.selection ? (
              <motion.div
                key={`${p.id}-sel`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1, left: `${p.selection.x * 100}%`, top: `${p.selection.y * 100}%`, width: `${p.selection.w * 100}%`, height: `${p.selection.h * 100}%` }}
                exit={{ opacity: 0 }}
                transition={glide}
                className="absolute rounded-[4px]"
                style={{ boxShadow: `inset 0 0 0 1.5px ${p.color}`, background: `color-mix(in oklab, ${p.color} 5%, transparent)` }}
              >
                {["-left-[3.5px] -top-[3.5px]", "-right-[3.5px] -top-[3.5px]", "-bottom-[3.5px] -left-[3.5px]", "-bottom-[3.5px] -right-[3.5px]"].map((at) => (
                  <span key={at} className={cx("absolute size-[7px] rounded-[1.5px] bg-[var(--bd-surface)]", at)} style={{ boxShadow: `inset 0 0 0 1.5px ${p.color}` }} />
                ))}
                <span className="absolute -top-[24px] left-0 flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-medium text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]">
                  <span className="size-1.5 rounded-full" style={{ background: p.color }} />
                  {p.name.split(" ")[0]}
                </span>
              </motion.div>
            ) : null,
          )}
        </AnimatePresence>
        {people.map((p) => (
          <motion.div key={p.id} initial={false} animate={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, opacity: p.idle ? 0.45 : 1 }} transition={glide} className="absolute">
            <Arrow color={p.color} />
            <div className="absolute left-3.5 top-4 grid w-max max-w-[220px] justify-items-start gap-1">
              <AnimatePresence initial={false}>
                {!p.idle && (
                  <motion.span key="name" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex origin-top-left items-center gap-1.5 whitespace-nowrap rounded-full py-0.5 pl-1.5 pr-2 text-[11.5px] font-medium shadow-[0_2px_8px_rgb(0_0_0/0.18)] text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]">
                    <span className="size-2 rounded-full shadow-[0_0_0_1.5px_rgb(255_255_255/0.25)]" style={{ background: p.color }} />
                    {p.name}
                  </motion.span>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {(p.message || p.typing) && (
                  <motion.span
                    key="bubble"
                    initial={{ opacity: 0, scale: 0.6, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={still ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 26 }}
                    className="w-max max-w-[220px] origin-top-left rounded-[14px] rounded-tl-[4px] px-3 py-1.5 text-[12.5px] leading-snug shadow-[0_6px_18px_-4px_rgb(0_0_0/0.3)] text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]"
                    style={{ boxShadow: `inset 2px 0 0 ${p.color}, 0 6px 18px -4px rgb(0 0 0 / 0.3)` }}
                  >
                    {p.typing && !p.message ? <Dots /> : p.message}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}

        {/* What you just said, staying by where you said it. */}
        <AnimatePresence>
          {said && you && (
            <motion.span key="said" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -6 }} className="absolute w-max max-w-[220px] origin-top-left rounded-[14px] rounded-tl-[4px] px-3 py-1.5 text-[12.5px] text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]" style={{ left: `${said.x * 100}%`, top: `${said.y * 100}%`, boxShadow: `inset 2px 0 0 ${you.color}, 0 6px 18px -4px rgb(0 0 0 / 0.3)`, marginLeft: 14, marginTop: 16 }}>
              {said.text}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Your own bubble, at your pointer, while you type. */}
      <AnimatePresence>
        {chat && you && (
          <motion.form
            key="chat"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={still ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 30 }}
            onSubmit={(e) => {
              e.preventDefault();
              const text = chat.text.trim();
              if (text) {
                onMessage?.(text);
                setSaid({ text, x: chat.x, y: chat.y });
              }
              setChat(null);
            }}
            className="absolute z-20 origin-top-left"
            style={{ left: `${chat.x * 100}%`, top: `${chat.y * 100}%`, marginLeft: 14, marginTop: 16 }}
          >
            <input
              autoFocus
              value={chat.text}
              onChange={(e) => setChat({ ...chat, text: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation();
                  setChat(null);
                  box.current?.focus();
                }
              }}
              aria-label="Say something to everyone here"
              placeholder="Say something"
              maxLength={120}
              className="w-[220px] rounded-[14px] rounded-tl-[4px] px-3 py-1.5 text-[12.5px] outline-none placeholder:text-[var(--bd-ui-ink-text)] placeholder:opacity-60 text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]"
              style={{ boxShadow: `inset 2px 0 0 ${you.color}, 0 6px 18px -4px rgb(0 0 0 / 0.3)` }}
            />
          </motion.form>
        )}
      </AnimatePresence>

      {/* Following someone: the surface framed in their color, and the way out. */}
      <AnimatePresence>
        {led && (
          <motion.div key="follow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-20 rounded-[inherit]" style={{ boxShadow: `inset 0 0 0 2.5px ${led.color}` }}>
            <button
              type="button"
              onClick={onStopFollowing}
              className="pointer-events-auto absolute left-1/2 top-2 flex -translate-x-1/2 items-center gap-1.5 rounded-full py-1 pl-2 pr-3 text-[12px] font-medium shadow-[0_4px_12px_rgb(0_0_0/0.2)] outline-none focus-visible:underline text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]"
            >
              <span className="size-2 rounded-full" style={{ background: led.color }} />
              Following {led.name.split(" ")[0]} · Esc to stop
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* What people say, for screen readers. */}
      <p aria-live="polite" className="sr-only">
        {people
          .filter((p) => p.message)
          .map((p) => `${p.name}: ${p.message}`)
          .join(". ")}
      </p>
    </div>
  );
}

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

export type ViewersProps = {
  people: Person[];
  /** How many faces before the rest fold into +N. */
  max?: number;
  /** Whose view you're following, ringed thicker. */
  following?: string | null;
  /** Runs when a face is chosen, with its id, or null to stop following. */
  onFollow?: (id: string | null) => void;
  /** sm sits beside a small button (32px tall with its ring); md is a step up. */
  size?: "sm" | "md";
  className?: string;
};

/** Everyone here, overlapping, each face dithered in their color; choose one to follow them. */
export function Viewers({ people, max = 4, following = null, onFollow, size = "sm", className }: ViewersProps) {
  const box = size === "sm" ? "size-7" : "size-9";
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <div role="group" aria-label={`${people.length} here`} className={cx("flex items-center", className)}>
      {shown.map((p, i) => {
        const on = p.id === following;
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={on}
            aria-label={on ? `Stop following ${p.name}` : `Follow ${p.name}`}
            onClick={() => onFollow?.(on ? null : p.id)}
            className="group/face relative -ml-2 rounded-full outline-none transition-transform duration-200 first:ml-0 hover:z-10 hover:-translate-y-0.5 focus-visible:z-10 focus-visible:-translate-y-0.5"
            style={{ zIndex: shown.length - i }}
          >
            <span className={cx("grid place-items-center overflow-hidden rounded-full transition-shadow duration-200", box)} style={{ boxShadow: on ? `0 0 0 2px var(--bd-surface), 0 0 0 4px ${p.color}` : "0 0 0 2px var(--bd-surface)" }}>
              {p.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.avatar} alt="" className="size-full object-cover" />
              ) : (
                <Face name={p.name} colors={[`color-mix(in oklab, ${p.color} 34%, white)`, p.color]} />
              )}
            </span>
            <span className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] -translate-x-1/2 whitespace-nowrap rounded-[8px] bg-[var(--bd-fg)] px-2 py-1 text-[11.5px] font-medium text-[var(--bd-surface)] opacity-0 transition-opacity duration-150 group-hover/face:opacity-100 group-focus-visible/face:opacity-100">
              {on ? "Following" : "Follow"} {p.name.split(" ")[0]}
            </span>
          </button>
        );
      })}
      {rest > 0 && (
        <span className={cx("relative -ml-2 grid place-items-center rounded-full bg-[var(--bd-ui-track)] text-[11px] font-semibold text-[var(--bd-muted)] shadow-[0_0_0_2px_var(--bd-surface)]", box)} aria-label={`and ${rest} more`}>
          +{rest}
        </span>
      )}
    </div>
  );
}
