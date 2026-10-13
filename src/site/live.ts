import auren from "../../templates/auren/bd/manifest.json";
import noma from "../../templates/noma/src/bd/manifest.json";
import zuno from "../../templates/zuno/src/bd/manifest.json";

/*
 * The templates basedraft sells: three real Next.js sites, each its own app in templates/ and served
 * here under /live/<slug>. Their sections are the components on each home page, listed in the
 * template's bd/manifest.json and drawn by its own code, so what you see is exactly what you get.
 */

export type TemplateSlug = "zuno" | "noma" | "auren";

export type SectionKind =
  | "nav"
  | "hero"
  | "logos"
  | "story"
  | "features"
  | "steps"
  | "interactive"
  | "stats"
  | "testimonials"
  | "security"
  | "pricing"
  | "faq"
  | "changelog"
  | "cta"
  | "divider"
  | "footer";

export interface LiveSection {
  /** Unique across templates: zuno/hero. */
  key: string;
  template: TemplateSlug;
  id: string;
  name: string;
  kind: SectionKind;
  /** The line that brings it into a page in its own template, and the tag that draws it. */
  import: string;
  tag: string;
}

export interface LiveTemplate {
  slug: TemplateSlug;
  name: string;
  category: string;
  price: number | "free";
  accent: string;
  tagline: string;
  description: string;
  highlights: string[];
  repo?: string;
  /** The home page, in order: section ids, nav and footer included. */
  home: string[];
  pages: Array<{ label: string; path: string }>;
  /** Where the template's project keeps its pages, e.g. "src/app/(site)". */
  pagesDir: string;
  sections: LiveSection[];
}

/** The kinds, in the order a page usually runs, with what each is for. */
export const KINDS: Array<{ id: SectionKind; label: string; blurb: string }> = [
  { id: "nav", label: "Navigation", blurb: "The bar across the top: brand, links and the main action." },
  { id: "hero", label: "Hero", blurb: "The first screen. One promise, one action, one look at the product." },
  { id: "logos", label: "Logos and tickers", blurb: "Proof in a line: who uses it, or what it's tracking right now." },
  { id: "story", label: "Story", blurb: "The why, said plainly, in one big statement." },
  { id: "features", label: "Features", blurb: "What the product does, shown rather than listed." },
  { id: "steps", label: "How it works", blurb: "The path from sign up to the first result, step by step." },
  { id: "interactive", label: "Interactive", blurb: "Something to try right on the page." },
  { id: "stats", label: "Stats", blurb: "A few numbers that matter, each with what it means." },
  { id: "testimonials", label: "Testimonials", blurb: "Customers in their own words." },
  { id: "security", label: "Security", blurb: "How data is kept safe, for the people who have to sign off." },
  { id: "pricing", label: "Pricing", blurb: "Plans side by side, with the one to pick made obvious." },
  { id: "faq", label: "FAQ", blurb: "The questions people ask before they buy." },
  { id: "changelog", label: "Changelog", blurb: "What shipped lately, so the product looks alive." },
  { id: "cta", label: "Call to action", blurb: "The last ask before the footer." },
  { id: "divider", label: "Dividers", blurb: "Bands that carry one section's color into the next." },
  { id: "footer", label: "Footer", blurb: "Links, legal and a last look at the brand." },
];

export const kindOf = (id: SectionKind) => KINDS.find((k) => k.id === id)!;

type Manifest = Omit<LiveTemplate, "sections" | "slug"> & { slug: string; sections: Array<Omit<LiveSection, "key" | "template" | "kind"> & { kind: string }> };

const load = (m: Manifest): LiveTemplate => {
  const slug = m.slug as TemplateSlug;
  return { ...m, slug, sections: m.sections.map((s) => ({ ...s, kind: s.kind as SectionKind, template: slug, key: `${slug}/${s.id}` })) };
};

export const TEMPLATES: LiveTemplate[] = [load(zuno as Manifest), load(noma as Manifest), load(auren as Manifest)];
export const SECTIONS: LiveSection[] = TEMPLATES.flatMap((t) => t.sections);

export const templateOf = (slug: string) => TEMPLATES.find((t) => t.slug === slug);
export const sectionOf = (template: string, id: string) => templateOf(template)?.sections.find((s) => s.id === id);
export const sectionsOfKind = (kind: SectionKind) => SECTIONS.filter((s) => s.kind === kind);

/** A free template's sections are free to take; every template is paid today, so these come with Pro or their template. */
export const isFree = (s: Pick<LiveSection, "template">) => templateOf(s.template)?.price === "free";

/* Where each piece lives, through basedraft's address. */
export const liveUrl = (slug: string, path = "/") => `/live/${slug}${path === "/" ? "" : path}`;
/** A template full window on basedraft, with its price and a way to buy it or open it in Studio. */
export const viewUrl = (slug: string, path = "/") => `/view/${slug}${path === "/" ? "" : `?path=${encodeURIComponent(path)}`}`;
export const sectionUrl = (s: Pick<LiveSection, "template" | "id">) => `/live/${s.template}/bd/section/${s.id}`;
export const composeUrl = (slug: string, keys: string[]) => `/live/${slug}/bd/compose?s=${keys.map(encodeURIComponent).join(",")}`;
/** Screenshots made by scripts/shots.mjs. */
export const templateShot = (slug: string) => `/shots/${slug}.jpg`;
export const sectionShot = (s: Pick<LiveSection, "template" | "id">) => `/shots/sections/${s.template}-${s.id}.jpg`;
