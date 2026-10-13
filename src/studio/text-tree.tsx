"use client";

import {
  CalendarBlankIcon,
  CaretRightIcon,
  ChartLineIcon,
  ChatTeardropTextIcon,
  CodeIcon,
  CursorClickIcon,
  DotOutlineIcon,
  EyeSlashIcon,
  HashIcon,
  ImageIcon,
  LinkSimpleIcon,
  ListBulletsIcon,
  ListIcon,
  SquaresFourIcon,
  LockSimpleIcon,
  ParagraphIcon,
  QuotesIcon,
  RectangleIcon,
  TagIcon,
  TextboxIcon,
  TextHOneIcon,
  TextHTwoIcon,
  TextTIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn, EASE_OUT } from "@/lib/utils";
import type { IconType } from "@/site/icons";
import { foldersTo, type Layer, type TextLayer } from "./text-layers";
import { ROLE_LABEL, ROLE_PLURAL, type FolderKind, type TextRole } from "./text-roles";

/*
 * A section's text layers under its row in Layers, as Figma lists a frame's: an icon for what each
 * one is, its words as its name, and the cards and callouts that hold them as folders. A click on
 * one puts the cursor in its words, ready to type.
 */

/** Opening and closing a row: its height and its contents together, so nothing below jumps or stretches. */
export function Fold({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div key="fold" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ height: { duration: 0.2, ease: EASE_OUT }, opacity: { duration: 0.14 } }} className="overflow-hidden">
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** A folder holding more than this many layers starts closed: a product mockup's dozens of labels stay out of the way. */
const BUSY = 8;

export const ROLE_ICON: Record<TextRole, IconType> = {
  headline: TextHOneIcon,
  heading: TextHTwoIcon,
  paragraph: ParagraphIcon,
  quote: QuotesIcon,
  item: DotOutlineIcon,
  text: TextTIcon,
  button: CursorClickIcon,
  link: LinkSimpleIcon,
  label: TagIcon,
  number: HashIcon,
  date: CalendarBlankIcon,
  code: CodeIcon,
  image: ImageIcon,
};

const FOLDER_ICON: Record<FolderKind, IconType> = {
  card: RectangleIcon,
  callout: ChatTeardropTextIcon,
  chart: ChartLineIcon,
  list: ListBulletsIcon,
  group: SquaresFourIcon,
  form: TextboxIcon,
  menu: ListIcon,
  hidden: EyeSlashIcon,
};

/** What Layers needs to list the text in its sections (or a page's blocks). */
export interface TextTree {
  /** Whether a section's row is open on its text. */
  open: (key: string) => boolean;
  onToggle: (key: string) => void;
  /** Each open section's layers; missing while they're read. */
  layers: Record<string, Layer[] | undefined>;
  /** The text layer picked, by its section and its id. */
  picked: { key: string; id: string } | null;
  onPick: (key: string, layer: TextLayer) => void;
  /** The pointer over a text layer (null once it leaves): outlined on the canvas. */
  onHover: (layer: TextLayer | null) => void;
}

/** The caret that opens a row on its layers. */
export function Twisty({ open, label, onToggle, className }: { open: boolean; label: string; onToggle: () => void; className?: string }) {
  return (
    <button
      type="button"
      aria-label={`${open ? "Hide" : "Show"} the text in ${label}`}
      aria-expanded={open}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn("grid size-6 shrink-0 place-items-center rounded-[6px] text-subtle transition-colors hover:bg-fg/[0.07] hover:text-fg active:bg-fg/[0.1]", className)}
    >
      <CaretRightIcon size={10} weight="bold" className={cn("transition-transform duration-200 ease-out", open && "rotate-90")} />
    </button>
  );
}

/** Rows step in this far for each folder they sit in. */
const STEP = 14;

function TextRow({ layer, indent, picked, onPick, onHover }: { layer: TextLayer; indent: number; picked: boolean; onPick: () => void; onHover: (l: TextLayer | null) => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  // Picked on the canvas: the row comes into view here too.
  useEffect(() => {
    if (picked) ref.current?.scrollIntoView({ block: "nearest" });
  }, [picked]);
  const Icon = ROLE_ICON[layer.role];
  const what = layer.live ? "changes on its own" : layer.hidden ? "hidden at this width" : layer.edited ? "edited" : null;
  return (
    <button
      ref={ref}
      type="button"
      data-text-layer
      aria-pressed={picked}
      aria-label={`${layer.items ? `${layer.items.length} ${ROLE_PLURAL[layer.role].toLowerCase()}` : ROLE_LABEL[layer.role]}: ${layer.name}${what ? `, ${what}` : ""}`}
      title={layer.name}
      onClick={onPick}
      onPointerEnter={() => onHover(layer)}
      onPointerLeave={() => onHover(null)}
      className={cn("group/text flex h-8 w-full items-center gap-2 rounded-[8px] pr-2 text-left text-[13px] transition-colors", picked ? "bg-fg/[0.08] text-fg" : "text-fg/85 hover:bg-fg/[0.04] hover:text-fg", layer.hidden && !picked && "text-fg/45")}
      style={{ paddingLeft: indent }}
    >
      <Icon size={14} weight={picked ? "bold" : "regular"} className={cn("shrink-0", picked ? "text-[#0d99ff]" : "text-subtle")} />
      <span className="min-w-0 flex-1 truncate">{layer.name}</span>
      {layer.items && <span className="shrink-0 text-[12px] tabular-nums text-subtle">{layer.items.length}</span>}
      {layer.edited && <span aria-hidden title="Edited" className="size-1.5 shrink-0 rounded-full bg-[#0d99ff]" />}
      {layer.live && <LockSimpleIcon aria-hidden size={12} className="shrink-0 text-subtle" />}
      {layer.hidden && <EyeSlashIcon aria-hidden size={12} className="shrink-0 text-subtle" />}
    </button>
  );
}

function FolderRow({ name, hint, kind, count, indent, open, onToggle }: { name: string; hint: string; kind: FolderKind; count: number; indent: number; open: boolean; onToggle: () => void }) {
  const Icon = FOLDER_ICON[kind];
  return (
    <button type="button" aria-expanded={open} aria-label={`${name}, ${count} layers: ${hint}`} onClick={onToggle} className="flex h-8 w-full items-center gap-2 rounded-[8px] pr-2 text-left text-[13px] transition-colors hover:bg-fg/[0.04] active:bg-fg/[0.07]" style={{ paddingLeft: indent - 18 }}>
      <CaretRightIcon size={10} weight="bold" className={cn("shrink-0 text-subtle transition-transform duration-200 ease-out", open && "rotate-90")} />
      <Icon size={14} className="shrink-0 text-subtle" />
      <span className="shrink-0 font-medium text-fg/85">{name}</span>
      <span className="min-w-0 flex-1 truncate text-subtle">{hint}</span>
      <span className="shrink-0 text-[12px] tabular-nums text-subtle">{count}</span>
    </button>
  );
}

/** One section's (or block's) text layers, their icons lined up under the row's own (`indent` in). */
export function TextLayers({ layerKey, tree, indent }: { layerKey: string; tree: TextTree; indent: number }) {
  const layers = tree.layers[layerKey];
  // Folders start open (a busy one closed); one opened or closed here stays so, and what's picked is always shown.
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const picked = tree.picked?.key === layerKey ? tree.picked.id : null;
  const opened = new Set(picked && layers ? (foldersTo(layers, picked) ?? []) : []);
  if (!layers) return <p className="py-1.5 text-[13px] text-subtle" style={{ paddingLeft: indent }}>Reading the text…</p>;
  if (!layers.length) return <p className="py-1.5 text-[13px] text-subtle" style={{ paddingLeft: indent }}>No text in this one.</p>;
  const rows = (list: Layer[], depth: number): ReactNode => {
    // Three or more cards alike side by side (plans, testimonials) start closed: their names are enough to find one.
    const alike = new Map<string, number>();
    for (const l of list) if (l.type === "folder") alike.set(l.kind, (alike.get(l.kind) ?? 0) + 1);
    return list.map((l) => {
      if (l.type === "text")
        return (
          <li key={l.id} className="list-none">
            <TextRow layer={l} indent={indent + depth * STEP} picked={picked === l.id} onPick={() => tree.onPick(layerKey, l)} onHover={tree.onHover} />
          </li>
        );
      const open = (toggled[l.id] ?? (l.kind !== "hidden" && l.count <= BUSY && (alike.get(l.kind) ?? 0) < 3)) || opened.has(l.id);
      return (
        <li key={l.id} className="list-none">
          <FolderRow name={l.name} hint={l.hint} kind={l.kind} count={l.count} indent={indent + depth * STEP} open={open} onToggle={() => setToggled((t) => ({ ...t, [l.id]: !open }))} />
          <Fold open={open}>
            <ul className="space-y-px pt-px">{rows(l.children, depth + 1)}</ul>
          </Fold>
        </li>
      );
    });
  };
  return (
    <ul role="group" aria-label="Text layers" className="space-y-px pb-1 pt-0.5">
      {rows(layers, 0)}
    </ul>
  );
}
