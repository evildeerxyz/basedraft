import type { TemplateSlug } from "./live";
import RADII from "./radii.json";

/*
 * A project's style: its colors, its type and its corners. Each template keeps its colors in its
 * own CSS variables; four of them say what it looks like, so those four are what you change: the
 * accent, the page, cards (anything lifted off the page) and text. The template's other shades
 * (lines, muted text, a deeper card) follow from them, mixed the way the template mixes its own,
 * so a new palette still reads as the template. A template with a dark mode beside its light one
 * has a palette for each, and its own switch between them keeps working.
 *
 * Type swaps the template's typeface (the font variable its layout sets) and can give headings
 * their own, weight and spacing; corners scale every radius its code writes as a class. All of it
 * is laid over the template's own styles, in Studio, in what's copied to Figma and Paper, and in
 * the code you download, where it's added to the end of the template's globals.css (and the fonts
 * are loaded by next/font in its layout). The template's own code is otherwise never changed.
 */

export type ThemeSlot = "accent" | "page" | "cards" | "text";
export const SLOTS: ThemeSlot[] = ["accent", "page", "cards", "text"];
export const SLOT_LABEL: Record<ThemeSlot, string> = { accent: "Accent", page: "Page", cards: "Cards", text: "Text" };

export type Mode = "light" | "dark";

export type FontId = "inter" | "barlow" | "geist" | "mona" | "manrope" | "dm-sans" | "space-grotesk" | "jakarta" | "fraunces" | "newsreader";

/** Typefaces to try: variable fonts on Google Fonts, so every weight a template uses is there. */
export const FONTS: Record<FontId, { label: string; family: string; google: string; next: string; serif?: boolean }> = {
  inter: { label: "Inter", family: "Inter", google: "Inter:wght@100..900", next: "Inter" },
  barlow: { label: "Barlow", family: "Barlow", google: "Barlow:wght@400;500;600;700", next: "Barlow" },
  geist: { label: "Geist", family: "Geist", google: "Geist:wght@100..900", next: "Geist" },
  mona: { label: "Mona Sans", family: "Mona Sans", google: "Mona+Sans:wght@200..900", next: "Mona_Sans" },
  manrope: { label: "Manrope", family: "Manrope", google: "Manrope:wght@200..800", next: "Manrope" },
  "dm-sans": { label: "DM Sans", family: "DM Sans", google: "DM+Sans:wght@100..1000", next: "DM_Sans" },
  "space-grotesk": { label: "Space Grotesk", family: "Space Grotesk", google: "Space+Grotesk:wght@300..700", next: "Space_Grotesk" },
  jakarta: { label: "Jakarta", family: "Plus Jakarta Sans", google: "Plus+Jakarta+Sans:wght@200..800", next: "Plus_Jakarta_Sans" },
  fraunces: { label: "Fraunces", family: "Fraunces", google: "Fraunces:wght@100..900", next: "Fraunces", serif: true },
  newsreader: { label: "Newsreader", family: "Newsreader", google: "Newsreader:wght@200..800", next: "Newsreader", serif: true },
};
const FONT_IDS = Object.keys(FONTS) as FontId[];

/** The colors you changed, and the type and corners; anything left out is the template's own. */
export interface Theme extends Partial<Record<ThemeSlot, string>> {
  /** A template with a dark mode: its colors there. The accent follows the light one unless set here. */
  dark?: Partial<Record<ThemeSlot, string>>;
  /** The typeface for everything. */
  font?: FontId;
  /** Headings in a typeface of their own. */
  headings?: FontId;
  /** Headlines' weight, and their letter spacing in em. */
  weight?: number;
  tracking?: number;
  /** Every corner, as a share of the template's own (1 is as written). */
  radius?: number;
}
export type Palette = Record<ThemeSlot, string>;

/** A variable takes a slot's color, a mix of two (the second at `amount`), or what reads on the accent. */
type Source = ThemeSlot | [ThemeSlot, ThemeSlot, number] | "on-accent";

interface TemplateColors {
  base: Palette;
  vars: Record<string, Source>;
  presets: Array<{ name: string; colors: Palette; dark?: Palette }>;
  /** A dark mode beside the light one: its colors, and how the template switches (an attribute on <html>, kept in localStorage). */
  dark?: { base: Palette; attr: string; storage: string };
  /** The typeface its layout loads with next/font: the CSS variable it sets, the file, and its name there. */
  font: { own: FontId | null; label: string; variable: string; layout: string };
  /** Where the template keeps its global styles, for the code you download. */
  globals: string;
  /**
   * Rules for the places the template writes a color into a class instead of a variable (a
   * button's hover, the text on the accent), so they follow the palette too.
   */
  extra?: (p: Palette, changed: Set<ThemeSlot>) => string;
  /** Colors the template keeps in code for things drawn in JS: in the download, they're set to yours. */
  code?: Array<{ file: string; keys: Record<string, ThemeSlot> }>;
}

export const COLORS: Record<TemplateSlug, TemplateColors> = {
  zuno: {
    base: { accent: "#c8ff3e", page: "#000000", cards: "#0e0e0f", text: "#f5f5f5" },
    vars: {
      "--zn-accent": "accent",
      "--color-lime": "accent",
      "--color-lime-deep": ["accent", "page", 0.18],
      "--color-on-lime": "on-accent",
      "--zn-bg": "page",
      "--zn-bg-2": "cards",
      "--zn-bg-3": ["cards", "text", 0.07],
      "--zn-bg-4": ["cards", "text", 0.13],
      "--zn-fg": "text",
      "--zn-fg-2": ["text", "page", 0.07],
      "--zn-mute": ["text", "page", 0.44],
    },
    presets: [
      { name: "Zuno", colors: { accent: "#c8ff3e", page: "#000000", cards: "#0e0e0f", text: "#f5f5f5" } },
      { name: "Ultramarine", colors: { accent: "#7b93ff", page: "#05060d", cards: "#0d1020", text: "#eef0ff" } },
      { name: "Ember", colors: { accent: "#ff6b3d", page: "#0b0706", cards: "#171110", text: "#f7efe9" } },
      { name: "Mint", colors: { accent: "#5ef2b5", page: "#03100b", cards: "#0a1a14", text: "#e9fbf3" } },
      { name: "Graphite", colors: { accent: "#f5f5f5", page: "#111111", cards: "#1b1b1b", text: "#ededed" } },
      { name: "Plum", colors: { accent: "#e879f9", page: "#0c0710", cards: "#170f1d", text: "#f6eefa" } },
    ],
    globals: "src/app/globals.css",
    font: { own: "geist", label: "Geist", variable: "--font-geist-sans", layout: "src/app/layout.tsx" },
    code: [{ file: "src/lib/palette.ts", keys: { bg: "page", fg: "text", accent: "accent" } }],
  },
  noma: {
    base: { accent: "#ff9e00", page: "#fbfaf7", cards: "#ffffff", text: "#1d1a15" },
    vars: {
      "--accent": "accent",
      "--warn": "accent",
      "--page": "page",
      "--grid": ["page", "text", 0.03],
      "--hover": ["page", "text", 0.035],
      "--sunken": ["page", "text", 0.045],
      "--selected": ["page", "text", 0.07],
      "--line-soft": ["page", "text", 0.08],
      "--line": ["page", "text", 0.12],
      "--line-strong": ["page", "text", 0.2],
      "--surface": "cards",
      "--surface-2": ["cards", "text", 0.035],
      "--pill": ["cards", "text", 0.07],
      "--pill-strong": ["cards", "text", 0.11],
      "--ink": "text",
      "--ink-2": ["text", "page", 0.38],
      "--ink-3": ["text", "page", 0.58],
      "--ink-4": ["text", "page", 0.72],
      "--inverse": "text",
      "--inverse-fg": "page",
      "--inverse-hover": ["text", "page", 0.1],
    },
    presets: [
      { name: "Noma", colors: { accent: "#ff9e00", page: "#fbfaf7", cards: "#ffffff", text: "#1d1a15" }, dark: { accent: "#ff9e00", page: "#161310", cards: "#1c1916", text: "#f2ede3" } },
      { name: "Cool", colors: { accent: "#0a7cff", page: "#f7f9fc", cards: "#ffffff", text: "#0f1722" }, dark: { accent: "#3d8bff", page: "#0c1016", cards: "#131922", text: "#e6edf5" } },
      { name: "Violet", colors: { accent: "#7a5fd0", page: "#faf8ff", cards: "#ffffff", text: "#1b1530" }, dark: { accent: "#9d86ec", page: "#120f1a", cards: "#1a1625", text: "#efeaff" } },
      { name: "Sage", colors: { accent: "#2f7f7a", page: "#f6f8f5", cards: "#ffffff", text: "#17201c" }, dark: { accent: "#4fb3aa", page: "#0e1412", cards: "#151c19", text: "#e6efea" } },
      { name: "Rose", colors: { accent: "#e5487f", page: "#fdf8f8", cards: "#ffffff", text: "#2a1519" }, dark: { accent: "#f06a98", page: "#160d10", cards: "#201417", text: "#f9e9ee" } },
      { name: "Graphite", colors: { accent: "#1a1a1a", page: "#fafafa", cards: "#ffffff", text: "#141414" }, dark: { accent: "#f2f2f2", page: "#0e0e0e", cards: "#171717", text: "#f2f2f2" } },
    ],
    dark: { base: { accent: "#ff9e00", page: "#161310", cards: "#1c1916", text: "#f2ede3" }, attr: "data-theme", storage: "noma-theme" },
    globals: "src/app/globals.css",
    font: { own: "geist", label: "Geist", variable: "--font-geist-sans", layout: "src/app/layout.tsx" },
    extra: (p, changed) => {
      if (!changed.has("accent")) return "";
      const on = onColor(p.accent);
      const line = (a: number) => `rgb(${rgb(on).join(" ")} / ${a})`;
      return `/* Buttons on the accent: their text and their hover. */
html:root:root .bg-accent.text-\\[\\#1d1a15\\] { color: ${on}; }
@media (hover: hover) {
  html:root:root .hover\\:bg-\\[\\#ffb02e\\]:hover, html:root:root .hover\\:bg-\\[\\#ffad26\\]:hover { background-color: ${mix(p.accent, "#ffffff", 0.16)}; }
}
/* The bold accent band. */
html:root:root [data-tone="accent"] {
  color-scheme: ${on === "#ffffff" ? "dark" : "light"};
  --page: ${p.accent};
  --surface: ${mix(p.accent, "#ffffff", 0.18)};
  --surface-2: ${mix(p.accent, "#ffffff", 0.08)};
  --sunken: ${mix(p.accent, "#000000", 0.05)};
  --hover: ${mix(p.accent, "#ffffff", 0.26)};
  --pill: ${line(0.1)};
  --pill-strong: ${line(0.2)};
  --line: ${line(0.24)};
  --line-soft: ${line(0.12)};
  --line-strong: ${line(0.45)};
  --grid: ${line(0.08)};
  --ink: ${on === "#ffffff" ? "#ffffff" : p.text};
  --ink-2: ${mix(on === "#ffffff" ? "#ffffff" : p.text, p.accent, 0.18)};
  --ink-3: ${mix(on === "#ffffff" ? "#ffffff" : p.text, p.accent, 0.38)};
  --ink-4: ${mix(on === "#ffffff" ? "#ffffff" : p.text, p.accent, 0.5)};
  --inverse: ${on === "#ffffff" ? "#ffffff" : p.text};
  --inverse-fg: ${on === "#ffffff" ? p.accent : p.page};
  --accent: ${on === "#ffffff" ? "#ffffff" : p.text};
}
`;
    },
  },
  auren: {
    base: { accent: "#f2a23a", page: "#0a0a09", cards: "#121211", text: "#efebe2" },
    vars: {
      "--accent": "accent",
      "--accent-deep": ["accent", "page", 0.76],
      "--ink": "page",
      "--ink-2": "cards",
      "--ink-3": ["cards", "text", 0.05],
      "--paper": "text",
      "--paper-2": ["text", "page", 0.05],
      "--paper-3": ["text", "page", 0.12],
      "--fog": ["text", "page", 0.33],
      "--mute": ["text", "page", 0.56],
    },
    presets: [
      { name: "Auren", colors: { accent: "#f2a23a", page: "#0a0a09", cards: "#121211", text: "#efebe2" } },
      { name: "Aurora", colors: { accent: "#7ddba4", page: "#0a0a09", cards: "#121211", text: "#efebe2" } },
      { name: "Ember", colors: { accent: "#ff6b3d", page: "#0a0a09", cards: "#121211", text: "#efebe2" } },
      { name: "Midnight", colors: { accent: "#8ea2ff", page: "#070912", cards: "#0f1220", text: "#e8eaf6" } },
      { name: "Moss", colors: { accent: "#c3e86b", page: "#080b06", cards: "#10150d", text: "#eef2e4" } },
      { name: "Mono", colors: { accent: "#efebe2", page: "#0a0a0a", cards: "#141414", text: "#efebe2" } },
    ],
    globals: "app/globals.css",
    font: { own: "mona", label: "Mona Sans", variable: "--font-mona", layout: "app/layout.tsx" },
  },
  pello: {
    // The four colors; every other shade in pello's globals.css is mixed from them there, so it follows on its own.
    base: { accent: "#ff4b1f", page: "#ffffff", cards: "#f1f2f3", text: "#0b0b0b" },
    vars: {
      "--pl-accent": "accent",
      "--pl-accent-ink": "on-accent",
      "--pl-page": "page",
      "--pl-surface": "cards",
      "--pl-ink": "text",
    },
    presets: [
      { name: "pello", colors: { accent: "#ff4b1f", page: "#ffffff", cards: "#f1f2f3", text: "#0b0b0b" } },
      { name: "Cobalt", colors: { accent: "#2a45ff", page: "#ffffff", cards: "#f0f2f6", text: "#0a0c14" } },
      { name: "Forest", colors: { accent: "#13804f", page: "#ffffff", cards: "#eff3f0", text: "#0a120d" } },
      { name: "Violet", colors: { accent: "#6b3cff", page: "#ffffff", cards: "#f2f1f7", text: "#100c1d" } },
      { name: "Crimson", colors: { accent: "#e5173f", page: "#ffffff", cards: "#f4f2f3", text: "#120a0c" } },
      { name: "Graphite", colors: { accent: "#0b0b0b", page: "#ffffff", cards: "#f1f1f1", text: "#0b0b0b" } },
    ],
    globals: "src/app/globals.css",
    font: { own: "barlow", label: "Barlow", variable: "--font-barlow", layout: "src/app/layout.tsx" },
  },
};

export const HEX = /^#[0-9a-f]{6}$/i;

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hexOf = (c: number[]) => `#${c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;
/** `a` with `amount` of `b` mixed in. */
const mix = (a: string, b: string, amount: number) => {
  const x = rgb(a);
  const y = rgb(b);
  return hexOf(x.map((v, i) => v + (y[i] - v) * amount));
};
const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
/** Text for a button in `hex`: white wherever white reads (3:1 and up, as button labels need), near black otherwise. */
export const onColor = (hex: string) => (ratio(hex, "#ffffff") >= 3 ? "#ffffff" : "#0a0a0a");

const slotsOf = (t?: Partial<Record<ThemeSlot, string>>) => Object.fromEntries(SLOTS.filter((k) => t?.[k] && HEX.test(t[k]!)).map((k) => [k, t![k]!.toLowerCase()])) as Partial<Palette>;

/** The template's own colors in a mode. */
export function baseOf(slug: string, mode: Mode = "light"): Palette | null {
  const c = COLORS[slug as TemplateSlug];
  if (!c) return null;
  return mode === "dark" && c.dark ? c.dark.base : c.base;
}

/** The four colors in effect in a mode: yours, then the template's. In dark, the accent follows yours unless you set one there. */
export function paletteOf(slug: string, theme?: Theme, mode: Mode = "light"): Palette | null {
  const c = COLORS[slug as TemplateSlug];
  if (!c) return null;
  if (mode === "dark" && c.dark) return { ...c.dark.base, ...(theme?.accent && HEX.test(theme.accent) ? { accent: theme.accent.toLowerCase() } : {}), ...slotsOf(theme?.dark) };
  return { ...c.base, ...slotsOf(theme) };
}

/** Only the variables that change: a theme that only moves the accent leaves the rest as written. */
export function themeVars(slug: string, theme?: Theme, mode: Mode = "light"): Record<string, string> {
  const c = COLORS[slug as TemplateSlug];
  const p = paletteOf(slug, theme, mode);
  const base = baseOf(slug, mode);
  if (!c || !p || !base) return {};
  const changed = new Set(SLOTS.filter((s) => p[s].toLowerCase() !== base[s].toLowerCase()));
  if (!changed.size) return {};
  const out: Record<string, string> = {};
  for (const [name, src] of Object.entries(c.vars)) {
    if (src === "on-accent") {
      if (changed.has("accent")) out[name] = onColor(p.accent);
    } else if (typeof src === "string") {
      if (changed.has(src)) out[name] = p[src];
    } else if (changed.has(src[0]) || changed.has(src[1])) out[name] = mix(p[src[0]], p[src[1]], src[2]);
  }
  return out;
}

const block = (selector: string, vars: Array<[string, string]>) => (vars.length ? `${selector} {\n${vars.map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n}\n` : "");
const stack = (id: FontId) => `"${FONTS[id].family}", ${FONTS[id].serif ? "ui-serif, Georgia, serif" : "ui-sans-serif, system-ui, sans-serif"}`;
const esc = (cls: string) => cls.replace(/[[\]:.]/g, (m) => `\\${m}`);
const BREAKPOINT: Record<string, string> = { sm: "40rem", md: "48rem", lg: "64rem", xl: "80rem", "2xl": "96rem" };
const NAMED: Record<string, number> = { "": 4, xs: 2, sm: 4, md: 6, lg: 8, xl: 12, "2xl": 16, "3xl": 24, "4xl": 32 };
const CORNERS: Record<string, string[]> = {
  "": ["border-radius"],
  t: ["border-top-left-radius", "border-top-right-radius"],
  r: ["border-top-right-radius", "border-bottom-right-radius"],
  b: ["border-bottom-right-radius", "border-bottom-left-radius"],
  l: ["border-top-left-radius", "border-bottom-left-radius"],
  tl: ["border-top-left-radius"],
  tr: ["border-top-right-radius"],
  br: ["border-bottom-right-radius"],
  bl: ["border-bottom-left-radius"],
  s: ["border-start-start-radius", "border-end-start-radius"],
  e: ["border-start-end-radius", "border-end-end-radius"],
  ss: ["border-start-start-radius"],
  se: ["border-start-end-radius"],
  es: ["border-end-start-radius"],
  ee: ["border-end-end-radius"],
};

/** Every radius class the template's code writes, at `k` times its value (see scripts/radii.mjs). */
function cornersCss(slug: string, k: number) {
  const list = (RADII as Record<string, string[]>)[slug] ?? [];
  const rules: Record<string, string[]> = {};
  for (const cls of list) {
    const m = cls.match(/^(?:(sm|md|lg|xl|2xl):)?rounded(?:-(t|r|b|l|tl|tr|br|bl|s|e|ss|se|es|ee))?(?:-\[(\d+(?:\.\d+)?)(px|rem)\]|-(xs|sm|md|lg|xl|2xl|3xl|4xl))?$/);
    if (!m) continue;
    const [, bp = "", side = "", n, unit, named = ""] = m;
    const px = n ? Number(n) * (unit === "rem" ? 16 : 1) : NAMED[named];
    if (px === undefined) continue;
    const value = `${Math.round(px * k * 100) / 100}px`;
    (rules[bp] ??= []).push(`html:root:root .${esc(cls)} { ${CORNERS[side].map((p) => `${p}: ${value};`).join(" ")} }`);
  }
  return Object.entries(rules)
    .sort(([a], [b]) => (a ? parseFloat(BREAKPOINT[a]) : 0) - (b ? parseFloat(BREAKPOINT[b]) : 0))
    .map(([bp, r]) => (bp ? `@media (width >= ${BREAKPOINT[bp]}) {\n${r.map((x) => `  ${x}`).join("\n")}\n}` : r.join("\n")))
    .join("\n");
}

/** The Google Fonts a theme's typefaces come from, for a page that's already drawn (the code loads them with next/font). */
export function fontsUrl(slug: string, theme?: Theme) {
  const own = COLORS[slug as TemplateSlug]?.font.own;
  const ids = [...new Set([theme?.font, theme?.headings].filter((f): f is FontId => !!f && f !== own))];
  return ids.length ? `https://fonts.googleapis.com/css2?${ids.map((f) => `family=${FONTS[f].google}`).join("&")}&display=swap` : "";
}

/** The variable headings take their typeface from in the code you download (its layout sets it with next/font). */
const HEADINGS_VAR = "--font-bd-headings";

/**
 * The theme as CSS, strong enough to win over the template's own (its light, dark and named themes
 * included). For a page that's drawn ("page"), the fonts come from Google Fonts by name; for the
 * template's code ("code"), from the variables next/font sets in its layout (see themeCode).
 */
export function themeCss(slug: string, theme?: Theme, target: "page" | "code" = "page") {
  const c = COLORS[slug as TemplateSlug];
  if (!c || !theme) return "";
  let css = "";
  // Colors: with a dark mode, each palette where the template draws that mode, a band of it included.
  const light = Object.entries(themeVars(slug, theme, "light"));
  if (c.dark) {
    const a = c.dark.attr;
    css += block(`html:root:root:not([${a}="dark"]), html:root:root [${a}="light"]`, light);
    css += block(`html:root:root[${a}="dark"], html:root:root [${a}="dark"]`, Object.entries(themeVars(slug, theme, "dark")));
  } else css += block("html:root:root", light);
  if (light.length) {
    const p = paletteOf(slug, theme)!;
    css += c.extra?.(p, new Set(SLOTS.filter((s) => p[s].toLowerCase() !== c.base[s].toLowerCase()))) ?? "";
  }
  // Type.
  const own = c.font.own;
  const font = theme.font && theme.font !== own ? theme.font : undefined;
  if (font && target === "page") css += block("html:root:root", [[c.font.variable, stack(font)]]);
  const heads: Array<[string, string]> = [];
  if (theme.headings && theme.headings !== (theme.font ?? own)) heads.push(["font-family", target === "page" ? stack(theme.headings) : `var(${HEADINGS_VAR}), ${stack(theme.headings)}`]);
  css += block("html:root:root :is(h1, h2, h3, h4, h5, h6)", heads);
  const lines: Array<[string, string]> = [];
  if (theme.weight) lines.push(["font-weight", String(theme.weight)]);
  if (theme.tracking !== undefined) lines.push(["letter-spacing", `${theme.tracking}em`]);
  css += block("html:root:root :is(h1, h2)", lines);
  // Corners.
  if (theme.radius !== undefined && theme.radius !== 1) css += `${cornersCss(slug, theme.radius)}\n`;
  if (!css) return "";
  const url = target === "page" ? fontsUrl(slug, theme) : "";
  return `${url ? `@import url("${url}");\n` : ""}${css}`;
}

/** The template's code files that keep colors for JS drawings, and its layout with your typefaces, written in. */
export function themeCode(slug: string, theme: Theme | undefined, read: (file: string) => string | undefined): Array<[string, string]> {
  const c = COLORS[slug as TemplateSlug];
  const p = paletteOf(slug, theme);
  if (!c || !p || !theme) return [];
  const out: Array<[string, string]> = [];
  if (c.code && Object.keys(themeVars(slug, theme)).length)
    for (const { file, keys } of c.code) {
      let src = read(file);
      if (src === undefined) continue;
      for (const [key, slot] of Object.entries(keys)) src = src.replace(new RegExp(`(\\b${key}: )"#[0-9a-fA-F]{6}"`), `$1"${p[slot]}"`);
      out.push([file, src]);
    }
  const layout = fontLayout(c, theme, read(c.font.layout));
  if (layout) out.push([c.font.layout, layout]);
  return out;
}

/** The layout with the typeface swapped in its next/font call, and the headings' typeface added beside it. */
function fontLayout(c: TemplateColors, theme: Theme, src: string | undefined) {
  if (src === undefined) return null;
  const font = theme.font && theme.font !== c.font.own ? theme.font : undefined;
  const heads = theme.headings && theme.headings !== (theme.font ?? c.font.own) ? theme.headings : undefined;
  if (!font && !heads) return null;
  const call = new RegExp(`const (\\w+) = (\\w+)\\(\\{[^}]*variable: "${c.font.variable}"[^}]*\\}\\);`);
  const m = src.match(call);
  if (!m) return null;
  const names = new Set<string>();
  let next = src;
  if (font) {
    next = next.replace(call, `const ${m[1]} = ${FONTS[font].next}({\n  variable: "${c.font.variable}",\n  subsets: ["latin"],\n});`);
    names.add(FONTS[font].next);
  }
  if (heads) {
    next = next.replace(call, (all) => `${all}\n\n// Headings, in their own typeface (basedraft Studio).\nconst bdHeadings = ${FONTS[heads].next}({\n  variable: "${HEADINGS_VAR}",\n  subsets: ["latin"],\n});`);
    next = next.replace(`\${${m[1]}.variable}`, `\${${m[1]}.variable} \${bdHeadings.variable}`);
    names.add(FONTS[heads].next);
  }
  // The names the calls use, imported from next/font/google (the old one stays if anything else uses it).
  next = next.replace(/import \{([^}]*)\} from "next\/font\/google";/, (_, list: string) => {
    const have = list.split(",").map((x) => x.trim()).filter(Boolean);
    const used = have.filter((n) => new RegExp(`\\b${n}\\(`).test(next));
    return `import { ${[...new Set([...used, ...names])].sort().join(", ")} } from "next/font/google";`;
  });
  return next;
}

const between = (v: unknown, lo: number, hi: number) => typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;

/** A theme checked for the server: known keys and sane values only. */
export function checkedTheme(t: unknown): Theme | undefined {
  if (!t || typeof t !== "object") return undefined;
  const x = t as Record<string, unknown>;
  const out: Theme = { ...slotsOf(x as Theme) };
  const dark = x.dark && typeof x.dark === "object" ? slotsOf(x.dark as Theme) : {};
  if (Object.keys(dark).length) out.dark = dark;
  if (FONT_IDS.includes(x.font as FontId)) out.font = x.font as FontId;
  if (FONT_IDS.includes(x.headings as FontId)) out.headings = x.headings as FontId;
  if (between(x.weight, 100, 900) && (x.weight as number) % 100 === 0) out.weight = x.weight as number;
  if (between(x.tracking, -0.1, 0.1)) out.tracking = Math.round((x.tracking as number) * 1000) / 1000;
  if (between(x.radius, 0, 3)) out.radius = Math.round((x.radius as number) * 100) / 100;
  return Object.keys(out).length ? out : undefined;
}

/** The mode a template is drawn in, in this browser: what its own switch last kept, or the system's. */
export function modeIn(slug: string): Mode {
  const d = COLORS[slug as TemplateSlug]?.dark;
  if (!d) return "light";
  try {
    const kept = localStorage.getItem(d.storage);
    if (kept === "light" || kept === "dark") return kept;
  } catch {}
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Draws a template in a mode, wherever it's open in this browser (Studio's frames read it as they load). */
export function keepMode(slug: string, mode: Mode, docs: Document[] = []) {
  const d = COLORS[slug as TemplateSlug]?.dark;
  if (!d) return;
  try {
    localStorage.setItem(d.storage, mode);
  } catch {}
  for (const doc of docs) doc.documentElement.setAttribute(d.attr, mode);
}

/** Writes the colors into a page that's already drawn (Studio's frames and copies), or takes them out. */
export function applyTheme(doc: Document, css: string) {
  let el = doc.getElementById("bd-theme") as HTMLStyleElement | null;
  if (!css) return el?.remove();
  if (!el) {
    el = doc.createElement("style");
    el.id = "bd-theme";
  }
  // Last in the head, after the template's own styles, every time: a page that adds styles later doesn't win.
  doc.head.appendChild(el);
  if (el.textContent !== css) el.textContent = css;
}
