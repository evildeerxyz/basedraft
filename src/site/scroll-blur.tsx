"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/*
 * Along the edges of the screen, on any page that scrolls: a blur that grows toward the edge, so
 * what's scrolled past and what's still to come soften into it rather than being cut off by the
 * window. Stacked layers, each blurring more and showing a band nearer the edge than the last,
 * make it progressive rather than one soft strip. The top one shows once the page has moved
 * (under the header, z-40); the bottom one fades away at the end of the page, where nothing is
 * left to come, under what floats at the foot (z-50). Neither is there on a page that doesn't scroll.
 */

/** Px of blur, from the strip's inner edge to the screen's edge. */
const LAYERS = [1, 2, 4, 8, 16, 32];
const STEP = 100 / (LAYERS.length + 1);

function Strip({ side, on }: { side: "top" | "bottom"; on: boolean }) {
  // Each layer shows in its own band: fading in, held for a step, fading out a step nearer the edge.
  const toward = side === "bottom" ? "to bottom" : "to top";
  return (
    <div aria-hidden className={cn("pointer-events-none fixed inset-x-0 h-24 transition-opacity duration-300", side === "bottom" ? "bottom-0 z-40" : "top-0 z-[35]", on ? "opacity-100" : "opacity-0")}>
      {LAYERS.map((px, i) => {
        const mask = `linear-gradient(${toward}, transparent ${i * STEP}%, #000 ${(i + 1) * STEP}%, #000 ${(i + 2) * STEP}%, transparent ${(i + 3) * STEP}%)`;
        return <div key={px} className="absolute inset-0" style={{ backdropFilter: `blur(${px}px)`, WebkitBackdropFilter: `blur(${px}px)`, maskImage: mask, WebkitMaskImage: mask }} />;
      })}
    </div>
  );
}

export function ScrollBlur() {
  const path = usePathname();
  const [edges, setEdges] = useState({ top: false, bottom: false });
  useEffect(() => {
    const read = () => {
      const page = document.documentElement.scrollHeight;
      const scrolls = page > innerHeight + 8;
      const top = scrolls && scrollY > 8;
      const bottom = scrolls && page - (scrollY + innerHeight) > 24;
      setEdges((e) => (e.top === top && e.bottom === bottom ? e : { top, bottom }));
    };
    read();
    addEventListener("scroll", read, { passive: true });
    addEventListener("resize", read);
    // A page that grows or shrinks as it loads (a gallery filling in) is read again.
    const ro = new ResizeObserver(read);
    ro.observe(document.body);
    return () => {
      removeEventListener("scroll", read);
      removeEventListener("resize", read);
      ro.disconnect();
    };
  }, [path]);
  return (
    <>
      <Strip side="top" on={edges.top} />
      <Strip side="bottom" on={edges.bottom} />
    </>
  );
}
