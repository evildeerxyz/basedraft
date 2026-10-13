/*
 * The colors in globals.css, for what's drawn in JS (the org graph, the charts). Read when a
 * drawing starts, so a new palette (in the CSS, or from basedraft's Studio) reaches them too.
 */
export type Palette = { page: string; surface: string; sunken: string; line: string; ink: string; ink2: string; mute: string; accent: string; accentSoft: string; good: string; bad: string };

const VARS: Record<keyof Palette, string> = {
  page: "--pl-page",
  surface: "--pl-surface",
  sunken: "--pl-sunken",
  line: "--pl-line",
  ink: "--pl-ink",
  ink2: "--pl-ink-2",
  mute: "--pl-mute",
  accent: "--pl-accent",
  accentSoft: "--pl-accent-soft",
  good: "--pl-good",
  bad: "--pl-bad",
};

/** Resolves a CSS color (a variable, a color-mix) to one a canvas can use. */
function resolve(el: Element, name: string) {
  const probe = document.createElement("span");
  probe.style.color = `var(${name})`;
  probe.style.display = "none";
  el.appendChild(probe);
  const c = getComputedStyle(probe).color;
  probe.remove();
  return c;
}

export function paletteOf(el: Element): Palette {
  return Object.fromEntries(Object.entries(VARS).map(([k, v]) => [k, resolve(el, v)])) as Palette;
}
