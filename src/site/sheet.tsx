import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { IconType } from "./icons";

/** The page's width: content sits in one 1248px column, with room to breathe at the edges. */
export const wrap = "mx-auto w-full max-w-[1312px] px-4 sm:px-8";

/**
 * A panel. Everything basedraft shows in a box sits on one: an optional title strip (name, a
 * fact, an action) and a body.
 */
export function Sheet({ title, icon: Icon, meta, actions, children, className, bodyClassName, id, as: Tag = "section" }: { title?: ReactNode; icon?: IconType; meta?: ReactNode; actions?: ReactNode; children?: ReactNode; className?: string; bodyClassName?: string; id?: string; as?: "section" | "article" | "div" | "li" }) {
  return (
    <Tag id={id} className={cn("bd-reveal overflow-hidden rounded-[var(--bd-r-sheet)] bg-surface shadow-[0_0_0_1px_var(--bd-line)]", className)}>
      {(title || meta || actions) && (
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-2.5">
          {/* Takes what's left beside the actions, so a long description truncates before the actions wrap. */}
          <div className="flex min-w-0 flex-[1_1_200px] items-center gap-3">
            {title && (
              <div className="flex shrink-0 items-center gap-2 text-ui font-medium">
                {Icon && <Icon size={17} weight="duotone" className="text-muted" />}
                {title}
              </div>
            )}
            {meta && <div className="hidden truncate text-meta text-subtle sm:block">{meta}</div>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children && <div className={bodyClassName}>{children}</div>}
    </Tag>
  );
}

/*
 * Buttons used across the site: flat ink for the main action, a hairline outline for the next one,
 * and quiet fills for dense rows. Sizes are part of each style rather than overrides, because class
 * names here are joined, not merged: a later "h-8" doesn't beat an "h-9" that's already there.
 * Every button is a pill. Large is 48px, the size that leads a page; medium is 36px, the header's.
 */
const INK = "btn-ink inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium";
/** The important action: charcoal inside a brushed-metal edge (btn-metal in globals.css). */
const METAL = "btn-metal inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium";
/* A press sinks a button a touch. */
const PLAIN = "inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium text-fg transition-[color,background-color,box-shadow,scale] duration-200 ease-out active:scale-[0.98]";
const LG = "h-12 gap-2.5 rounded-full px-6 text-ui";
const MD = "h-9 gap-2 rounded-full px-4 text-ui";
const SM = "h-8 gap-1.5 rounded-full px-3.5 text-meta";
/** A hairline drawn inside, so outlined and filled buttons are the same size. */
const OUTLINE = "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--bd-fg)_14%,transparent)] hover:bg-surface-2";
/** The page color on an ink card: white in light mode, near black in dark, where the card turns light. */
const PAPER = "bg-canvas hover:bg-canvas/90 focus-visible:outline-canvas";
/** On the hero's surface: a frosted pill with a hairline of its ink, beside the metal one. */
const ON_PAPER_LINE = "text-paper-ink bg-paper/60 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--bd-paper-ink)_16%,transparent)] backdrop-blur hover:bg-paper/90 focus-visible:outline-paper-ink";

export const btn = {
  ink: `${METAL} ${MD}`,
  quiet: `${PLAIN} ${MD} bg-fg/[0.06] hover:bg-fg/[0.1]`,
  /** A hairline instead of a fill: the second action beside an ink one. */
  outline: `${PLAIN} ${MD} ${OUTLINE}`,
  /** No fill until hovered. */
  ghost: `${PLAIN} ${MD} hover:bg-fg/[0.06]`,
  paper: `${PLAIN} ${MD} ${PAPER}`,
  markup: `${INK} ${MD}`,
  /** Words with an arrow: "All templates →". */
  link: "bd-link inline-flex items-center gap-2 text-ui font-medium text-fg transition-opacity hover:opacity-70",
};

/** A step bigger, 48px tall, for the one or two actions that lead a page. */
export const btnLg = {
  ink: `${METAL} ${LG}`,
  outline: `${PLAIN} ${LG} ${OUTLINE}`,
  onPaper: `${METAL} ${LG}`,
  onPaperOutline: `${PLAIN} ${LG} ${ON_PAPER_LINE}`,
};

/** The same buttons a step smaller, 32px tall, for toolbars and dense rows. */
export const btnSm = {
  ink: `${INK} ${SM}`,
  quiet: `${PLAIN} ${SM} bg-fg/[0.06] hover:bg-fg/[0.1]`,
  outline: `${PLAIN} ${SM} ${OUTLINE}`,
  paper: `${PLAIN} ${SM} ${PAPER}`,
};

/** "Pro", as a small light blue pill beside a name. */
export function ProBadge({ className, children = "Pro" }: { className?: string; children?: ReactNode }) {
  return <span className={cn("inline-flex h-[18px] shrink-0 items-center rounded-full bg-brand-soft px-[7px] text-[11px] font-medium leading-none tracking-normal text-brand-ink", className)}>{children}</span>;
}

/**
 * New, on a component added lately: a solid green pill that's hard to miss, with a dot that
 * pulses and a band of light crossing it every few seconds. Still, with reduced motion.
 */
export function NewBadge({ size = "sm", className }: { size?: "sm" | "md"; className?: string }) {
  return (
    <span
      className={cn(
        // Its own containing block for the layers, unless it's placed from outside.
        !/\b(absolute|fixed)\b/.test(className ?? "") && "relative",
        "bd-new isolate inline-flex shrink-0 items-center rounded-full font-semibold leading-none tracking-[0.01em] text-white",
        size === "md" ? "h-6 gap-1.5 px-2.5 text-[12px]" : "h-[18px] gap-1 px-[7px] text-[11px] [--bd-new-line:1px]",
        className,
      )}
    >
      {/* Behind, a soft glow of the rainbow; over it the dark body with the rainbow on its edge, and a band of light crossing. */}
      <span aria-hidden className="bd-new-glow pointer-events-none absolute inset-px rounded-full" />
      <span aria-hidden className="bd-new-edge pointer-events-none absolute inset-0 overflow-hidden rounded-full">
        <span className="absolute inset-y-0 left-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.22),transparent)] animate-[bd-new-shine_3.2s_ease-in-out_infinite] motion-reduce:hidden" />
      </span>
      <span aria-hidden className={cn("relative grid shrink-0 place-items-center", size === "md" ? "size-1.5" : "size-[5px]")}>
        <span className="absolute inset-0 rounded-full bg-white animate-[bd-new-pulse_1.6s_ease-out_infinite] motion-reduce:hidden" />
        <span className="relative size-full rounded-full bg-white" />
      </span>
      <span className="relative">New</span>
    </span>
  );
}

/** A tick on a small light blue dot, the way the plans list what's in them. */
export function Tick({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("grid size-4 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-ink", className)}>
      <svg viewBox="0 0 16 16" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 8.4 6.6 11 12 5.4" />
      </svg>
    </span>
  );
}
