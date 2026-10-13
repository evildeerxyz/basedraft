"use client";

import { animate, MotionConfig } from "motion/react";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { bayer8 } from "@/lib/dither";
import { pal } from "@/lib/palette";
import { EASE_IN_OUT, hexToRgb } from "@/lib/utils";
import { LogoMark } from "./ui/Logo";

const IntroContext = createContext(true);

/** True once the intro curtain starts dissolving. Hero animations key off this. */
export const useIntroDone = () => useContext(IntroContext);

export function Providers({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

// The curtain plays on the first load of the home page only, not on client navigation back to it.
let introPlayed = false;

/** Wraps the home page: holds its animations until the intro curtain dissolves. */
export function IntroGate({ children }: { children: ReactNode }) {
  const [skip] = useState(() => introPlayed);
  const [revealed, setRevealed] = useState(skip);
  const [finished, setFinished] = useState(skip);
  return (
    <IntroContext.Provider value={revealed}>
      {children}
      {!finished && (
        <IntroCurtain
          onReveal={() => setRevealed(true)}
          onFinish={() => {
            introPlayed = true;
            setFinished(true);
          }}
        />
      )}
    </IntroContext.Provider>
  );
}

const CELL = 10;

/**
 * Loading curtain that dissolves in Bayer order from the centre out, with a
 * lime "burn" line riding the edge of the dissolve.
 */
function IntroCurtain({ onReveal, onFinish }: { onReveal: () => void; onFinish: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current!;
    const canvas = canvasRef.current!;
    const html = document.documentElement;
    html.classList.add("intro-lock");
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    let cancelled = false;
    let raf = 0;
    const finish = () => {
      html.classList.remove("intro-lock");
      onFinish();
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onReveal();
      const a = animate(root, { opacity: 0 }, { duration: 0.3, onComplete: finish });
      return () => {
        a.stop();
        html.classList.remove("intro-lock");
      };
    }

    const w = Math.ceil(window.innerWidth / CELL);
    const h = Math.ceil(window.innerHeight / CELL);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w * CELL}px`;
    canvas.style.height = `${h * CELL}px`;
    const ctx = canvas.getContext("2d")!;
    const img = ctx.createImageData(w, h);
    const [cr, cg, cb] = hexToRgb(pal.bg);
    const [er, eg, eb] = hexToRgb(pal.dither);
    const order = new Float32Array(w * h);
    const maxD = Math.hypot(w / 2, h / 2);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const d = Math.hypot(x - w / 2, (y - h / 2) * 1.2) / maxD;
        order[y * w + x] = bayer8(x, y) * 0.45 + d * 0.55;
      }
    }

    const paint = (p: number) => {
      const data = img.data;
      for (let i = 0; i < order.length; i++) {
        const o = order[i];
        const j = i * 4;
        if (o > p) {
          // curtain
          data[j] = cr; data[j + 1] = cg; data[j + 2] = cb; data[j + 3] = 255;
        } else if (o > p - 0.07) {
          // burning edge
          data[j] = er; data[j + 1] = eg; data[j + 2] = eb; data[j + 3] = 255;
        } else {
          data[j + 3] = 0;
        }
      }
      ctx.putImageData(img, 0, 0);
    };
    paint(-1);

    const counter = animate(0, 100, {
      duration: 1.1,
      ease: EASE_IN_OUT,
      onUpdate: (v) => {
        if (countRef.current) countRef.current.textContent = String(Math.round(v)).padStart(3, "0");
        if (barRef.current) barRef.current.style.transform = `scaleX(${v / 100})`;
      },
      onComplete: () => {
        if (cancelled) return;
        root.style.background = "transparent";
        animate(contentRef.current!, { opacity: 0, scale: 0.94, filter: "blur(6px)" }, { duration: 0.25 });
        const start = performance.now();
        const total = 950;
        let revealed = false;
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / total);
          const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          paint(eased * 1.12);
          if (!revealed && t > 0.18) {
            revealed = true;
            onReveal();
          }
          if (t < 1) raf = requestAnimationFrame(step);
          else finish();
        };
        raf = requestAnimationFrame(step);
      },
    });

    return () => {
      cancelled = true;
      counter.stop();
      cancelAnimationFrame(raf);
      html.classList.remove("intro-lock");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={rootRef} className="intro-overlay fixed inset-0 z-[200] bg-ink" aria-hidden>
      <canvas ref={canvasRef} className="pixelated absolute left-0 top-0" />
      <div ref={contentRef} className="relative flex h-full flex-col items-center justify-center gap-7">
        <LogoMark size={64} animated={false} />
        <div className="flex w-44 flex-col gap-3">
          <div className="flex justify-between font-mono text-[15px] tracking-[0.2em] text-mute">
            <span>ZUNO/OS</span>
            <span ref={countRef}>000</span>
          </div>
          <span className="block h-px w-full bg-white/10">
            <span ref={barRef} className="block h-px w-full origin-left scale-x-0 bg-lime" />
          </span>
        </div>
      </div>
    </div>
  );
}
