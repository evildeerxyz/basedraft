import { ArrowUpRightIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * A stage: the frame a piece is shown in, 28px corners, lit like the hero, the piece set inside it
 * on a panel, and a caption under it. Its light comes one of four ways, so neighbors differ.
 */
export type Glow = "a" | "b" | "c" | "d";
export const GLOW: Record<Glow, string> = { a: "", b: "glow-b", c: "glow-c", d: "glow-d" };
/** The four ways round, for a list of stages. */
export const glowAt = (i: number): Glow => (["a", "b", "c", "d"] as const)[i % 4];

export function Stage({ children, glow = "a", quiet, className, inner = "p-4 sm:p-6", label }: { children: ReactNode; glow?: Glow; /** The flat light gray instead of the hero's light, for a page of many stages. */ quiet?: boolean; className?: string; /** The inside's classes, padding included (it replaces the default, as class names are joined, not merged). */ inner?: string; label?: string }) {
  return (
    <div aria-label={label} className={cn(quiet ? "bd-panel" : "bd-paper", "relative isolate overflow-hidden rounded-[var(--bd-r-stage)]", !quiet && GLOW[glow], className)}>
      <div className={cn("relative h-full", inner)}>{children}</div>
    </div>
  );
}

/** Under a stage: the piece's name, a badge, a word on it in the quiet gray, and an arrow to it. */
export function Caption({ title, note, badge, href, external, className }: { title: ReactNode; note?: ReactNode; badge?: ReactNode; href?: string; external?: boolean; className?: string }) {
  const body = (
    <>
      <span className="flex shrink-0 items-center gap-2 text-ui text-fg">
        {title}
        {badge}
      </span>
      {note && <span className="min-w-0 truncate">{note}</span>}
      {href && <ArrowUpRightIcon weight="regular" size={13} className="ml-auto shrink-0 text-subtle transition-[translate,color] duration-300 ease-[var(--bd-ease)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" />}
    </>
  );
  const cls = cn("group flex h-11 items-center gap-2.5 px-2 text-meta text-subtle", className);
  if (!href) return <div className={cls}>{body}</div>;
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {body}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {body}
    </Link>
  );
}

/** A panel set on a stage, 8 to 12px in: the surface, corners 12px under the stage's so they share a center, a hairline and a soft lift. */
export const onStage = "overflow-hidden rounded-[16px] border border-line bg-surface shadow-[var(--bd-shadow-raised)]";
