import { templateOf, TEMPLATES, type TemplateSlug } from "@/site/live";
import { withEdit, type TextEdit } from "@/site/text-edits";
import { checkedImages, type Images } from "@/site/images";
import { checkedTheme, SLOTS, type Theme } from "@/site/theme";

/*
 * A Studio project is one template's site. It has pages you build from the template's sections
 * (its home page to start with, and any you add), and it shows the template's own other pages
 * too, as they are. Text you change on any of them is kept as edits laid over the template, so
 * the template's code always stays exactly as written.
 *
 * A page made of sections lists them as "id:instance", so a section can appear twice and still be
 * its own layer.
 */
export interface Page {
  template: TemplateSlug;
  name: string;
  keys: string[];
}

/** A page you build from sections, with its own address on the site. */
export interface SitePage extends Page {
  id: string;
  path: string;
}

export interface Project {
  template: TemplateSlug;
  name: string;
  pages: SitePage[];
  edits: TextEdit[];
  /** Colors, type and corners changed from the template's own (see site/theme). */
  theme?: Theme;
  /** Images put in place of the template's own files (see site/images). */
  images?: Images;
}

/** What the canvas shows: one of your pages, or one of the template's own. */
export type View = { kind: "page"; id: string } | { kind: "route"; path: string };

export interface StudioState {
  project: Project;
  view: View;
  /** The selected layer's key. */
  selected: string | null;
  past: Project[];
  future: Project[];
}

export type Action =
  | { type: "change"; project: Project }
  | { type: "replace"; project: Project }
  /** The same edit, still going (dragging a color): it changes the last undo step instead of adding one. */
  | { type: "amend"; project: Project }
  /** Another project opened (from the Library, a link, or your account): a fresh start, no undo back. */
  | { type: "load"; project: Project }
  /** Someone else's save, merged in: no undo step of its own, and undo never takes it back out. */
  | { type: "sync"; project: Project }
  | { type: "view"; view: View }
  | { type: "select"; key: string | null }
  | { type: "undo" }
  | { type: "redo" };

const LIMIT = 80;

/** The page being shown, if it's one made of sections. */
export const pageOf = (p: Project, v: View) => (v.kind === "page" ? (p.pages.find((x) => x.id === v.id) ?? null) : null);

/** Keeps the view on something that exists after a change (an undo can remove a page). */
function keepView(p: Project, v: View): View {
  if (v.kind === "route" || p.pages.some((x) => x.id === v.id)) return v;
  return { kind: "page", id: p.pages[0].id };
}

function keepSelection(p: Project, v: View, key: string | null) {
  const page = pageOf(p, v);
  return page && key && page.keys.includes(key) ? key : null;
}

export function reducer(s: StudioState, a: Action): StudioState {
  switch (a.type) {
    case "change": {
      const view = keepView(a.project, s.view);
      return { ...s, project: a.project, view, past: [...s.past, s.project].slice(-LIMIT), future: [], selected: keepSelection(a.project, view, s.selected) };
    }
    case "replace": {
      const view: View = { kind: "page", id: a.project.pages[0].id };
      const keys = a.project.pages[0].keys;
      return { ...s, project: a.project, view, past: [...s.past, s.project].slice(-LIMIT), future: [], selected: keys[1] ?? keys[0] ?? null };
    }
    case "amend":
      return { ...s, project: a.project, future: [] };
    case "load": {
      const view = keepView(a.project, s.view);
      return { ...s, project: a.project, view, past: [], future: [], selected: keepSelection(a.project, view, s.selected) };
    }
    case "sync": {
      // Every undo step is rebased onto their change, so undoing yours leaves theirs in place.
      const rebase = (p: Project) => merge3(s.project, p, a.project);
      const view = keepView(a.project, s.view);
      return { ...s, project: a.project, view, past: s.past.map(rebase), future: s.future.map(rebase), selected: keepSelection(a.project, view, s.selected) };
    }
    case "view":
      return { ...s, view: a.view, selected: null };
    case "select":
      return { ...s, selected: a.key };
    case "undo": {
      const prev = s.past.at(-1);
      if (!prev) return s;
      const view = keepView(prev, s.view);
      return { ...s, project: prev, view, past: s.past.slice(0, -1), future: [s.project, ...s.future], selected: keepSelection(prev, view, s.selected) };
    }
    case "redo": {
      const next = s.future[0];
      if (!next) return s;
      const view = keepView(next, s.view);
      return { ...s, project: next, view, past: [...s.past, s.project], future: s.future.slice(1), selected: keepSelection(next, view, s.selected) };
    }
  }
}

/* ---------- merging ---------- */

const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);
const editKey = (e: TextEdit) => `${e.scope}\u0000${e.from}\u0000${e.nth}`;

/** A page's sections after both sides changed them: yours, with what they added and took out. */
function mergeKeys(base: string[], mine: string[], theirs: string[]) {
  if (same(mine, base)) return theirs;
  if (same(theirs, base)) return mine;
  const gone = new Set(base.filter((k) => !theirs.includes(k)));
  const out = mine.filter((k) => !gone.has(k));
  theirs.forEach((k, i) => {
    if (base.includes(k) || out.includes(k)) return;
    // Theirs goes in after whatever it follows on their page.
    const after = theirs.slice(0, i).reverse().find((x) => out.includes(x));
    out.splice(after ? out.indexOf(after) + 1 : 0, 0, k);
  });
  return out;
}

/**
 * Two people's changes to one project, both kept: what changed since `base` on your side wins
 * where you both changed the same thing, and everything else of theirs comes through. Pages
 * and text edits merge one by one, so editing different pages or different words never clashes.
 */
export function merge3(base: Project, mine: Project, theirs: Project): Project {
  if (same(mine, base)) return theirs;
  if (same(theirs, base)) return mine;
  // Starting over from another template replaces everything; the later start wins.
  if (theirs.template !== base.template) return theirs;
  if (mine.template !== base.template) return mine;
  const pick = <T,>(b: T, m: T, t: T) => (same(m, b) ? t : m);

  const byId = (p: Project) => new Map(p.pages.map((x) => [x.id, x]));
  const B = byId(base);
  const M = byId(mine);
  const T = byId(theirs);
  const ids = (p: Project) => p.pages.map((x) => x.id);
  const order = same(ids(mine), ids(base)) ? ids(theirs) : ids(mine);
  for (const id of [...ids(mine), ...ids(theirs)]) if (!order.includes(id)) order.push(id);
  const pages: SitePage[] = [];
  for (const id of order) {
    const b = B.get(id);
    const m = M.get(id);
    const t = T.get(id);
    // Deleted on either side stays deleted; new on either side comes in.
    if (b && (!m || !t)) continue;
    if (!b) {
      const page = m ?? t;
      if (page && !pages.some((p) => p.path === page.path)) pages.push(page);
      continue;
    }
    pages.push({ ...m!, name: pick(b.name, m!.name, t!.name), path: pick(b.path, m!.path, t!.path), keys: mergeKeys(b.keys, m!.keys, t!.keys) });
  }

  const map = (p: Project) => new Map(p.edits.map((e) => [editKey(e), e]));
  const EB = map(base);
  const EM = map(mine);
  const ET = map(theirs);
  const edits: TextEdit[] = [];
  for (const k of new Set([...EM.keys(), ...ET.keys(), ...EB.keys()])) {
    const b = EB.get(k)?.to;
    const m = EM.get(k);
    const e = m?.to !== b ? m : ET.get(k);
    if (e) edits.push(e);
  }
  // Style setting by setting (each color, in each mode): yours where you changed one, theirs otherwise.
  const theme: Theme = {};
  for (const k of SLOTS) {
    const v = pick(base.theme?.[k], mine.theme?.[k], theirs.theme?.[k]);
    if (v) theme[k] = v;
  }
  const dark: NonNullable<Theme["dark"]> = {};
  for (const k of SLOTS) {
    const v = pick(base.theme?.dark?.[k], mine.theme?.dark?.[k], theirs.theme?.dark?.[k]);
    if (v) dark[k] = v;
  }
  if (Object.keys(dark).length) theme.dark = dark;
  for (const k of ["font", "headings", "weight", "tracking", "radius"] as const) {
    const v = pick(base.theme?.[k], mine.theme?.[k], theirs.theme?.[k]);
    if (v !== undefined) (theme as Record<string, unknown>)[k] = v;
  }
  // Images file by file, the same way.
  const images: Images = {};
  for (const k of new Set([...Object.keys(mine.images ?? {}), ...Object.keys(theirs.images ?? {}), ...Object.keys(base.images ?? {})])) {
    const v = pick(base.images?.[k], mine.images?.[k], theirs.images?.[k]);
    if (v) images[k] = v;
  }
  return { template: mine.template, name: pick(base.name, mine.name, theirs.name), pages: pages.length ? pages : theirs.pages, edits, ...(Object.keys(theme).length ? { theme } : {}), ...(Object.keys(images).length ? { images } : {}) };
}

let n = 0;
/** A new layer for section id. */
export const instance = (id: string) => `${id}:${Date.now().toString(36)}${(n++).toString(36)}`;
export const idOf = (key: string) => key.split(":")[0];
const pageId = () => `p${Date.now().toString(36)}${(n++).toString(36)}`;

/** A template's home page, exactly as the template composes it. */
export function homePage(slug: TemplateSlug, name?: string): SitePage {
  const t = templateOf(slug)!;
  return { id: pageId(), path: "/", template: slug, name: name ?? "Home", keys: t.home.map(instance) };
}

/** Just the template's nav and footer, for starting a page from scratch in its look. */
export function blankPage(slug: TemplateSlug, name = "Untitled page", path = "/untitled"): SitePage {
  const t = templateOf(slug)!;
  const ends = t.sections.filter((s) => s.kind === "nav" || s.kind === "footer").map((s) => s.id);
  return { id: pageId(), path, template: slug, name, keys: ends.map(instance) };
}

/** A fresh project from a template: its home page, and its own pages beside it. */
export function newProject(slug: TemplateSlug, name?: string): Project {
  const t = templateOf(slug)!;
  return { template: slug, name: name ?? t.name, pages: [homePage(slug)], edits: [] };
}

/** A page's address, kept unique on the site and free of anything a URL can't hold. */
export function pathFor(project: Project, name: string, except?: string) {
  const t = templateOf(project.template)!;
  const base = `/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "page"}`;
  const taken = new Set([...project.pages.filter((p) => p.id !== except).map((p) => p.path), ...t.pages.map((p) => p.path)]);
  let path = base;
  for (let i = 2; taken.has(path); i++) path = `${base}-${i}`;
  return path;
}

/** A copy of a page: the same sections as new layers, its text edits carried over to them. */
export function copyPage(project: Project, page: SitePage): Project {
  const name = `${page.name} copy`;
  const map = new Map(page.keys.map((k) => [k, instance(idOf(k))]));
  const copy: SitePage = { ...page, id: pageId(), name, path: pathFor(project, name), keys: page.keys.map((k) => map.get(k)!) };
  let edits = project.edits;
  for (const e of project.edits) if (map.has(e.scope)) edits = withEdit(edits, { ...e, scope: map.get(e.scope)! });
  const at = project.pages.indexOf(page) + 1;
  return { ...project, pages: [...project.pages.slice(0, at), copy, ...project.pages.slice(at)], edits };
}

/** Replaces one page of the project. */
export const withPage = (project: Project, page: SitePage): Project => ({ ...project, pages: project.pages.map((p) => (p.id === page.id ? page : p)) });

const STORE = "bd-studio-project";
const OLD_STORE = "bd-studio-page";

const validPage = (p: unknown, slug: TemplateSlug): p is SitePage => {
  const page = p as SitePage;
  const t = templateOf(slug);
  return Boolean(t && page && typeof page.name === "string" && typeof page.id === "string" && typeof page.path === "string" && Array.isArray(page.keys) && page.keys.every((k) => typeof k === "string" && t.sections.some((s) => s.id === idOf(k))));
};

export const validProject = (p: unknown): p is Project => {
  const x = p as Project;
  return Boolean(x && templateOf(x.template) && typeof x.name === "string" && Array.isArray(x.pages) && x.pages.length > 0 && x.pages.every((pg) => validPage(pg, x.template)) && Array.isArray(x.edits));
};

const PATH = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*)?$/;
const text = (v: unknown, max: number) => typeof v === "string" && v.length <= max;

/**
 * A project sent from a browser, checked for the server: a real template, sections it has, page
 * addresses that are only folders, and text of a sane length. Anything else is turned away.
 */
export function checkedProject(p: unknown): Project | null {
  if (!validProject(p) || !text(p.name, 120) || p.pages.length > 40 || p.edits.length > 2000) return null;
  const paths = new Set<string>();
  for (const page of p.pages) {
    if (page.template !== p.template || !PATH.test(page.path) || paths.has(page.path) || !text(page.name, 120) || page.keys.length > 80) return null;
    paths.add(page.path);
  }
  const edits = p.edits.every((e) => e && text(e.scope, 200) && text(e.from, 4000) && text(e.to, 4000) && e.from.trim().length > 0 && Number.isInteger(e.nth) && e.nth >= 0);
  const theme = checkedTheme(p.theme);
  const images = checkedImages(p.images);
  return edits ? { template: p.template, name: p.name, pages: p.pages.map(({ id, path, template, name, keys }) => ({ id, path, template, name, keys })), edits: p.edits.map(({ scope, from, nth, to }) => ({ scope, from, nth, to })), ...(theme ? { theme } : {}), ...(images ? { images } : {}) } : null;
}

/** The template from the URL wins, then the saved project, then Zuno. A page saved by an older Studio becomes a project's home. */
export function initialState(): StudioState {
  let project = newProject(TEMPLATES[0].slug);
  try {
    const param = new URLSearchParams(window.location.search).get("template");
    const t = param ? templateOf(param) : undefined;
    if (t) project = newProject(t.slug);
    else {
      const saved = JSON.parse(localStorage.getItem(STORE) ?? "null");
      const old = JSON.parse(localStorage.getItem(OLD_STORE) ?? "null") as Page | null;
      if (validProject(saved)) project = saved;
      else if (old && templateOf(old.template) && Array.isArray(old.keys)) {
        const home = { ...homePage(old.template), name: "Home", keys: old.keys };
        if (validPage(home, old.template)) project = { template: old.template, name: old.name || templateOf(old.template)!.name, pages: [home], edits: [] };
      }
    }
  } catch {
    /* a broken save falls back to the default */
  }
  const home = project.pages[0];
  // A section's own link (?template=noma&section=hero) opens with that section picked.
  const linked = new URLSearchParams(window.location.search).get("section");
  const picked = (linked && home.keys.find((k) => idOf(k) === linked)) || home.keys[1] || null;
  return { project, view: { kind: "page", id: home.id }, selected: picked, past: [], future: [] };
}

/** The project as Studio last saved it in this browser, for the preview tab. */
export const SAVED_KEY = STORE;
export function savedProject(): Project | null {
  try {
    const p = JSON.parse(localStorage.getItem(STORE) ?? "null");
    return validProject(p) ? p : null;
  } catch {
    return null;
  }
}

export function save(project: Project) {
  try {
    localStorage.setItem(STORE, JSON.stringify(project));
  } catch {
    /* storage full or blocked: Studio still works, it just won't remember */
  }
}
