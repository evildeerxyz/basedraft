"use client";

import { CheckCircleIcon, InfoIcon, WarningIcon, WarningOctagonIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";

/*
 * A note in the flow of a page: something that happened, or something that needs doing, in one of
 * four tones, as a quiet card washed with its tone. With dither, the tone comes in from the left
 * edge instead, as a band of dots through an ordered dither, strong at the edge and gone a few
 * dots in, the way ink bleeds into paper. It can carry actions, and close: then it folds away
 * and what's below closes the gap.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* A 4 by 4 ordered-dither matrix: which dots in the band stay lit as it fades. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** The band's dots as a tile four dots tall, repeated down the edge, each column fainter than the one before. */
function band(cols: number, cell: number) {
  let dots = "";
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = 0.88 * (1 - c / cols) ** 1.5;
      if ((BAYER[r * 4 + (c % 4)] + 0.5) / 16 > lit) continue;
      dots += `<circle cx='${c * cell + cell / 2}' cy='${r * cell + cell / 2}' r='${(cell * 0.34).toFixed(2)}'/>`;
    }
  }
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${cols * cell}' height='${4 * cell}'>${dots}</svg>`)}")`;
}
const BAND = band(9, 4);

const TONES = {
  info: { color: "rgb(var(--bd-ink) / 0.55)", icon: InfoIcon, text: "text-[var(--bd-muted)]" },
  ok: { color: "var(--bd-ui-ok)", icon: CheckCircleIcon, text: "text-[var(--bd-ui-ok)]" },
  warn: { color: "var(--bd-ui-wait)", icon: WarningIcon, text: "text-[var(--bd-ui-wait)]" },
  stop: { color: "var(--bd-ui-stop)", icon: WarningOctagonIcon, text: "text-[var(--bd-ui-stop)]" },
} as const;

export type AlertTone = keyof typeof TONES;

export type AlertProps = Omit<ComponentProps<"div">, "title"> & {
  /** info for a note, ok when something worked, warn when something needs doing soon, stop when something failed. */
  tone?: AlertTone;
  /** The line it leads with. */
  title?: ReactNode;
  /** In place of the tone's icon; `false` for none. */
  icon?: ReactNode | false;
  /** Buttons or links, in a row under the text. */
  actions?: ReactNode;
  /** The tone bleeds in from the left edge as a band of dithered dots. */
  dither?: boolean;
  /** Shows a close button. Runs once the alert has folded away, so you can take it out then. */
  onDismiss?: () => void;
  /** What the close button says to a screen reader. */
  dismissLabel?: string;
};

export function Alert({ tone = "info", title, icon, actions, dither = false, onDismiss, dismissLabel = "Dismiss", className, style, children, ...props }: AlertProps) {
  const [open, setOpen] = useState(true);
  const still = useReducedMotion();
  const t = TONES[tone];
  const Icon = t.icon;
  return (
    <AnimatePresence initial={false} onExitComplete={onDismiss}>
      {open && (
        <motion.div
          key="alert"
          exit={still ? { opacity: 0, transition: { duration: 0.12 } } : { opacity: 0, height: 0, marginTop: 0, marginBottom: 0, transition: { default: { type: "spring", stiffness: 420, damping: 40 }, opacity: { duration: 0.14 } } }}
          className="overflow-hidden"
        >
          <div
            role={tone === "stop" ? "alert" : "status"}
            className={cx(
              "relative isolate flex gap-3 overflow-hidden rounded-[18px] py-3.5 pr-3.5 text-sm",
              "bg-[color-mix(in_oklab,var(--bd-surface)_95%,var(--alert-tone))] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--alert-tone)_20%,var(--bd-line))]",
              dither ? "pl-11" : "pl-4",
              className,
            )}
            style={{ ...style, "--alert-tone": t.color } as CSSProperties}
            {...props}
          >
            {/* The tone, bleeding in from the edge. */}
            {dither && <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-9 bg-[var(--alert-tone)]" style={{ maskImage: BAND, WebkitMaskImage: BAND, maskRepeat: "repeat-y", WebkitMaskRepeat: "repeat-y" }} />}
            {icon !== false && <span className={cx("mt-px grid size-5 shrink-0 place-items-center [&_svg]:size-[18px]", t.text)}>{icon ?? <Icon weight="duotone" />}</span>}
            <div className="min-w-0 flex-1 py-px">
              {title && <p className="font-medium leading-5 text-[var(--bd-fg)]">{title}</p>}
              {children && <div className={cx("leading-[1.55] text-[var(--bd-muted)]", title != null && title !== false && "mt-1")}>{children}</div>}
              {actions && <div className="mt-3 flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
            {onDismiss && (
              <button
                type="button"
                aria-label={dismissLabel}
                onClick={() => setOpen(false)}
                className="-my-1 grid size-7 shrink-0 place-items-center rounded-full text-[var(--bd-subtle)] outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
              >
                <XIcon weight="regular" className="size-3.5" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
