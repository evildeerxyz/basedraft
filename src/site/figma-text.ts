/*
 * Text the way Figma stores it once laid out: every glyph's outline, placed where the browser
 * drew that character, with its line boxes and font facts. Figma draws a pasted text layer from
 * this straight away, even before it has the font. Outlines come from static copies of the
 * template typefaces in /fonts/figma, fetched only when someone copies.
 */
import type { Font } from "opentype.js";
import { pathBlob } from "./figma-geometry";
import type { FText } from "./figma-tree";

const FILES: Record<string, string> = { Geist: "Geist", "Geist Mono": "GeistMono", "Instrument Sans": "InstrumentSans", "Mona Sans": "MonaSans", "Inter Tight": "InterTight", Doto: "Doto" };
/** The weights each family has a static copy of; anything between draws from the nearest. */
const WEIGHTS: Record<string, number[]> = { Doto: [400, 500, 600, 700, 800, 900] };

interface Loaded {
  key: string;
  font: Font;
  digest: Uint8Array;
}

const cache = new Map<string, Promise<Loaded | null>>();

function load(family: string, weight: number) {
  const file = FILES[family];
  if (!file) return Promise.resolve(null);
  const w = (WEIGHTS[family] ?? [400, 500, 600, 700]).reduce((best, x) => (Math.abs(x - weight) < Math.abs(best - weight) ? x : best));
  const key = `${file}-${w}`;
  if (!cache.has(key))
    cache.set(
      key,
      (async () => {
        try {
          const [{ parse }, res] = await Promise.all([import("opentype.js"), fetch(`/fonts/figma/${key}.ttf`)]);
          if (!res.ok) return null;
          const buf = await res.arrayBuffer();
          return { key, font: parse(buf), digest: new Uint8Array(await crypto.subtle.digest("SHA-1", buf)) };
        } catch {
          return null;
        }
      })(),
    );
  return cache.get(key)!;
}

export interface TextStyle {
  weight?: number;
}

/**
 * Figma's derivedTextData for one text layer. `ids` gives each character's style (0 for the
 * layer's own), `styles[id - 1]` its weight, and `blob` stores an outline once per glyph.
 */
export async function derivedText(t: FText, w: number, ids: number[], styles: TextStyle[], blob: (key: string, make: () => Uint8Array) => number, fontName: (weight: number) => unknown) {
  const boxes = t.boxes;
  if (!boxes) return null;
  const weightOf = (k: number) => (ids[k] ? (styles[ids[k] - 1]?.weight ?? t.weight) : t.weight);
  const weights = [...new Set(t.chars.split("").map((_, k) => weightOf(k)))];
  const fonts = new Map<number, Loaded>();
  for (const wt of weights) {
    const f = await load(t.family, wt);
    if (!f) return null;
    fonts.set(wt, f);
  }

  // Visual lines: characters whose boxes share a top. A line runs up to the next line's first character.
  const lines: Array<{ s: number; top: number; h: number; left: number; right: number }> = [];
  let newline = false;
  for (let k = 0; k < t.chars.length; k++) {
    if (t.chars[k] === "\n") {
      newline = true;
      continue;
    }
    const [x, y, cw, ch] = boxes.slice(k * 4, k * 4 + 4);
    if (cw < 0) continue;
    const line = lines[lines.length - 1];
    if (!line || newline || Math.abs(y - line.top) > ch * 0.5) lines.push({ s: line ? k : 0, top: y, h: ch, left: x, right: x + cw });
    else if (t.chars[k] !== " ") {
      line.left = Math.min(line.left, x);
      line.right = Math.max(line.right, x + cw);
    }
    newline = false;
  }
  if (!lines.length) return null;

  // A character box is the font's ascent plus descent; find which of the font's metric sets the
  // browser used by matching that height, and the baseline sits one ascent below the box top.
  const main = fonts.get(t.weight) ?? [...fonts.values()][0];
  const upm = main.font.unitsPerEm;
  const hhea = main.font.tables.hhea as unknown as { ascender: number; descender: number };
  const os2 = (main.font.tables.os2 ?? {}) as unknown as { sTypoAscender?: number; sTypoDescender?: number; usWinAscent?: number; usWinDescent?: number };
  const sets = [
    [hhea.ascender, -hhea.descender],
    [os2.sTypoAscender ?? 0, -(os2.sTypoDescender ?? 0)],
    [os2.usWinAscent ?? 0, os2.usWinDescent ?? 0],
  ].filter(([a, d]) => a > 0 && a + d > 0);
  const heights = lines.map((l) => l.h).sort((a, b) => a - b);
  const drawn = heights[Math.floor(heights.length / 2)];
  const [asc] = sets.reduce((best, s) => (Math.abs(((s[0] + s[1]) * t.size) / upm - drawn) < Math.abs(((best[0] + best[1]) * t.size) / upm - drawn) ? s : best), sets[0] ?? [upm * 0.9, upm * 0.25]);
  const ascent = (asc * t.size) / upm;

  const baselines = lines.map((l, i) => {
    const baseline = l.top + ascent;
    const lineY = l.top - (t.lh - l.h) / 2;
    return {
      position: { x: l.left, y: baseline },
      width: Math.max(0, l.right - l.left),
      lineY,
      lineHeight: t.lh,
      lineAscent: baseline - lineY,
      firstCharacter: l.s,
      endCharacter: i + 1 < lines.length ? lines[i + 1].s : t.chars.length,
    };
  });
  const lineOf = (k: number) => {
    let i = 0;
    while (i + 1 < baselines.length && baselines[i + 1].firstCharacter <= k) i++;
    return baselines[i];
  };

  const glyphs: Array<Record<string, unknown>> = [];
  const offsets: number[] = [];
  let lastX = 0;
  for (let k = 0; k < t.chars.length; k++) {
    const ch = t.chars[k];
    const [x, , cw] = boxes.slice(k * 4, k * 4 + 3);
    offsets.push(cw >= 0 ? x : lastX);
    if (cw >= 0) lastX = x + cw;
    if (cw < 0 || /\s/.test(ch)) continue;
    const f = fonts.get(weightOf(k))!;
    const glyph = f.font.charToGlyph(ch);
    if (!glyph || glyph.index === 0) continue;
    const upm = f.font.unitsPerEm;
    const commandsBlob = blob(`${f.key}|${glyph.index}`, () =>
      pathBlob(
        glyph.path.commands.map((c) => {
          if (c.type === "M") return [1, c.x / upm, c.y / upm];
          if (c.type === "L") return [2, c.x / upm, c.y / upm];
          if (c.type === "Q") return [3, c.x1 / upm, c.y1 / upm, c.x / upm, c.y / upm];
          if (c.type === "C") return [4, c.x1 / upm, c.y1 / upm, c.x2 / upm, c.y2 / upm, c.x / upm, c.y / upm];
          return [0];
        }),
      ),
    );
    glyphs.push({
      commandsBlob,
      position: { x, y: lineOf(k).position.y },
      fontSize: t.size,
      firstCharacter: k,
      advance: (glyph.advanceWidth ?? 0) / upm,
      rotation: 0,
      ...(ids[k] ? { styleID: ids[k] } : {}),
    });
  }

  return {
    layoutSize: { x: w, y: t.h },
    baselines,
    glyphs,
    fontMetaData: [...fonts].map(([wt, f]) => {
      const hhea = f.font.tables.hhea as unknown as { ascender: number; descender: number; lineGap: number };
      return {
        key: fontName(wt),
        fontLineHeight: (hhea.ascender - hhea.descender + hhea.lineGap) / f.font.unitsPerEm,
        fontDigest: f.digest,
        fontStyle: t.italic ? "ITALIC" : "NORMAL",
        fontWeight: wt,
      };
    }),
    truncationStartIndex: -1,
    truncatedHeight: -1,
    logicalIndexToCharacterOffsetMap: offsets,
    derivedLines: t.chars.split("\n").map(() => ({ directionality: "LTR" })),
  };
}
