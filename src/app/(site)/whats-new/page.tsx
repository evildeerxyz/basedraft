import { ArrowRightIcon, EnvelopeSimpleIcon, GithubLogoIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { REPO } from "@/registry";
import { CHANGELOG, dayLabel, type ChangeTag } from "@/site/changelog";
import { wrap } from "@/site/sheet";
import { withCard } from "@/site/og";

export const metadata: Metadata = withCard("whats-new", { title: "What's new", description: "What's changed in basedraft: new templates, components, blocks and Studio updates, newest first." });

/*
 * What's new, newest first: each day on the left, pinned as you read, and its changes on the right
 * along a line. A tag says what kind of change it is: new, improved, or coming next (drawn dashed,
 * since it isn't here yet).
 */

const TAG: Record<ChangeTag, string> = {
  New: "bg-brand-soft text-brand-ink",
  Improved: "bg-surface-2 text-fg",
  Coming: "text-muted shadow-[inset_0_0_0_1px_var(--bd-line-strong)] [border-style:dashed]",
};

export default function WhatsNewPage() {
  return (
    <main id="main" className={cn(wrap, "pb-24")}>
      <header className="bd-reveal mx-auto flex max-w-[680px] flex-col items-center pb-16 pt-20 text-center sm:pt-24">
        <h1 className="text-display">What&apos;s new</h1>
        <p className="mt-5 max-w-[520px] text-pretty text-lead text-muted">New templates, components, blocks and changes to Studio, newest first. Every one of them is free and open source.</p>
      </header>

      <ol className="mx-auto max-w-[960px]">
        {CHANGELOG.map((day, d) => (
          <li key={day.date} className="bd-reveal grid gap-x-12 gap-y-5 pb-14 md:grid-cols-[180px_minmax(0,1fr)]">
            <div className="md:sticky md:top-[calc(var(--bd-header-h,80px)+24px)] md:self-start">
              <time dateTime={day.date} className="font-display text-[20px] leading-tight">
                {dayLabel(day.date)}
              </time>
              {d === 0 && <p className="mt-1.5 text-meta text-subtle">Latest</p>}
            </div>
            {/* The day's changes, along a line, a node at each. */}
            <ul className="relative space-y-3 border-l border-dashed border-line pl-6 md:pl-8">
              {day.changes.map((c) => (
                <li key={c.title} className="relative rounded-[24px] border border-line bg-surface p-5 sm:p-6">
                  <span aria-hidden className={cn("absolute top-7 size-2.5 rounded-full ring-4 ring-canvas", "-left-[29px] md:-left-[37px]", c.tag === "New" ? "bg-brand-soft shadow-[inset_0_0_0_1.5px_color-mix(in_oklab,var(--bd-brand)_55%,transparent)]" : c.tag === "Coming" ? "bg-canvas shadow-[inset_0_0_0_1.5px_var(--bd-line-strong)]" : "bg-line-strong")} />
                  <div className="flex flex-wrap items-center gap-2.5">
                    {c.tag && <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium leading-none", TAG[c.tag])}>{c.tag}</span>}
                    <h2 className="text-heading">{c.title}</h2>
                  </div>
                  <p className="mt-2.5 max-w-[620px] text-ui leading-[1.65] text-muted">{c.body}</p>
                  {c.href && (
                    <Link href={c.href} className="bd-link mt-4 inline-flex items-center gap-2 text-ui font-medium">
                      {c.link ?? "Take a look"} <ArrowRightIcon weight="regular" size={14} />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      {/* How to hear about the next ones. */}
      <section aria-labelledby="updates-title" data-scroll="settle" className="bd-light bd-paper glow-c mx-auto flex max-w-[960px] flex-wrap items-center justify-between gap-6 rounded-[28px] p-7 sm:p-9">
        <div className="max-w-[520px]">
          <h2 id="updates-title" className="font-display text-[24px] leading-[1.15]">
            Get updates
          </h2>
          <p className="mt-2 text-ui leading-[1.6] text-paper-muted">New templates and changes land here first. Watch the repository on GitHub to hear about every release, or write to us.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="mailto:hello@basedraft.site?subject=basedraft%20updates" className="inline-flex h-11 items-center gap-2 rounded-full bg-paper/70 px-5 text-ui font-medium text-paper-ink shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--bd-paper-ink)_14%,transparent)] backdrop-blur transition-colors hover:bg-paper">
            <EnvelopeSimpleIcon weight="duotone" size={16} /> hello@basedraft.site
          </a>
          <a href={REPO} target="_blank" rel="noreferrer" className="btn-metal inline-flex h-11 items-center gap-2 rounded-full px-5 text-ui font-medium">
            <GithubLogoIcon weight="duotone" size={16} /> Watch on GitHub
          </a>
        </div>
      </section>
    </main>
  );
}
