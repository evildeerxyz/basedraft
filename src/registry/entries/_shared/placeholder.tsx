/*
 * Stand-ins for pictures in the demos: gray boxes in the shape of a page, a dashboard, a photo,
 * the way a page looks while it loads. Each is drawn for the shape it's given, so it fills its box
 * whole, nothing cut at the edges. Inline, they're in the theme's ink and sit right on light and
 * dark; as an image URL, they're see-through grays.
 */

export type Layout = "landing" | "dashboard" | "article" | "shop" | "photo" | "portrait" | "board";

type Tone = 1 | 2 | 3;
/* A shape: a rounded box, a circle or a path, in tone 1 (faint) to 3 (strong). */
type Part = ["r", number, number, number, number, number, Tone] | ["c", number, number, number, Tone] | ["p", string, Tone];

/* Everything is drawn 320 wide; the height follows the shape asked for. */
const W = 320;
const box = (x: number, y: number, w: number, h: number, rx: number, t: Tone): Part => ["r", x, y, w, h, rx, t];
const n = (v: number) => Math.round(v * 10) / 10;

/** A sun and two peaks standing on the bottom of a box, kept inside its rounded corners. */
const peaks = (x: number, y: number, w: number, h: number, rx = 10): Part[] => [
  ["c", n(x + w * 0.72), n(y + h * 0.3), n(Math.min(w, h) * 0.1), 2],
  ["p", `M${n(x + rx)},${n(y + h)} L${n(x + w * 0.36)},${n(y + h * 0.42)} L${n(x + w * 0.56)},${n(y + h * 0.72)} L${n(x + w * 0.74)},${n(y + h * 0.52)} L${n(x + w - rx)},${n(y + h)} Z`, 2],
];

const LAYOUTS: Record<Layout, { ratio: number; draw: (H: number) => Part[] }> = {
  landing: {
    ratio: 1.6,
    draw: (H) => {
      const cardH = Math.min(60, Math.max(30, H * 0.2));
      const cards = H - 40 - cardH - 26 >= 92;
      const heroEnd = cards ? H - 12 - cardH - 14 : H - 14;
      const heroH = heroEnd - 40;
      const ty = 40 + Math.max(0, (heroH - 88) / 2);
      const parts: Part[] = [
        ["c", 20, 17, 5, 3],
        box(30, 14, 28, 6, 3, 2),
        box(178, 14, 22, 6, 3, 1),
        box(206, 14, 22, 6, 3, 1),
        box(234, 14, 22, 6, 3, 1),
        box(268, 9, 36, 16, 8, 3),
        box(16, ty, 132, 12, 6, 3),
        box(16, ty + 18, 98, 12, 6, 3),
        box(16, ty + 42, 124, 6, 3, 1),
        box(16, ty + 53, 108, 6, 3, 1),
        box(16, ty + 70, 50, 18, 9, 3),
        box(72, ty + 70, 50, 18, 9, 1),
        box(166, 40, 138, heroH, 10, 1),
        ...peaks(166, 40 + heroH * 0.25, 138, heroH * 0.75),
      ];
      if (cards) for (const x of [16, 115, 214]) parts.push(box(x, H - 12 - cardH, 90, cardH, 9, 1));
      return parts;
    },
  },
  dashboard: {
    ratio: 1.6,
    draw: (H) => {
      const parts: Part[] = [box(0, 0, 66, H, 0, 1), box(12, 14, 40, 9, 4.5, 3)];
      for (let k = 0, y = 38; y + 6 <= H - 16 && k < 9; k++, y += 14) parts.push(box(12, y, k === 1 ? 42 : 34, 6, 3, k === 1 ? 3 : 2));
      parts.push(box(80, 13, 86, 9, 4.5, 3), box(270, 10, 36, 14, 7, 2));
      [80, 158, 236].forEach((x, k) => parts.push(box(x, 34, 70, 42, 8, 1), box(x + 9, 43, 30, 5, 2.5, 2), box(x + 9, 55, [40, 32, 44][k], 11, 5.5, 3)));
      const top = 86;
      const ch = H - 10 - top;
      parts.push(box(80, top, 226, ch, 10, 1), box(92, top + 11, 60, 6, 3, 2));
      const [x0, x1, yT, yB] = [92, 294, top + 26, top + ch - 10];
      const pts = [[0, 0.85], [0.12, 0.72], [0.26, 0.52], [0.4, 0.6], [0.55, 0.38], [0.7, 0.44], [0.85, 0.16], [1, 0.24]];
      parts.push(["p", `M${x0},${yB} ${pts.map(([fx, fy]) => `L${n(x0 + fx * (x1 - x0))},${n(yT + fy * (yB - yT))}`).join(" ")} L${x1},${yB} Z`, 2]);
      return parts;
    },
  },
  article: {
    ratio: 0.8,
    draw: (H) => {
      const imgH = Math.min(150, Math.max(44, (H - 122) * 0.45));
      const parts: Part[] = [
        box(16, 16, 24, 9, 4.5, 3),
        box(272, 16, 32, 9, 4.5, 2),
        box(16, 44, 48, 6, 3, 2),
        box(16, 57, 250, 13, 6.5, 3),
        box(16, 76, 190, 13, 6.5, 3),
        ["c", 23, 104, 7, 2],
        box(36, 101, 72, 6, 3, 1),
        box(16, 122, 288, imgH, 10, 1),
        ...peaks(16, 122 + imgH * 0.2, 288, imgH * 0.8),
      ];
      const widths = [288, 268, 282, 236, 276, 198];
      for (let k = 0, y = 122 + imgH + 16; y + 6 <= H - 14; k++, y += 12) parts.push(box(16, y, widths[k % widths.length], 6, 3, 1));
      return parts;
    },
  },
  shop: {
    ratio: 1,
    draw: (H) => {
      const parts: Part[] = [box(16, 16, 44, 9, 4.5, 3), box(268, 13, 36, 15, 7.5, 2)];
      const rows = H >= 280 ? 2 : 1;
      const [cols, cw] = H < 230 ? [[16, 115, 214], 90] : [[16, 164], 140];
      const cardH = (H - 12 - 40 - (rows - 1) * 10) / rows;
      for (let r = 0; r < rows; r++)
        for (const x of cols) {
          const y = 40 + r * (cardH + 10);
          parts.push(box(x, y, cw, cardH, 10, 1), box(x + 8, y + 8, cw - 16, Math.max(16, cardH - 46), 7, 1), box(x + 8, y + cardH - 30, cw * 0.5, 6, 3, 2), box(x + 8, y + cardH - 18, 34, 6, 3, 3));
        }
      return parts;
    },
  },
  photo: {
    ratio: 1.5,
    draw: (H) => [
      ["c", n(W * 0.72), n(H * 0.3), n(Math.min(W, H) * 0.085), 2],
      ["p", `M0,${H} L0,${n(H * 0.74)} L${n(W * 0.24)},${n(H * 0.48)} L${n(W * 0.43)},${n(H * 0.7)} L${n(W * 0.64)},${n(H * 0.42)} L${W},${n(H * 0.8)} L${W},${H} Z`, 1],
      ["p", `M0,${H} L0,${n(H * 0.88)} Q${n(W * 0.22)},${n(H * 0.7)} ${n(W * 0.44)},${n(H * 0.84)} T${W},${n(H * 0.82)} L${W},${H} Z`, 2],
    ],
  },
  portrait: {
    ratio: 0.8,
    draw: (H) => {
      const r = Math.min(W, H) * 0.17;
      const top = H * 0.62;
      return [
        ["c", W / 2, n(H * 0.4), n(r), 2],
        ["p", `M${W * 0.15},${H} C${W * 0.15},${n(top + (H - top) * 0.3)} ${W * 0.32},${n(top)} ${W / 2},${n(top)} C${W * 0.68},${n(top)} ${W * 0.85},${n(top + (H - top) * 0.3)} ${W * 0.85},${H} Z`, 2],
      ];
    },
  },
  board: {
    ratio: 16 / 9,
    draw: (H) => {
      const parts: Part[] = [box(14, 13, 64, 9, 4.5, 3), ["c", 284, 17, 6, 2], ["c", 298, 17, 6, 2]];
      const fit = Math.max(1, Math.floor((H - 50 - 10 + 6) / 42));
      [14, 116, 218].forEach((x, col) => {
        parts.push(box(x, 36, 44, 6, 3, 2));
        for (let k = 0; k < Math.max(1, fit - col); k++) {
          const y = 50 + k * 42;
          parts.push(box(x, y, 88, 36, 8, 1), box(x + 9, y + 9, [58, 46, 62][k % 3], 5, 2.5, 2), box(x + 9, y + 21, [30, 38, 26][k % 3], 5, 2.5, 2));
        }
      });
      return parts;
    },
  },
};

const heightOf = (ratio: number) => Math.round(W / ratio);

/* The theme's ink, faint to strong, over a faint wash. */
const INK = { 0: "rgb(var(--bd-ink) / 0.045)", 1: "rgb(var(--bd-ink) / 0.06)", 2: "rgb(var(--bd-ink) / 0.1)", 3: "rgb(var(--bd-ink) / 0.15)" };

/**
 * A page, a photo or a person, in gray boxes, drawn for the shape given as ratio (width over
 * height): pass the shape of its box and it fills it whole. Give it a width in className.
 */
export function Placeholder({ layout = "landing", ratio, label, className }: { layout?: Layout; ratio?: number; label?: string; className?: string }) {
  const L = LAYOUTS[layout];
  const k = ratio ?? L.ratio;
  const H = heightOf(k);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={["block", className].filter(Boolean).join(" ")}
      style={{ aspectRatio: k, background: INK[0] }}
    >
      {L.draw(H).map((p, i) =>
        p[0] === "r" ? (
          <rect key={i} x={n(p[1])} y={n(p[2])} width={n(p[3])} height={n(p[4])} rx={p[5]} style={{ fill: INK[p[6]] }} />
        ) : p[0] === "c" ? (
          <circle key={i} cx={p[1]} cy={p[2]} r={p[3]} style={{ fill: INK[p[4]] }} />
        ) : (
          <path key={i} d={p[1]} style={{ fill: INK[p[2]] }} />
        ),
      )}
    </svg>
  );
}

/* The same in plain grays, for an <img>: see-through, so they take the color of what's behind. */
const GRAY = { 0: "rgb(128 128 128 / 0.12)", 1: "rgb(128 128 128 / 0.12)", 2: "rgb(128 128 128 / 0.2)", 3: "rgb(128 128 128 / 0.3)" };

/** A placeholder as an image URL, drawn for the shape given, for components that take a src. */
export function placeholderSrc(layout: Layout, ratio?: number) {
  const L = LAYOUTS[layout];
  const H = heightOf(ratio ?? L.ratio);
  const body = L.draw(H)
    .map((p) =>
      p[0] === "r"
        ? `<rect x='${n(p[1])}' y='${n(p[2])}' width='${n(p[3])}' height='${n(p[4])}' rx='${p[5]}' fill='${GRAY[p[6]]}'/>`
        : p[0] === "c"
          ? `<circle cx='${p[1]}' cy='${p[2]}' r='${p[3]}' fill='${GRAY[p[4]]}'/>`
          : `<path d='${p[1]}' fill='${GRAY[p[2]]}'/>`,
    )
    .join("");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${W * 4}' height='${H * 4}' viewBox='0 0 ${W} ${H}'><rect width='${W}' height='${H}' fill='${GRAY[0]}'/>${body}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
