import type { PageText, TextRef } from "./canvas";
import { FOLDER_LABEL, type FolderKind, type TextRole } from "./text-roles";

/*
 * A section's words as layers, the way Figma lists a frame's: one layer per piece of copy, named
 * by what it says, in the folders that hold it on the page (a card, a callout, a list). A headline
 * set in two lines, or a sentence with a word in bold, is one layer with a part per line. Short
 * pieces side by side (a menu's links, a row of buttons, a list of labels) are one layer too, a
 * set, with a field for each, so a section reads as a handful of layers, not dozens.
 */

export interface TextLayer {
  type: "text";
  /** Its first part's address: unique in its section. */
  id: string;
  role: TextRole;
  parts: PageText[];
  /** What it says, all its parts together. */
  name: string;
  live: boolean;
  hidden: boolean;
  edited: boolean;
  /** Where it sits beside its likes (see PageText.row). */
  row: number;
  /** A set: the short pieces side by side it's made of, each its own piece of copy. */
  items?: TextLayer[];
}

export interface FolderLayer {
  type: "folder";
  id: string;
  kind: FolderKind;
  name: string;
  /** The words of its first layer, so two cards side by side can be told apart. */
  hint: string;
  children: Layer[];
  /** How many text layers are inside, folders opened. */
  count: number;
}

export type Layer = TextLayer | FolderLayer;

export const refId = (t: TextRef) => `${t.from}|${t.nth}`;

/** Words in `n` places: one each, the last taking any more; places left over are emptied (a headline set word by word). */
export const spread = (v: string, n: number) => {
  const words = v.trim().split(/\s+/).filter(Boolean);
  return Array.from({ length: n }, (_, i) => (i < n - 1 ? (words[i] ?? "") : words.slice(n - 1).join(" ")));
};

/** Kinds that sit together in one set: buttons with links, small print with small print. */
const KIN: Record<string, string> = { button: "action", link: "action", label: "note", text: "note", number: "note", date: "note", item: "item", code: "code" };

/** The roles a layer that mixes several takes its name from, strongest first. */
const STRONG: TextRole[] = ["headline", "heading", "button", "link", "quote", "paragraph"];

/** What can be one of a set: short copy that sits in a row or a list. Headings and sentences stay their own. */
const SETS = new Set<TextRole>(["label", "button", "link", "item", "code", "number", "date", "text"]);
const SHORT = 48;

const named = (parts: PageText[]) => parts.map((p, i) => (i && p.space ? ` ${p.text}` : p.text)).join("").replace(/\s+/g, " ");

function textLayer(parts: PageText[]): TextLayer {
  const roles = new Set(parts.map((p) => p.role));
  const role = roles.size === 1 ? parts[0].role : (STRONG.find((r) => roles.has(r)) ?? "text");
  return {
    type: "text",
    id: refId(parts[0]),
    role,
    parts,
    name: named(parts),
    live: parts.some((p) => p.live),
    hidden: parts.every((p) => p.hidden),
    edited: parts.some((p) => (p.kind === "image" ? p.swapped : p.text !== p.from)),
    row: parts[0].row,
  };
}

const settable = (l: TextLayer) => SETS.has(l.role) && !l.live && l.parts[0].kind !== "image" && l.name.length <= SHORT && l.row >= 0;
const together = (a: TextLayer, b: TextLayer) => settable(a) && settable(b) && a.row === b.row && KIN[a.role] === KIN[b.role];

/** Two short pieces side by side, made one set (or the set grown by one). */
function joined(a: TextLayer, b: TextLayer): TextLayer {
  const items = [...(a.items ?? [a]), b];
  const roles = new Set(items.map((i) => i.role));
  // A mix of one kind is named for the kind: a link beside a button is one of a row of buttons.
  const kind = KIN[a.role];
  return {
    ...a,
    role: roles.size === 1 ? a.role : kind === "action" ? "button" : kind === "note" ? "label" : "text",
    parts: [...a.parts, ...b.parts],
    name: items.map((i) => i.name).join(", "),
    live: false,
    hidden: a.hidden && b.hidden,
    edited: a.edited || b.edited,
    items,
  };
}

const countOf = (layers: Layer[]): number => layers.reduce((n, l) => n + (l.type === "text" ? 1 : l.count), 0);

/**
 * A folder that holds a single layer is that layer: the folder would only be in the way. A card
 * whose content is nearly all one card inside it (a window and its pane) is the one card.
 */
function flatten(layers: Layer[]): Layer[] {
  return layers.flatMap((l): Layer[] => {
    if (l.type === "text") return [l];
    let children = flatten(l.children);
    const inner = children.filter((c): c is FolderLayer => c.type === "folder");
    const total = countOf(children);
    if (inner.length === 1 && inner[0].kind === l.kind && inner[0].count >= total * 0.6) children = children.flatMap((c) => (c === inner[0] ? c.children : [c]));
    if (!children.length) return [];
    if (children.length === 1) return children;
    // Named for its heading, if it has one ("Background agents"), else its first words.
    const texts = textLayersIn(children);
    const title = texts.find((t) => t.role === "headline" || t.role === "heading") ?? texts[0];
    return [{ ...l, children, count: countOf(children), hint: title?.name ?? "" }];
  });
}

function firstText(layers: Layer[]): TextLayer | undefined {
  for (const l of layers) {
    const t = l.type === "text" ? l : firstText(l.children);
    if (t) return t;
  }
}

/** A quote mark, a dash or an arrow on its own: part of how copy is set, not copy anyone writes. */
const mark = (t: PageText) => t.kind !== "image" && !/[\p{L}\p{N}]/u.test(t.text) && t.text.length <= 2;

export function layersOf(texts: PageText[]): Layer[] {
  // Pieces of one element next to each other make one layer; lone marks around the words stay out of it.
  const runs: PageText[][] = [];
  for (const t of texts) {
    const last = runs.at(-1);
    if (last && last[0].group === t.group) last.push(t);
    else runs.push([t]);
  }
  for (let i = 0; i < runs.length; i++) if (runs[i].some((t) => !mark(t))) runs[i] = runs[i].filter((t) => !mark(t));
  const top: Layer[] = [];
  // The folders open around the layer being placed, outermost first.
  const open: Array<{ id: number; layer: FolderLayer }> = [];
  for (const run of runs) {
    const layer = textLayer(run);
    // A lone digit or symbol is a piece of a counter or an icon, not copy anyone writes.
    if (!/\p{L}/u.test(layer.name) && layer.name.length <= 2) continue;
    const path = run[0].folders;
    let same = 0;
    while (same < open.length && same < path.length && open[same].id === path[same].id) same++;
    open.length = same;
    for (const f of path.slice(same)) {
      const folder: FolderLayer = { type: "folder", id: `folder:${f.id}`, kind: f.kind, name: FOLDER_LABEL[f.kind], hint: "", children: [], count: 0 };
      (open.at(-1)?.layer.children ?? top).push(folder);
      open.push({ id: f.id, layer: folder });
    }
    const into = open.at(-1)?.layer.children ?? top;
    const prev = into.at(-1);
    // Beside the last short piece in the same row or list: one set with it.
    if (prev?.type === "text" && together(prev, layer)) into[into.length - 1] = joined(prev, layer);
    else into.push(layer);
  }
  // Copy only drawn at other widths (a phone's version of the same section) waits in one folder at the end.
  const hidden: Layer[] = [];
  const keep = (list: Layer[]): Layer[] =>
    list.flatMap((l): Layer[] => {
      if (l.type === "text") {
        if (l.hidden && l.parts[0].kind !== "image") return hidden.push(l), [];
        return [l];
      }
      return [{ ...l, children: keep(l.children) }];
    });
  const shown = keep(top);
  if (hidden.length > 1) shown.push({ type: "folder", id: "folder:hidden", kind: "hidden", name: FOLDER_LABEL.hidden, hint: "", children: hidden, count: hidden.length });
  else shown.push(...hidden);
  const out = flatten(shown);
  // A section that's all one card (a menu, a banner) lists what's in it.
  return out.length === 1 && out[0].type === "folder" ? out[0].children : out;
}

/** Every text layer, folders opened, in order. */
export function textLayersIn(layers: Layer[]): TextLayer[] {
  return layers.flatMap((l) => (l.type === "text" ? [l] : textLayersIn(l.children)));
}

/** The layer a piece of text is part of. */
export function layerWith(layers: Layer[], t: TextRef): TextLayer | undefined {
  const id = refId(t);
  return textLayersIn(layers).find((l) => l.parts.some((p) => refId(p) === id));
}

/** The folders on the way to a layer, so they can be opened to show it. */
export function foldersTo(layers: Layer[], id: string, path: string[] = []): string[] | null {
  for (const l of layers) {
    if (l.type === "text") {
      if (l.id === id) return path;
    } else {
      const found = foldersTo(l.children, id, [...path, l.id]);
      if (found) return found;
    }
  }
  return null;
}
