"use client";

import { CopyIcon, DotsSixVerticalIcon, FileIcon, HouseIcon, LockSimpleIcon, PlusIcon, SquareIcon, TrashIcon } from "@phosphor-icons/react";
import { motion, Reorder, useDragControls } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SectionGlyph } from "@/site/icons";
import { Tip } from "@/site/keys";
import { isFree, KINDS, sectionOf, sectionShot, TEMPLATES, templateOf, templateShot, type LiveSection, type TemplateSlug } from "@/site/live";
import { Menu } from "@/site/menu";
import type { Block } from "./canvas";
import { idOf, type Project, type View } from "./state";
import { TextLayers, Twisty, type TextTree } from "./text-tree";

/* ---------- layers ---------- */

function LayerRow({ layer, section, index, selected, onSelect, onRemove, onDuplicate, text }: { layer: string; section: LiveSection; index: number; selected: boolean; onSelect: () => void; onRemove: () => void; onDuplicate: () => void; text: TextTree }) {
  const controls = useDragControls();
  const open = text.open(layer);
  // A text layer in it is picked: the section is the picked layer's parent, lit more softly.
  const inside = selected && text.picked?.key === layer;
  return (
    <Reorder.Item
      value={layer}
      dragListener={false}
      dragControls={controls}
      className="relative"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: "spring", stiffness: 520, damping: 42, mass: 0.8 }}
      whileDrag={{ scale: 1.02, zIndex: 10, boxShadow: "0 8px 24px rgb(var(--bd-shade)/0.14)", borderRadius: 12 }}
    >
      <div className={cn("group flex h-11 items-center gap-0.5 rounded-control pr-1 transition-colors", inside ? "bg-fg/[0.035]" : selected ? "bg-fg/[0.07]" : "hover:bg-fg/[0.04]")}>
        <button type="button" aria-label={`Drag ${section.name} to reorder`} onPointerDown={(e) => controls.start(e)} className="grid h-full w-4 shrink-0 cursor-grab touch-none place-items-center text-subtle opacity-0 transition-opacity active:cursor-grabbing group-hover:opacity-100 focus-visible:opacity-100">
          <DotsSixVerticalIcon size={13} weight="bold" />
        </button>
        <Twisty open={open} label={section.name} onToggle={() => text.onToggle(layer)} />
        <button type="button" onClick={onSelect} aria-pressed={selected} className="ml-1 flex min-w-0 flex-1 items-center gap-2.5 text-left">
          <span className={cn("relative block aspect-[16/10] w-11 shrink-0 overflow-hidden rounded-[6px] bg-surface shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.1)]", selected && "shadow-[0_0_0_1.5px_var(--bd-fg)]")}>
            <Image src={sectionShot(section)} alt="" fill sizes="44px" className="object-cover" />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className={cn("block truncate text-[13px]", selected && !inside ? "font-semibold text-fg" : "text-fg")}>{section.name}</span>
            {/* The component that draws it, as the template's code calls it. */}
            <span className="mt-0.5 block truncate font-mono text-[11px] text-subtle">{section.tag.match(/^<(\w+)/)?.[1]}</span>
          </span>
          <span className="text-[12px] tabular-nums text-subtle group-hover:hidden">{String(index + 1).padStart(2, "0")}</span>
        </button>
        <div className="hidden shrink-0 group-hover:flex group-focus-within:flex">
          <Tip label="Duplicate" keys="Cmd D">
            <button type="button" onClick={onDuplicate} aria-label="Duplicate section" className="grid size-7 place-items-center rounded-[8px] text-subtle hover:bg-fg/[0.06] hover:text-fg">
              <CopyIcon size={13} />
            </button>
          </Tip>
          <Tip label="Delete" keys="Del">
            <button type="button" onClick={onRemove} aria-label="Delete section" className="grid size-7 place-items-center rounded-[8px] text-subtle hover:bg-fg/[0.06] hover:text-[#d92d20]">
              <TrashIcon size={13} />
            </button>
          </Tip>
        </div>
      </div>
      {open && <TextLayers layerKey={layer} tree={text} indent={46} />}
    </Reorder.Item>
  );
}

/** The page's sections, top to bottom, each opening on its text. Drag the handle to reorder. */
export function Layers({ template, keys, selected, onSelect, onRemove, onDuplicate, onReorder, text }: { template: TemplateSlug; keys: string[]; selected: string | null; onSelect: (k: string) => void; onRemove: (k: string) => void; onDuplicate: (k: string) => void; onReorder: (keys: string[]) => void; text: TextTree }) {
  return (
    <Reorder.Group axis="y" values={keys} onReorder={onReorder} className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden p-1.5">
      {keys.map((k, i) => {
        const s = sectionOf(template, idOf(k));
        return s ? <LayerRow key={k} layer={k} section={s} index={i} selected={selected === k} onSelect={() => onSelect(k)} onRemove={() => onRemove(k)} onDuplicate={() => onDuplicate(k)} text={text} /> : null;
      })}
      {keys.length === 0 && <p className="px-3 py-6 text-center text-[13px] text-muted">No sections yet. Insert one with +.</p>}
    </Reorder.Group>
  );
}

/* ---------- insert ---------- */

const tile = "rounded-[8px] shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.1)] transition-shadow group-hover:shadow-[0_0_0_2px_var(--bd-fg)]";

/** Every section in the template, grouped by kind, as the real thing in miniature. */
export function InsertGrid({ template, pro, onInsert, cols = 3 }: { template: TemplateSlug; pro: boolean; onInsert: (id: string) => void; cols?: 2 | 3 }) {
  const t = templateOf(template)!;
  const kinds = KINDS.filter((k) => t.sections.some((s) => s.kind === k.id));
  return (
    <div className="space-y-5">
      {kinds.map((k) => (
        <div key={k.id}>
          <div className="mb-2 flex items-center gap-1.5 text-[12px] text-muted">
            <SectionGlyph kind={k.id} size={13} />
            {k.label}
          </div>
          <div className={cn("grid gap-2", cols === 3 ? "grid-cols-3" : "grid-cols-2")}>
            {t.sections
              .filter((s) => s.kind === k.id)
              .map((s) => {
                const locked = !pro && !isFree(s);
                return (
                  <button key={s.id} type="button" onClick={() => onInsert(s.id)} className="group text-left">
                    <span className={cn("relative block aspect-[16/10] overflow-hidden bg-surface", tile)}>
                      <Image src={sectionShot(s)} alt="" fill sizes="180px" className="object-cover" />
                      {locked && (
                        <span className="absolute right-1 top-1 flex items-center gap-0.5 rounded-[6px] bg-fg/85 px-1 py-px text-[10px] font-medium text-canvas">
                          <LockSimpleIcon size={9} weight="bold" /> Pro
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block truncate px-0.5 text-[12px]">{s.name}</span>
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

/** The templates' home pages, for starting over. */
export function StartFrom({ onStart, current }: { onStart: (slug: TemplateSlug) => void; current: TemplateSlug }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {TEMPLATES.map((t) => (
        <motion.button key={t.slug} type="button" whileTap={{ scale: 0.97 }} onClick={() => onStart(t.slug)} className="group text-left">
          <span className={cn("relative block aspect-[16/11] overflow-hidden bg-surface", tile, current === t.slug && "shadow-[0_0_0_2px_var(--bd-fg)]")}>
            <Image src={templateShot(t.slug)} alt="" fill sizes="180px" className="object-cover object-top" />
          </span>
          <span className="mt-1 flex items-center gap-1.5 px-0.5 text-[12px] font-medium">
            <span aria-hidden className="size-2 rounded-full" style={{ background: t.accent }} />
            {t.name}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

/* ---------- pages ---------- */

const pageRow = "group flex h-9 w-full items-center gap-2 rounded-control pl-2.5 pr-1 text-left text-[13px] transition-colors";

function PageName({ value, onRename }: { value: string; onRename: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  if (!editing)
    return (
      <span
        className="min-w-0 flex-1 truncate"
        onDoubleClick={(e) => {
          e.stopPropagation();
          setDraft(value);
          setEditing(true);
        }}
      >
        {value}
      </span>
    );
  const done = () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== value) onRename(draft.trim());
  };
  return (
    <input
      autoFocus
      aria-label="Page name"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onBlur={done}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") done();
        if (e.key === "Escape") setEditing(false);
      }}
      className="h-7 min-w-0 flex-1 rounded-[7px] bg-surface px-1.5 text-[13px] outline-none ring-2 ring-[#0d99ff]/40"
    />
  );
}

/**
 * The site's pages, as in Framer: the ones you build from sections first (Home, and any you add),
 * then the template's own pages, which you can open, read and edit the text of as they are.
 */
export function PagesPanel({ project, view, onView, onAdd, onRename, onDuplicate, onRemove }: { project: Project; view: View; onView: (v: View) => void; onAdd: (kind: "blank" | "copy") => void; onRename: (id: string, name: string) => void; onDuplicate: (id: string) => void; onRemove: (id: string) => void }) {
  const t = templateOf(project.template)!;
  const edited = (scope: string) => project.edits.some((e) => e.scope === scope);
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
      <div className="flex h-8 items-center justify-between pl-2.5 pr-1 text-[12px] font-medium text-muted">
        Your pages
        <Menu
          label="Add a page"
          align="left"
          buttonClassName="grid size-7 place-items-center rounded-[8px] text-muted transition-colors hover:bg-fg/[0.06] hover:text-fg"
          button={<PlusIcon size={14} weight="bold" />}
          items={[
            { label: "Blank page", icon: FileIcon, hint: "Nav and footer", onSelect: () => onAdd("blank") },
            { label: "Copy this page", icon: CopyIcon, onSelect: () => onAdd("copy") },
          ]}
        />
      </div>
      <ul className="space-y-0.5">
        {project.pages.map((p) => {
          const on = view.kind === "page" && view.id === p.id;
          const Icon = p.path === "/" ? HouseIcon : FileIcon;
          return (
            <li key={p.id}>
              <div role="button" tabIndex={0} aria-pressed={on} onClick={() => onView({ kind: "page", id: p.id })} onKeyDown={(e) => e.key === "Enter" && onView({ kind: "page", id: p.id })} className={cn(pageRow, on ? "bg-fg/[0.07] font-medium" : "hover:bg-fg/[0.04]")}>
                <Icon size={14} weight={on ? "fill" : "regular"} className="shrink-0 text-muted" />
                <PageName value={p.name} onRename={(v) => onRename(p.id, v)} />
                <span className="shrink-0 font-mono text-[11px] text-subtle group-hover:hidden">{p.path}</span>
                <span className="hidden shrink-0 group-hover:flex">
                  <Tip label="Duplicate">
                    <button type="button" aria-label={`Duplicate ${p.name}`} onClick={(e) => (e.stopPropagation(), onDuplicate(p.id))} className="grid size-7 place-items-center rounded-[8px] text-subtle hover:bg-fg/[0.06] hover:text-fg">
                      <CopyIcon size={13} />
                    </button>
                  </Tip>
                  {p.path !== "/" && (
                    <Tip label="Delete">
                      <button type="button" aria-label={`Delete ${p.name}`} onClick={(e) => (e.stopPropagation(), onRemove(p.id))} className="grid size-7 place-items-center rounded-[8px] text-subtle hover:bg-fg/[0.06] hover:text-[#d92d20]">
                        <TrashIcon size={13} />
                      </button>
                    </Tip>
                  )}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex h-8 items-center gap-1.5 border-t border-line pl-2.5 pt-3 text-[12px] font-medium text-muted">
        <span aria-hidden className="size-2 rounded-full" style={{ background: t.accent }} />
        {t.name}&apos;s pages
      </div>
      <ul className="mt-1 space-y-0.5">
        {t.pages
          .filter((p) => p.path !== "/")
          .map((p) => {
            const on = view.kind === "route" && view.path === p.path;
            return (
              <li key={p.path}>
                <button type="button" aria-pressed={on} onClick={() => onView({ kind: "route", path: p.path })} className={cn(pageRow, on ? "bg-fg/[0.07] font-medium" : "hover:bg-fg/[0.04]")}>
                  <FileIcon size={14} weight={on ? "fill" : "regular"} className="shrink-0 text-muted" />
                  <span className="min-w-0 flex-1 truncate">{p.label}</span>
                  {edited(`route:${p.path}`) && <span aria-label="Text edited" className="size-1.5 shrink-0 rounded-full bg-[#0d99ff]" />}
                  <span className="shrink-0 truncate font-mono text-[11px] text-subtle">{p.path}</span>
                </button>
              </li>
            );
          })}
      </ul>
    </div>
  );
}

/** A template page's blocks, top to bottom: read from the page, so they're its own, as written. */
export function BlockLayers({ blocks, selected, onSelect, text }: { blocks: Block[]; selected: string | null; onSelect: (k: string) => void; text: TextTree }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
      <ul className="space-y-0.5">
        {blocks.map((b, i) => {
          const on = selected === b.key;
          const inside = on && text.picked?.key === b.key;
          const open = text.open(b.key);
          return (
            <li key={b.key}>
              <div className={cn("group flex h-9 items-center gap-1 rounded-control pl-1 pr-1 transition-colors", inside ? "bg-fg/[0.035]" : on ? "bg-fg/[0.07]" : "hover:bg-fg/[0.04]")}>
                <Twisty open={open} label={b.name} onToggle={() => text.onToggle(b.key)} />
                <button type="button" aria-pressed={on} onClick={() => onSelect(b.key)} className={cn("flex h-full min-w-0 flex-1 items-center gap-2 pr-1.5 text-left text-[13px]", on && !inside && "font-medium")}>
                  <SquareIcon size={13} className="shrink-0 text-subtle" />
                  <span className="min-w-0 flex-1 truncate">{b.name}</span>
                  <span className="text-[12px] tabular-nums text-subtle">{String(i + 1).padStart(2, "0")}</span>
                </button>
              </div>
              {open && <TextLayers layerKey={b.key} tree={text} indent={30} />}
            </li>
          );
        })}
        {!blocks.length && <li className="px-3 py-6 text-center text-[13px] text-muted">Loading the page…</li>}
      </ul>
      <p className="px-2.5 pt-3 text-[12px] leading-snug text-muted">This is the template&apos;s own page, drawn as written. Double-click any text to change it.</p>
    </div>
  );
}
