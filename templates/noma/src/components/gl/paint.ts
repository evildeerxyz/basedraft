"use client";

import { useEffect, useState } from "react";

/*
 * Printing onto WebGL surfaces: UI and labels are painted into a 2D
 * canvas and used as a texture, so text lies on the isometric plane.
 */

export const UI = {
  light: {
    surface: "#ffffff",
    surface2: "#f5f2ec",
    sunken: "#f0ece4",
    line: "#e2dccf",
    lineStrong: "#cfc7b6",
    ink: "#1d1a15",
    ink2: "#686156",
    ink3: "#a29a88",
    ink4: "#c4bcac",
    inverse: "#1d1a15",
    inverseFg: "#fbfaf7",
    accent: "#ff9e00",
    ok: "#00b383",
    okTint: "#d8f2e8",
    pink: "#f762f4",
    blue: "#009dff",
  },
  dark: {
    surface: "#1c1916",
    surface2: "#211e1a",
    sunken: "#131110",
    line: "#2c2824",
    lineStrong: "#3d3832",
    ink: "#f2ede3",
    ink2: "#b3a898",
    ink3: "#847a6d",
    ink4: "#5a5249",
    inverse: "#f2ede3",
    inverseFg: "#1d1a15",
    accent: "#ff9e00",
    ok: "#00b383",
    okTint: "#103a2c",
    pink: "#f762f4",
    blue: "#009dff",
  },
};

export type Pal = (typeof UI)["light"];

/** Texture pixels per world unit. */
export const PPU = 128;

export type G = { ctx: CanvasRenderingContext2D; pal: Pal; sans: string; mono: string };

export const px = (v: number) => v * PPU;

export function rect(g: G, x: number, y: number, w: number, h: number, fill?: string, stroke?: string, lineWidth = 0.022) {
  if (fill) {
    g.ctx.fillStyle = fill;
    g.ctx.fillRect(px(x), px(y), px(w), px(h));
  }
  if (stroke) {
    g.ctx.strokeStyle = stroke;
    g.ctx.lineWidth = px(lineWidth);
    g.ctx.strokeRect(px(x), px(y), px(w), px(h));
  }
}

export function text(g: G, s: string, x: number, y: number, size: number, color: string, opts: { weight?: number; mono?: boolean; align?: CanvasTextAlign } = {}) {
  g.ctx.font = `${opts.weight ?? 450} ${px(size)}px ${opts.mono ? g.mono : g.sans}`;
  g.ctx.fillStyle = color;
  g.ctx.textAlign = opts.align ?? "left";
  g.ctx.textBaseline = "middle";
  g.ctx.fillText(s, px(x), px(y));
}

export function dot(g: G, x: number, y: number, r: number, color: string) {
  g.ctx.fillStyle = color;
  g.ctx.beginPath();
  g.ctx.arc(px(x), px(y), px(r), 0, Math.PI * 2);
  g.ctx.fill();
}

/** Text that shrinks (never grows) to fit `maxWidth` world units, so it can never run past its field. */
export function fitText(g: G, s: string, x: number, y: number, size: number, maxWidth: number, color: string, opts: { weight?: number; mono?: boolean; align?: CanvasTextAlign } = {}) {
  g.ctx.font = `${opts.weight ?? 450} ${px(size)}px ${opts.mono ? g.mono : g.sans}`;
  const width = g.ctx.measureText(s).width / PPU;
  text(g, s, x, y, width > maxWidth ? (size * maxWidth) / width : size, color, opts);
}

/** Break `s` into lines no wider than `maxWidth` world units at `size`. */
export function wrapText(g: G, s: string, size: number, maxWidth: number, opts: { weight?: number; mono?: boolean } = {}) {
  g.ctx.font = `${opts.weight ?? 450} ${px(size)}px ${opts.mono ? g.mono : g.sans}`;
  const lines: string[] = [];
  let line = "";
  for (const word of s.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (line && g.ctx.measureText(next).width / PPU > maxWidth) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Fonts used inside the textures, resolved from the page so they match the site. */
export function resolveFonts() {
  const sans = getComputedStyle(document.body).fontFamily || "sans-serif";
  const mono = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-mono").trim() || "monospace";
  return { sans, mono };
}

export function useFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    document.fonts.ready.then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, []);
  return ready;
}

export type Painter<D> = (g: G, w: number, d: number, data: D) => void;
