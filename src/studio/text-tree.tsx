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
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { IconType } from "@/site/icons";
import { foldersTo, type Layer, type TextLayer } from "./text-layers";
import { ROLE_LABEL, type FolderKind, type TextRole } from "./text-roles";

/*
 * A section's text layers under its row in Layers, as Figma lists a frame's: an icon for what each
 * one is, its words as its name, and the cards and callouts that hold them as folders.
 */

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
      className={cn("grid size-5 shrink-0 place-items-center rounded-[5px] text-subtle transition-colors hover:bg-fg/[0.06] hover:text-fg", className)}
    >
      <CaretRightIcon size={10} weight="bold" className={cn("transition-transform duration-150", open && "rotate-90")} />
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
      aria-label={`${ROLE_LABEL[layer.role]}: ${layer.name}${what ? `, ${what}` : ""}`}
      title={layer.name}
      onClick={onPick}
      onPointerEnter={() => onHover(layer)}
      onPointerLeave={() => onHover(null)}
      className={cn("group/text flex h-8 w-full items-center gap-2 rounded-[8px] pr-2 text-left text-[13px] transition-colors", picked ? "bg-fg/[0.08] text-fg" : "text-fg/85 hover:bg-fg/[0.04] hover:text-fg", layer.hidden && !picked && "text-fg/45")}
      style={{ paddingLeft: indent }}
    >
      <Icon size={14} weight={picked ? "bold" : "regular"} className={cn("shrink-0", picked ? "text-[#0d99ff]" : "text-subtle")} />
      <span className="min-w-0 flex-1 truncate">{layer.name}</span>
      {layer.edited && <span aria-hidden title="Edited" className="size-1.5 shrink-0 rounded-full bg-[#0d99ff]" />}
      {layer.live && <LockSimpleIcon aria-hidden size={12} className="shrink-0 text-subtle" />}
      {layer.hidden && <EyeSlashIcon aria-hidden size={12} className="shrink-0 text-subtle" />}
    </button>
  );
}

function FolderRow({ name, hint, kind, indent, open, onToggle }: { name: string; hint: string; kind: FolderKind; indent: number; open: boolean; onToggle: () => void }) {
  const Icon = FOLDER_ICON[kind];
  return (
    <button type="button" aria-expanded={open} onClick={onToggle} className="flex h-8 w-full items-center gap-2 rounded-[8px] pr-2 text-left text-[13px] transition-colors hover:bg-fg/[0.04]" style={{ paddingLeft: indent - 18 }}>
      <CaretRightIcon size={10} weight="bold" className={cn("shrink-0 text-subtle transition-transform duration-150", open && "rotate-90")} />
      <Icon size={14} className="shrink-0 text-subtle" />
      <span className="shrink-0 font-medium text-fg/85">{name}</span>
      <span className="min-w-0 flex-1 truncate text-subtle">{hint}</span>
    </button>
  );
}

/** One section's (or block's) text layers, their icons lined up under the row's own (`indent` in). */
export function TextLayers({ layerKey, tree, indent }: { layerKey: string; tree: TextTree; indent: number }) {
  const layers = tree.layers[layerKey];
  // Folders start open; the ones closed here stay closed, unless what's picked is inside.
  const [closed, setClosed] = useState<Set<string>>(() => new Set());
  const picked = tree.picked?.key === layerKey ? tree.picked.id : null;
  const opened = new Set(picked && layers ? (foldersTo(layers, picked) ?? []) : []);
  if (!layers) return <p className="py-1.5 text-[13px] text-subtle" style={{ paddingLeft: indent }}>Reading the text…</p>;
  if (!layers.length) return <p className="py-1.5 text-[13px] text-subtle" style={{ paddingLeft: indent }}>No text in this one.</p>;
  const rows = (list: Layer[], depth: number): ReactNode =>
    list.map((l) => {
      if (l.type === "text")
        return (
          <li key={l.id} className="list-none">
            <TextRow layer={l} indent={indent + depth * STEP} picked={picked === l.id} onPick={() => tree.onPick(layerKey, l)} onHover={tree.onHover} />
          </li>
        );
      const open = !closed.has(l.id) || opened.has(l.id);
      return (
        <li key={l.id} className="list-none">
          <FolderRow
            name={l.name}
            hint={l.hint}
            kind={l.kind}
            indent={indent + depth * STEP}
            open={open}
            onToggle={() =>
              setClosed((s) => {
                const next = new Set(s);
                if (open) next.add(l.id);
                else next.delete(l.id);
                return next;
              })
            }
          />
          {open && <ul className="space-y-px">{rows(l.children, depth + 1)}</ul>}
        </li>
      );
    });
  return (
    <ul role="group" aria-label="Text layers" className="space-y-px pb-1 pt-0.5">
      {rows(layers, 0)}
    </ul>
  );
}
