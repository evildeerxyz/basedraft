"use client";

import { useState, type ComponentType } from "react";
import { ColorField, ColorPicker, inkOn, parseColor, toHex } from "../../ui/color-picker";

/* A considered palette, not a rainbow: ink, graphite, clay, ochre, moss, pine, ocean, plum. */
const PALETTE = ["#1f1f1f", "#5c5c5c", "#b4553a", "#c4962f", "#4e6b47", "#2f5d50", "#2c5a7c", "#6a4560"];

/* ---------- A ramp, mixed in OKLab so its steps look even ---------- */

type V3 = [number, number, number];
const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
function toLab(hex: string): V3 {
  const c = parseColor(hex) ?? { r: 0, g: 0, b: 0, a: 1 };
  const [r, g, b] = [c.r, c.g, c.b].map((v) => lin(v / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function fromLab([L, A, B]: V3) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  const [r, g, b] = rgb.map((v) => Math.round(Math.min(1, Math.max(0, gam(v))) * 255));
  return toHex({ r, g, b, a: 1 });
}
const mix = (x: V3, y: V3, t: number): V3 => [x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t];
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
function ramp(hex: string) {
  const base = toLab(hex);
  const white: V3 = [1, 0, 0];
  const black: V3 = [0.16, 0, 0];
  const toWhite = [0.92, 0.82, 0.62, 0.42, 0.2];
  const toBlack = [0.22, 0.42, 0.6, 0.76];
  return STEPS.map((step, i) => ({ step, hex: i < 5 ? fromLab(mix(base, white, toWhite[i])) : i === 5 ? toHex({ ...(parseColor(hex) ?? { r: 0, g: 0, b: 0, a: 1 }), a: 1 }) : fromLab(mix(base, black, toBlack[i - 6])) }));
}
const luminance = (hex: string) => {
  const c = parseColor(hex) ?? { r: 0, g: 0, b: 0, a: 1 };
  const [r, g, b] = [c.r, c.g, c.b].map((v) => lin(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (x: string, y: string) => {
  const [a, b] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return (a + 0.05) / (b + 0.05);
};

/** A brand color as a sheet: the chip, its ten steps, and which of them hold text. */
function Sheet({ color }: { color: string }) {
  const steps = ramp(color);
  const [copied, setCopied] = useState<number | null>(null);
  const onWhite = steps.find((s) => ratio(s.hex, "#ffffff") >= 4.5)?.step;
  const onBlack = [...steps].reverse().find((s) => ratio(s.hex, "#000000") >= 4.5)?.step;
  return (
    <div className="grid w-[248px] content-start gap-3 rounded-[18px] p-2.5 shadow-[var(--bd-ui-lift),0_0_0_1px_rgb(var(--bd-ink)/0.08)] [background:var(--bd-ui-raised)]">
      <div className="flex h-[132px] flex-col justify-between rounded-[11px] p-3 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1)] transition-colors duration-200" style={{ background: color, color: inkOn(color) }}>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] opacity-75">Brand · 500</span>
        <span className="flex items-end justify-between">
          <span className="text-[22px] font-semibold tracking-[-0.03em]">Pine</span>
          <span className="font-mono text-[11.5px] uppercase opacity-85">{color}</span>
        </span>
      </div>
      <div className="grid gap-1.5">
        <div className="grid grid-cols-10 gap-[3px]">
          {steps.map((s) => (
            <button
              key={s.step}
              type="button"
              aria-label={`Copy ${s.step}, ${s.hex}`}
              onClick={() => {
                void navigator.clipboard?.writeText(s.hex).then(() => {
                  setCopied(s.step);
                  setTimeout(() => setCopied(null), 1100);
                });
              }}
              className="h-9 rounded-[5px] outline-none shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)] transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--bd-ui-focus)]"
              style={{ background: s.hex }}
            />
          ))}
        </div>
        <div className="grid grid-cols-10 gap-[3px] font-mono text-[8.5px] tabular-nums text-[var(--bd-subtle)]">
          {steps.map((s) => (
            <span key={s.step} className={`text-center ${copied === s.step ? "text-[var(--bd-fg)]" : ""}`}>
              {copied === s.step ? "✓" : s.step}
            </span>
          ))}
        </div>
      </div>
      <dl className="grid gap-1 border-t border-dashed border-[rgb(var(--bd-ink)/0.14)] pt-2.5 font-mono text-[10.5px]">
        <div className="flex justify-between">
          <dt className="uppercase tracking-[0.08em] text-[var(--bd-subtle)]">Text on white</dt>
          <dd className="text-[var(--bd-fg)]">{onWhite ? `${onWhite} and darker` : "none"}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="uppercase tracking-[0.08em] text-[var(--bd-subtle)]">Text on black</dt>
          <dd className="text-[var(--bd-fg)]">{onBlack ? `${onBlack} and lighter` : "none"}</dd>
        </div>
      </dl>
    </div>
  );
}

export function Demo() {
  const [color, setColor] = useState("#2f5d50");
  return (
    <div className="flex flex-wrap items-start justify-center gap-3">
      <ColorPicker value={color} onChange={setColor} swatches={PALETTE} />
      <Sheet color={color} />
    </div>
  );
}

function Field() {
  return (
    <div className="grid w-full max-w-[300px] gap-3.5">
      {[
        { label: "Brand", value: "#2f5d50" },
        { label: "Accent", value: "#b4553a" },
        { label: "Background", value: "#f6f4ef" },
      ].map((f) => (
        <label key={f.label} className="grid gap-1.5">
          <span className="text-[13px] font-medium text-[var(--bd-fg)]">{f.label}</span>
          <ColorField label={`${f.label} color`} defaultValue={f.value} swatches={PALETTE} />
        </label>
      ))}
    </div>
  );
}

function Alpha() {
  return <ColorPicker alpha defaultValue="#2c5a7cb3" contrast={false} />;
}

export const examples: Record<string, ComponentType> = { field: Field, alpha: Alpha };
