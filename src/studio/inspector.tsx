"use client";

import { ArrowCounterClockwiseIcon, ArrowUpRightIcon, CaretDownIcon, CaretUpIcon, CheckIcon, CodeIcon, CrosshairSimpleIcon, EyeSlashIcon, LockSimpleIcon, SwapIcon, TextTIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ICON, SectionGlyph } from "@/site/icons";
import { isFree, kindOf, liveUrl, sectionShot, templateOf, type LiveSection } from "@/site/live";
import { btnSm } from "@/site/sheet";
import type { TextEdit } from "@/site/text-edits";
import { Tip } from "@/site/keys";
import type { PageText, TextRef } from "./canvas";
import { spread, type TextLayer } from "./text-layers";
import { ROLE_LABEL, ROLE_PLURAL } from "./text-roles";
import { ROLE_ICON } from "./text-tree";
import { Group } from "./ui";

/* ---------- text: one text layer, picked in Layers or on the canvas ---------- */

/** One part of a text layer, editable in place: the page shows it as you type; Enter or leaving the field keeps it, Esc undoes. */
function Field({ part, label, focus, onEdit, onPreview }: { part: PageText; label: string; focus: number; onEdit: (e: TextEdit) => void; onPreview: (t: TextRef, value: string) => void }) {
  const id = useId();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  // Esc blurs the field too; the blur that follows mustn't keep what Esc undid.
  const undone = useRef(false);
  // What it read when the cursor went in. The page shows each key as it's typed (and is read
  // again now and then), so that's what a change is measured against, and what Esc goes back to.
  const start = useRef(part.text);
  const value = draft ?? part.text;
  const edited = value.trim() !== part.from;
  useEffect(() => {
    if (focus) ref.current?.focus();
  }, [focus]);
  const keep = () => {
    const v = draft?.trim();
    if (!undone.current && v && v !== start.current) onEdit({ scope: part.scope, from: part.from, nth: part.nth, to: v });
    else if (draft !== null) onPreview(part, start.current);
    undone.current = false;
    setDraft(null);
  };
  const count = value.trim().length;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[12px]">
        <label htmlFor={id} className="text-muted">
          {label}
        </label>
        <span className="tabular-nums text-subtle">
          {count} {count === 1 ? "character" : "characters"}
          {edited && `, was ${part.from.length}`}
        </span>
      </div>
      <textarea
        ref={ref}
        id={id}
        value={value}
        rows={Math.min(8, Math.max(1, Math.ceil(value.length / 30)))}
        spellCheck
        onChange={(e) => {
          setDraft(e.target.value);
          onPreview(part, e.target.value);
        }}
        onFocus={(e) => {
          if (draft === null) start.current = part.text;
          e.target.select();
        }}
        onBlur={keep}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            e.preventDefault();
            undone.current = true;
            onPreview(part, start.current);
            e.currentTarget.blur();
          }
        }}
        className={cn(
          "block w-full resize-none rounded-[8px] px-2.5 py-2 text-[13px] leading-snug outline-none transition-[box-shadow,background-color] [field-sizing:content] focus:bg-fg/[0.03] focus:ring-2 focus:ring-[#0d99ff]/40",
          edited ? "bg-[#0d99ff]/[0.07]" : "bg-fg/[0.05]",
        )}
      />
    </div>
  );
}

/**
 * A headline set word by word (each word its own element, to animate them in): one field for the
 * whole of it, its words handed back to their places as it's kept.
 */
function WordsField({ parts, label, focus, onEdit, onPreview }: { parts: PageText[]; label: string; focus: number; onEdit: (e: TextEdit[]) => void; onPreview: (t: TextRef, value: string) => void }) {
  const id = useId();
  const ref = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const undone = useRef(false);
  const now = parts.map((p) => p.text).filter(Boolean).join(" ");
  const was = parts.map((p) => p.from).join(" ");
  // Each word as it read when the cursor went in: what a change is measured against (see Field).
  const start = useRef(parts.map((p) => p.text));
  const value = draft ?? now;
  useEffect(() => {
    if (focus) ref.current?.focus();
  }, [focus]);
  const show = (v: string) => spread(v, parts.length).forEach((w, i) => onPreview(parts[i], w));
  const keep = () => {
    const v = draft?.trim();
    const before = start.current;
    if (!undone.current && v && v !== before.filter(Boolean).join(" ")) {
      const next = spread(v, parts.length);
      onEdit(parts.map((p, i) => ({ scope: p.scope, from: p.from, nth: p.nth, to: next[i] })).filter((e, i) => e.to !== before[i]));
    } else if (draft !== null) before.forEach((w, i) => onPreview(parts[i], w));
    undone.current = false;
    setDraft(null);
  };
  const count = value.trim().length;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[12px]">
        <label htmlFor={id} className="text-muted">
          {label}
        </label>
        <span className="tabular-nums text-subtle">
          {count} characters{value.trim() !== was && `, was ${was.length}`}
        </span>
      </div>
      <textarea
        ref={ref}
        id={id}
        value={value}
        rows={Math.min(8, Math.max(2, Math.ceil(value.length / 30)))}
        spellCheck
        onChange={(e) => {
          setDraft(e.target.value);
          show(e.target.value);
        }}
        onFocus={(e) => {
          if (draft === null) start.current = parts.map((p) => p.text);
          e.target.select();
        }}
        onBlur={keep}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            e.preventDefault();
            undone.current = true;
            start.current.forEach((w, i) => onPreview(parts[i], w));
            e.currentTarget.blur();
          }
        }}
        className={cn("block w-full resize-none rounded-[8px] px-2.5 py-2 text-[13px] leading-snug outline-none transition-[box-shadow,background-color] [field-sizing:content] focus:bg-fg/[0.03] focus:ring-2 focus:ring-[#0d99ff]/40", value.trim() !== was ? "bg-[#0d99ff]/[0.07]" : "bg-fg/[0.05]")}
      />
      <p className="mt-1.5 text-[12px] leading-snug text-subtle">Set word by word, as the template animates it. Your words take the same places, in order.</p>
    </div>
  );
}

/**
 * A text layer, picked in Layers or clicked on the canvas: what it is and where, then its
 * words, a field per line (or per part, for a word set apart in a sentence), as Figma's inspector
 * shows a text layer on its own.
 */
export function TextPanel({ layer, place, focus, focusRef, onStep, onEdit, onPreview, onShow }: { layer: TextLayer; place: { at: number; of: number }; focus: number; focusRef?: TextRef; onStep: (by: 1 | -1) => void; onEdit: (e: TextEdit | TextEdit[]) => void; onPreview: (t: TextRef, value: string) => void; onShow: () => void }) {
  const Icon = ROLE_ICON[layer.role];
  const set = layer.items;
  const many = layer.parts.length > 1;
  // Parts that each start lower down the page are lines; side by side, they're parts of one line.
  const lines = many && layer.parts.every((p, i) => i === 0 || p.top > layer.parts[i - 1].top + 4);
  // A word in each part (three or more): a headline set word by word.
  const words = !set && layer.parts.length >= 3 && layer.parts.every((p) => !/\s/.test(p.from));
  const name = set ? ROLE_PLURAL[layer.role] : ROLE_LABEL[layer.role];
  const edited = layer.parts.filter((p) => p.text !== p.from);
  const about = layer.live ? "Changes on its own" : [set ? `${set.length} side by side, each its own` : words ? `${layer.parts.length} words` : many ? `${layer.parts.length} ${lines ? "lines" : "parts"}` : "1 line", layer.hidden && "hidden at this width", edited.length > 0 && "edited"].filter(Boolean).join(", ");
  // The cursor goes in the field for what was clicked (a link in a menu), else the first.
  const target = (focusRef && layer.parts.find((p) => p.from === focusRef.from && p.nth === focusRef.nth)) || layer.parts[0];
  const focusFor = (p: PageText) => (p === target ? focus : 0);
  const step = "grid size-7 place-items-center rounded-[8px] text-muted transition-colors hover:bg-fg/[0.06] hover:text-fg disabled:pointer-events-none disabled:opacity-30";
  return (
    <>
      <div className="flex items-center gap-3 border-b border-line py-3.5 pl-4 pr-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#0d99ff]/10 text-[#0d99ff]">
          <Icon size={18} weight="bold" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold">{name}</span>
          <span className="mt-0.5 block truncate text-[12px] text-muted">{about}</span>
        </span>
        <span className="flex shrink-0 items-center">
          <Tip label="Previous text" keys="Shift Tab">
            <button type="button" aria-label="Previous text" disabled={place.at <= 1} onClick={() => onStep(-1)} className={step}>
              <CaretUpIcon size={13} weight="bold" />
            </button>
          </Tip>
          <span className="min-w-[38px] text-center text-[12px] tabular-nums text-subtle">
            {place.at} of {place.of}
          </span>
          <Tip label="Next text" keys="Tab">
            <button type="button" aria-label="Next text" disabled={place.at >= place.of} onClick={() => onStep(1)} className={step}>
              <CaretDownIcon size={13} weight="bold" />
            </button>
          </Tip>
        </span>
      </div>
      <Group
        title="Text"
        icon={TextTIcon}
        aside={
          edited.length > 0 &&
          !layer.live && (
            <button type="button" onClick={() => onEdit(edited.map((p) => ({ scope: p.scope, from: p.from, nth: p.nth, to: p.from })))} title="Back to the template's words" className="flex h-7 items-center gap-1 rounded-[8px] px-2 text-[12px] font-medium text-muted hover:bg-fg/[0.06] hover:text-fg">
              <ArrowCounterClockwiseIcon size={12} /> Reset
            </button>
          )
        }
      >
        {layer.live ? (
          <>
            <p className="flex items-start gap-2 rounded-[8px] bg-fg/[0.04] px-2.5 py-2 text-[13px] leading-snug text-muted">
              <LockSimpleIcon size={14} className="mt-0.5 shrink-0" />
              <span className="min-w-0 break-words tabular-nums">{layer.name}</span>
            </p>
            <p className="text-[12px] leading-snug text-muted">This changes on its own as the page runs (a counter, a ticker, a price), so it&apos;s set in the section&apos;s code rather than here.</p>
          </>
        ) : (
          <>
            {set ? (
              set.flatMap((item, i) => item.parts.map((p, j) => <Field key={`${p.from}|${p.nth}`} part={p} label={`${ROLE_LABEL[item.role]} ${i + 1}${item.parts.length > 1 ? `, part ${j + 1}` : ""}`} focus={focusFor(p)} onEdit={onEdit} onPreview={onPreview} />))
            ) : words ? (
              <WordsField parts={layer.parts} label={name} focus={focus} onEdit={onEdit} onPreview={onPreview} />
            ) : (
              layer.parts.map((p, i) => <Field key={`${p.from}|${p.nth}`} part={p} label={many ? `${lines ? "Line" : "Part"} ${i + 1}` : name} focus={focusFor(p)} onEdit={onEdit} onPreview={onPreview} />)
            )}
            {layer.hidden && (
              <p className="flex gap-2 text-[12px] leading-snug text-muted">
                <EyeSlashIcon size={14} className="mt-px shrink-0" />
                Not drawn at desktop width. It shows at another breakpoint, or to screen readers; your words go there too.
              </p>
            )}
            <p className="text-[12px] leading-snug text-subtle">Enter keeps it, Esc undoes. It changes at every breakpoint, and in what you copy or download.</p>
          </>
        )}
        <button type="button" onClick={onShow} className={cn(btnSm.quiet, "w-full")}>
          <CrosshairSimpleIcon size={14} /> Show on the canvas
        </button>
      </Group>
    </>
  );
}

/** With a section or a block selected and no text in it picked: how to get to its words. */
function TextHint({ layers, onPick }: { layers: TextLayer[]; onPick: (l: TextLayer) => void }) {
  const first = layers.find((l) => !l.live);
  return (
    <Group title="Text" icon={TextTIcon} aside={layers.length > 0 && <span className="text-[12px] tabular-nums text-subtle">{layers.length}</span>}>
      <p className="text-[12px] leading-snug text-muted">
        {layers.length ? `${layers.length} text ${layers.length === 1 ? "layer" : "layers"}, listed under this one in Layers.` : "No text here to change."} {layers.length > 0 && "Click one to change its words, or click any text on the canvas."}
      </p>
      {first && (
        <button type="button" onClick={() => onPick(first)} className={cn(btnSm.quiet, "w-full justify-start")}>
          {(() => {
            const Icon = ROLE_ICON[first.role];
            return <Icon size={14} className="shrink-0" />;
          })()}
          <span className="min-w-0 truncate">Edit the {ROLE_LABEL[first.role].toLowerCase()}</span>
          <span className="ml-auto shrink-0 text-subtle">Enter</span>
        </button>
      )}
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

export function SectionPanel({ section, pro, onSwap, layers, onPick }: { section: LiveSection; pro: boolean; onSwap: (id: string) => void; layers: TextLayer[]; onPick: (l: TextLayer) => void }) {
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
      <TextHint layers={layers} onPick={onPick} />
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
export function BlockPanel({ name, layers, onPick }: { name: string; layers: TextLayer[]; onPick: (l: TextLayer) => void }) {
  return (
    <>
      <div className="border-b border-line px-4 py-4">
        <span className="block text-[13px] font-semibold">{name}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-muted">Part of the template&apos;s own page, drawn as written. Its text is yours to change.</span>
      </div>
      <TextHint layers={layers} onPick={onPick} />
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
        {t.name}&apos;s own page, exactly as the template draws it. Click any text on the canvas to change it, or a block to see all of its text.
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
