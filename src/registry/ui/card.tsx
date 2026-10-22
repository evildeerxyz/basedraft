"use client";

import { Children, isValidElement, useRef, type ComponentProps, type PointerEvent, type ReactNode } from "react";

/*
 * A card in two layers: a soft gray shell, and inside it a raised white face holding the head, any
 * media and the content. The foot sits on the shell under the face, so actions read as the card's
 * ground rather than one more stripe. Interactive cards lift when they're pointed at, with a soft
 * light that follows the pointer across the face. A face of its own (surface), paper with fine
 * dots, and a brushed-metal hairline for the one card on a page that matters most.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const FACES = {
  shell: "bg-[var(--bd-surface)] text-[var(--bd-fg)]",
  surface: "bg-[var(--bd-surface)] text-[var(--bd-fg)]",
  paper: "text-[var(--bd-paper-ink)] [background:var(--bd-ui-paper)]",
} as const;

/* The shell: a gray a step off the face, its own hairline, and a long soft shadow. */
const SHELL = "bg-[color-mix(in_oklab,var(--bd-ui-track)_42%,var(--bd-surface))] shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.07),0_1px_2px_rgb(var(--bd-shade)/0.05),0_16px_36px_-20px_rgb(var(--bd-shade)/0.38)]";
/* The face inside it, raised by a hairline and a short shadow. */
const FACE = "shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.06),0_1px_2px_rgb(var(--bd-shade)/0.06),0_4px_12px_-6px_rgb(var(--bd-shade)/0.14)]";
/* A brushed-metal hairline around the shell, in place of its own. */
const EDGE = "relative before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:p-px before:[background:var(--bd-ui-metal-edge)] before:[mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]";
const LIFT = "transition-[translate,box-shadow] duration-300 ease-[var(--bd-ease)] hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.1),0_2px_4px_rgb(var(--bd-shade)/0.06),0_24px_44px_-22px_rgb(var(--bd-shade)/0.5)] motion-reduce:transition-none motion-reduce:hover:translate-y-0";

export type CardProps = ComponentProps<"div"> & {
  /** Shell: a raised face on a gray shell, the foot on the shell. Surface: one plain face. Paper: near white with fine dots. */
  variant?: keyof typeof FACES;
  /** A brushed-metal hairline around it, for the card that matters most. */
  edge?: boolean;
  /** Lifts when pointed at, with a light that follows the pointer: for a card that opens something. */
  interactive?: boolean;
};

export function Card({ variant = "shell", edge = false, interactive = false, className, children, onPointerMove, ...props }: CardProps) {
  const face = useRef<HTMLDivElement>(null);
  // The light's place, written straight to the face so the pointer never re-renders the card.
  const follow = (e: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e);
    const el = face.current;
    if (!interactive || !el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--bd-card-x", `${e.clientX - r.left}px`);
    el.style.setProperty("--bd-card-y", `${e.clientY - r.top}px`);
  };
  const light = interactive && (
    <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 [background:radial-gradient(260px_circle_at_var(--bd-card-x,50%)_var(--bd-card-y,0%),rgb(var(--bd-ink)/0.045),transparent_70%)] group-hover/card:opacity-100" />
  );

  if (variant !== "shell")
    return (
      <div onPointerMove={follow} className={cx("group/card relative overflow-hidden rounded-[20px] shadow-[inset_0_0_0_1px_var(--bd-line),0_1px_2px_rgb(var(--bd-shade)/0.05),0_14px_32px_-18px_rgb(var(--bd-shade)/0.35)]", FACES[variant], edge && EDGE, interactive && LIFT, className)} {...props}>
        <div ref={face} data-card-face="" className="relative">
          {light}
          {children}
        </div>
      </div>
    );

  // The foot goes on the shell; everything else goes on the face.
  const parts = Children.toArray(children);
  const isFoot = (c: ReactNode) => isValidElement(c) && c.type === CardFooter;
  const body = parts.filter((c) => !isFoot(c));
  const foot = parts.filter(isFoot);
  return (
    <div onPointerMove={follow} className={cx("group/card relative rounded-[22px] p-1.5 text-[var(--bd-fg)]", SHELL, edge && EDGE, interactive && LIFT, className)} {...props}>
      <div ref={face} data-card-face="" className={cx("relative overflow-hidden rounded-[16.5px]", FACES.shell, FACE)}>
        {light}
        {body}
      </div>
      {foot}
    </div>
  );
}

/** A picture, a cover or a preview at the top of the face, inset to its curve. */
export function CardMedia({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("relative m-1.5 mb-0 overflow-hidden rounded-[12px]", className)} {...props} />;
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

/** The foot: on a shell card it sits on the shell under the face; inside a face (the other cards), a strip under a hairline. */
export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return <div data-card-foot="" className={cx("flex items-center gap-2 px-3.5 pb-2 pt-3 [[data-card-face]_&]:border-t [[data-card-face]_&]:border-[var(--bd-line-subtle)] [[data-card-face]_&]:px-5 [[data-card-face]_&]:py-3", className)} {...props} />;
}
