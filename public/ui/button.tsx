import type { ComponentProps } from "react";

/*
 * basedraft's button: a pill in six materials. Ink for the main action; metal, a charcoal fill
 * inside a brushed edge with a sheen that crosses it on hover, for the one action that matters
 * most on a page; paper, near white under fine dots; glass, for what floats over a picture; outline
 * and ghost for the rest. While it's loading, the label gives way to a field of dots that pulse in
 * an ordered-dither pattern, and the button keeps its width.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const VARIANTS = {
  ink: "text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(var(--bd-shade)/0.2),0_6px_16px_-8px_rgb(var(--bd-shade)/0.5)] hover:brightness-[1.12]",
  metal:
    "border-[1.5px] border-transparent text-white [background:var(--bd-ui-metal-fill)_padding-box,var(--bd-ui-metal-edge)_border-box] shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_1px_2px_rgb(0_0_0/0.18),0_8px_20px_-10px_rgb(0_0_0/0.5)] hover:brightness-[1.14]",
  paper: "text-[var(--bd-paper-ink)] [background:var(--bd-ui-paper)] shadow-[var(--bd-ui-lift),inset_0_0_0_1px_rgb(var(--bd-ink)/0.08)] hover:shadow-[var(--bd-ui-lift),inset_0_0_0_1px_rgb(var(--bd-ink)/0.16)]",
  glass: "bg-[color-mix(in_oklab,var(--bd-surface)_60%,transparent)] text-[var(--bd-fg)] backdrop-blur-xl shadow-[inset_0_1px_0_rgb(255_255_255/0.4),inset_0_0_0_1px_rgb(var(--bd-ink)/0.1),0_8px_24px_-12px_rgb(var(--bd-shade)/0.4)] hover:bg-[color-mix(in_oklab,var(--bd-surface)_80%,transparent)]",
  outline: "bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[inset_0_0_0_1px_var(--bd-line-strong),0_1px_2px_rgb(var(--bd-shade)/0.06)] hover:bg-[var(--bd-surface-2)]",
  ghost: "text-[var(--bd-muted)] hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)]",
} as const;

const SIZES = {
  sm: "h-8 gap-1.5 px-3.5 text-[13px] [&_svg]:size-3.5",
  md: "h-10 gap-2 px-5 text-sm [&_svg]:size-4",
  lg: "h-12 gap-2.5 px-6 text-[15px] [&_svg]:size-[18px]",
  icon: "size-10 [&_svg]:size-[18px]",
} as const;

/* A 4 by 4 ordered-dither matrix: each dot's turn in the pulse, so the field shimmers across rather than blinking at once. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const COLS = 11;

function Dither() {
  return (
    <span aria-hidden className="absolute inset-0 grid place-items-center">
      <span className="grid gap-[2.5px]" style={{ gridTemplateColumns: `repeat(${COLS}, 3px)` }}>
        {Array.from({ length: COLS * 3 }, (_, i) => {
          const c = i % COLS;
          const r = Math.floor(i / COLS);
          const delay = (c / COLS) * 0.8 + (BAYER[(r % 4) * 4 + (c % 4)] / 16) * 0.45;
          return <span key={i} className="size-[3px] rounded-full bg-current opacity-60 animate-[bd-ui-dither_1.15s_ease-in-out_infinite] motion-reduce:animate-none" style={{ animationDelay: `${delay.toFixed(3)}s` }} />;
        })}
      </span>
    </span>
  );
}

export type ButtonProps = ComponentProps<"button"> & { variant?: keyof typeof VARIANTS; size?: keyof typeof SIZES; loading?: boolean };

export function Button({ variant = "ink", size = "md", loading = false, className, type = "button", children, disabled, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      aria-busy={loading || undefined}
      className={cx(
        "group/button relative isolate inline-flex shrink-0 select-none items-center justify-center overflow-hidden whitespace-nowrap rounded-full font-medium transition-[background-color,color,filter,scale,box-shadow] duration-200 ease-[var(--bd-ease)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]",
        VARIANTS[variant],
        SIZES[size],
        loading && "pointer-events-none",
        className,
      )}
      {...props}
    >
      {/* Metal catches the light: a sheen crosses it as the pointer arrives. */}
      {variant === "metal" && <span aria-hidden className="pointer-events-none absolute inset-0 -z-10 -translate-x-[110%] bg-[linear-gradient(105deg,transparent_30%,rgb(255_255_255/0.22)_50%,transparent_70%)] transition-transform duration-700 ease-[var(--bd-ease)] group-hover/button:translate-x-[110%] motion-reduce:hidden" />}
      <span className={cx("inline-flex items-center gap-[inherit] transition-opacity duration-200", loading && "opacity-0")}>{children}</span>
      {loading && <Dither />}
    </button>
  );
}
