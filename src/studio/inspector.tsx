"use client";

import { ArrowCounterClockwiseIcon, ArrowUpRightIcon, CheckIcon, SwapIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ICON, SectionGlyph } from "@/site/icons";
import { kindOf, liveUrl, sectionShot, templateOf, type LiveSection } from "@/site/live";
import { btnSm } from "@/site/sheet";
import { Group } from "./ui";

/*
 * The inspector. A section stays exactly as its template wrote it, so there are no fields to fill
 * in: you see what it is and can swap it for another of its kind. Its words change right on the
 * canvas. With nothing selected, the page: its template and where it came from.
 */

/** Another section of the same kind from the same template, ready to take this one's place. */
function SwapTile({ s, on, onPick }: { s: LiveSection; on: boolean; onPick: () => void }) {
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onPick} className="group text-left">
      <span className={cn("relative block aspect-[16/10] overflow-hidden rounded-[8px] bg-surface transition-shadow", on ? "shadow-[0_0_0_2px_var(--bd-fg)]" : "shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.1)] group-hover:shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.3)]")}>
        <Image src={sectionShot(s)} alt="" fill sizes="140px" className="object-cover" />
      </span>
      <span className={cn("mt-1 flex items-center gap-1 truncate px-0.5 text-[12px]", on ? "font-medium text-fg" : "text-muted")}>
        {on && <CheckIcon size={11} weight="bold" />}
        {s.name}
      </span>
    </button>
  );
}

export function SectionPanel({ section, onSwap }: { section: LiveSection; onSwap: (id: string) => void }) {
  const t = templateOf(section.template)!;
  const kind = kindOf(section.kind);
  const kin = t.sections.filter((s) => s.kind === section.kind);
  return (
    <>
      <div className="flex gap-3 border-b border-line px-4 py-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-fg/[0.05]">
          <SectionGlyph kind={section.kind} size={18} />
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold">{section.name}</span>
          <span className="mt-0.5 block text-[12px] leading-snug text-muted">{kind.blurb}</span>
          <span className="mt-2 block text-[12px] leading-snug text-subtle">Click any of its text on the canvas to change it.</span>
        </span>
      </div>
      {kin.length > 1 && (
        <Group title="Swap for" icon={SwapIcon}>
          <div role="radiogroup" aria-label={`${kind.label} sections`} className="grid grid-cols-2 gap-2">
            {kin.map((s) => (
              <SwapTile key={s.id} s={s} on={s.id === section.id} onPick={() => onSwap(s.id)} />
            ))}
          </div>
          <p className="text-[12px] leading-snug text-muted">The other {kind.label.toLowerCase()} sections in {t.name}, each as its template draws it.</p>
        </Group>
      )}
    </>
  );
}

/** A block of one of the template's own pages: drawn as written, its words yours to change. */
export function BlockPanel({ name }: { name: string }) {
  return (
    <div className="border-b border-line px-4 py-4">
      <span className="block text-[13px] font-semibold">{name}</span>
      <span className="mt-0.5 block text-[12px] leading-snug text-muted">Part of the template&apos;s own page, drawn as written. Click any of its text on the canvas to change it.</span>
    </div>
  );
}

/** One of the template's own pages, with nothing selected. */
export function RoutePanel({ template, label, path, edits }: { template: LiveSection["template"]; label: string; path: string; edits: number }) {
  const t = templateOf(template)!;
  return (
    <Group title="Page" icon={ICON.pages}>
      <div>
        <span className="block text-[13px] font-semibold">{label}</span>
        <span className="block font-mono text-[12px] text-subtle">{path}</span>
      </div>
      <p className="text-[12px] leading-snug text-muted">
        {t.name}&apos;s own page, exactly as the template draws it. Click any text on the canvas to change it.
        {edits > 0 && ` ${edits} ${edits === 1 ? "edit" : "edits"} on this page so far.`}
      </p>
      <a href={liveUrl(t.slug, path)} target="_blank" rel="noreferrer" className={cn(btnSm.quiet, "w-full")}>
        <ArrowUpRightIcon size={14} /> Open the live page
      </a>
    </Group>
  );
}

export function PagePanel({ template, count, onReset }: { template: LiveSection["template"]; count: number; onReset: () => void }) {
  const t = templateOf(template)!;
  return (
    <>
      <Group title="Template" icon={ICON.templates}>
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="size-3 shrink-0 rounded-full" style={{ background: t.accent }} />
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold">{t.name}</span>
            <span className="block text-[12px] text-muted">{t.category}</span>
          </span>
        </div>
        <p className="text-[12px] leading-snug text-muted">{t.tagline}</p>
        <p className="text-[12px] leading-snug text-muted">
          {count} {count === 1 ? "section" : "sections"} on this page, drawn by {t.name}&apos;s own code. Switch templates from the toolbar below.
        </p>
        <button type="button" onClick={onReset} className={cn(btnSm.quiet, "w-full")}>
          <ArrowCounterClockwiseIcon size={14} /> Back to {t.name}&apos;s home page
        </button>
      </Group>
      <Group title="Pages in the template" icon={ICON.pages} defaultOpen={false}>
        <ul className="-mx-1.5">
          {t.pages.map((p) => (
            <li key={p.path}>
              <a href={liveUrl(t.slug, p.path)} target="_blank" rel="noreferrer" className="flex h-8 items-center justify-between gap-2 rounded-[8px] px-1.5 text-[13px] transition-colors hover:bg-fg/[0.04]">
                <span className="truncate">{p.label}</span>
                <ArrowUpRightIcon size={12} className="shrink-0 text-subtle" />
              </a>
            </li>
          ))}
        </ul>
      </Group>
    </>
  );
}
