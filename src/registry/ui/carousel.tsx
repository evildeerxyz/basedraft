"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { animate, LayoutGroup, motion, useMotionValue, useReducedMotion, useTransform, type AnimationPlaybackControls } from "motion/react";
import { Children, cloneElement, isValidElement, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactElement, type ReactNode } from "react";

/*
 * A row of slides you move through by hand: drag or swipe it and it carries on with the speed you
 * gave it, then settles on the nearest slide; a trackpad's sideways swipe moves it too. Past the
 * first or last slide it gives a little and springs back. Slides can be any width. The buttons,
 * the dots or the bar under it, and the arrow keys all move it a slide at a time. Left to play on
 * its own, it waits while it's hidden, pointed at, focused, or when the system asks for less motion.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const SNAPPY = { type: "spring", stiffness: 520, damping: 42 } as const;
const SOFT = { type: "spring", stiffness: 300, damping: 30 } as const;
/* How far a drag goes before it's a drag (and not a click or a scroll), how much the ends give, and how far a flick carries. */
const SLOP = 6;
const GIVE = 0.32;
const CARRY = 0.2;

export type CarouselProps = {
  /** What the slides are, for screen readers: "Templates". */
  label: string;
  /** CarouselSlides. */
  children: ReactNode;
  /** Dots under it, a thin bar that fills as you go, or nothing. */
  indicator?: "dots" | "progress" | "none";
  /** Hide the previous and next buttons. */
  buttons?: boolean;
  /** Past the last slide comes the first again. */
  loop?: boolean;
  /** Move on its own every this many milliseconds. */
  autoPlay?: number;
  /** The space between slides, in pixels. */
  gap?: number;
  /** Line each slide up with the start, or center it. */
  align?: "start" | "center";
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  className?: string;
};

type SlideInject = { "data-carousel-index"?: number; "data-carousel-total"?: number };

/** One slide. Give it a width with className ("w-[78%]", "w-[260px]"); it's as tall as its content. */
export function CarouselSlide({ children, label, className, ...rest }: { children: ReactNode; /** A name for it, read out after its number: "Zuno". */ label?: string; className?: string } & SlideInject) {
  const i = rest["data-carousel-index"] ?? 0;
  const total = rest["data-carousel-total"] ?? 1;
  // Full width unless it's given its own; both at once and the stylesheet's order would pick.
  const sized = /(^|\s)(w|basis)-/.test(className ?? "");
  return (
    <div role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${total}${label ? `: ${label}` : ""}`} className={cx("shrink-0 select-none", !sized && "w-full", className)}>
      {children}
    </div>
  );
}

export function Carousel({ label, children, indicator = "dots", buttons = true, loop = false, autoPlay, gap = 16, align = "start", index, defaultIndex = 0, onIndexChange, className }: CarouselProps) {
  const reduce = useReducedMotion();
  const id = useId();
  const view = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const run = useRef<AnimationPlaybackControls | null>(null);
  const x = useMotionValue(0);
  const [stops, setStops] = useState<number[]>([0]);
  const [inner, setInner] = useState(defaultIndex);
  const [said, setSaid] = useState("");
  const [paused, setPaused] = useState(false);
  const slides = Children.toArray(children).filter(isValidElement) as ReactElement<SlideInject>[];
  const at = Math.max(0, Math.min(stops.length - 1, index ?? inner));
  const atRef = useRef(at);
  const stopsRef = useRef(stops);
  const last = stops.length - 1;
  const lo = stops[last] ?? 0;
  const hi = stops[0] ?? 0;
  // How far along, 0 to 1, for the bar: it follows x itself, so it moves while you drag.
  const progress = useTransform(x, (v) => (hi === lo ? 1 : Math.max(0, Math.min(1, (v - hi) / (lo - hi)))));

  useEffect(() => {
    atRef.current = at;
    stopsRef.current = stops;
  });

  /*
   * Where the track sits for each slide: the slide's start (or middle) at the start (or middle) of
   * the view, never so far that blank space shows after the last one. Slides that would all end up
   * at that last spot share it, so there's one stop for them.
   */
  const measure = useCallback(() => {
    const v = view.current;
    const t = track.current;
    if (!v || !t) return;
    const w = v.clientWidth;
    const end = Math.min(0, w - t.scrollWidth);
    const raw = [...t.children].map((el) => {
      const s = el as HTMLElement;
      return align === "center" ? -(s.offsetLeft + s.offsetWidth / 2 - w / 2) : Math.max(end, -s.offsetLeft);
    });
    const unique = raw.filter((p, i) => i === 0 || Math.abs(p - raw[i - 1]) > 1);
    setStops(unique.length ? unique : [0]);
  }, [align]);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (view.current) ro.observe(view.current);
    if (track.current) ro.observe(track.current);
    return () => ro.disconnect();
  }, [measure, slides.length]);

  /* Glide to a stop, carrying the speed it had. It remembers where it was sent, so the index catching up doesn't send it again. */
  const placed = useRef<{ i: number; stops: number[] } | null>(null);
  const glide = useCallback(
    (i: number, velocity = 0, how: object = SOFT) => {
      placed.current = { i, stops: stopsRef.current };
      const to = stopsRef.current[i] ?? 0;
      run.current?.stop();
      if (reduce) x.set(to);
      else run.current = animate(x, to, { ...how, velocity });
    },
    [reduce, x],
  );

  const choose = useCallback(
    (i: number, how?: "user" | "auto") => {
      const n = stopsRef.current.length;
      const next = loop ? (i + n) % n : Math.max(0, Math.min(n - 1, i));
      setInner(next);
      onIndexChange?.(next);
      if (how === "user") setSaid(`${next + 1} of ${n}`);
      glide(next, 0, SNAPPY);
    },
    [glide, loop, onIndexChange],
  );

  // The track follows the index when it changes from outside, or when the slides are measured anew.
  useEffect(() => {
    if (placed.current?.i === at && placed.current.stops === stops) return;
    glide(at);
  }, [at, stops, glide]);

  /* Dragging: it only starts once the pointer has moved mostly sideways, so a vertical swipe still scrolls the page. */
  const press = useRef<{ x: number; y: number; from: number; id: number; on: boolean; moved: boolean; samples: Array<[number, number]> } | null>(null);
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    press.current = { x: e.clientX, y: e.clientY, from: x.get(), id: e.pointerId, on: false, moved: false, samples: [[e.timeStamp, x.get()]] };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (!p || e.pointerId !== p.id) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (!p.on) {
      if (Math.hypot(dx, dy) < SLOP) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        press.current = null;
        return;
      }
      p.on = true;
      p.moved = true;
      run.current?.stop();
      p.from = x.get() - dx;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    let v = p.from + dx;
    // Past either end it gives a little, rather than stopping dead.
    if (!loop && v > hi) v = hi + (v - hi) * GIVE;
    if (!loop && v < lo) v = lo + (v - lo) * GIVE;
    x.set(v);
    p.samples.push([e.timeStamp, v]);
    while (p.samples.length > 2 && e.timeStamp - p.samples[0][0] > 90) p.samples.shift();
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (!p || e.pointerId !== p.id) return;
    press.current = null;
    if (!p.on) return;
    const [a, b] = [p.samples[0], p.samples[p.samples.length - 1]];
    const velocity = b[0] > a[0] ? ((b[1] - a[1]) / (b[0] - a[0])) * 1000 : 0;
    // Where it would coast to, then the stop nearest that.
    const aim = x.get() + velocity * CARRY;
    let best = 0;
    stops.forEach((s, i) => {
      if (Math.abs(s - aim) < Math.abs(stops[best] - aim)) best = i;
    });
    setInner(best);
    onIndexChange?.(best);
    setSaid(`${best + 1} of ${stops.length}`);
    glide(best, velocity);
    // The click that ends a drag isn't a click on a slide.
    const stop = (ev: Event) => {
      ev.stopPropagation();
      ev.preventDefault();
    };
    view.current?.addEventListener("click", stop, { capture: true, once: true });
    setTimeout(() => view.current?.removeEventListener("click", stop, { capture: true }), 0);
  };

  /* A trackpad's sideways swipe moves it directly, then it settles on the nearest stop once the swipe ends. */
  useEffect(() => {
    const v = view.current;
    if (!v) return;
    let quiet = 0;
    const onWheel = (e: WheelEvent) => {
      const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
      if (Math.abs(dx) <= Math.abs(e.deltaY) && !e.shiftKey) return;
      e.preventDefault();
      run.current?.stop();
      const s = stopsRef.current;
      const [top, bottom] = [s[0] ?? 0, s[s.length - 1] ?? 0];
      let next = x.get() - dx;
      if (next > top) next = top + (next - top) * GIVE;
      if (next < bottom) next = bottom + (next - bottom) * GIVE;
      x.set(next);
      clearTimeout(quiet);
      quiet = window.setTimeout(() => {
        let best = 0;
        s.forEach((p, i) => {
          if (Math.abs(p - x.get()) < Math.abs(s[best] - x.get())) best = i;
        });
        setInner(best);
        onIndexChange?.(best);
        glide(best);
      }, 140);
    };
    v.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      v.removeEventListener("wheel", onWheel);
      clearTimeout(quiet);
    };
  }, [x, glide, onIndexChange]);

  /* Playing on its own: only while it's on screen, the tab is showing, nothing's pointing at it or focused in it. */
  const [seen, setSeen] = useState(true);
  const [shown, setShown] = useState(true);
  useEffect(() => {
    if (!autoPlay || !view.current) return;
    const io = new IntersectionObserver(([en]) => setSeen(en.isIntersecting), { threshold: 0.4 });
    io.observe(view.current);
    const vis = () => setShown(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", vis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
    };
  }, [autoPlay]);
  const playing = !!autoPlay && !reduce && !paused && seen && shown;
  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => {
      const n = stopsRef.current.length;
      if (!loop && atRef.current >= n - 1) choose(0, "auto");
      else choose(atRef.current + 1, "auto");
    }, autoPlay);
    return () => clearInterval(t);
  }, [playing, autoPlay, loop, choose]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const to = e.key === "ArrowRight" ? at + 1 : e.key === "ArrowLeft" ? at - 1 : e.key === "Home" ? 0 : e.key === "End" ? last : null;
    if (to === null) return;
    e.preventDefault();
    choose(to, "user");
  };

  const canBack = loop || at > 0;
  const canOn = loop || at < last;
  // The side the next slide peeks in from fades out, and at the end the side the one before does,
  // so the peek reads as more to come rather than as cut off.
  const fadeOn = canOn && stops.length > 1;
  const fadeBack = !canOn && at > 0;
  const fade = fadeOn || fadeBack ? `linear-gradient(to right, ${fadeBack ? "transparent, black 32px" : "black"}, ${fadeOn ? "black calc(100% - 32px), transparent" : "black"})` : undefined;
  const round = "grid size-9 place-items-center rounded-full bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)] transition-[opacity,scale,box-shadow] duration-200 hover:shadow-[0_0_0_1px_var(--bd-line-strong),var(--bd-shadow-raised)] active:scale-95 disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]";

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className={cx("w-full min-w-0", className)}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setPaused(false)}
    >
      <div
        ref={view}
        tabIndex={0}
        aria-label={`${label}, ${at + 1} of ${stops.length}. Arrow keys move between slides.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        style={{ touchAction: "pan-y", maskImage: fade, WebkitMaskImage: fade }}
        // Its width comes from where it's put, never from the row of slides inside it.
        className="relative -my-2 cursor-grab overflow-hidden rounded-[18px] py-2 outline-none [contain:inline-size] active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--bd-ui-focus)]"
      >
        <motion.div ref={track} id={`${id}-track`} className="flex" style={{ x, gap }}>
          {slides.map((s, i) => cloneElement(s, { key: s.key ?? i, "data-carousel-index": i, "data-carousel-total": slides.length }))}
        </motion.div>
      </div>
      <p className="sr-only" aria-live="polite">
        {said}
      </p>
      {(buttons || indicator !== "none") && stops.length > 1 && (
        <div className="mt-4 flex items-center gap-3">
          {indicator === "dots" && (
            <LayoutGroup id={id}>
              <div role="tablist" aria-label="Choose a slide" className="flex items-center gap-1.5">
                {stops.map((_, i) => (
                  <button key={i} type="button" role="tab" aria-selected={i === at} aria-controls={`${id}-track`} aria-label={`Slide ${i + 1}`} onClick={() => choose(i, "user")} className="relative grid h-5 w-3 place-items-center rounded-full outline-none focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]">
                    <span className="size-1.5 rounded-full bg-[var(--bd-ui-track)]" />
                    {i === at && <motion.span layoutId="dot" className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full [background:var(--bd-ui-ink)]" transition={reduce ? { duration: 0 } : SNAPPY} />}
                  </button>
                ))}
              </div>
            </LayoutGroup>
          )}
          {indicator === "progress" && (
            <div aria-hidden className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--bd-ui-track)]">
              <motion.span className="block h-full origin-left rounded-full [background:var(--bd-ui-ink)]" style={{ scaleX: progress }} />
            </div>
          )}
          {buttons && (
            <div className="ml-auto flex items-center gap-2">
              <button type="button" aria-label="Previous slide" aria-controls={`${id}-track`} disabled={!canBack} onClick={() => choose(at - 1, "user")} className={round}>
                <CaretLeftIcon size={15} weight="regular" />
              </button>
              <button type="button" aria-label="Next slide" aria-controls={`${id}-track`} disabled={!canOn} onClick={() => choose(at + 1, "user")} className={round}>
                <CaretRightIcon size={15} weight="regular" />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
