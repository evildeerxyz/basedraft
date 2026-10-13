"use client";

import { useEffect, useRef } from "react";
import { bayer } from "@/lib/dither";
import { prefersReducedMotion } from "@/lib/hooks";
import { THEME_EVENT, cn } from "@/lib/site";

/**
 * The wordmark as a field of dither dots. Dots flee the cursor, glow in the
 * accent while displaced, and spring back. It assembles itself on first view.
 */
export function DitherWordmark({ text = "Auren", className }: { text?: string; className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = prefersReducedMotion();

    // per dot: x, y, homeX, homeY, vx, vy
    let dots = new Float32Array(0);
    let count = 0;
    let cell = 6;
    let W = 0;
    let H = 0;
    let raf = 0;
    let running = false;
    let started = reduced;
    let colors = { paper: "#efebe2", accent: "#f2a23a" };
    const pointer = { x: 0, y: 0, active: false };

    const readColors = () => {
      const cs = getComputedStyle(wrap);
      colors = { paper: cs.getPropertyValue("--paper").trim(), accent: cs.getPropertyValue("--accent").trim() };
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const s = cell - 1;
      for (const pass of [0, 1]) {
        ctx.fillStyle = pass ? colors.accent : colors.paper;
        ctx.beginPath();
        for (let i = 0; i < count; i++) {
          const o = i * 6;
          const off = Math.abs(dots[o] - dots[o + 2]) + Math.abs(dots[o + 1] - dots[o + 3]) > 4;
          if (off === !!pass) ctx.rect(Math.round(dots[o]), Math.round(dots[o + 1]), s, s);
        }
        ctx.fill();
      }
    };

    const step = () => {
      const R = Math.max(70, W * 0.075);
      const R2 = R * R;
      let moving = false;
      for (let i = 0; i < count; i++) {
        const o = i * 6;
        let x = dots[o];
        let y = dots[o + 1];
        let vx = dots[o + 4];
        let vy = dots[o + 5];
        if (pointer.active) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R2 && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const f = (1 - d / R) * 2.4;
            vx += (dx / d) * f;
            vy += (dy / d) * f;
          }
        }
        vx = (vx + (dots[o + 2] - x) * 0.05) * 0.85;
        vy = (vy + (dots[o + 3] - y) * 0.05) * 0.85;
        x += vx;
        y += vy;
        dots[o] = x;
        dots[o + 1] = y;
        dots[o + 4] = vx;
        dots[o + 5] = vy;
        if (!moving && Math.abs(vx) + Math.abs(vy) + Math.abs(x - dots[o + 2]) + Math.abs(y - dots[o + 3]) > 0.15)
          moving = true;
      }
      return moving;
    };

    const loop = () => {
      const moving = step();
      draw();
      if (moving) raf = requestAnimationFrame(loop);
      else running = false;
    };

    const kick = () => {
      if (running || !started || reduced) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };

    let generation = 0;
    const build = async () => {
      const gen = ++generation;
      const width = wrap.clientWidth;
      if (!width) return;
      const family = getComputedStyle(wrap).fontFamily;
      const font = (size: number) => `620 ${size}px ${family}`;
      try {
        await document.fonts.load(font(200), text);
      } catch {}
      if (gen !== generation) return;

      cell = width < 640 ? 4 : width < 1100 ? 5 : 6;
      const off = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
      const setFont = (size: number) => {
        off.font = font(size);
        off.fontStretch = "semi-expanded";
        off.letterSpacing = `${-0.035 * size}px`;
      };
      setFont(200);
      const probe = off.measureText(text);
      const size = (200 * width) / (probe.actualBoundingBoxLeft + probe.actualBoundingBoxRight);
      setFont(size);
      const m = off.measureText(text);
      W = width;
      H = Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + cell * 2;
      off.canvas.width = W;
      off.canvas.height = H;
      setFont(size);
      off.fillStyle = "#fff";
      off.fillText(text, m.actualBoundingBoxLeft, m.actualBoundingBoxAscent + cell);
      const data = off.getImageData(0, 0, W, H).data;

      const pts: number[] = [];
      for (let gy = 0; gy * cell < H; gy++) {
        for (let gx = 0; gx * cell < W; gx++) {
          const sx = Math.min(W - 1, gx * cell + (cell >> 1));
          const sy = Math.min(H - 1, gy * cell + (cell >> 1));
          if (data[(sy * W + sx) * 4 + 3] < 128) continue;
          // solid at the top, dissolving toward the baseline: the horizon motif
          const shade = 1.25 - (sy / H) * 1.15;
          if (shade < bayer(gx, gy)) continue;
          pts.push(gx * cell, gy * cell);
        }
      }

      count = pts.length / 2;
      dots = new Float32Array(count * 6);
      for (let i = 0; i < count; i++) {
        const o = i * 6;
        const hx = pts[i * 2];
        const hy = pts[i * 2 + 1];
        dots[o + 2] = hx;
        dots[o + 3] = hy;
        if (started) {
          dots[o] = hx;
          dots[o + 1] = hy;
        } else {
          // scattered until it scrolls into view
          dots[o] = hx + (Math.random() - 0.5) * W * 0.5;
          dots[o + 1] = hy + (Math.random() - 0.2) * H * 2.2;
        }
      }

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      wrap.style.aspectRatio = "auto";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      readColors();
      draw();
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.active = true;
      kick();
    };
    const onLeave = () => {
      pointer.active = false;
      kick();
    };

    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(build, 120);
    });
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started) return;
        started = true;
        kick();
      },
      { threshold: 0.35 },
    );
    const onTheme = () => {
      readColors();
      draw();
    };

    build();
    ro.observe(wrap);
    io.observe(wrap);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    window.addEventListener(THEME_EVENT, onTheme);

    return () => {
      generation++;
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      ro.disconnect();
      io.disconnect();
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      window.removeEventListener(THEME_EVENT, onTheme);
    };
  }, [text]);

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label={text}
      className={cn("relative aspect-[3.4/1] touch-pan-y select-none", className)}
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
