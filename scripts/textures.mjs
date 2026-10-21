/*
 * The dot field's tile: square marks on a grid, each its own weight, about a third of the grid
 * left empty. basedraft's texture, behind the hero and printed through the mark at the foot of
 * every page. Written to public/textures, once:
 *   node scripts/textures.mjs
 *
 * It has to be an image: a CSS gradient draws the same mark at every point of a grid, and what
 * makes this a texture is that no two marks match and some aren't there. The squares stay
 * square because they sit on whole pixels and are drawn at their final size, never scaled.
 * Seeded, so every run writes the same bytes.
 */
import { mkdirSync } from "node:fs";
import sharp from "sharp";

/** Ink, at up to 17%: the page shows through, so the tile sits on any paper without bringing its own. */
const INK = [0x1f, 0x20, 0x24];
const MAX_ALPHA = 44;
/** The share of the grid left empty. */
const MISSING = 0.3;
const SEED = 7;

/* A small seeded random number generator (mulberry32): the same tile on every run. */
function random(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/*
 * Each tile is written twice: as printed (MAX_ALPHA), and lit, the same marks at up to full
 * strength, for the light that falls on the field (the pointer's and the flickering patches').
 * Same seed, same draws, so a lit mark sits exactly on its printed one.
 */
async function tile({ size, pitch, square, file, max = MAX_ALPHA, ink = INK }) {
  const next = random(SEED);
  const px = Buffer.alloc(size * size * 4);
  for (let gy = 0; gy < size; gy += pitch)
    for (let gx = 0; gx < size; gx += pitch) {
      if (next() < MISSING) continue;
      // From a fifth of full weight to full, so neighbours rarely match.
      const alpha = Math.round(max * (0.2 + next() * 0.8));
      for (let dy = 0; dy < square; dy++)
        for (let dx = 0; dx < square; dx++) {
          const i = ((gy + dy) * size + gx + dx) * 4;
          px.set([...ink, alpha], i);
        }
    }
  await sharp(px, { raw: { width: size, height: size, channels: 4 } }).png({ compressionLevel: 9 }).toFile(`public/textures/${file}`);
  console.log(file, `${size}px, a mark every ${pitch}px`);
}

mkdirSync("public/textures", { recursive: true });
await tile({ size: 240, pitch: 6, square: 2, file: "dots.png" });
await tile({ size: 240, pitch: 6, square: 2, file: "dots-lit.png", max: 255 });
/*
 * The fine texture every gradient surface wears: a smaller mark on a tighter grid, faint, in ink
 * for light mode and in white for dark, each at 1x and 2x (the 2x drawn at twice every measure).
 */
const WHITE = [0xff, 0xff, 0xff];
await tile({ size: 240, pitch: 4, square: 1, file: "dots-fine.png", max: 30 });
await tile({ size: 480, pitch: 8, square: 2, file: "dots-fine@2x.png", max: 30 });
await tile({ size: 240, pitch: 4, square: 1, file: "dots-fine-dark.png", max: 22, ink: WHITE });
await tile({ size: 480, pitch: 8, square: 2, file: "dots-fine-dark@2x.png", max: 22, ink: WHITE });

