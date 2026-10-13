import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { btn } from "./sheet";

/*
 * Headings that sit on the page itself, not in a box: a page's title, and each part of a page.
 * Boxes are for things you look at or use (a live site, a card, a code block); words stay open.
 */

/** The top of a page: where you came from, its title, a line on what it's for, and its actions. */
export function PageHead({ title, lead, actions, back, children, className }: { title: ReactNode; lead?: ReactNode; actions?: ReactNode; back?: { href: string; label: string }; children?: ReactNode; className?: string }) {
  return (
    <header className={cn("bd-reveal flex flex-wrap items-end justify-between gap-x-10 gap-y-6 px-1 pb-8 pt-10 md:pt-14", className)}>
      <div className="min-w-0 max-w-[640px]">
        {back && (
          <Link href={back.href} className={cn(btn.link, "mb-5")}>
            <ArrowLeftIcon size={13} weight="bold" /> {back.label}
          </Link>
        )}
        <h1 className="text-display">{title}</h1>
        {lead && <p className="mt-4 text-lead text-muted">{lead}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

/** A part of a page: its heading and one line, with an action at the other end. */
export function SectionHead({ title, lead, action, id }: { title: ReactNode; lead?: ReactNode; action?: ReactNode; id?: string }) {
  return (
    <div className="bd-reveal mb-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 px-1">
      <div className="min-w-0 max-w-[620px]">
        <h2 id={id} className="text-title">
          {title}
        </h2>
        {lead && <p className="mt-2.5 text-body text-muted">{lead}</p>}
      </div>
      {action}
    </div>
  );
}
