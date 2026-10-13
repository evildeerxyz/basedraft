/**
 * Colours for things drawn in JS (shaders, canvases, SVG fills). They follow the CSS tokens in
 * globals.css, so a new palette there reaches the drawings too; these values are the defaults,
 * used on the server and wherever the tokens aren't set.
 */
const DEFAULTS = {
  bg: "#000000",
  fg: "#f5f5f5",
  accent: "#c8ff3e",
  down: "#ff5a4e",
};

const token = (name: string, fallback: string) => {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return /^#[0-9a-f]{6}$/i.test(v) ? v : fallback;
};

const rgba = (hex: string, a: number) => `rgba(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",")},${a})`;

export const pal = {
  get bg() {
    return token("--zn-bg", DEFAULTS.bg);
  },
  get fg() {
    return token("--zn-fg", DEFAULTS.fg);
  },
  get dither() {
    return token("--zn-accent", DEFAULTS.accent);
  },
  get accent() {
    return token("--zn-accent", DEFAULTS.accent);
  },
  get soft() {
    return token("--zn-fg", DEFAULTS.fg);
  },
  get down() {
    return token("--zn-down", DEFAULTS.down);
  },
  get muted() {
    return rgba(token("--zn-fg", DEFAULTS.fg), 0.6);
  },
};
