import type { ComponentProps } from "react";

/*
 * A small stamp beside a name: inked, quiet, outlined, on paper, or rimmed in metal. It can lead
 * with a status dot (ready, waiting, stopped or idle), and a live one pulses.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const VARIANTS = {
  default: "text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14)]",
  secondary: "bg-[var(--bd-ui-track)] text-[var(--bd-muted)] shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.06)]",
  outline: "bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[inset_0_0_0_1px_var(--bd-line-strong)]",
  paper: "text-[var(--bd-paper-ink)] [background:var(--bd-ui-paper)] shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.1),0_1px_2px_rgb(var(--bd-shade)/0.06)]",
  metal: "border-[1.5px] border-transparent text-white [background:var(--bd-ui-metal-fill)_padding-box,var(--bd-ui-metal-edge)_border-box] shadow-[0_1px_2px_rgb(0_0_0/0.18)]",
} as const;

const DOTS = { ok: "bg-[var(--bd-ui-ok)]", wait: "bg-[var(--bd-ui-wait)]", stop: "bg-[var(--bd-ui-stop)]", idle: "bg-[var(--bd-subtle)]" } as const;

export type BadgeProps = ComponentProps<"span"> & { variant?: keyof typeof VARIANTS; dot?: keyof typeof DOTS; live?: boolean };

export function Badge({ variant = "default", dot, live = false, className, children, ...props }: BadgeProps) {
  return (
    <span className={cx("inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-medium leading-none tracking-[0.005em] [&_svg]:size-3", VARIANTS[variant], className)} {...props}>
      {dot && (
        <span aria-hidden className="relative grid size-1.5 place-items-center">
          {live && <span className={cx("absolute inset-0 rounded-full animate-[bd-ui-pulse_1.6s_ease-out_infinite] motion-reduce:hidden", DOTS[dot])} />}
          <span className={cx("relative size-1.5 rounded-full", DOTS[dot])} />
        </span>
      )}
      {children}
    </span>
  );
}
