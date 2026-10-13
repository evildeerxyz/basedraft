"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { bayer8 } from "@/lib/dither";

/*
 * Studio, presented: a screenshot in a window, on an ink stage with an ordered dither rising behind
 * it like light from below. The stage is drawn in ink, so in dark mode it turns light, and the dark
 * Studio shot sits on it.
 */

/** One dot, in CSS pixels. */
const CELL = 3;

/**
 * How lit the stage is at (u, v), each 0 to 1 across and down: light spilling from behind the
 * window, strongest just under it, gone by the corners.
 */
function light(u: number, v: number) {
  const behind = Math.max(0, 1 - Math.hypot((u - 0.5) / 0.66, (v - 0.62) / 0.62));
  return Math.min(0.94, behind ** 1.15 * 1.25);
}

function Dither() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const box = c?.parentElement;
    if (!c || !box) return;
    const draw = () => {
      const w = box.clientWidth;
      const h = box.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const px = CELL * dpr;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      const ctx = c.getContext("2d");
      if (!ctx) return;
      // The page's own color, so the dots are white on the ink stage and ink on the light one.
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--bd-bg").trim() || "#fff";
      ctx.globalAlpha = 0.34;
      const cols = Math.ceil(w / CELL);
      const rows = Math.ceil(h / CELL);
      for (let y = 0; y < rows; y++) {
        // Runs of lit dots in a row go down as one rectangle.
        let run = -1;
        for (let x = 0; x <= cols; x++) {
          const on = x < cols && light(x / cols, y / rows) > bayer8(x, y);
          if (on && run < 0) run = x;
          if (!on && run >= 0) {
            ctx.fillRect(Math.round(run * px), Math.round(y * px), Math.round((x - run) * px), Math.round(px));
            run = -1;
          }
        }
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(box);
    // Light and dark swap the stage's colors.
    const mo = new MutationObserver(draw);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, []);
  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 -z-10 size-full" />;
}

export function StudioStage() {
  return (
    // On a phone the whole of Studio would be too small to read: the stage stands upright and the
    // window shows its left half, the layers and the selected hero, at twice the size.
    <div className="bd-reveal relative isolate grid aspect-[5/7] place-items-center overflow-hidden rounded-[var(--bd-r-sheet)] bg-fg sm:aspect-[16/10]">
      <Dither />
      <div className="w-[90%] overflow-hidden rounded-[8px] bg-surface shadow-[0_40px_90px_-30px_rgba(0,0,0,0.75),0_0_0_1px_rgb(var(--bd-paper)/0.14)] sm:w-[78%]">
        {/* A window around it, so it reads as an app on a screen. */}
        <div aria-hidden className="flex h-7 items-center gap-1.5 border-b border-line px-3 sm:h-8">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-2 rounded-full bg-fg/15 sm:size-2.5" />
          ))}
        </div>
        <div className="relative aspect-[4/5] bg-well sm:aspect-[16/10]">
          <Image src="/shots/studio-stage.jpg" alt="Studio with Zuno open: its sections as layers on the left, the hero selected on the canvas, and its words in the inspector" fill quality={85} sizes="(min-width: 1024px) 860px, 180vw" className="object-cover object-[22%_50%] dark:hidden sm:object-center" />
          <Image src="/shots/studio-stage-dark.jpg" alt="" aria-hidden fill quality={85} sizes="(min-width: 1024px) 860px, 180vw" className="hidden object-cover object-[22%_50%] dark:block sm:object-center" />
        </div>
      </div>
    </div>
  );
}
