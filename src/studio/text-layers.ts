import type { PageText, TextRef } from "./canvas";
import { FOLDER_LABEL, type FolderKind, type TextRole } from "./text-roles";

/*
 * A section's words as layers, the way Figma lists a frame's: one layer per piece of copy, named
 * by what it says, in the folders that hold it on the page (a card, a callout, a list). A headline
 * set in two lines, or a sentence with a word in bold, is one layer with a part per line.
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
}

export interface FolderLayer {
  type: "folder";
  id: string;
  kind: FolderKind;
  name: string;
  /** The words of its first layer, so two cards side by side can be told apart. */
  hint: string;
  children: Layer[];
}

export type Layer = TextLayer | FolderLayer;

export const refId = (t: TextRef) => `${t.from}|${t.nth}`;

/** The roles a layer that mixes several takes its name from, strongest first. */
const STRONG: TextRole[] = ["headline", "heading", "button", "link", "quote", "paragraph"];

function textLayer(parts: PageText[]): TextLayer {
  const roles = new Set(parts.map((p) => p.role));
  const role = roles.size === 1 ? parts[0].role : (STRONG.find((r) => roles.has(r)) ?? "text");
  return {
    type: "text",
    id: refId(parts[0]),
    role,
    parts,
    name: parts.map((p, i) => (i && p.space ? ` ${p.text}` : p.text)).join("").replace(/\s+/g, " "),
    live: parts.some((p) => p.live),
    hidden: parts.every((p) => p.hidden),
    edited: parts.some((p) => (p.kind === "image" ? p.swapped : p.text !== p.from)),
  };
}

/** A folder that holds a single layer is that layer: the folder would only be in the way. */
function flatten(layers: Layer[]): Layer[] {
  return layers.flatMap((l) => {
    if (l.type === "text") return [l];
    const children = flatten(l.children);
    if (!children.length) return [];
    if (children.length === 1) return children;
    const first = firstText(children);
    return [{ ...l, children, hint: first?.name ?? "" }];
  });
}

function firstText(layers: Layer[]): TextLayer | undefined {
  for (const l of layers) {
    const t = l.type === "text" ? l : firstText(l.children);
    if (t) return t;
  }
}

export function layersOf(texts: PageText[]): Layer[] {
  // Pieces of one element next to each other make one layer.
  const runs: PageText[][] = [];
  for (const t of texts) {
    const last = runs.at(-1);
    if (last && last[0].group === t.group) last.push(t);
    else runs.push([t]);
  }
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
      const folder: FolderLayer = { type: "folder", id: `folder:${f.id}`, kind: f.kind, name: FOLDER_LABEL[f.kind], hint: "", children: [] };
      (open.at(-1)?.layer.children ?? top).push(folder);
      open.push({ id: f.id, layer: folder });
    }
    (open.at(-1)?.layer.children ?? top).push(layer);
  }
  const out = flatten(top);
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
