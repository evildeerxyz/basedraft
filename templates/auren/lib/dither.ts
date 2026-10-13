/**
 * Ordered-dither helpers. Everything here is pure so it can run on the server:
 * patterns are emitted as tiny SVG data URLs and used as CSS masks/backgrounds.
 */

/** 8×8 Bayer threshold matrix, values 0 to 63, row-major. */
export const BAYER8: readonly number[] = (() => {
  let m = [[0]];
  for (let n = 1; n < 8; n *= 2) {
    const next = Array.from({ length: n * 2 }, () => new Array<number>(n * 2).fill(0));
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const v = m[y][x] * 4;
        next[y][x] = v;
        next[y][x + n] = v + 2;
        next[y + n][x] = v + 3;
        next[y + n][x + n] = v + 1;
      }
    }
    m = next;
  }
  return m.flat();
})();

/** Bayer threshold in [0, 1) for a pixel coordinate. */
export const bayer = (x: number, y: number) => (BAYER8[(y & 7) * 8 + (x & 7)] + 0.5) / 64;

const px = (x: number, y: number) => `M${x} ${y}h1v1h-1z`;

function svgUrl(cols: number, rows: number, d: string, scale: number, fill = "#000") {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * scale}" height="${rows * scale}" ` +
    `viewBox="0 0 ${cols} ${rows}" shape-rendering="crispEdges" fill="${fill}">` +
    (d ? `<path d="${d}"/>` : "") +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** An 8×8 tile with `level` of its 64 pixels lit, in Bayer order. */
export function ditherTile(level: number, scale = 1, fill = "#000") {
  let d = "";
  for (let i = 0; i < 64; i++) if (BAYER8[i] < level) d += px(i % 8, (i / 8) | 0);
  return svgUrl(8, 8, d, scale, fill);
}

const dissolveCache = new Map<number, string[]>();

/** 65 mask frames (0 to 64 lit pixels) used to dissolve elements in. */
export function dissolveSteps(scale: number) {
  let steps = dissolveCache.get(scale);
  if (!steps) {
    steps = Array.from({ length: 65 }, (_, level) => ditherTile(level, scale));
    dissolveCache.set(scale, steps);
  }
  return steps;
}

/**
 * Masks for a dithered ramp between two surfaces, with an optional accent
 * seam in the middle. `axis` is the direction the ramp travels.
 */
export function rampMasks(length: number, scale: number, { accent = 0, axis = "y" as "x" | "y" } = {}) {
  let end = "";
  let mid = "";
  for (let i = 0; i < length; i++) {
    const v = (i + 0.5) / length;
    // accent dots peak in the middle of the ramp and never fully fill
    const seam = accent * Math.pow(Math.sin(Math.PI * v), 2);
    for (let j = 0; j < 8; j++) {
      const [x, y] = axis === "y" ? [j, i] : [i, j];
      const t = bayer(x, y);
      if (v > t) end += px(x, y);
      else if (seam > bayer(x + 4, y + 2)) mid += px(x, y);
    }
  }
  const [cols, rows] = axis === "y" ? [8, length] : [length, 8];
  return {
    end: svgUrl(cols, rows, end, scale),
    mid: accent ? svgUrl(cols, rows, mid, scale) : null,
  };
}

/** The Auren mark: a pixel sun on the horizon over a dithered reflection. */
const GLYPH = [
  "...#####...",
  ".#########.",
  "###########",
  "###########",
  "###########",
  "...........",
  "#.#.#.#.#.#",
  ".#.#.#.#.#.",
  "...#...#...",
  ".....#.....",
];

export const GLYPH_CELLS: ReadonlyArray<readonly [number, number]> = GLYPH.flatMap((row, y) =>
  [...row].flatMap((c, x) => (c === "#" ? [[x, y] as const] : [])),
);

export const GLYPH_PATH = GLYPH_CELLS.map(([x, y]) => px(x, y)).join("");
