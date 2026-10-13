"use client";

import { ArrowCounterClockwiseIcon, ArrowUpRightIcon, CheckIcon, CodeIcon, LockSimpleIcon, SwapIcon, TextTIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ICON, SectionGlyph } from "@/site/icons";
import { isFree, kindOf, liveUrl, sectionShot, templateOf, type LiveSection } from "@/site/live";
import { btnSm } from "@/site/sheet";
import type { TextEdit } from "@/site/text-edits";
import type { PageText } from "./canvas";
import { Group } from "./ui";

/* ---------- content: the words on the page ---------- */

const TAG: Record<string, string> = { h1: "Headline", h2: "Heading", h3: "Title", h4: "Title", button: "Button", a: "Link", li: "Item", p: "Text", label: "Label", dt: "Term", dd: "Detail", span: "Text", text: "Text" };

/** One piece of text, editable in place: Enter or leaving the field keeps it. */
function TextField({ t, onEdit }: { t: PageText; onEdit: (e: TextEdit) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? t.text;
  const keep = () => {
    if (draft !== null && draft.trim() && draft.trim() !== t.text) onEdit({ scope: t.scope, from: t.from, nth: t.nth, to: draft.trim() });
    setDraft(null);
  };
  const edited = t.text !== t.from;
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-[11.5px] text-subtle">
        {TAG[t.tag] ?? "Text"}
        {edited && (
          <button type="button" onClick={() => onEdit({ scope: t.scope, from: t.from, nth: t.nth, to: t.from })} className="font-medium text-muted transition-colors hover:text-fg">
            Reset
          </button>
        )}
      </span>
      <textarea
        value={value}
        rows={Math.min(5, Math.max(1, Math.ceil(value.length / 34)))}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={keep}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            (e.target as HTMLTextAreaElement).blur();
          }
          if (e.key === "Escape") setDraft(null);
        }}
        className={cn("block w-full resize-none rounded-[9px] px-2.5 py-1.5 text-[13px] leading-snug outline-none transition-shadow focus:ring-2 focus:ring-[#0d99ff]/40", edited ? "bg-[#0d99ff]/[0.07]" : "bg-fg/[0.04]")}
      />
    </label>
  );
}

/** Every piece of text in a section or block, top to bottom, each one editable. */
export function ContentGroup({ texts, onEdit }: { texts: PageText[]; onEdit: (e: TextEdit) => void }) {
  // A lone digit or symbol is a piece of a counter or an icon, not copy anyone writes.
  const words = texts.filter((t) => /\p{L}/u.test(t.from) || t.from.length > 2);
  const shown = words.slice(0, 40);
  return (
    <Group title="Content" icon={TextTIcon}>
      {shown.length ? (
        <div className="space-y-2.5">
          {shown.map((t) => (
            <TextField key={`${t.from}|${t.nth}|${t.text}`} t={t} onEdit={onEdit} />
          ))}
        </div>
      ) : (
        <p className="text-[12px] leading-snug text-muted">No text here to change.</p>
      )}
      <p className="text-[12px] leading-snug text-muted">{words.length > shown.length ? `The first ${shown.length} of ${words.length}. ` : ""}Or double-click any text on the canvas.</p>
    </Group>
  );
}

/*
 * The inspector for real sections. A section stays exactly as its template wrote it, so there are
 * no fields to fill in: you see what it is, swap it for another of its kind, and see the code
 * it adds to the page. With nothing selected, the page: its template and where it came from.
 */

/** Another section of the same kind from the same template, ready to take this one's place. */
function SwapTile({ s, on, locked, onPick }: { s: LiveSection; on: boolean; locked: boolean; onPick: () => void }) {
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onPick} className="group text-left">
      <span className={cn("relative block aspect-[16/10] overflow-hidden rounded-[8px] bg-surface transition-shadow", on ? "shadow-[0_0_0_2px_var(--bd-fg)]" : "shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.1)] group-hover:shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.3)]")}>
        <Image src={sectionShot(s)} alt="" fill sizes="140px" className="object-cover" />
        {locked && (
          <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-[5px] bg-fg/85 text-canvas">
            <LockSimpleIcon size={9} weight="bold" />
          </span>
        )}
      </span>
      <span className={cn("mt-1 flex items-center gap-1 truncate px-0.5 text-[12px]", on ? "font-medium text-fg" : "text-muted")}>
        {on && <CheckIcon size={11} weight="bold" />}
        {s.name}
      </span>
    </button>
  );
}

export function SectionPanel({ section, pro, onSwap, texts, onEdit }: { section: LiveSection; pro: boolean; onSwap: (id: string) => void; texts: PageText[]; onEdit: (e: TextEdit) => void }) {
  const t = templateOf(section.template)!;
  const kind = kindOf(section.kind);
  const kin = t.sections.filter((s) => s.kind === section.kind);
  const code = `${section.import}\n\n${section.tag}`;
  return (
    <>
      <div className="flex gap-3 border-b border-line px-4 py-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-fg/[0.05]">
          <SectionGlyph kind={section.kind} size={18} />
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold">{section.name}</span>
          <span className="mt-0.5 block text-[12px] leading-snug text-muted">{kind.blurb}</span>
        </span>
      </div>
      <ContentGroup texts={texts} onEdit={onEdit} />
      {kin.length > 1 && (
        <Group title="Swap for" icon={SwapIcon}>
          <div role="radiogroup" aria-label={`${kind.label} sections`} className="grid grid-cols-2 gap-2">
            {kin.map((s) => (
              <SwapTile key={s.id} s={s} on={s.id === section.id} locked={!pro && !isFree(s)} onPick={() => onSwap(s.id)} />
            ))}
          </div>
          <p className="text-[12px] leading-snug text-muted">The other {kind.label.toLowerCase()} sections in {t.name}, each as its template draws it.</p>
        </Group>
      )}
      <Group title="Code" icon={CodeIcon}>
        <pre className="whitespace-pre-wrap break-words rounded-[10px] bg-fg/[0.04] p-3 font-mono text-[11.5px] leading-[1.6] text-fg/85">{code}</pre>
        <p className="text-[12px] leading-snug text-muted">
          What this section adds to a page in the {t.name} project. Its source is in the template, as written.
        </p>
      </Group>
    </>
  );
}

/** A block of one of the template's own pages: what it says, editable. */
export function BlockPanel({ name, texts, onEdit }: { name: string; texts: PageText[]; onEdit: (e: TextEdit) => void }) {
  return (
    <>
      <div className="border-b border-line px-4 py-4">
        <span className="block text-[13px] font-semibold">{name}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-muted">Part of the template&apos;s own page, drawn as written. Its text is yours to change.</span>
      </div>
      <ContentGroup texts={texts} onEdit={onEdit} />
    </>
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
        {t.name}&apos;s own page, exactly as the template draws it. Click a block to see its text, or double-click any text on the canvas to change it.
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
      <Group title="Pages in the template" icon={ICON.pages}>
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
