"use client";

import { useState, type ComponentType } from "react";
import { ColorField, ColorPicker, inkOn } from "../../pro-ui/color-picker";

const BRAND = ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#0f172a"];

/** What the color does on a page: a button, a tag and a bar. */
function Preview({ color }: { color: string }) {
  return (
    <div className="grid w-[210px] content-start gap-3.5 rounded-[22px] bg-[var(--bd-surface)] p-4 shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--bd-subtle)]">Preview</p>
      <button type="button" className="h-10 rounded-full px-4 text-[13.5px] font-medium shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_4px_12px_-6px_rgb(0_0_0/0.4)] transition-colors duration-200" style={{ background: color, color: inkOn(color) }}>
        Get started
      </button>
      <span className="inline-flex h-6 w-fit items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium text-[var(--bd-fg)]" style={{ background: `color-mix(in oklab, ${color} 16%, transparent)` }}>
        <span className="size-1.5 rounded-full" style={{ background: color }} />
        Shipped
      </span>
      <div className="grid gap-1.5">
        <div className="flex justify-between text-[12px] text-[var(--bd-muted)]">
          <span>Storage</span>
          <span className="tabular-nums">68%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bd-ui-track)]">
          <div className="h-full w-[68%] rounded-full transition-colors duration-200" style={{ background: color }} />
        </div>
      </div>
    </div>
  );
}

export function Demo() {
  const [color, setColor] = useState("#2563eb");
  return (
    <div className="flex flex-wrap items-start justify-center gap-3">
      <ColorPicker value={color} onChange={setColor} swatches={BRAND} />
      <Preview color={color} />
    </div>
  );
}

function Field() {
  return (
    <div className="grid w-full max-w-[300px] gap-3.5">
      {[
        { label: "Brand", value: "#2563eb" },
        { label: "Accent", value: "#db2777" },
        { label: "Background", value: "#f8fafc" },
      ].map((f) => (
        <label key={f.label} className="grid gap-1.5">
          <span className="text-[13px] font-medium text-[var(--bd-fg)]">{f.label}</span>
          <ColorField label={`${f.label} color`} defaultValue={f.value} swatches={BRAND} />
        </label>
      ))}
    </div>
  );
}

function Alpha() {
  return <ColorPicker alpha defaultValue="#7c3aedb3" format="rgb" contrast={false} />;
}

export const examples: Record<string, ComponentType> = { field: Field, alpha: Alpha };
