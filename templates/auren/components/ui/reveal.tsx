"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { animate, motion, useInView, type Variants } from "motion/react";
import { dissolveSteps } from "@/lib/dither";
import { prefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/site";

const EASE = [0.16, 1, 0.3, 1] as const;
const VIEWPORT = { once: true, margin: "0px 0px -12% 0px" } as const;

/** Words slide up out of a clipped line, one after another. */
export function RevealText({
  lines,
  className,
  delay = 0,
  stagger = 0.045,
  lineClassNames,
}: {
  lines: string[];
  className?: string;
  delay?: number;
  stagger?: number;
  /** Per-line classes, e.g. to dim a second line. */
  lineClassNames?: Array<string | undefined>;
}) {
  let n = 0;
  const word: Variants = {
    hidden: { y: "108%" },
    show: (i: number) => ({ y: "0%", transition: { duration: 1, ease: EASE, delay: delay + i * stagger } }),
  };
  return (
    <motion.span className={cn("block", className)} initial="hidden" whileInView="show" viewport={VIEWPORT}>
      {lines.map((line, li) => (
        <span key={li} className={cn("block", lineClassNames?.[li])}>
          {line.split(" ").map((w, wi, arr) => (
            <Fragment key={wi}>
              <span className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
                <motion.span className="inline-block" variants={word} custom={n++}>
                  {w}
                </motion.span>
              </span>
              {wi < arr.length - 1 && " "}
            </Fragment>
          ))}
        </span>
      ))}
    </motion.span>
  );
}

/** Plain fade-up for supporting content. */
export function FadeIn({
  children,
  className,
  delay = 0,
  y = 18,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "li" | "p" | "span";
}) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </Component>
  );
}

/**
 * Dissolves its children in through an 8×8 Bayer mask, the page's signature
 * entrance. `trigger="mount"` plays immediately (used for cross-fades).
 */
export function DitherReveal({
  children,
  className,
  style,
  scale = 4,
  duration = 900,
  delay = 0,
  trigger = "view",
  onDone,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  scale?: number;
  duration?: number;
  delay?: number;
  trigger?: "view" | "mount";
  onDone?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    const el = ref.current!;
    const steps = dissolveSteps(scale);
    const set = (url: string) => {
      el.style.maskImage = url;
      el.style.webkitMaskImage = url;
    };
    const finish = () => {
      set("none");
      doneRef.current?.();
    };
    if (prefersReducedMotion()) {
      finish();
      return;
    }

    let raf = 0;
    let timer = 0;
    const play = () => {
      timer = window.setTimeout(() => {
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / duration);
          if (p >= 1) return finish();
          set(steps[Math.floor((1 - (1 - p) * (1 - p)) * 64)]);
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      }, delay);
    };

    let io: IntersectionObserver | undefined;
    if (trigger === "mount") play();
    else {
      io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          io?.disconnect();
          play();
        },
        { rootMargin: "0px 0px -12% 0px" },
      );
      io.observe(el);
    }
    return () => {
      io?.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [scale, duration, delay, trigger]);

  const first = dissolveSteps(scale)[0];
  const size = `${8 * scale}px ${8 * scale}px`;
  return (
    <div
      ref={ref}
      className={className}
      style={{ ...style, maskImage: first, WebkitMaskImage: first, maskSize: size, WebkitMaskSize: size }}
    >
      {children}
    </div>
  );
}

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+=/<>";

/** Mono labels decode from noise when they scroll into view. */
export function Scramble({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, VIEWPORT);

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (prefersReducedMotion()) {
      el.style.visibility = "visible";
      return;
    }
    let raf = 0;
    const timer = window.setTimeout(() => {
      el.style.visibility = "visible";
      const t0 = performance.now();
      const tick = (now: number) => {
        const elapsed = now - t0;
        let out = "";
        let settled = true;
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          if (ch === " " || elapsed > 120 + i * 32) out += ch;
          else {
            settled = false;
            out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
          }
        }
        el.textContent = out;
        if (!settled) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay * 1000);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [inView, text, delay]);

  return (
    <span aria-label={text} className={className}>
      <span ref={ref} aria-hidden style={{ visibility: "hidden" }}>
        {text}
      </span>
    </span>
  );
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Counts up to a value once visible. */
export function CountUp({
  to,
  decimals = 0,
  duration = 1.6,
  className,
}: {
  to: number;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, VIEWPORT);
  const [whole, frac] = to.toFixed(decimals).split(".");

  // writes straight to the DOM so counting doesn't re-render
  const write = (v: number) => {
    const [w, f] = v.toFixed(decimals).split(".");
    const el = ref.current;
    if (!el) return;
    el.querySelector("[data-whole]")!.textContent = w;
    if (f) el.querySelector("[data-frac]")!.textContent = f;
  };

  useIsoLayoutEffect(() => {
    if (!prefersReducedMotion()) write(0);
  }, []);

  useEffect(() => {
    if (!inView || prefersReducedMotion()) return;
    const controls = animate(0, to, {
      duration,
      ease: EASE,
      onUpdate: write,
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, to, duration]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      <span data-whole>{whole}</span>
      {frac && (
        <>
          {/* a square point that matches the dot-matrix digits */}
          <span aria-hidden className="mx-[0.05em] inline-block size-[0.1em] bg-current" />
          <span className="sr-only">.</span>
          <span data-frac>{frac}</span>
        </>
      )}
    </span>
  );
}
