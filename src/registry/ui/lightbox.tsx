"use client";

import { CaretLeftIcon, CaretRightIcon, XIcon } from "@phosphor-icons/react";
import { animate, AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

/*
 * Photos as thumbnails that open into a dark viewer. A photo grows out of its thumbnail, the crop
 * opening up to the whole picture as it does, without stretching; the arrows, a swipe or the keys
 * move to the next, and closing shrinks it back into the thumbnail it came from. Focus stays in
 * the viewer while it's open and goes back to that thumbnail after.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* True once it's running in the browser: the server and the first render agree on false, so the portal never trips hydration. */
const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

export type LightboxImage = {
  src: string;
  alt: string;
  caption?: ReactNode;
  /** A smaller file for the thumbnail. The full one by default. */
  thumb?: string;
};

type Box = { left: number; top: number; width: number; height: number };

/** The largest box of the picture's shape that fits the viewer, centered. */
function fit(w: number, h: number): Box {
  const maxW = Math.max(120, innerWidth - (innerWidth < 640 ? 24 : 152));
  const maxH = Math.max(120, innerHeight - 156);
  const s = Math.min(maxW / w, maxH / h, 1.6);
  const width = Math.round(w * s);
  const height = Math.round(h * s);
  return { left: Math.round((innerWidth - width) / 2), top: Math.round((innerHeight - 156) / 2 + 64 - height / 2), width, height };
}

/** Where the picture starts (or ends) to sit exactly over a thumbnail: scaled to cover it, clipped to its shape. */
function fromThumb(t: DOMRect, f: Box, radius: number) {
  const s = Math.max(t.width / f.width, t.height / f.height);
  const ix = (f.width - t.width / s) / 2;
  const iy = (f.height - t.height / s) / 2;
  return {
    x: t.left + t.width / 2 - (f.left + f.width / 2),
    y: t.top + t.height / 2 - (f.top + f.height / 2),
    scale: s,
    clipPath: `inset(${iy}px ${ix}px ${iy}px ${ix}px round ${radius / s}px)`,
  };
}
const REST = { x: 0, y: 0, scale: 1, clipPath: "inset(0px 0px 0px 0px round 14px)" };
const SPRING = { type: "spring", stiffness: 260, damping: 30 } as const;

export type LightboxProps = {
  images: LightboxImage[];
  /** Laid out on the thumbnails' box: a grid, a row. */
  className?: string;
  /** Added to each thumbnail: its shape and corners. */
  thumbClassName?: string;
};

/** A picture's own shape, from the thumbnail that already loaded it. */
const shapeOf = (thumb: HTMLButtonElement | null | undefined) => {
  const img = thumb?.querySelector("img");
  return img && img.naturalWidth ? { w: img.naturalWidth, h: img.naturalHeight } : { w: 4, h: 3 };
};

export function Lightbox({ images, className, thumbClassName }: LightboxProps) {
  const [open, setOpen] = useState<number | null>(null);
  const [startBox, setStartBox] = useState<Box | null>(null);
  const thumbs = useRef<Array<HTMLButtonElement | null>>([]);
  return (
    <>
      <div className={className}>
        {images.map((im, i) => (
          <button
            key={im.src + i}
            ref={(el) => void (thumbs.current[i] = el)}
            type="button"
            aria-label={`Open ${im.alt}`}
            onClick={(e) => {
              const { w, h } = shapeOf(e.currentTarget);
              setStartBox(fit(w, h));
              setOpen(i);
            }}
            className={cx("group/thumb relative block overflow-hidden rounded-[12px] bg-[var(--bd-ui-track)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]", thumbClassName)}
            style={{ visibility: open === i ? "hidden" : undefined }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={im.thumb ?? im.src} alt="" draggable={false} className="size-full object-cover transition-transform duration-500 ease-[var(--bd-ease)] group-hover/thumb:scale-[1.03]" />
          </button>
        ))}
      </div>
      {open !== null && startBox && <Viewer images={images} start={open} startBox={startBox} thumbs={thumbs} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </>
  );
}

function Viewer({ images, start, startBox, thumbs, onIndex, onClose }: { images: LightboxImage[]; start: number; startBox: Box; thumbs: RefObject<Array<HTMLButtonElement | null>>; onIndex: (i: number) => void; onClose: () => void }) {
  const mounted = useMounted();
  const still = useReducedMotion();
  const [i, setI] = useState(start);
  const [dir, setDir] = useState(0);
  const [closing, setClosing] = useState(false);
  const [box, setBox] = useState<Box>(startBox);
  const frame = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const im = images[i];

  // Its box in the viewer follows the window.
  useEffect(() => {
    const place = () => {
      const { w, h } = shapeOf(thumbs.current[i]);
      setBox(fit(w, h));
    };
    addEventListener("resize", place);
    return () => removeEventListener("resize", place);
  }, [i, thumbs]);

  // Opening: the picture grows out of its thumbnail.
  useLayoutEffect(() => {
    const el = frame.current;
    const t = thumbs.current[start]?.getBoundingClientRect();
    if (!el || !first.current) return;
    first.current = false;
    if (still || !t) return;
    const radius = parseFloat(getComputedStyle(thumbs.current[start]!).borderTopLeftRadius) || 12;
    const from = fromThumb(t, box, radius);
    animate(el, { x: [from.x, REST.x], y: [from.y, REST.y], scale: [from.scale, REST.scale], clipPath: [from.clipPath, REST.clipPath] }, SPRING);
  }, [box, start, thumbs, still]);

  // The page stays put behind it, and focus comes back to the thumbnail after.
  useEffect(() => {
    const was = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    dialog.current?.querySelector<HTMLElement>("[data-close]")?.focus({ preventScroll: true });
    return () => {
      document.documentElement.style.overflow = was;
    };
  }, []);

  const go = (to: number) => {
    const n = images.length;
    const next = (to + n) % n;
    if (next === i) return;
    setDir(to > i ? 1 : -1);
    const { w, h } = shapeOf(thumbs.current[next]);
    setBox(fit(w, h));
    setI(next);
    onIndex(next);
  };

  const close = () => {
    if (closing) return;
    setClosing(true);
    const el = frame.current;
    const thumb = thumbs.current[i];
    const t = thumb?.getBoundingClientRect();
    const seen = t && t.bottom > 0 && t.top < innerHeight && t.right > 0 && t.left < innerWidth;
    const done = () => {
      onClose();
      thumbs.current[i]?.focus({ preventScroll: true });
    };
    if (!el || !t || !seen || still) return void setTimeout(done, still ? 0 : 140);
    const radius = parseFloat(getComputedStyle(thumb!).borderTopLeftRadius) || 12;
    animate(el, fromThumb(t, box, radius), { ...SPRING, stiffness: 340, damping: 34 }).then(done);
  };

  // The keys always reach the latest go and close.
  const keys = useRef<(e: KeyboardEvent) => void>(() => {});
  useLayoutEffect(() => {
    keys.current = (e) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(i + 1);
      else if (e.key === "ArrowLeft") go(i - 1);
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(images.length - 1);
      else if (e.key === "Tab") {
        // Focus stays in the viewer.
        const all = [...(dialog.current?.querySelectorAll<HTMLElement>("button") ?? [])];
        const at = all.indexOf(document.activeElement as HTMLElement);
        all[(at + (e.shiftKey ? -1 : 1) + all.length) % all.length]?.focus();
      } else return;
      e.preventDefault();
    };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keys.current(e);
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  if (!mounted) return null;
  const many = images.length > 1;
  return createPortal(
    <div ref={dialog} role="dialog" aria-modal="true" aria-label={`${im.alt}, ${i + 1} of ${images.length}`} data-theme="dark" className="dark fixed inset-0 z-[120] text-white">
      <motion.div aria-hidden className="absolute inset-0 bg-[rgb(9_9_11/0.9)] backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: closing ? 0 : 1 }} transition={{ duration: closing ? 0.22 : 0.28 }} onClick={close} />
      {/* The frame eases to each picture's shape as you go from one to the next. */}
      <motion.div initial={false} animate={box} transition={still ? { duration: 0 } : SPRING} className="absolute" style={{ left: box.left, top: box.top, width: box.width, height: box.height }}>
        {/* Inside it, the layer that grows out of the thumbnail and shrinks back into it. */}
        <div ref={frame} className="absolute inset-0 overflow-hidden rounded-[14px] bg-[var(--bd-ui-track)] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)]">
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.div
              key={i}
              custom={dir}
              variants={{ in: (d: number) => ({ x: still ? 0 : d * 60, opacity: 0 }), at: { x: 0, opacity: 1 }, out: (d: number) => ({ x: still ? 0 : d * -60, opacity: 0 }) }}
              initial="in"
              animate="at"
              exit="out"
              transition={{ x: SPRING, opacity: { duration: 0.2 } }}
              drag={many && !closing ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => {
                if (info.offset.x < -70 || info.velocity.x < -500) go(i + 1);
                else if (info.offset.x > 70 || info.velocity.x > 500) go(i - 1);
              }}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={im.src} alt={im.alt} draggable={false} className="size-full select-none object-cover" />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: closing ? 0 : 1 }} transition={{ duration: 0.2, delay: closing ? 0 : 0.12 }}>
        <button type="button" data-close aria-label="Close" onClick={close} className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 text-white outline-none backdrop-blur-xl transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white">
          <XIcon weight="regular" className="size-4" />
        </button>
        {many && (
          <>
            <button type="button" aria-label="Previous photo" onClick={() => go(i - 1)} className="absolute left-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white outline-none backdrop-blur-xl transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white max-sm:hidden">
              <CaretLeftIcon weight="regular" className="size-4" />
            </button>
            <button type="button" aria-label="Next photo" onClick={() => go(i + 1)} className="absolute right-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white outline-none backdrop-blur-xl transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white max-sm:hidden">
              <CaretRightIcon weight="regular" className="size-4" />
            </button>
          </>
        )}
        <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-1.5 px-6 text-center">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.p key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="max-w-[560px] text-sm text-white/90">
              {im.caption ?? im.alt}
            </motion.p>
          </AnimatePresence>
          {many && (
            <p className="text-xs tabular-nums text-white/50">
              {i + 1} of {images.length}
            </p>
          )}
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
