import { ArrowRightIcon, ArrowUpRightIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GLOW, type Glow } from "./stage";

/*
 * The pieces the marketing pages are built from: a part's heading, links in words, round arrow
 * buttons, and scenes, a piece set on a flat color of its own.
 */

/** A link in words with an arrow 10px off it: "Browse all templates →". Up and out for another page's front door. */
export function TextLink({ href, children, up, className, onDark }: { href: string; children: ReactNode; up?: boolean; className?: string; onDark?: boolean }) {
  const I = up ? ArrowUpRightIcon : ArrowRightIcon;
  return (
    <Link href={href} className={cn("bd-link inline-flex items-center gap-2.5 text-ui transition-opacity hover:opacity-70", onDark ? "text-white" : "text-fg", className)}>
      {children} <I weight="regular" size={14} />
    </Link>
  );
}

/**
 * A part of a page: its heading and a line under it on the left, an action on the right along the
 * bottom. Two sizes: a headline (48) for a main part, a title (32) for a smaller one.
 */
export function SectionHeading({ title, lead, action, id, small, center, className }: { title: ReactNode; lead?: ReactNode; action?: ReactNode; id?: string; small?: boolean; center?: boolean; className?: string }) {
  return (
    <div className={cn("bd-reveal flex flex-wrap gap-x-10 gap-y-5", center ? "flex-col items-center text-center" : "items-end justify-between", small ? "mb-8" : "mb-12", className)}>
      <div className={cn("min-w-0", center ? "flex max-w-[760px] flex-col items-center" : "max-w-[760px]")}>
        <h2 id={id} className={cn("text-balance", small ? "text-title" : "text-headline")}>
          {title}
        </h2>
        {lead && <p className={cn("mt-4 text-pretty text-muted", small ? "text-ui leading-[1.65]" : "text-body")}>{lead}</p>}
      </div>
      {action && <div className={center ? "" : "pb-1"}>{action}</div>}
    </div>
  );
}

/** A round button with an arrow, 44px, a hairline around it: "go to this one". */
export function CircleLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} aria-label={label} className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-fg transition-colors hover:bg-surface-2">
      <ArrowUpRightIcon weight="regular" size={14} />
    </Link>
  );
}

/** A scene: a piece set in the hero's light, one of its four arrangements, with 28px corners. */
export function Scene({ glow = "a", children, className, style }: { glow?: Glow; children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={cn("bd-paper relative isolate overflow-hidden rounded-[var(--bd-r-stage)]", GLOW[glow], className)} style={style}>
      {children}
    </div>
  );
}
