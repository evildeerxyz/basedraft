import type { ComponentProps } from "react";

/*
 * A card and its parts: a head with a title and a line under it, the content, and a foot for
 * actions. It sits on a plain surface or on paper (near white, with fine dots), and can wear a
 * brushed-metal edge for the one card on a page that matters most.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const FACES = {
  surface: "bg-[var(--bd-surface)] text-[var(--bd-fg)]",
  paper: "text-[var(--bd-paper-ink)] [background:var(--bd-ui-paper)]",
} as const;

export type CardProps = ComponentProps<"div"> & { variant?: keyof typeof FACES; edge?: boolean };

export function Card({ variant = "surface", edge = false, className, children, ...props }: CardProps) {
  if (edge)
    return (
      <div className={cx("rounded-[22px] p-[1.5px] [background:var(--bd-ui-metal-edge)] shadow-[0_1px_2px_rgb(var(--bd-shade)/0.08),0_18px_40px_-20px_rgb(var(--bd-shade)/0.45)]", className)} {...props}>
        <div className={cx("overflow-hidden rounded-[20.5px]", FACES[variant])}>{children}</div>
      </div>
    );
  return (
    <div className={cx("overflow-hidden rounded-[20px] shadow-[inset_0_0_0_1px_var(--bd-line),0_1px_2px_rgb(var(--bd-shade)/0.05),0_14px_32px_-18px_rgb(var(--bd-shade)/0.35)]", FACES[variant], className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("flex flex-col gap-1 p-5 pb-0", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<"h3">) {
  return <h3 className={cx("text-[15px] font-semibold leading-tight tracking-[-0.01em]", className)} {...props} />;
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cx("text-[13px] text-[var(--bd-muted)]", className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("p-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("flex items-center gap-2 border-t border-[rgb(var(--bd-ink)/0.07)] bg-[rgb(var(--bd-ink)/0.02)] px-5 py-3", className)} {...props} />;
}
