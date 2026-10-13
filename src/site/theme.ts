import type { TemplateSlug } from "./live";

/*
 * A project's colors. Each template keeps its colors in its own CSS variables; four of them say
 * what it looks like, so those four are what you change: the accent, the page, cards (anything
 * lifted off the page) and text. The template's other shades (lines, muted text, a deeper card)
 * follow from them, mixed the way the template mixes its own, so a new palette still reads as
 * the template. The colors are laid over the template's own, in Studio, in what's copied to
 * Figma and Paper, and in the code you download, where they're added to the end of its
 * globals.css. The template's code is never changed.
 */

export type ThemeSlot = "accent" | "page" | "cards" | "text";
export const SLOTS: ThemeSlot[] = ["accent", "page", "cards", "text"];
export const SLOT_LABEL: Record<ThemeSlot, string> = { accent: "Accent", page: "Page", cards: "Cards", text: "Text" };

/** The colors you changed; anything left out is the template's own. */
export type Theme = Partial<Record<ThemeSlot, string>>;
export type Palette = Record<ThemeSlot, string>;

/** A variable takes a slot's color, a mix of two (the second at `amount`), or what reads on the accent. */
type Source = ThemeSlot | [ThemeSlot, ThemeSlot, number] | "on-accent";

interface TemplateColors {
  base: Palette;
  vars: Record<string, Source>;
  presets: Array<{ name: string; colors: Palette }>;
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
      { name: "Noma", colors: { accent: "#ff9e00", page: "#fbfaf7", cards: "#ffffff", text: "#1d1a15" } },
      { name: "Noma dark", colors: { accent: "#ff9e00", page: "#161310", cards: "#1c1916", text: "#f2ede3" } },
      { name: "Cool", colors: { accent: "#0a7cff", page: "#f7f9fc", cards: "#ffffff", text: "#0f1722" } },
      { name: "Violet", colors: { accent: "#7a5fd0", page: "#faf8ff", cards: "#ffffff", text: "#1b1530" } },
      { name: "Sage", colors: { accent: "#2f7f7a", page: "#f6f8f5", cards: "#ffffff", text: "#17201c" } },
      { name: "Rose", colors: { accent: "#e5487f", page: "#fdf8f8", cards: "#ffffff", text: "#2a1519" } },
    ],
    globals: "src/app/globals.css",
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

/** The four colors in effect: yours, then the template's. */
export function paletteOf(slug: string, theme?: Theme): Palette | null {
  const c = COLORS[slug as TemplateSlug];
  if (!c) return null;
  return { ...c.base, ...Object.fromEntries(Object.entries(theme ?? {}).filter(([, v]) => v && HEX.test(v))) } as Palette;
}

/** Only the variables that change: a theme that only moves the accent leaves the rest as written. */
export function themeVars(slug: string, theme?: Theme): Record<string, string> {
  const c = COLORS[slug as TemplateSlug];
  const p = paletteOf(slug, theme);
  if (!c || !p) return {};
  const changed = new Set(SLOTS.filter((s) => p[s].toLowerCase() !== c.base[s].toLowerCase()));
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

/** The colors as CSS, strong enough to win over the template's own (its light, dark and named themes included). */
export function themeCss(slug: string, theme?: Theme) {
  const vars = Object.entries(themeVars(slug, theme));
  if (!vars.length) return "";
  const c = COLORS[slug as TemplateSlug];
  const p = paletteOf(slug, theme)!;
  const changed = new Set(SLOTS.filter((s) => p[s].toLowerCase() !== c.base[s].toLowerCase()));
  return `html:root:root {\n${vars.map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n}\n${c.extra?.(p, changed) ?? ""}`;
}

/** The template's code files that keep colors for JS drawings, with your colors written in. */
export function themeCode(slug: string, theme: Theme | undefined, read: (file: string) => string | undefined): Array<[string, string]> {
  const c = COLORS[slug as TemplateSlug];
  const p = paletteOf(slug, theme);
  if (!c?.code || !p || !themeCss(slug, theme)) return [];
  const out: Array<[string, string]> = [];
  for (const { file, keys } of c.code) {
    let src = read(file);
    if (src === undefined) continue;
    for (const [key, slot] of Object.entries(keys)) src = src.replace(new RegExp(`(\\b${key}: )"#[0-9a-fA-F]{6}"`), `$1"${p[slot]}"`);
    out.push([file, src]);
  }
  return out;
}

/** A theme checked for the server: known slots and real colors only. */
export function checkedTheme(t: unknown): Theme | undefined {
  if (!t || typeof t !== "object") return undefined;
  const out: Theme = {};
  for (const s of SLOTS) {
    const v = (t as Record<string, unknown>)[s];
    if (typeof v === "string" && HEX.test(v)) out[s] = v.toLowerCase();
  }
  return Object.keys(out).length ? out : undefined;
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
