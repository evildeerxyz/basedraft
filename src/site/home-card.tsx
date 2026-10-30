"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { DitherLight } from "./dither-light";
import { HomeSearch } from "./home-search";

/*
 * The home page's card, with the header's capsule and the search set into its edges: each sits
 * half on the page and half in a pocket cut into the card, the pocket keeping the same gap all
 * round it, its ends following the pill's own curve and its corners rounding into the edge. The
 * outline is drawn from the measured sizes of the card, the capsule and the search, and drawn
 * again whenever any of them changes. On a desk only: on a smaller screen the header and the
 * search are as wide as the card, so the card sits under the header and the search over its foot.
 */

/** The gap around what sits in a pocket, the rounding where a pocket meets the edge, and the card's corners. */
const GAP = 8;
const FILLET = 12;
const R = 32;

type Piece = { w: number; h: number };

/** The card's outline, clockwise from its top left, with a pocket at the top and at the foot for each piece. */
function outline(W: number, H: number, top: Piece | null, foot: Piece | null) {
  const f = FILLET;
  const n = (v: number) => Math.round(v * 100) / 100;
  // Each pocket: the pill's half-circle ends, centered on the edge, grown by the gap.
  const pocket = (p: Piece) => {
    const rc = p.h / 2;
    const rn = rc + GAP;
    const left = W / 2 - p.w / 2 + rc;
    const right = W / 2 + p.w / 2 - rc;
    // The rounding's center sits f in from the edge and f + rn from the end's center, tangent to both.
    const dx = Math.sqrt((rn + f) ** 2 - f ** 2);
    const k = rn / (rn + f);
    return { rn, left, right, dx, k };
  };
  // A pocket that would run into the card's rounded corners isn't cut at all.
  const fits = (p: Piece | null) => {
    if (!p) return null;
    const { left, dx } = pocket(p);
    return left - dx >= R + 8 ? p : null;
  };
  [top, foot] = [fits(top), fits(foot)];
  let d = `M ${R} 0`;
  if (top) {
    const { rn, left, right, dx, k } = pocket(top);
    d += ` L ${n(left - dx)} 0 A ${f} ${f} 0 0 1 ${n(left - dx * k)} ${n(f * k)} A ${n(rn)} ${n(rn)} 0 0 0 ${n(left)} ${n(rn)}`;
    d += ` L ${n(right)} ${n(rn)} A ${n(rn)} ${n(rn)} 0 0 0 ${n(right + dx * k)} ${n(f * k)} A ${f} ${f} 0 0 1 ${n(right + dx)} 0`;
  }
  d += ` L ${W - R} 0 A ${R} ${R} 0 0 1 ${W} ${R} L ${W} ${H - R} A ${R} ${R} 0 0 1 ${W - R} ${H}`;
  if (foot) {
    const { rn, left, right, dx, k } = pocket(foot);
    d += ` L ${n(right + dx)} ${H} A ${f} ${f} 0 0 1 ${n(right + dx * k)} ${n(H - f * k)} A ${n(rn)} ${n(rn)} 0 0 0 ${n(right)} ${n(H - rn)}`;
    d += ` L ${n(left)} ${n(H - rn)} A ${n(rn)} ${n(rn)} 0 0 0 ${n(left - dx * k)} ${n(H - f * k)} A ${f} ${f} 0 0 1 ${n(left - dx)} ${H}`;
  }
  d += ` L ${R} ${H} A ${R} ${R} 0 0 1 0 ${H - R} L 0 ${R} A ${R} ${R} 0 0 1 ${R} 0 Z`;
  return d;
}

export function HomeCard({ children }: { children: ReactNode }) {
  const card = useRef<HTMLElement>(null);
  const search = useRef<HTMLDivElement>(null);
  const [shape, setShape] = useState<{ d: string; w: number; h: number } | null>(null);
  useEffect(() => {
    const el = card.current;
    if (!el) return;
    const desk = matchMedia("(min-width: 1024px)");
    const bar = document.querySelector<HTMLElement>("[data-capsule]");
    const draw = () => {
      if (!desk.matches) return setShape(null);
      const [W, H] = [el.offsetWidth, el.offsetHeight];
      const top = bar && bar.offsetWidth ? { w: bar.offsetWidth, h: bar.offsetHeight } : null;
      const foot = search.current ? { w: search.current.offsetWidth, h: search.current.offsetHeight } : null;
      setShape({ d: outline(W, H, top, foot), w: W, h: H });
    };
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    if (search.current) ro.observe(search.current);
    if (bar) ro.observe(bar);
    desk.addEventListener("change", draw);
    return () => {
      ro.disconnect();
      desk.removeEventListener("change", draw);
    };
  }, []);
  return (
    <div className="relative flex flex-1 flex-col">
      {/* Light paper in both modes, lit in dither around its edges, the promise in the middle. */}
      <section
        ref={card}
        aria-labelledby="hero-title"
        style={shape ? { clipPath: `path("${shape.d}")` } : undefined}
        className="bd-light relative isolate flex min-h-[560px] flex-1 flex-col items-center justify-center overflow-hidden rounded-[32px] bg-paper px-5 pb-28 pt-28 text-center text-paper-ink"
      >
        <DitherLight layout="home" />
        {children}
        {/* A hairline along the cut edge, so the pockets read on a light page too. */}
        {shape && (
          <svg aria-hidden width={shape.w} height={shape.h} className="pointer-events-none absolute inset-0">
            <path d={shape.d} fill="none" strokeWidth={2} style={{ stroke: "color-mix(in oklab, var(--bd-paper-ink) 9%, transparent)" }} />
          </svg>
        )}
      </section>
      {/* The search, half in the card's foot. */}
      <div ref={search} className="absolute bottom-0 left-1/2 z-10 w-[min(440px,calc(100%-32px))] -translate-x-1/2 translate-y-1/2">
        <HomeSearch />
      </div>
    </div>
  );
}
