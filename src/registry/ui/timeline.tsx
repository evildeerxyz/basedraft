"use client";

import { motion, useReducedMotion } from "motion/react";
import { createContext, use, useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

/*
 * What happened, as an activity log. Times stand in a gutter on the left and every event hangs
 * from one rail: a raised bead for the ones that matter, carrying an icon or the person who did
 * it, and a small ring for the minor ones, so the eye finds the big moments first. Days gather
 * under their names, a comment sits in a bubble that points back at its bead, and a new event
 * slides in at the top while the rest make room. One still running wears a ring of dots with a
 * crest going round it.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* A 4 by 4 ordered-dither matrix: how much each dot of the running ring is nudged. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** A hue from 0 to 359 for a name, the same every time, as Avatar draws it. */
const hue = (name: string) => [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

const TONES = {
  default: { icon: "text-[var(--bd-muted)]", ring: "rgb(var(--bd-ink) / 0.06)", dot: "rgb(var(--bd-ink) / 0.38)" },
  ok: { icon: "text-[var(--bd-ui-ok)]", ring: "color-mix(in oklab, var(--bd-ui-ok) 45%, transparent)", dot: "var(--bd-ui-ok)" },
  warn: { icon: "text-[var(--bd-ui-wait)]", ring: "color-mix(in oklab, var(--bd-ui-wait) 50%, transparent)", dot: "var(--bd-ui-wait)" },
  stop: { icon: "text-[var(--bd-ui-stop)]", ring: "color-mix(in oklab, var(--bd-ui-stop) 45%, transparent)", dot: "var(--bd-ui-stop)" },
} as const;

/* Whether the list has drawn once: events there from the start just appear, ones added later slide in. */
const Ready = createContext(false);

export type TimelineProps = ComponentProps<"ol"> & {
  /** History goes on past the last event shown: the rail runs on below it and fades out. */
  continues?: boolean;
};

export function Timeline({ continues = false, className, children, ...props }: TimelineProps) {
  const root = useRef<HTMLOListElement>(null);
  const [ready, setReady] = useState(false);
  const [rail, setRail] = useState<{ x: number; top: number; height: number } | null>(null);
  useEffect(() => {
    const t = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(t);
  }, []);
  // One rail, from the first bead's middle to the last's, measured as events come, go and grow.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    // A bead's middle within the list, from layout offsets rather than the screen: right inside
    // anything scaled or zoomed, and while a new bead is still springing in.
    const middle = (bead: HTMLElement) => {
      let x = bead.offsetWidth / 2;
      let y = bead.offsetHeight / 2;
      for (let n: HTMLElement | null = bead; n && n !== el; n = n.offsetParent as HTMLElement | null) {
        x += n.offsetLeft;
        y += n.offsetTop;
      }
      return { x, y };
    };
    const measure = () => {
      const beads = el.querySelectorAll<HTMLElement>("[data-bead]");
      if (!beads.length) return setRail(null);
      const a = middle(beads[0]);
      const b = middle(beads[beads.length - 1]);
      const next = { x: a.x, top: a.y, height: b.y - a.y };
      setRail((r) => (r && Math.abs(r.x - next.x) < 0.5 && Math.abs(r.top - next.top) < 0.5 && Math.abs(r.height - next.height) < 0.5 ? r : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const mo = new MutationObserver(measure);
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, []);
  return (
    <Ready value={ready}>
      <ol ref={root} className={cx("relative grid grid-cols-[auto_28px_minmax(0,1fr)] gap-x-3", continues && "pb-14", className)} {...props}>
        {rail && <span aria-hidden className="pointer-events-none absolute w-px bg-[var(--bd-line-strong)]" style={{ left: rail.x - 0.5, top: rail.top, height: rail.height }} />}
        {rail && continues && (
          <span
            aria-hidden
            className="pointer-events-none absolute h-14 w-px [background:repeating-linear-gradient(to_bottom,var(--bd-line-strong)_0_3px,transparent_3px_7px)] [mask-image:linear-gradient(to_bottom,#000,transparent)]"
            style={{ left: rail.x - 0.5, top: rail.top + rail.height + 18 }}
          />
        )}
        {children}
      </ol>
    </Ready>
  );
}

export type TimelineGroupProps = Omit<ComponentProps<"li">, "children"> & {
  /** The day or stretch it gathers: Today, Yesterday, October 12. */
  label: ReactNode;
  children: ReactNode;
};

/** A day's events under its name. */
export function TimelineGroup({ label, className, children, ...props }: TimelineGroupProps) {
  return (
    <li className={cx("col-span-3 grid grid-cols-subgrid [&:not(:first-child)]:pt-4", className)} {...props}>
      <span />
      <span />
      <p className="pb-3 text-xs font-medium text-[var(--bd-muted)]">{label}</p>
      <ol className="col-span-3 grid grid-cols-subgrid">{children}</ol>
    </li>
  );
}

export type TimelineItemProps = Omit<ComponentProps<"li">, "title"> & {
  /** What happened, in a line. With a person, it follows their name. */
  title: ReactNode;
  /** When, as it reads, in the gutter: 09:42, 2m, Oct 14. */
  time?: ReactNode;
  /** The moment for machines, like 2026-10-14T09:42. */
  dateTime?: string;
  /** In the bead, at 14px. */
  icon?: ReactNode;
  /** Who did it: their initials or picture in the bead, and their name leading the line. */
  person?: { name: string; src?: string };
  /** The bead's color: plain, or ok, warn or stop. */
  tone?: keyof typeof TONES;
  /** A small event: a ring on the rail and a quieter line, so the big ones stand out. */
  minor?: boolean;
  /** Still happening: a ring of dots turns round the bead. */
  live?: boolean;
};

export function TimelineItem({ title, time, dateTime, icon, person, tone = "default", minor = false, live = false, className, children, ...props }: TimelineItemProps) {
  const ready = use(Ready);
  const still = useReducedMotion();
  const enter = ready && !still;
  const t = TONES[tone];
  return (
    <motion.li
      initial={enter ? { opacity: 0, height: 0, overflow: "hidden" } : false}
      animate={{ opacity: 1, height: "auto", transitionEnd: { overflow: "visible" } }}
      transition={{ height: { type: "spring", stiffness: 420, damping: 40 }, opacity: { duration: 0.2 } }}
      className={cx("col-span-3 grid grid-cols-subgrid last:[&>*]:pb-0", className)}
      {...(props as ComponentProps<typeof motion.li>)}
    >
      <span className={cx("whitespace-nowrap pt-[6px] text-right text-[11.5px] leading-4 tabular-nums text-[var(--bd-subtle)]", minor ? "pb-4" : "pb-6")}>
        {time != null && <time dateTime={dateTime}>{time}</time>}
      </span>
      <span className="relative flex justify-center">
        {minor ? (
          <span data-bead className="mt-[9.5px] size-[9px] rounded-full bg-[var(--bd-surface)]" style={{ boxShadow: `inset 0 0 0 1.5px ${t.dot}` }} />
        ) : (
          <motion.span data-bead initial={enter ? { scale: 0.5 } : false} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 520, damping: 26, delay: 0.05 }} className="relative grid size-7 place-items-center">
            {live && <Ring />}
            {person ? (
              <span
                className="grid size-7 place-items-center overflow-hidden rounded-full text-[10px] font-semibold tracking-[0.02em] shadow-[inset_0_1px_0_rgb(255_255_255/0.5),inset_0_0_0_1px_rgb(0_0_0/0.06),var(--bd-ui-lift)]"
                style={{ backgroundImage: `linear-gradient(150deg, oklch(0.94 0.022 ${hue(person.name)}), oklch(0.82 0.035 ${hue(person.name) + 40}))`, color: `oklch(0.34 0.03 ${hue(person.name)})` }}
              >
                {person.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={person.src} alt="" className="size-full object-cover" />
                ) : (
                  initials(person.name)
                )}
              </span>
            ) : (
              <span className={cx("grid size-7 place-items-center rounded-full [background:var(--bd-ui-raised)] [&_svg]:size-3.5", t.icon)} style={{ boxShadow: `var(--bd-ui-lift), inset 0 0 0 1px ${t.ring}` }}>
                {icon ?? <span className="size-1.5 rounded-full bg-current" />}
              </span>
            )}
          </motion.span>
        )}
      </span>
      <div className={cx("min-w-0 pt-[4px]", minor ? "pb-4" : "pb-6")}>
        <div className={cx("leading-5", minor ? "text-[13px] text-[var(--bd-muted)]" : "text-sm text-[var(--bd-fg)]")}>
          {person && <span className="font-medium text-[var(--bd-fg)]">{person.name} </span>}
          {title}
        </div>
        {children != null && <div className="mt-1 text-[13px] leading-[1.55] text-[var(--bd-muted)]">{children}</div>}
      </div>
    </motion.li>
  );
}

/** What someone wrote, in a bubble that points back at their bead. */
export function TimelineQuote({ className, ...props }: ComponentProps<"blockquote">) {
  return <blockquote className={cx("mt-1 w-fit max-w-full rounded-[16px] rounded-tl-[5px] bg-[var(--bd-surface)] px-3.5 py-2.5 text-[13.5px] leading-[1.5] text-[var(--bd-fg)] shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]", className)} {...props} />;
}

/** A row of small facts about an event, set apart by dots: a branch, a commit, how long it took. */
export function TimelineMeta({ items, className }: { items: ReactNode[]; className?: string }) {
  return (
    <span className={cx("flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--bd-subtle)]", className)}>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden className="size-[3px] rounded-full bg-current opacity-60" />}
          {it}
        </span>
      ))}
    </span>
  );
}

/* One trip round the ring, in seconds. */
const TURN = 1.2;

/** A ring of dots round the bead with a crest that goes round, its tail nudged through the matrix. */
function Ring() {
  const n = 14;
  return (
    <span aria-hidden className="pointer-events-none absolute -inset-[5px]">
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * 2 * Math.PI;
        const nudge = (BAYER[(i * 5) % 16] / 16) * 0.16;
        return (
          <span
            key={i}
            className="absolute size-[2.5px] rounded-full bg-[var(--bd-muted)] animate-[bd-ui-dither_1.2s_linear_infinite] motion-reduce:animate-none"
            style={{ left: `calc(50% + ${(Math.sin(a) * 19).toFixed(2)}px - 1.25px)`, top: `calc(50% - ${(Math.cos(a) * 19).toFixed(2)}px - 1.25px)`, animationDelay: `${(-(1 - i / n) * TURN + nudge).toFixed(3)}s` }}
          />
        );
      })}
    </span>
  );
}
