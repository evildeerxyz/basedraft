"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/*
 * A word made of ink pixels. Each pixel springs to its place in the letters, and with dither on
 * the letters are lit from above: an ordered dither keeps every pixel at the crown and thins them
 * toward the foot, so the word reads like a print. Move through it and the pixels scatter from your
 * pointer and settle back. Give it several words and they sweep into one another in turn.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

type Dot = { x: number; y: number; vx: number; vy: number; tx: number; ty: number; a: number; out: boolean };

export type ParticleTextProps = {
  /** The words, shown in turn. One holds still. */
  words: string[];
  /** How long each word stays, in ms. */
  interval?: number;
  /** The box's height; the word is set as large as fits it. */
  height?: number;
  /** The space between pixels, in px. Smaller is finer and busier. */
  gap?: number;
  /** Lights the letters from above through an ordered dither; false fills them solid. */
  dither?: boolean;
  /** How far the pointer pushes pixels, in px. 0 turns it off. */
  repel?: number;
  /** The weight the word is set in. */
  weight?: number;
  className?: string;
};

export function ParticleText({ words, interval = 3200, height = 220, gap = 4, dither = true, repel = 90, weight = 600, className }: ParticleTextProps) {
  const [i, setI] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const still = useReducedMotion();
  const word = words[i % words.length] ?? "";
  const live = useRef({ word, dither, gap, repel, weight, still: !!still });
  useEffect(() => {
    live.current = { word, dither, gap, repel, weight, still: !!still };
  });

  // The next word, on a timer.
  useEffect(() => {
    if (words.length < 2) return;
    const t = setTimeout(() => setI((n) => n + 1), interval);
    return () => clearTimeout(t);
  }, [i, interval, words.length]);

  useEffect(() => {
    const el = box.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let dots: Dot[] = [];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let shownWord = "";
    let shownDither: boolean | null = null;
    let raf = 0;
    let ready = false;
    const pointer = { x: -9999, y: -9999 };

    /** Where the pixels go for a word: the letters drawn off-screen, then sampled on the grid. */
    const targets = (text: string) => {
      const L = live.current;
      const off = document.createElement("canvas");
      off.width = Math.max(1, Math.round(w));
      off.height = Math.max(1, Math.round(h));
      const o = off.getContext("2d", { willReadFrequently: true })!;
      const family = getComputedStyle(el).fontFamily || "sans-serif";
      let size = h * 0.78;
      o.font = `${L.weight} ${size}px ${family}`;
      const fit = o.measureText(text).width;
      if (fit > w * 0.94) size *= (w * 0.94) / fit;
      o.font = `${L.weight} ${size}px ${family}`;
      o.textAlign = "center";
      o.textBaseline = "middle";
      if (L.dither) {
        // Light from above: full at the crown, thinner toward the foot.
        const g = o.createLinearGradient(0, h / 2 - size * 0.42, 0, h / 2 + size * 0.42);
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(1, "rgba(0,0,0,0.28)");
        o.fillStyle = g;
      } else o.fillStyle = "#000";
      o.fillText(text, w / 2, h / 2 + size * 0.04);
      const data = o.getImageData(0, 0, off.width, off.height).data;
      const out: Array<[number, number]> = [];
      const step = L.gap;
      for (let y = 0, gy = 0; y < off.height; y += step, gy++) {
        for (let x = 0, gx = 0; x < off.width; x += step, gx++) {
          const a = data[(Math.floor(y) * off.width + Math.floor(x)) * 4 + 3] / 255;
          const keep = L.dither ? a * 16 > BAYER[(gy % 4) * 4 + (gx % 4)] + 0.5 : a > 0.5;
          if (keep) out.push([x, y]);
        }
      }
      return out;
    };

    /** Sends the pixels to a word: matched across by position so the change sweeps, the extras dissolve, the shortfall flies in. */
    const aim = (text: string, scatter: boolean) => {
      const T = targets(text).sort((p, q) => p[0] - q[0] || p[1] - q[1]);
      const keep = dots.filter((d) => !d.out).sort((p, q) => p.x - q.x);
      const next: Dot[] = [];
      T.forEach(([tx, ty], k) => {
        const d = keep[k];
        if (d) next.push({ ...d, tx, ty });
        else {
          const sx = scatter ? Math.random() * w : tx + (Math.random() - 0.5) * 160;
          const sy = scatter ? Math.random() * h : ty + (Math.random() - 0.5) * 160;
          next.push({ x: sx, y: sy, vx: 0, vy: 0, tx, ty, a: scatter ? 1 : 0, out: false });
        }
      });
      // The pixels this word doesn't need drift off and fade.
      keep.slice(T.length).forEach((d) => next.push({ ...d, tx: d.x + (Math.random() - 0.5) * 120, ty: d.y + (Math.random() - 0.5) * 120, out: true }));
      dots = next;
      shownWord = text;
      shownDither = live.current.dither;
    };

    const fit = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = el.clientWidth;
      h = el.clientHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      if (ready) aim(live.current.word, false);
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const L = live.current;
      if (!ready) return;
      if (L.word !== shownWord || L.dither !== shownDither) aim(L.word, false);
      const ink = getComputedStyle(cv).getPropertyValue("--bd-fg").trim() || "#111";
      const px = Math.max(1.4, L.gap * 0.62);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = ink;
      const R = L.repel;
      for (const d of dots) {
        if (L.still) {
          d.x = d.tx;
          d.y = d.ty;
          d.a = d.out ? 0 : 1;
        } else {
          d.vx += (d.tx - d.x) * 0.075;
          d.vy += (d.ty - d.y) * 0.075;
          if (R) {
            const dx = d.x - pointer.x;
            const dy = d.y - pointer.y;
            const dist = Math.hypot(dx, dy);
            if (dist < R && dist > 0.01) {
              const f = (1 - dist / R) * 5.5;
              d.vx += (dx / dist) * f;
              d.vy += (dy / dist) * f;
            }
          }
          d.vx *= 0.8;
          d.vy *= 0.8;
          d.x += d.vx;
          d.y += d.vy;
          d.a = d.out ? Math.max(0, d.a - 0.04) : Math.min(1, d.a + 0.06);
        }
        if (d.a <= 0) continue;
        ctx.globalAlpha = d.a;
        ctx.fillRect(d.x - px / 2, d.y - px / 2, px, px);
      }
      ctx.globalAlpha = 1;
      dots = dots.filter((d) => !d.out || d.a > 0);
    };

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };
    const leave = () => {
      pointer.x = pointer.y = -9999;
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    fit();
    // The letters are measured in the real typeface, so the font loads first.
    document.fonts.ready.then(() => {
      ready = true;
      aim(live.current.word, true);
    });
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={box} className={cx("relative w-full touch-none select-none", className)} style={{ height }}>
      <canvas ref={canvas} aria-hidden className="absolute inset-0 size-full" />
      <span aria-live="polite" className="sr-only">
        {word}
      </span>
    </div>
  );
}
