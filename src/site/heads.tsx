import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { BACK, BACK_ARROW } from "./library-css";
import { cn } from "@/lib/utils";

/*
 * Headings that sit on the page itself, not in a box: a page's title, and each part of a page.
 * Boxes are for things you look at or use (a live site, a card, a code block); words stay open.
 */

/**
 * The top of a page: where you came from, its title, a line on what it's for, and its actions.
 * Centered, for a page that's one big list (Templates, Pricing); otherwise it reads from the left.
 */
export function PageHead({ title, lead, actions, back, children, className, center }: { title: ReactNode; lead?: ReactNode; actions?: ReactNode; back?: { href: string; label: string }; children?: ReactNode; className?: string; center?: boolean }) {
  return (
    <header className={cn("bd-reveal pb-12 pt-14 md:pb-16 md:pt-24", center ? "flex flex-col items-center text-center" : "flex flex-wrap items-end justify-between gap-x-10 gap-y-6", className)}>
      <div className={cn("min-w-0", center ? "flex max-w-[760px] flex-col items-center" : "max-w-[720px]")}>
        {back && (
          <Link href={back.href} className={cn(BACK, "mb-6")}>
            <ArrowLeftIcon size={13} weight="regular" className={BACK_ARROW} />
            {back.label}
          </Link>
        )}
        <h1 className="text-balance text-display">{title}</h1>
        {lead && <p className={cn("mt-5 text-pretty text-lead text-muted", center && "max-w-[560px]")}>{lead}</p>}
        {children}
      </div>
      {actions && <div className={cn("flex flex-wrap gap-2", center && "mt-8 justify-center")}>{actions}</div>}
    </header>
  );
}

/** A note on the drawing: a part's number and name in mono, the way a drafter labels a sheet. */
export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mb-5 flex items-center gap-2.5 font-mono text-[12px] uppercase tracking-[0.06em] text-subtle", className)}>{children}</p>;
}

/** A part of a page: its heading and a line, with an action at the other end. A kicker numbers it. */
export function SectionHead({ title, lead, action, id, className, kicker }: { title: ReactNode; lead?: ReactNode; action?: ReactNode; id?: string; className?: string; kicker?: ReactNode }) {
  return (
    <div className={cn("bd-reveal mb-8 flex flex-wrap items-end justify-between gap-x-10 gap-y-4 md:mb-10", className)}>
      <div className="min-w-0 max-w-[640px]">
        {kicker && <Kicker>{kicker}</Kicker>}
        <h2 id={id} className="text-balance text-headline">
          {title}
        </h2>
        {lead && <p className="mt-4 text-pretty text-lead text-muted">{lead}</p>}
      </div>
      {action && <div className="pb-1">{action}</div>}
    </div>
  );
}
