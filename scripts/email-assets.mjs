/*
 * The images basedraft's emails use, as PNGs (email clients don't draw SVG), written into
 * convex/emails/assets.ts and served by the Convex deployment at /email/<name>.png.
 *   node scripts/email-assets.mjs
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const BAYER4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]].map((r) => r.map((v) => (v + 0.5) / 16));

// The mark at 2x the 32px it's shown at, in ink and, for mail apps in dark mode, in near white.
const icon = readFileSync("src/app/icon.svg", "utf8").replace(/<style>[\s\S]*?<\/style>/, "");
const markIn = (color) => sharp(Buffer.from(icon.replace("<path ", `<path fill="${color}" `).replace(/<path d="([^"]+)" fill-opacity/, `<path fill="${color}" d="$1" fill-opacity`)), { density: 300 }).resize(64, 64).png().toBuffer();
const mark = await markIn("#121212");
const markLight = await markIn("#ededed");

// The dithered band along the top of the card, at 2x its 480 × 28: dots thinning out downward.
const W = 960, H = 56, CELL = 4;
const px = Buffer.alloc(W * H * 4);
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
    const level = 0.5 * (1 - cy / (H / CELL));
    if (level <= BAYER4[cy % 4][cx % 4]) continue;
    const i = (y * W + x) * 4;
    px[i] = px[i + 1] = px[i + 2] = 20;
    px[i + 3] = 34;
  }
const sky = await sharp(px, { raw: { width: W, height: H, channels: 4 } }).png({ palette: true }).toBuffer();

// Each file's name carries a hash of its bytes: mail apps and CDNs cache images for a long time,
// so a changed image needs a new address.
const files = { mark, "mark-light": markLight, sky };
const entries = Object.entries(files).map(([name, buf]) => [name, `/email/${name}-${createHash("sha256").update(buf).digest("hex").slice(0, 10)}.png`, buf.toString("base64")]);
writeFileSync(
  "convex/emails/assets.ts",
  `/* Written by scripts/email-assets.mjs. The emails' images, each served at its path. */\nexport const ASSETS: Record<string, { path: string; data: string }> = {\n${entries.map(([n, path, data]) => `  ${JSON.stringify(n)}: { path: "${path}", data: "${data}" },`).join("\n")}\n};\n`,
);
console.log("mark", mark.length, "bytes; sky", sky.length, "bytes");
