"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

/*
 * A box that scrolls the way the browser does (wheel, touch, keys, momentum) with a quieter bar:
 * a slim thumb that wakes when you point at the box or scroll it, that you can drag, and a track
 * that pages when clicked. Each edge fades only while there's more past it, as a soft gradient or
 * as an ordered dither that dissolves the content into dots, so the box says which way there's more.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* A 4 by 4 ordered-dither matrix: which cells of an edge stay lit as it fades out. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const EDGE = 27;
const CELL = 3;

/** An edge as a dithered mask: cells lit more the further they are from the edge. */
function ditherBand(side: "top" | "bottom" | "left" | "right") {
  const rows = EDGE / CELL;
  const across = side === "top" || side === "bottom";
  let rects = "";
  for (let r = 0; r < rows; r++) {
    const lit = (r + 0.5) / rows;
    for (let c = 0; c < 4; c++) {
      if ((BAYER[(r % 4) * 4 + c] + 0.5) / 16 > lit) continue;
      // r counts from the edge inward.
      const depth = side === "top" || side === "left" ? r : rows - 1 - r;
      const [x, y] = across ? [c * CELL, depth * CELL] : [depth * CELL, c * CELL];
      rects += `<rect x='${x}' y='${y}' width='${CELL}' height='${CELL}'/>`;
    }
  }
  const [w, h] = across ? [4 * CELL, EDGE] : [EDGE, 4 * CELL];
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${rects}</svg>`)}")`;
}
const DITHER = { top: ditherBand("top"), bottom: ditherBand("bottom"), left: ditherBand("left"), right: ditherBand("right") };
const SOLID = "linear-gradient(#000,#000)";

/** The mask for one axis: each end faded while there's more that way, solid otherwise. */
function edges(fade: "gradient" | "dither", across: boolean, start: boolean, end: boolean) {
  const [a, b] = across ? (["left", "right"] as const) : (["top", "bottom"] as const);
  const size = across ? `${EDGE}px 100%` : `100% ${EDGE}px`;
  const repeat = across ? "repeat-y" : "repeat-x";
  const layer = (side: "top" | "bottom" | "left" | "right", more: boolean) =>
    !more ? `${SOLID} ${side} / ${size} no-repeat` : fade === "dither" ? `${DITHER[side]} ${side} / ${across ? `${EDGE}px ${4 * CELL}px` : `${4 * CELL}px ${EDGE}px`} ${repeat}` : `linear-gradient(to ${side === "top" ? "bottom" : side === "bottom" ? "top" : side === "left" ? "right" : "left"}, transparent, #000) ${side} / ${size} no-repeat`;
  const middle = `${SOLID} center / ${across ? `calc(100% - ${2 * EDGE}px) 100%` : `100% calc(100% - ${2 * EDGE}px)`} no-repeat`;
  return `${layer(a, start)}, ${middle}, ${layer(b, end)}`;
}

export type ScrollAreaProps = {
  children: ReactNode;
  /** Which way it scrolls. */
  orientation?: "vertical" | "horizontal" | "both";
  /** How the edges fade while there's more past them: a gradient, an ordered dither, or not at all. */
  fade?: "gradient" | "dither" | "none";
  /** The most it grows to before it scrolls. Or give it a height in className. */
  maxHeight?: number | string;
  /** Names the box for screen readers, so the keys can reach and scroll it. */
  label?: string;
  className?: string;
  /** Added to the box that scrolls, for padding. */
  viewportClassName?: string;
};

type Metrics = { ch: number; sh: number; st: number; cw: number; sw: number; sl: number };

export function ScrollArea({ children, orientation = "vertical", fade = "gradient", maxHeight, label, className, viewportClassName }: ScrollAreaProps) {
  const view = useRef<HTMLDivElement>(null);
  const [m, setM] = useState<Metrics>({ ch: 0, sh: 0, st: 0, cw: 0, sw: 0, sl: 0 });
  const [awake, setAwake] = useState(false);
  const [held, setHeld] = useState(false);
  const sleep = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = view.current;
    if (!el) return;
    const measure = () => setM({ ch: el.clientHeight, sh: el.scrollHeight, st: el.scrollTop, cw: el.clientWidth, sw: el.scrollWidth, sl: el.scrollLeft });
    const frame = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      if (sleep.current) clearTimeout(sleep.current);
    };
  }, []);

  const wake = () => {
    setAwake(true);
    if (sleep.current) clearTimeout(sleep.current);
    sleep.current = setTimeout(() => setAwake(false), 900);
  };

  const vertical = orientation !== "horizontal";
  const horizontal = orientation !== "vertical";
  const canY = vertical && m.sh > m.ch + 1;
  const canX = horizontal && m.sw > m.cw + 1;
  const more = { top: canY && m.st > 1, bottom: canY && m.st + m.ch < m.sh - 1, left: canX && m.sl > 1, right: canX && m.sl + m.cw < m.sw - 1 };
  // Fades on one axis only: with both, the up and down edges.
  const mask = fade === "none" ? undefined : vertical ? edges(fade, false, more.top, more.bottom) : edges(fade, true, more.left, more.right);
  const style: CSSProperties = { maxHeight, ...(mask ? { mask, WebkitMask: mask } : {}) };

  /** Dragging a thumb: it moves the content the same share of the way. */
  const drag = (axis: "y" | "x", e: ReactPointerEvent<HTMLSpanElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const el = view.current;
    if (!el) return;
    const thumb = e.currentTarget;
    thumb.setPointerCapture(e.pointerId);
    setHeld(true);
    const from = axis === "y" ? e.clientY : e.clientX;
    const start = axis === "y" ? el.scrollTop : el.scrollLeft;
    const track = (axis === "y" ? thumb.parentElement!.clientHeight - thumb.offsetHeight : thumb.parentElement!.clientWidth - thumb.offsetWidth) || 1;
    const range = axis === "y" ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
    const move = (ev: PointerEvent) => {
      const d = ((axis === "y" ? ev.clientY : ev.clientX) - from) * (range / track);
      if (axis === "y") el.scrollTop = start + d;
      else el.scrollLeft = start + d;
    };
    const up = () => {
      setHeld(false);
      thumb.removeEventListener("pointermove", move);
      thumb.removeEventListener("pointerup", up);
      thumb.removeEventListener("pointercancel", up);
    };
    thumb.addEventListener("pointermove", move);
    thumb.addEventListener("pointerup", up);
    thumb.addEventListener("pointercancel", up);
  };
  /** Clicking the track: a page toward where you clicked. */
  const page = (axis: "y" | "x", e: ReactPointerEvent<HTMLDivElement>) => {
    const el = view.current;
    if (!el || e.target !== e.currentTarget) return;
    const thumb = e.currentTarget.firstElementChild!.getBoundingClientRect();
    const forward = axis === "y" ? e.clientY > thumb.bottom : e.clientX > thumb.right;
    if (axis === "y") el.scrollBy({ top: (forward ? 1 : -1) * el.clientHeight * 0.9, behavior: "smooth" });
    else el.scrollBy({ left: (forward ? 1 : -1) * el.clientWidth * 0.9, behavior: "smooth" });
  };

  const thumbY = canY ? { size: Math.max(28, (m.ch / m.sh) * (m.ch - 8)), at: 0 } : null;
  if (thumbY) thumbY.at = (m.st / (m.sh - m.ch)) * (m.ch - 8 - thumbY.size);
  const thumbX = canX ? { size: Math.max(28, (m.cw / m.sw) * (m.cw - 8)), at: 0 } : null;
  if (thumbX) thumbX.at = (m.sl / (m.sw - m.cw)) * (m.cw - 8 - thumbX.size);
  const shown = awake || held;

  return (
    <div className={cx("group/scroll relative min-h-0", className)} onPointerEnter={wake} onPointerMove={() => !awake && wake()}>
      <div
        ref={view}
        tabIndex={label ? 0 : undefined}
        role={label ? "region" : undefined}
        aria-label={label}
        onScroll={() => {
          const el = view.current;
          if (el) setM({ ch: el.clientHeight, sh: el.scrollHeight, st: el.scrollTop, cw: el.clientWidth, sw: el.scrollWidth, sl: el.scrollLeft });
          wake();
        }}
        style={style}
        className={cx(
          "size-full overscroll-contain outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]",
          vertical ? "overflow-y-auto" : "overflow-y-hidden",
          horizontal ? "overflow-x-auto" : "overflow-x-hidden",
          viewportClassName,
        )}
      >
        <div className={horizontal ? "w-max min-w-full" : undefined}>{children}</div>
      </div>
      {thumbY && (
        <div aria-hidden onPointerDown={(e) => page("y", e)} className="absolute bottom-1 right-0.5 top-1 w-3">
          <span
            onPointerDown={(e) => drag("y", e)}
            className={cx("absolute right-[3px] w-[5px] rounded-full bg-[rgb(var(--bd-ink)/0.26)] transition-[opacity,background-color,width] duration-200 hover:w-[7px] hover:bg-[rgb(var(--bd-ink)/0.42)]", shown ? "opacity-100" : "opacity-0", held && "w-[7px] bg-[rgb(var(--bd-ink)/0.5)]")}
            style={{ height: thumbY.size, transform: `translateY(${thumbY.at}px)` }}
          />
        </div>
      )}
      {thumbX && (
        <div aria-hidden onPointerDown={(e) => page("x", e)} className="absolute bottom-0.5 left-1 right-1 h-3">
          <span
            onPointerDown={(e) => drag("x", e)}
            className={cx("absolute bottom-[3px] h-[5px] rounded-full bg-[rgb(var(--bd-ink)/0.26)] transition-[opacity,background-color,height] duration-200 hover:h-[7px] hover:bg-[rgb(var(--bd-ink)/0.42)]", shown ? "opacity-100" : "opacity-0", held && "h-[7px] bg-[rgb(var(--bd-ink)/0.5)]")}
            style={{ width: thumbX.size, transform: `translateX(${thumbX.at}px)` }}
          />
        </div>
      )}
    </div>
  );
}
