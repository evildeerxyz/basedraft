"use client";

import { CaretDownIcon, CheckIcon, EyedropperIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";

/*
 * Choosing a color the way design tools do: a field of saturation and brightness to drag across, a
 * hue and an alpha slider, an eyedropper where the browser has one, and a value you can type as hex,
 * rgb() or hsl(). Under it, the contrast white and black text would have on the color, rated AA or
 * AAA, so a brand color is checked as it's picked. ColorField puts it behind a swatch, in a popover.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

/* ---------- Color ---------- */

type RGBA = { r: number; g: number; b: number; a: number };
type HSVA = { h: number; s: number; v: number; a: number };

function hsvToRgb({ h, s, v, a }: HSVA): RGBA {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return Math.round((v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255);
  };
  return { r: f(5), g: f(3), b: f(1), a };
}

function rgbToHsv({ r, g, b, a }: RGBA, hue = 0): HSVA {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const d = max - Math.min(R, G, B);
  let h = hue;
  if (d) h = 60 * (max === R ? ((G - B) / d + 6) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4);
  return { h, s: max ? d / max : 0, v: max, a };
}

function rgbToHsl({ r, g, b }: RGBA) {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  const h = d ? 60 * (max === R ? ((G - B) / d + 6) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4) : 0;
  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number, a: number): RGBA {
  const k = (n: number) => (n + h / 30) % 12;
  const f = (n: number) => Math.round((l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))) * 255);
  return { r: f(0), g: f(8), b: f(4), a };
}

const hex2 = (n: number) => Math.round(n).toString(16).padStart(2, "0");
/** #rrggbb, or #rrggbbaa when it's see-through. */
export const toHex = ({ r, g, b, a }: RGBA) => `#${hex2(r)}${hex2(g)}${hex2(b)}${a < 1 ? hex2(a * 255) : ""}`;

/** Reads #rgb, #rgba, #rrggbb, #rrggbbaa, rgb() and hsl(), with or without commas and alpha. */
export function parseColor(input: string): RGBA | null {
  const t = input.trim().toLowerCase();
  const hex = t.match(/^#?([0-9a-f]{3,8})$/);
  if (hex && [3, 4, 6, 8].includes(hex[1].length)) {
    const h = hex[1].length < 6 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
  }
  const fn = t.match(/^(rgba?|hsla?)\(\s*([^)]*)\)$/);
  if (!fn) return null;
  const parts = fn[2].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3) return null;
  const num = (p: string, scale: number) => (p.endsWith("%") ? (parseFloat(p) / 100) * scale : parseFloat(p));
  const a = parts[3] === undefined ? 1 : clamp(num(parts[3], 1));
  if (fn[1].startsWith("rgb")) {
    const [r, g, b] = parts.slice(0, 3).map((p) => clamp(num(p, 255), 0, 255));
    return [r, g, b, a].some(Number.isNaN) ? null : { r, g, b, a };
  }
  const h = parseFloat(parts[0]);
  const s = clamp(parseFloat(parts[1]) / 100);
  const l = clamp(parseFloat(parts[2]) / 100);
  return [h, s, l, a].some(Number.isNaN) ? null : hslToRgb(((h % 360) + 360) % 360, s, l, a);
}

type Format = "hex" | "rgb" | "hsl";
const pct = (n: number) => `${Math.round(n * 100)}%`;
function formatColor(c: RGBA, f: Format) {
  if (f === "hex") return toHex(c);
  const alpha = c.a < 1 ? ` / ${pct(c.a)}` : "";
  if (f === "rgb") return `rgb(${Math.round(c.r)} ${Math.round(c.g)} ${Math.round(c.b)}${alpha})`;
  const { h, s, l } = rgbToHsl(c);
  return `hsl(${Math.round(h)} ${pct(s)} ${pct(l)}${alpha})`;
}

/** WCAG contrast between two opaque colors, from 1 to 21. */
function contrast(x: RGBA, y: RGBA) {
  const lum = ({ r, g, b }: RGBA) => {
    const [R, G, B] = [r, g, b].map((n) => {
      const c = n / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  };
  const [a, b] = [lum(x), lum(y)].sort((m, n) => n - m);
  return (a + 0.05) / (b + 0.05);
}
const WHITE: RGBA = { r: 255, g: 255, b: 255, a: 1 };
const BLACK: RGBA = { r: 0, g: 0, b: 0, a: 1 };

/** The text color that reads best on a color: white or near-black. */
export const inkOn = (color: string) => {
  const c = parseColor(color);
  return c && contrast(c, BLACK) > contrast(c, WHITE) ? "#0b0b0c" : "#ffffff";
};

const CHECKER = "repeating-conic-gradient(rgb(var(--bd-ink) / 0.14) 0% 25%, transparent 0% 50%) 0 0 / 8px 8px";

/* ---------- Parts ---------- */

/** A slider of one channel: hue or alpha. The thumb is what takes focus and the keys. */
function Track({ label, value, max, text, background, swatch, onChange }: { label: string; value: number; max: number; text: string; background: string; swatch: string; onChange: (n: number) => void }) {
  const bar = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLSpanElement>(null);
  const from = (e: ReactPointerEvent) => {
    const r = bar.current!.getBoundingClientRect();
    onChange(clamp((e.clientX - r.left) / r.width) * max);
  };
  const keys = (e: ReactKeyboardEvent) => {
    const step = (e.shiftKey ? 10 : 1) * (max === 1 ? 0.01 : 1);
    const next = e.key === "ArrowRight" || e.key === "ArrowUp" ? value + step : e.key === "ArrowLeft" || e.key === "ArrowDown" ? value - step : e.key === "Home" ? 0 : e.key === "End" ? max : null;
    if (next === null) return;
    e.preventDefault();
    onChange(clamp(next, 0, max));
  };
  return (
    <div
      ref={bar}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        from(e);
        knob.current?.focus({ preventScroll: true });
      }}
      onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && from(e)}
      className="relative h-3 touch-none rounded-full"
      style={{ background }}
    >
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.1)]" />
      <span
        ref={knob}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max === 1 ? 100 : max}
        aria-valuenow={Math.round(max === 1 ? value * 100 : value)}
        aria-valuetext={text}
        onKeyDown={keys}
        className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none shadow-[0_0_0_2.5px_white,0_1px_4px_1px_rgb(0_0_0/0.3)] transition-transform duration-150 focus-visible:scale-[1.18] active:scale-[1.18]"
        style={{ left: `${(value / max) * 100}%`, background: swatch }}
      />
    </div>
  );
}

const noop = () => () => {};
const hasEyeDropper = () => typeof window !== "undefined" && "EyeDropper" in window;

export type ColorPickerProps = {
  /** The color, as hex: #rrggbb, or #rrggbbaa with alpha. */
  value?: string;
  defaultValue?: string;
  onChange?: (hex: string) => void;
  /** Shows the alpha slider, and lets the value carry alpha. */
  alpha?: boolean;
  /** Colors to pick from in one click: the brand's, or the last few used. */
  swatches?: string[];
  /** Shows how white and black text read on the color. */
  contrast?: boolean;
  /** How the value shows to start: hex, rgb() or hsl(). The button beside it switches. */
  format?: Format;
  className?: string;
};

/** The picker itself: a panel to put in a page, or in ColorField's popover. */
export function ColorPicker({ value, defaultValue = "#3b82f6", onChange, alpha = false, swatches, contrast: showContrast = true, format: startFormat = "hex", className }: ColorPickerProps) {
  const [hsva, setHsva] = useState<HSVA>(() => rgbToHsv(parseColor(value ?? defaultValue) ?? BLACK));
  // Follows a value set from outside, keeping its own hue when the new color is the same one.
  const [seen, setSeen] = useState(value);
  if (value !== undefined && value !== seen) {
    setSeen(value);
    const c = parseColor(value);
    if (c && toHex(c) !== toHex(hsvToRgb(hsva))) setHsva(rgbToHsv(c, hsva.h));
  }
  const [format, setFormat] = useState<Format>(startFormat);
  const [text, setText] = useState<string | null>(null);
  const [bad, setBad] = useState(0);
  const [drag, setDrag] = useState(false);
  const canDrop = useSyncExternalStore(noop, hasEyeDropper, () => false);
  const area = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  const still = useReducedMotion();
  const id = useId();

  const rgba = hsvToRgb(hsva);
  const hex = toHex(rgba);
  const solid = toHex({ ...rgba, a: 1 });
  const set = (next: HSVA) => {
    const n = { ...next, a: alpha ? next.a : 1 };
    setHsva(n);
    const h = toHex(hsvToRgb(n));
    if (h !== hex) onChange?.(h);
  };
  const setColor = (c: RGBA) => set(rgbToHsv({ ...c, a: alpha ? c.a : 1 }, hsva.h));

  const fromArea = (e: ReactPointerEvent) => {
    const r = area.current!.getBoundingClientRect();
    set({ ...hsva, s: clamp((e.clientX - r.left) / r.width), v: 1 - clamp((e.clientY - r.top) / r.height) });
  };
  const areaKeys = (e: ReactKeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.01;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
    if (!d) return;
    e.preventDefault();
    set({ ...hsva, s: clamp(hsva.s + d[0]), v: clamp(hsva.v + d[1]) });
  };
  const commit = () => {
    if (text === null) return;
    const c = parseColor(text);
    if (c) setColor(c);
    else setBad((n) => n + 1);
    setText(null);
  };
  const drop = async () => {
    try {
      const { sRGBHex } = await new (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper().open();
      const c = parseColor(sRGBHex);
      if (c) setColor({ ...c, a: hsva.a });
    } catch {}
  };

  const onWhite = contrast(rgba, WHITE);
  const onBlack = contrast(rgba, BLACK);
  const grade = (r: number) => (r >= 7 ? "AAA" : r >= 4.5 ? "AA" : r >= 3 ? "AA large" : "Fails");

  return (
    <div className={cx("grid w-[264px] gap-3 rounded-[22px] bg-[var(--bd-surface)] p-3 text-[var(--bd-fg)] shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]", className)}>
      {/* Saturation across, brightness up: white and black laid over the pure hue. */}
      <div
        ref={area}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setDrag(true);
          fromArea(e);
          thumb.current?.focus({ preventScroll: true });
        }}
        onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && fromArea(e)}
        onPointerUp={() => setDrag(false)}
        onPointerCancel={() => setDrag(false)}
        className={cx("relative h-[152px] touch-none rounded-[14px]", drag ? "cursor-grabbing" : "cursor-crosshair")}
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsva.h} 100% 50%))` }}
      >
        <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[14px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]" />
        <span
          ref={thumb}
          role="slider"
          tabIndex={0}
          aria-label="Saturation and brightness"
          aria-roledescription="2D slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(hsva.s * 100)}
          aria-valuetext={`Saturation ${pct(hsva.s)}, brightness ${pct(hsva.v)}`}
          onKeyDown={areaKeys}
          className={cx("absolute size-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full outline-none shadow-[0_0_0_2.5px_white,0_2px_6px_1px_rgb(0_0_0/0.35)] transition-transform duration-150 focus-visible:shadow-[0_0_0_2.5px_white,0_0_0_5px_rgb(0_0_0/0.25),0_2px_6px_1px_rgb(0_0_0/0.35)]", drag && "scale-125")}
          style={{ left: pct(hsva.s), top: pct(1 - hsva.v), background: solid }}
        />
      </div>

      <div className="flex items-center gap-2.5">
        {/* The color as it is, over a checkerboard when it's see-through. */}
        <span aria-hidden className="relative size-8 shrink-0 overflow-hidden rounded-full" style={{ background: CHECKER }}>
          <span className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.12)]" style={{ background: hex }} />
        </span>
        <div className="grid min-w-0 flex-1 gap-2.5 px-1.5">
          <Track label="Hue" value={hsva.h} max={360} text={`${Math.round(hsva.h)} degrees`} background="linear-gradient(to right, #f00, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00)" swatch={`hsl(${hsva.h} 100% 50%)`} onChange={(h) => set({ ...hsva, h })} />
          {alpha && <Track label="Alpha" value={hsva.a} max={1} text={pct(hsva.a)} background={`linear-gradient(to right, transparent, ${solid}), ${CHECKER}`} swatch={hex} onChange={(a) => set({ ...hsva, a })} />}
        </div>
        {canDrop && (
          <button type="button" aria-label="Pick a color from the screen" onClick={drop} className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--bd-muted)] outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]">
            <EyedropperIcon weight="duotone" className="size-[18px]" />
          </button>
        )}
      </div>

      <div className="flex h-9 items-center gap-1 rounded-[12px] bg-[var(--bd-ui-field)] p-1 shadow-[var(--bd-ui-well)]">
        <button
          type="button"
          onClick={() => setFormat((f) => (f === "hex" ? "rgb" : f === "rgb" ? "hsl" : "hex"))}
          aria-label={`Showing ${format.toUpperCase()}; switch the format`}
          className="h-7 w-11 shrink-0 rounded-[8px] text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--bd-muted)] outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
        >
          {format}
        </button>
        <motion.input
          key={bad}
          aria-label="Color value"
          spellCheck={false}
          value={text ?? formatColor(rgba, format)}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape" && text !== null) {
              e.stopPropagation();
              setText(null);
            }
          }}
          animate={bad && !still ? { x: [0, -5, 5, -3, 3, 0] } : undefined}
          transition={{ duration: 0.32 }}
          className="h-7 min-w-0 flex-1 rounded-[8px] bg-transparent px-1.5 font-mono text-[12.5px] text-[var(--bd-fg)] outline-none focus-visible:bg-[rgb(var(--bd-ink)/0.04)]"
        />
      </div>

      {swatches && swatches.length > 0 && (
        <div role="group" aria-label="Swatches" className="flex flex-wrap gap-1.5">
          {swatches.map((s) => {
            const c = parseColor(s);
            if (!c) return null;
            const on = toHex({ ...c, a: alpha ? c.a : 1 }) === hex;
            return (
              <button
                key={s}
                type="button"
                aria-label={s}
                aria-pressed={on}
                onClick={() => setColor(c)}
                className="relative grid size-6 place-items-center rounded-full outline-none transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
                style={{ background: s, boxShadow: "inset 0 0 0 1px rgb(var(--bd-ink) / 0.12)" }}
              >
                <AnimatePresence>
                  {on && (
                    <motion.span key="on" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ type: "spring", stiffness: 600, damping: 30 }} style={{ color: inkOn(s) }}>
                      <CheckIcon weight="bold" className="size-3" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
      )}

      {showContrast && (
        <div aria-labelledby={`${id}-contrast`} role="group" className="grid grid-cols-2 gap-1.5">
          <span id={`${id}-contrast`} className="sr-only">
            Contrast of text on this color
          </span>
          {[
            { ink: "#ffffff", ratio: onWhite, name: "White text" },
            { ink: "#0b0b0c", ratio: onBlack, name: "Black text" },
          ].map((t) => {
            const g = grade(t.ratio);
            return (
              <div key={t.name} className="flex items-center gap-2 rounded-[12px] p-1 pr-2 shadow-[inset_0_0_0_1px_var(--bd-line-subtle)]">
                <span aria-hidden className="grid h-7 w-8 shrink-0 place-items-center rounded-[8px] text-[13px] font-semibold" style={{ background: solid, color: t.ink }}>
                  Aa
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="sr-only">{t.name}: </span>
                  <span className="block font-mono text-[11.5px] tabular-nums text-[var(--bd-fg)]">{t.ratio.toFixed(1)}:1</span>
                  <span className={cx("block text-[10.5px] font-medium", g === "Fails" ? "text-[var(--bd-ui-stop)]" : g === "AA large" ? "text-[var(--bd-subtle)]" : "text-[var(--bd-ui-ok)]")}>{g}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- ColorField ---------- */

type Scope = { "data-theme"?: string; className?: string };
function scopeOf(el: Element | null): Scope {
  if (!el) return {};
  const byAttr = el.closest("[data-theme]");
  const byClass = el.closest(".dark, .light, .bd-light");
  const near = byAttr && byClass ? (byAttr.contains(byClass) ? byClass : byAttr) : (byAttr ?? byClass);
  if (!near) return {};
  if (near === byAttr) return { "data-theme": near.getAttribute("data-theme") ?? undefined };
  return { className: ["dark", "bd-light", "light"].find((c) => near.classList.contains(c)) };
}

export type ColorFieldProps = Omit<ColorPickerProps, "className"> & {
  /** What the color is for, read to screen readers: "Brand color". */
  label: string;
  className?: string;
};

/** A swatch and its value, that opens the picker under it. */
export function ColorField({ label, value, defaultValue = "#3b82f6", onChange, className, ...picker }: ColorFieldProps) {
  const [own, setOwn] = useState(defaultValue);
  const color = value ?? own;
  const [place, setPlace] = useState<{ left: number; top: number; bottom: number; up: boolean; scope: Scope } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  const show = () => {
    const r = button.current?.getBoundingClientRect();
    if (!r) return;
    const room = innerHeight - r.bottom;
    setPlace({ left: Math.min(r.left, innerWidth - 276), top: r.bottom + 8, bottom: innerHeight - r.top + 8, up: room < 440 && r.top > room, scope: scopeOf(button.current) });
  };
  const hide = (refocus = false) => {
    setPlace(null);
    if (refocus) button.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!place) return;
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !button.current?.contains(t)) setPlace(null);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setPlace(null);
      button.current?.focus({ preventScroll: true });
    };
    const move = (e: Event) => {
      if (!panel.current?.contains(e.target as Node)) setPlace(null);
    };
    // Into the picker, on its first control.
    const f = requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>('[role="slider"]')?.focus({ preventScroll: true }));
    addEventListener("pointerdown", away, true);
    addEventListener("keydown", esc);
    addEventListener("resize", move);
    addEventListener("scroll", move, { capture: true, passive: true });
    return () => {
      cancelAnimationFrame(f);
      removeEventListener("pointerdown", away, true);
      removeEventListener("keydown", esc);
      removeEventListener("resize", move);
      removeEventListener("scroll", move, { capture: true });
    };
  }, [place]);

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={!!place}
        aria-label={`${label}: ${color}`}
        onClick={() => (place ? hide() : show())}
        className={cx("group flex h-10 w-full items-center gap-2.5 rounded-[12px] bg-[var(--bd-ui-field)] pl-1.5 pr-3 text-left shadow-[var(--bd-ui-well)] outline-none transition-shadow focus-visible:shadow-[var(--bd-ui-well),0_0_0_3px_var(--bd-ui-focus)]", className)}
      >
        <span aria-hidden className="relative size-7 shrink-0 overflow-hidden rounded-[8px]" style={{ background: CHECKER }}>
          <span className="absolute inset-0 rounded-[8px] shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.12)] transition-colors duration-200" style={{ background: color }} />
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-[13px] uppercase text-[var(--bd-fg)]">{color}</span>
        <CaretDownIcon weight="bold" className={cx("size-3 shrink-0 text-[var(--bd-subtle)] transition-transform duration-200", place && "rotate-180")} />
      </button>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {place && (
              <motion.div
                ref={panel}
                role="dialog"
                aria-label={label}
                {...place.scope}
                initial={{ opacity: 0, scale: 0.96, y: place.up ? 6 : -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12 } }}
                transition={still ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 34 }}
                className={cx("fixed z-[110] rounded-[22px] shadow-[var(--bd-shadow-float)]", place.scope.className)}
                style={{ left: Math.max(8, place.left), ...(place.up ? { bottom: place.bottom } : { top: place.top }), transformOrigin: place.up ? "bottom left" : "top left" }}
                onBlur={(e) => {
                  const to = e.relatedTarget as Node | null;
                  if (to && !e.currentTarget.contains(to) && to !== button.current) hide();
                }}
              >
                <ColorPicker
                  {...picker}
                  value={color}
                  onChange={(h) => {
                    if (value === undefined) setOwn(h);
                    onChange?.(h);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
