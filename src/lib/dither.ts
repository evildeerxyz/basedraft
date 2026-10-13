/**
 * Ordered-dithering helpers shared by the canvas, SVG and CSS dither effects.
 * The Bayer matrix is built recursively: M(2n) = [[4M, 4M+2], [4M+3, 4M+1]].
 */
function buildBayer(size: number) {
  let m = [[0]];
  for (let n = 1; n < size; n *= 2) {
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
  const total = size * size;
  return m.map((row) => row.map((v) => (v + 0.5) / total));
}

export const BAYER4 = buildBayer(4);
export const BAYER8 = buildBayer(8);

export const bayer8 = (x: number, y: number) => BAYER8[y & 7][x & 7];

/**
 * A tiling SVG data-URI that renders `level` (0 to 1) coverage as a 4×4 Bayer
 * pattern. Use as a CSS background-image for crisp, resolution-independent
 * dithered fills.
 */
export function ditherTile(color: string, level: number, cell = 2) {
  const size = 4 * cell;
  let rects = "";
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      if (BAYER4[y][x] < level) {
        rects += `<rect x='${x * cell}' y='${y * cell}' width='${cell}' height='${cell}'/>`;
      }
    }
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' shape-rendering='crispEdges' fill='${color}'>${rects}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export const ditherStyle = (color: string, level: number, cell = 2) => ({
  backgroundImage: ditherTile(color, level, cell),
  backgroundSize: `${cell * 4}px ${cell * 4}px`,
});

/** 17 mask tiles (0/16 … 16/16 coverage) for the dithered text reveal. */
const maskCache = new Map<number, string[]>();
export function ditherMasks(cell = 3) {
  let masks = maskCache.get(cell);
  if (!masks) {
    masks = Array.from({ length: 17 }, (_, k) => ditherTile("#000", k / 16 + 0.001, cell));
    maskCache.set(cell, masks);
  }
  return masks;
}
