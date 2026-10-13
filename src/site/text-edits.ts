/*
 * Text you change in Studio. The templates' code stays as written; an edit says "in this section,
 * the nth piece of text that reads X now reads Y", and is laid over the page wherever it's drawn:
 * the canvas, every breakpoint, and the hidden frames copies are made from. Only a text node's
 * characters change, never the elements around it, so the template's own code never notices.
 */

export interface TextEdit {
  /** A section's layer key on a page made of sections, or "route:/path" for a template page. */
  scope: string;
  /** The text as the template wrote it, trimmed. */
  from: string;
  /** Which of the scope's pieces of text that read `from` (0 for the first). */
  nth: number;
  to: string;
}

type Marked = Text & { bdFrom?: string };

/** The text a node had before any edit, trimmed. */
export const original = (n: Text) => (n as Marked).bdFrom ?? n.data.trim();

/** Every piece of visible text under `root`, in reading order, and any an edit has emptied (so it can come back). */
export function textsIn(root: Node): Text[] {
  const doc = root.ownerDocument ?? (root as Document);
  const walk = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      const p = n.parentElement;
      if ((!(n as Text).data.trim() && (n as Marked).bdFrom === undefined) || !p || p.closest("script,style,noscript,title")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const out: Text[] = [];
  for (let n = walk.nextNode(); n; n = walk.nextNode()) out.push(n as Text);
  return out;
}

/** Where a piece of text sits among the scope's texts that read the same. */
export function addressOf(node: Text, root: Node) {
  const from = original(node);
  const nth = textsIn(root)
    .filter((t) => original(t) === from)
    .indexOf(node);
  return { from, nth: Math.max(0, nth) };
}

/** Sets a text node's characters, keeping its leading and trailing space. */
export function setText(node: Text, to: string) {
  const m = node as Marked;
  m.bdFrom ??= node.data.trim();
  const [, lead, , trail] = node.data.match(/^(\s*)([\s\S]*?)(\s*)$/) ?? [];
  const next = `${lead ?? ""}${to}${trail ?? ""}`;
  if (node.data !== next) node.data = next;
}

/** The element a scope's texts live in. */
export function scopeRoot(doc: Document, scope: string): Element | null {
  if (scope.startsWith("route:")) return doc.querySelector("main") ?? doc.body;
  return doc.querySelector(`[data-bd-key="${CSS.escape(scope)}"]`);
}

/** Lays every edit over the page. Safe to run again and again: it only ever sets characters. */
export function applyEdits(doc: Document, edits: TextEdit[], remap?: (scope: string) => string) {
  const byScope = new Map<string, TextEdit[]>();
  for (const e of edits) {
    const s = remap ? remap(e.scope) : e.scope;
    byScope.set(s, [...(byScope.get(s) ?? []), e]);
  }
  for (const [scope, list] of byScope) {
    const root = scopeRoot(doc, scope);
    if (!root) continue;
    const texts = textsIn(root);
    for (const e of list) {
      const node = texts.filter((t) => original(t) === e.from)[e.nth];
      if (node) setText(node, e.to);
    }
  }
}

/** Adds or replaces one edit; an edit back to the original text removes it. */
export function withEdit(edits: TextEdit[], e: TextEdit): TextEdit[] {
  const rest = edits.filter((x) => !(x.scope === e.scope && x.from === e.from && x.nth === e.nth));
  return e.to.trim() === e.from ? rest : [...rest, { ...e, to: e.to.trim() }];
}
