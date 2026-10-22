"use client";

import { Children, useEffect, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";

/*
 * An endless row that drifts sideways, for customers' logos or short quotes: as many copies as it
 * takes to fill the width, each one item-for-item the same, moving at a steady speed and fading
 * out at both edges. Pointing at it or tabbing into it holds it still. Only the first copy is read
 * out or reached with Tab; the others are hidden from screen readers and inert. With reduced
 * motion it stops, and the one copy scrolls by hand instead.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/*
 * The drift, set once for every marquee on the page (React 19 hoists a style with an href and
 * keeps one copy). It moves the row by exactly one copy, so the loop has no seam.
 */
const DRIFT = `@keyframes bd-ui-marquee{to{transform:translateX(calc(-100% / var(--bd-copies)))}}.bd-ui-marquee-track{animation:bd-ui-marquee var(--bd-duration) linear infinite var(--bd-direction)}.bd-ui-marquee[data-hold]:hover .bd-ui-marquee-track,.bd-ui-marquee[data-hold]:focus-within .bd-ui-marquee-track{animation-play-state:paused}@media (prefers-reduced-motion:reduce){.bd-ui-marquee{overflow-x:auto}.bd-ui-marquee-track{animation:none}.bd-ui-marquee-track>[aria-hidden]{display:none}}`;

export type MarqueeProps = Omit<ComponentProps<"div">, "children"> & {
  /** The items, each one a logo, a quote or a word. */
  children: ReactNode;
  /** How fast it drifts, in pixels a second. */
  speed?: number;
  /** Drift to the right instead. */
  reverse?: boolean;
  /** Hold still while it's pointed at or has focus inside. */
  pauseOnHover?: boolean;
  /** How far in from each edge it fades, in pixels. 0 for a hard edge. */
  fade?: number;
  /** The space between items, in pixels. */
  gap?: number;
  /** What it is, for screen readers: "Teams that build on Noma". */
  label?: string;
};

export function Marquee({ children, speed = 40, reverse = false, pauseOnHover = true, fade = 56, gap = 40, label, className, style, ...props }: MarqueeProps) {
  const box = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLUListElement>(null);
  const [copy, setCopy] = useState({ width: 0, count: 2 });
  useEffect(() => {
    // How wide one copy is, and how many it takes to cover the box with one to spare.
    const measure = () => {
      const width = first.current?.offsetWidth ?? 0;
      const box_ = box.current?.offsetWidth ?? 0;
      if (width) setCopy({ width, count: Math.max(2, Math.ceil(box_ / width) + 1) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (box.current) ro.observe(box.current);
    if (first.current) ro.observe(first.current);
    return () => ro.disconnect();
  }, []);
  const items = Children.toArray(children);
  const mask = fade ? `linear-gradient(90deg, transparent, #000 ${fade}px, #000 calc(100% - ${fade}px), transparent)` : undefined;
  const vars = { "--bd-copies": copy.count, "--bd-duration": `${(copy.width || 1) / speed}s`, "--bd-direction": reverse ? "reverse" : "normal" } as CSSProperties;
  return (
    <div ref={box} role="marquee" aria-label={label} data-hold={pauseOnHover || undefined} className={cx("bd-ui-marquee relative flex overflow-hidden", className)} style={{ maskImage: mask, WebkitMaskImage: mask, ...style }} {...props}>
      <style href="bd-ui-marquee" precedence="medium">
        {DRIFT}
      </style>
      <div className={cx("flex w-max shrink-0", copy.width > 0 && "bd-ui-marquee-track")} style={vars}>
        {Array.from({ length: copy.count }, (_, n) => (
          <ul key={n} ref={n === 0 ? first : undefined} aria-hidden={n > 0 || undefined} inert={n > 0 || undefined} className="flex shrink-0 items-center" style={{ gap, paddingRight: gap }}>
            {items.map((item, i) => (
              <li key={i} className="shrink-0">
                {item}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
