/*
 * What a piece of text on a template's page is, so its layer can be named: the headline, a
 * paragraph, a button, a link, a label, a figure. Read from the page itself: the element the text
 * sits in first (an h1 is a headline, a button is a button), then how it looks (a link dressed
 * as a button is a button; small print is a label), then what it says (a price or a percentage
 * is a figure, "Jun 2021" is a date). And what holds it, as Figma's frames would: a card, a
 * callout pinned over a chart, a list, a form.
 */

export type TextRole = "headline" | "heading" | "paragraph" | "quote" | "item" | "text" | "button" | "link" | "label" | "number" | "date" | "code" | "image";

export type FolderKind = "card" | "callout" | "chart" | "list" | "group" | "form" | "menu";

/** The elements that make one piece of copy out of the text inside them. */
const OWNER = "h1,h2,h3,h4,h5,h6,p,button,a,li,label,dt,dd,blockquote,q,figcaption,th,td,summary,legend,[role=button]";

const NUMBER = /^[\s$€£¥+−–-]*\d[\d.,\s]*(%|[kKmMbB]\b|x\b|ms\b|s\b)?[\s+]*$/;
const DATE = /^((jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(,\s*\d{4})?|(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|(mon|tue|wed|thu|fri|sat|sun)[a-z]*\s+\d{1,2}:\d{2})$/i;

/** Styles from the element's own window: the page lives in a frame. */
const styleOf = (el: Element) => (el.ownerDocument.defaultView ?? window).getComputedStyle(el);

/** Whether a link is drawn as a button: a fill of its own, or a border, with room around its words. */
function looksLikeButton(el: Element) {
  const cs = styleOf(el);
  const filled = cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent";
  const bordered = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none";
  const padded = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) >= 8 && parseFloat(cs.paddingLeft) >= 10;
  return (filled || bordered) && padded;
}

/** The nearest element that starts a line of its own: the words in it, styled in pieces, read as one. */
function lineOf(el: Element) {
  let p: Element = el;
  while (p.parentElement && ["inline", "contents"].includes(styleOf(p).display)) p = p.parentElement;
  return p;
}

export function roleOf(node: Text): { role: TextRole; owner: Element } {
  const el = node.parentElement!;
  const copy = el.closest(OWNER);
  // A line of code drawn token by token is one line of code; a word of code in a sentence is the sentence's.
  const code = el.closest("pre,code");
  if (code && !copy?.contains(code)) return { role: "code", owner: code.tagName === "PRE" ? lineOf(el) : code };
  const owner = copy ?? lineOf(el);
  const tag = owner.tagName.toLowerCase();
  const words = node.data.trim();
  const size = parseFloat(styleOf(el).fontSize) || 16;
  if (tag === "h1" || tag === "h2") return { role: "headline", owner };
  if (/^h[3-6]$/.test(tag)) return { role: "heading", owner };
  if (tag === "button" || owner.getAttribute("role") === "button") return { role: "button", owner };
  if (tag === "a") return { role: looksLikeButton(owner) ? "button" : "link", owner };
  if (DATE.test(words)) return { role: "date", owner };
  if (NUMBER.test(words)) return { role: "number", owner };
  if (tag === "blockquote" || tag === "q") return { role: "quote", owner };
  if (tag === "li") return { role: "item", owner };
  if (tag === "label" || tag === "dt" || tag === "th" || tag === "legend" || tag === "figcaption") return { role: "label", owner };
  // Big type that isn't marked as a heading still reads as one; small type is a label.
  if (size >= 30) return { role: "headline", owner };
  if (size >= 22) return { role: "heading", owner };
  if (tag === "p") return { role: size <= 13 ? "label" : "paragraph", owner };
  if (size <= 13.5) return { role: "label", owner };
  // A few words that don't make a sentence are a label ("Maya's portfolio · live").
  if (words.split(/\s+/).length <= 6 && words.length < 40 && !/[.!?]$/.test(words)) return { role: "label", owner };
  return { role: words.length > 60 ? "paragraph" : "text", owner };
}

export const ROLE_LABEL: Record<TextRole, string> = {
  headline: "Headline",
  heading: "Heading",
  paragraph: "Paragraph",
  quote: "Quote",
  item: "List item",
  text: "Text",
  button: "Button",
  link: "Link",
  label: "Label",
  number: "Figure",
  date: "Date",
  code: "Code",
  image: "Image",
};

/* ---------- what holds it ---------- */

const CLEAR = new Set(["rgba(0, 0, 0, 0)", "transparent"]);

/** An element that's a piece of copy itself, or too small to hold any: never a folder. */
const NOT_A_FOLDER = "label,p,h1,h2,h3,h4,h5,h6,dt,dd,th,td,span,em,strong,b,i,small,svg";

/** The box a section is drawn in: its wrapper may draw no box of its own (display: contents). */
export function sectionBox(root: Element) {
  const r = root.getBoundingClientRect();
  if (r.width && r.height) return r;
  const kids = [...root.children].map((c) => c.getBoundingClientRect()).filter((b) => b.width && b.height);
  if (!kids.length) return r;
  const top = Math.min(...kids.map((b) => b.top));
  const left = Math.min(...kids.map((b) => b.left));
  return new DOMRect(left, top, Math.max(...kids.map((b) => b.right)) - left, Math.max(...kids.map((b) => b.bottom)) - top);
}

/** Whether a big drawing (a canvas, or an svg) fills a good part of an element. A canvas printing a photo is a picture, not a chart. */
function drawn(el: Element, r: DOMRect, share: number) {
  return [...el.querySelectorAll("canvas:not([data-bd-src]), svg")].some((a) => {
    const b = a.getBoundingClientRect();
    return b.width >= 120 && b.height >= 80 && b.width * b.height > r.width * r.height * share;
  });
}

/** One of three or more siblings drawn alike in a row or a grid: a stat, a feature, a column. */
function repeated(el: Element) {
  const parent = el.parentElement;
  if (!parent || parent.children.length < 3 || !el.className || typeof el.className !== "string") return false;
  const d = styleOf(parent).display;
  if (!d.includes("grid") && !d.includes("flex")) return false;
  return [...parent.children].filter((c) => c.tagName === el.tagName && c.className === el.className).length >= 3;
}

/**
 * What an element is, if it's one of the things a designer would draw as a frame around some
 * copy: a card (a fill, a border or a shadow, narrower than the section), a callout (a small box
 * pinned over something), a chart (an area that's mostly a drawing), a list of three or more, one
 * of a row of things drawn alike, a form or a menu. The section's own background, a band across
 * it, is none of these.
 */
function folderKind(el: Element, root: Element, all: DOMRect): FolderKind | null {
  if (el.matches(NOT_A_FOLDER)) return null;
  // A link or a button is copy, unless it's a whole card that links somewhere.
  if (el.matches("a,button,[role=button]") && !el.querySelector("h1,h2,h3,h4,h5,h6,p")) return null;
  const tag = el.tagName.toLowerCase();
  if (tag === "form") return "form";
  if (tag === "nav") return "menu";
  if (tag === "ul" || tag === "ol") return el.children.length >= 3 ? "list" : null;
  const cs = styleOf(el);
  if (cs.display === "contents") return null;
  const r = el.getBoundingClientRect();
  if (r.width < 64 || r.height < 36) return null;
  if (cs.position === "absolute" || cs.position === "fixed") return r.width < all.width * 0.6 && r.height < all.height * 0.6 ? "callout" : null;
  const filled = !CLEAR.has(cs.backgroundColor) || cs.backgroundImage !== "none";
  const bordered = ["Top", "Right", "Bottom", "Left"].filter((s) => parseFloat(cs.getPropertyValue(`border-${s.toLowerCase()}-width`)) > 0 && cs.getPropertyValue(`border-${s.toLowerCase()}-style`) !== "none").length >= 3;
  const shadowed = cs.boxShadow !== "none";
  if (!filled && !bordered && !shadowed) {
    // An area that's mostly a drawing, short of the whole section (a background scene), is a chart.
    if (r.height < all.height * 0.8 && drawn(el, r, 0.4)) return "chart";
    return repeated(el) ? "group" : null;
  }
  // A band as wide as the section is its background, not a card on it.
  if (r.width > all.width * 0.92) return null;
  return drawn(el, r, 0.25) ? "chart" : "card";
}

/**
 * The folders a piece of text sits in, outermost first, below the section: at most two deep, as
 * deeper nesting reads as noise in a list of layers. `seen` keeps each element's answer for the
 * rest of the section.
 */
export function foldersOf(node: Node, root: Element, seen: Map<Element, FolderKind | null>, all: DOMRect = sectionBox(root)): Array<{ el: Element; kind: FolderKind }> {
  const found: Array<{ el: Element; kind: FolderKind }> = [];
  for (let p = node.parentElement; p && p !== root && root.contains(p); p = p.parentElement) {
    if (!seen.has(p)) seen.set(p, folderKind(p, root, all));
    const kind = seen.get(p);
    if (kind) found.unshift({ el: p, kind });
  }
  // A box drawn inside a box of the same size (a callout's card in its pinned holder) is one folder.
  const out: typeof found = [];
  for (const f of found) {
    const last = out.at(-1)?.el.getBoundingClientRect();
    const b = f.el.getBoundingClientRect();
    if (last && Math.abs(last.width - b.width) < 3 && Math.abs(last.height - b.height) < 3) continue;
    out.push(f);
  }
  return out.slice(0, 2);
}

export const FOLDER_LABEL: Record<FolderKind, string> = {
  card: "Card",
  callout: "Callout",
  chart: "Chart",
  list: "List",
  group: "Group",
  form: "Form",
  menu: "Menu",
};
