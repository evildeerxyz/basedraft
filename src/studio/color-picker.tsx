"use client";

import { ArrowCounterClockwiseIcon, EyedropperIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { cn, EASE_OUT } from "@/lib/utils";

/* ---------- color maths ---------- */

type HSV = { h: number; s: number; v: number };

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

export function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const rgbToHex = (r: number, g: number, b: number) => `#${[r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")}`;

function rgbToHsv(r: number, g: number, b: number): HSV {
  [r, g, b] = [r / 255, g / 255, b / 255];
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: ((h * 60) + 360) % 360, s: max ? d / max : 0, v: max };
}

function hsvToHex({ h, s, v }: HSV) {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return 255 * (v - v * s * Math.max(0, Math.min(k, 4 - k, 1)));
  };
  return rgbToHex(f(5), f(3), f(1));
}

/** WCAG contrast between two hex colors. */
export function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const [r, g, bl] = (hexToRgb(hex) ?? [0, 0, 0]).map((c) => {
      const x = c / 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/* ---------- the picker ---------- */

interface EyeDropperCtor {
  new (): { open: () => Promise<{ sRGBHex: string }> };
}

/** Drags a handle across an element, reporting where the pointer is as 0..1 on each axis. */
function useDrag(onMove: (x: number, y: number) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const at = (e: { clientX: number; clientY: number }) => {
    const r = ref.current!.getBoundingClientRect();
    onMove(clamp((e.clientX - r.left) / r.width), clamp((e.clientY - r.top) / r.height));
  };
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    at(e);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => e.currentTarget.hasPointerCapture(e.pointerId) && at(e);
  return { ref, onPointerDown, onPointerMove };
}

/** Named colors, grouped like a Figma library: "BaseDraft / Accents", then Red, Orange... */
export interface Library {
  group: string;
  items: Array<{ name: string; hex: string }>;
}

export function ColorPicker({
  value,
  onChange,
  onClose,
  onReset,
  anchor,
  swatches,
  libraries,
  tab: initialTab = "custom",
  against,
  label,
}: {
  value: string;
  onChange: (hex: string) => void;
  onClose: () => void;
  /** Back to the template's own color; offered when the color has been changed. */
  onReset?: () => void;
  /** The element the picker opens beside. */
  anchor: HTMLElement;
  swatches: string[];
  libraries: Library[];
  tab?: "custom" | "libraries";
  /** Color to measure contrast against, usually the page. */
  against?: string;
  label: string;
}) {
  const [tab, setTab] = useState(initialTab);
  const [query, setQuery] = useState("");
  const [hsv, setHsv] = useState<HSV>(() => {
    const rgb = hexToRgb(value) ?? [0, 0, 0];
    return rgbToHsv(...rgb);
  });
  const [draft, setDraft] = useState(value.replace("#", "").toUpperCase());
  const card = useRef<HTMLDivElement>(null);
  const hex = hsvToHex(hsv);

  // Follow edits made elsewhere (undo, a reset) without snapping the hue when the change was ours.
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    const rgb = hexToRgb(value);
    if (rgb && value.toLowerCase() !== hex.toLowerCase()) {
      setHsv(rgbToHsv(...rgb));
      setDraft(value.replace("#", "").toUpperCase());
    }
  }

  // Live while dragging, at most once a frame.
  const frame = useRef(0);
  const set = (next: HSV) => {
    setHsv(next);
    const out = hsvToHex(next);
    setDraft(out.slice(1).toUpperCase());
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => onChange(out));
  };

  const area = useDrag((x, y) => set({ ...hsv, s: x, v: 1 - y }));
  const hue = useDrag((x) => set({ ...hsv, h: x * 359.9 }));

  useEffect(() => {
    const close = (e: PointerEvent) => !card.current?.contains(e.target as Node) && !anchor.contains(e.target as Node) && onClose();
    const esc = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        anchor.focus();
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [anchor, onClose]);

  // Beside the anchor's panel, like Figma: to its left, kept on screen.
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useEffect(() => {
    const r = anchor.getBoundingClientRect();
    const panel = anchor.closest("aside")?.getBoundingClientRect() ?? r;
    const h = card.current?.offsetHeight ?? 440;
    setPos({ left: Math.max(8, panel.left - 248), top: clamp(r.top - 60, 8, window.innerHeight - h - 8) });
  }, [anchor]);

  const keyOn = (e: KeyboardEvent, axis: "sv" | "h") => {
    const step = e.shiftKey ? 0.1 : 0.01;
    const d = { ArrowLeft: -step, ArrowRight: step, ArrowUp: step, ArrowDown: -step }[e.key];
    if (d === undefined) return;
    e.preventDefault();
    if (axis === "h") set({ ...hsv, h: (hsv.h + d * 360 + 360) % 360 });
    else if (e.key === "ArrowLeft" || e.key === "ArrowRight") set({ ...hsv, s: clamp(hsv.s + d) });
    else set({ ...hsv, v: clamp(hsv.v + d) });
  };

  const picker = typeof window !== "undefined" ? (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper : undefined;
  const ratio = against ? contrast(hex, against) : null;
  const field = "h-8 rounded-[8px] bg-fg/[0.05] text-[12px] outline-none focus-within:ring-2 focus-within:ring-fg/15";

  return createPortal(
    <motion.div
      ref={card}
      role="dialog"
      aria-label={`${label} color`}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.14, ease: EASE_OUT }}
      className="fixed z-[80] w-[240px] rounded-[16px] bg-surface text-fg shadow-[0_0_0_0.5px_rgb(var(--bd-ink)/0.12),0_10px_32px_rgba(0,0,0,0.16),0_2px_6px_rgba(0,0,0,0.06)]"
      style={pos ?? { left: -9999, top: 0 }}
    >
      <div role="tablist" aria-label={`${label} color`} className="flex items-center gap-1 border-b border-line p-2">
        {(["custom", "libraries"] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("h-7 rounded-[8px] px-2.5 text-[12px] font-semibold transition-colors", tab === t ? "bg-fg/[0.06] text-fg" : "text-muted hover:text-fg")}>
            {t === "custom" ? "Custom" : "Libraries"}
          </button>
        ))}
        <span className="flex-1 truncate px-1 text-right text-[12px] text-subtle">{label}</span>
        <button type="button" onClick={onClose} aria-label="Close" className="grid size-7 place-items-center rounded-[8px] text-muted hover:bg-fg/[0.06] hover:text-fg">
          <XIcon size={13} weight="bold" />
        </button>
      </div>

      {tab === "libraries" ? (
        <div className="flex max-h-[420px] flex-col">
          <label className="flex h-11 shrink-0 items-center gap-2 border-b border-line px-3">
            <MagnifyingGlassIcon size={14} className="text-muted" />
            <span className="sr-only">Search colors</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" autoFocus className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-subtle" />
          </label>
          <div className="min-h-0 overflow-y-auto py-1">
            {libraries.map((lib) => {
              const items = lib.items.filter((it) => `${lib.group} ${it.name} ${it.hex}`.toLowerCase().includes(query.trim().toLowerCase()));
              if (!items.length) return null;
              const [owner, name] = lib.group.includes(" / ") ? lib.group.split(" / ") : ["", lib.group];
              return (
                <div key={lib.group} className="pb-1">
                  <div className="px-3 pb-1 pt-2.5 text-[12px] font-medium">
                    {owner && <span className="text-muted">{owner} / </span>}
                    {name}
                  </div>
                  {items.map((it) => {
                    const on = it.hex.toLowerCase() === hex.toLowerCase();
                    return (
                      <button
                        key={it.name + it.hex}
                        type="button"
                        onClick={() => {
                          const rgb = hexToRgb(it.hex);
                          if (rgb) set(rgbToHsv(...rgb));
                        }}
                        className={cn("flex h-8 w-full items-center gap-2.5 px-3 text-left text-[13px] transition-colors hover:bg-fg/[0.05]", on && "bg-fg/[0.06] font-medium")}
                      >
                        <span className="size-4 shrink-0 rounded-[6px] shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.14)]" style={{ background: it.hex }} />
                        <span className="flex-1 truncate">{it.name}</span>
                        <span className="font-mono text-[11px] uppercase text-subtle">{it.hex.slice(1)}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
      <div className="space-y-3 p-3">
        {ratio !== null && (
          <div className="flex items-center justify-between text-[12px]" title="Contrast against the page color">
            <span className="flex items-center gap-1.5 tabular-nums">
              <span aria-hidden className="size-3.5 rounded-full shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.15)]" style={{ background: `linear-gradient(90deg, ${against} 50%, ${hex} 50%)` }} />
              {ratio.toFixed(2)} : 1
            </span>
            <span className={cn("rounded-[6px] px-1.5 py-0.5 font-semibold", ratio >= 4.5 ? "bg-[#14ae5c]/12 text-[#0d7a40]" : ratio >= 3 ? "bg-[#f5a623]/15 text-[#a15c00]" : "bg-fg/[0.06] text-muted")}>
              {ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA large" : "Low"}
            </span>
          </div>
        )}

        <div
          {...area}
          role="slider"
          tabIndex={0}
          aria-label="Saturation and brightness"
          aria-valuenow={Math.round(hsv.s * 100)}
          aria-valuetext={`Saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`}
          onKeyDown={(e) => keyOn(e, "sv")}
          className="relative aspect-square cursor-crosshair touch-none overflow-hidden rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-fg/40"
          style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))` }}
        >
          <span className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_2px_#fff,0_0_0_3px_rgb(var(--bd-ink)/0.25),inset_0_0_0_1px_rgb(var(--bd-ink)/0.2)]" style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: hex }} />
        </div>

        <div className="flex items-center gap-2.5">
          {picker && (
            <button
              type="button"
              aria-label="Pick a color from the screen"
              title="Pick from the screen"
              onClick={async () => {
                try {
                  const r = await new picker().open();
                  const rgb = hexToRgb(r.sRGBHex);
                  if (rgb) set(rgbToHsv(...rgb));
                } catch {
                  /* canceled */
                }
              }}
              className="grid size-7 shrink-0 place-items-center rounded-[8px] text-muted hover:bg-fg/[0.06] hover:text-fg"
            >
              <EyedropperIcon size={16} />
            </button>
          )}
          <div
            {...hue}
            role="slider"
            tabIndex={0}
            aria-label="Hue"
            aria-valuemin={0}
            aria-valuemax={360}
            aria-valuenow={Math.round(hsv.h)}
            onKeyDown={(e) => keyOn(e, "h")}
            className="relative h-3 flex-1 cursor-pointer touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-fg/40"
            style={{ background: "linear-gradient(90deg, #f00, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00)" }}
          >
            <span className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_2px_#fff,0_0_0_3px_rgb(var(--bd-ink)/0.2)]" style={{ left: `${(hsv.h / 360) * 100}%`, background: `hsl(${hsv.h} 100% 50%)` }} />
          </div>
        </div>

        <div className="flex gap-1.5">
          <span className={cn(field, "flex w-[58px] shrink-0 items-center px-2 font-medium")}>Hex</span>
          <label className={cn(field, "flex min-w-0 flex-1 items-center pl-2")}>
            <span className="sr-only">Hex value</span>
            <input
              value={draft}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9a-f]/gi, "").slice(0, 6).toUpperCase();
                setDraft(v);
                const rgb = hexToRgb(v);
                if (rgb && v.length === 6) set(rgbToHsv(...rgb));
              }}
              onFocus={(e) => e.target.select()}
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent font-mono uppercase outline-none"
            />
            <span className="border-l border-canvas px-2 tabular-nums text-muted">100 %</span>
          </label>
        </div>
      </div>

      <div className="border-t border-line p-3">
        <div className="mb-2 text-[12px] font-medium text-muted">On this page</div>
        <div className="grid grid-cols-8 gap-1.5">
          {[...new Set(swatches.map((c) => c.toLowerCase()))].map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Use ${c}`}
              title={c.toUpperCase()}
              onClick={() => {
                const rgb = hexToRgb(c);
                if (rgb) set(rgbToHsv(...rgb));
              }}
              className={cn("aspect-square rounded-[7px] shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.12)] transition-transform hover:scale-110", c === hex && "shadow-[0_0_0_2px_var(--bd-surface),0_0_0_3.5px_var(--bd-fg)]")}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
        </>
      )}
      {onReset && (
        <button type="button" onClick={onReset} className="flex h-10 w-full items-center gap-2 border-t border-line px-3 text-[12px] font-medium text-muted transition-colors hover:text-fg">
          <ArrowCounterClockwiseIcon size={13} /> Reset to the template&apos;s color
        </button>
      )}
    </motion.div>,
    document.body,
  );
}
