import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { IconType } from "./icons";

/**
 * A sheet on the drafting table. Everything basedraft shows sits on one:
 * an optional title strip (name, a fact, an action) and a body.
 */
export function Sheet({ title, icon: Icon, meta, actions, children, className, bodyClassName, id, as: Tag = "section" }: { title?: ReactNode; icon?: IconType; meta?: ReactNode; actions?: ReactNode; children?: ReactNode; className?: string; bodyClassName?: string; id?: string; as?: "section" | "article" | "div" | "li" }) {
  return (
    <Tag id={id} className={cn("bd-reveal overflow-hidden rounded-[var(--bd-r-sheet)] bg-surface shadow-[0_0_0_1px_var(--bd-line)]", className)}>
      {(title || meta || actions) && (
        <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-4 py-2">
          {/* Takes what's left beside the actions, so a long description truncates before the actions wrap. */}
          <div className="flex min-w-0 flex-[1_1_200px] items-center gap-3">
            {title && (
              <div className="flex shrink-0 items-center gap-2 text-ui font-medium">
                {Icon && <Icon size={17} weight="duotone" className="text-accent" />}
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
 * Buttons used across the site: ink for the main action, quiet for the rest. Sizes are part of
 * each style rather than overrides, because class names here are joined, not merged: a later
 * "h-8" doesn't beat an "h-9" that's already there.
 */
const INK = "btn-ink inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium";
/* A press sinks a button a touch, the way the ink button sinks a pixel. */
const PLAIN = "inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium text-fg transition-[color,background-color,box-shadow,scale] duration-200 ease-out active:scale-[0.97]";
const MD = "h-9 gap-2 rounded-control px-3.5 text-ui";
const SM = "h-8 gap-1.5 rounded-control px-3 text-[13px]";
/** The page color on an ink card: white in light mode, near black in dark, where the card turns light. */
const PAPER = "bg-canvas shadow-[inset_0_-1px_0_rgb(var(--bd-shade)/0.12),0_10px_24px_-12px_rgba(0,0,0,0.7)] hover:bg-canvas/90 focus-visible:outline-canvas";

export const btn = {
  ink: `${INK} ${MD}`,
  quiet: `${PLAIN} ${MD} bg-fg/[0.06] hover:bg-fg/[0.1]`,
  /** Quiet with a hairline instead of a fill. */
  outline: `${PLAIN} ${MD} bg-surface shadow-[0_0_0_1px_var(--bd-line)] hover:bg-fg/[0.04]`,
  /** No fill until hovered. */
  ghost: `${PLAIN} ${MD} hover:bg-fg/[0.06]`,
  paper: `${PLAIN} ${MD} ${PAPER}`,
  markup: "btn-ink inline-flex h-9 items-center justify-center gap-2 rounded-control px-3.5 text-ui font-medium",
  link: "bd-link inline-flex items-center gap-1.5 text-ui text-muted transition-colors hover:text-fg",
};

/** The same buttons a step smaller, 32px tall, for toolbars and dense rows. */
export const btnSm = {
  ink: `${INK} ${SM}`,
  quiet: `${PLAIN} ${SM} bg-fg/[0.06] hover:bg-fg/[0.1]`,
  paper: `${PLAIN} ${SM} ${PAPER}`,
};
