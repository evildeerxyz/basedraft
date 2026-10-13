"use client";

import { ArrowCounterClockwiseIcon, CheckIcon, CirclesFourIcon, PaletteIcon, WarningIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { templateOf, type TemplateSlug } from "@/site/live";
import { COLORS, HEX, paletteOf, SLOT_LABEL, SLOTS, type Palette, type Theme, type ThemeSlot } from "@/site/theme";
import { ColorPicker, contrast, type Library } from "./color-picker";
import { Group } from "./ui";

/*
 * The project's colors, in the inspector when nothing is selected: a few palettes made for the
 * template, then its four colors one by one, each with Figma's fill row (swatch, hex, styles).
 */

const LIBRARIES: Library[] = [
  {
    group: "basedraft / Accents",
    items: [
      { name: "Ultramarine", hex: "#2f49ff" },
      { name: "Periwinkle", hex: "#7b93ff" },
      { name: "Sky", hex: "#0ea5e9" },
      { name: "Green", hex: "#0fa968" },
      { name: "Lime", hex: "#c8ff3e" },
      { name: "Amber", hex: "#ff9e00" },
      { name: "Honey", hex: "#f2a23a" },
      { name: "Coral", hex: "#ff5a4e" },
      { name: "Pink", hex: "#ec4899" },
    ],
  },
  {
    group: "basedraft / Neutrals",
    items: [
      { name: "White", hex: "#ffffff" },
      { name: "Paper", hex: "#fbfaf7" },
      { name: "Mist", hex: "#f5f5f5" },
      { name: "Stone", hex: "#e5e5e5" },
      { name: "Gray", hex: "#8c8c8c" },
      { name: "Graphite", hex: "#2e2e2e" },
      { name: "Ink", hex: "#141414" },
      { name: "Black", hex: "#000000" },
    ],
  },
];

const same = (a: Palette, b: Palette) => SLOTS.every((s) => a[s].toLowerCase() === b[s].toLowerCase());

function ColorRow({ label, value, base, swatches, libraries, against, onChange }: { label: string; value: string; base: string; swatches: string[]; libraries: Library[]; against?: string; onChange: (v: string | undefined) => void }) {
  const changed = value.toLowerCase() !== base.toLowerCase();
  // The control the picker opens beside, and which tab it opens on; null while it's closed.
  const [open, setOpen] = useState<{ anchor: HTMLElement; tab: "custom" | "libraries" } | null>(null);
  const hex = HEX.test(value) ? value : "#000000";
  const toggle = (anchor: HTMLElement, tab: "custom" | "libraries") => setOpen((o) => (o?.tab === tab ? null : { anchor, tab }));
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-[52px] shrink-0 text-[12px] text-muted">{label}</span>
      {/* Figma's fill row: swatch, hex, opacity, then the style button. */}
      <div className={cn("flex h-8 min-w-0 flex-1 items-center rounded-[8px] bg-fg/[0.05] pl-1.5 text-[12px] transition-shadow focus-within:ring-2 focus-within:ring-fg/15", open?.tab === "custom" && "ring-2 ring-fg/15")}>
        <button type="button" onClick={(e) => toggle(e.currentTarget, "custom")} aria-label={`Pick the ${label.toLowerCase()} color`} aria-expanded={open?.tab === "custom"} className="size-[18px] shrink-0 rounded-[6px] shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.14)]" style={{ background: hex }} />
        <input
          aria-label={`${label} hex value`}
          defaultValue={hex.slice(1).toUpperCase()}
          key={hex}
          spellCheck={false}
          onFocus={(e) => e.target.select()}
          onBlur={(e) => {
            const v = `#${e.target.value.replace(/[^0-9a-f]/gi, "")}`;
            if (HEX.test(v)) onChange(v.toLowerCase());
            else e.target.value = hex.slice(1).toUpperCase();
          }}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className="h-full min-w-0 flex-1 bg-transparent pl-2 font-mono uppercase outline-none"
        />
        {changed && <span aria-label="Changed from the template" title="Changed from the template" className="mr-1.5 size-1.5 shrink-0 rounded-full bg-fg/45" />}
        <span className="border-l border-canvas px-2 tabular-nums text-muted">100 %</span>
      </div>
      <button type="button" onClick={(e) => toggle(e.currentTarget, "libraries")} aria-label={`${label} color styles`} aria-expanded={open?.tab === "libraries"} title="Styles" className={cn("grid size-8 shrink-0 place-items-center rounded-[8px] text-muted transition-colors hover:bg-fg/[0.06] hover:text-fg", open?.tab === "libraries" && "bg-fg/[0.08] text-fg")}>
        <CirclesFourIcon size={15} />
      </button>
      {open && (
        <ColorPicker
          key={open.tab}
          label={label}
          value={hex}
          tab={open.tab}
          anchor={open.anchor}
          swatches={swatches}
          libraries={libraries}
          against={against}
          onChange={(v) => onChange(v)}
          onReset={changed ? () => onChange(undefined) : undefined}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

/** A palette at a glance: its page, a card on it, a line of its text and its accent. */
function PresetTile({ name, colors, on, onPick }: { name: string; colors: Palette; on: boolean; onPick: () => void }) {
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onPick} className="group min-w-0 text-left">
      <span className={cn("relative flex h-12 flex-col justify-between overflow-hidden rounded-[7px] p-1.5 transition-shadow", on ? "shadow-[0_0_0_2px_var(--bd-fg)]" : "shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.12)] group-hover:shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.3)]")} style={{ background: colors.page }}>
        <span className="flex items-center justify-between">
          <span className="text-[13px] font-semibold leading-none" style={{ color: colors.text }}>
            Aa
          </span>
          <span className="size-2.5 rounded-full" style={{ background: colors.accent }} />
        </span>
        <span className="h-2.5 w-3/4 rounded-[3px]" style={{ background: colors.cards, boxShadow: `inset 0 0 0 1px ${colors.text}1a` }} />
        {on && (
          <span className="absolute bottom-1 right-1 grid size-3.5 place-items-center rounded-full bg-fg text-canvas">
            <CheckIcon size={8} weight="bold" />
          </span>
        )}
      </span>
      <span className={cn("mt-1 block truncate px-0.5 text-[11.5px]", on ? "font-medium text-fg" : "text-muted")}>{name}</span>
    </button>
  );
}

export function ColorsGroup({ template, theme, onChange }: { template: TemplateSlug; theme?: Theme; onChange: (t: Theme | undefined) => void }) {
  const c = COLORS[template];
  const p = paletteOf(template, theme);
  if (!c || !p) return null;
  const t = templateOf(template)!;
  /** Keeps only what differs from the template, so a palette that matches it is no change at all. */
  const set = (next: Palette) => {
    const out: Theme = {};
    for (const s of SLOTS) if (next[s].toLowerCase() !== c.base[s].toLowerCase()) out[s] = next[s].toLowerCase();
    onChange(Object.keys(out).length ? out : undefined);
  };
  const slot = (s: ThemeSlot) => (v: string | undefined) => set({ ...p, [s]: v ?? c.base[s] });
  const swatches = [...new Set([p.accent, p.page, p.cards, p.text, ...c.presets.map((x) => x.colors.accent)])];
  const libraries: Library[] = [
    { group: `${t.name} / This project`, items: SLOTS.map((s) => ({ name: SLOT_LABEL[s], hex: p[s] })) },
    { group: `${t.name} / Its palettes`, items: c.presets.flatMap((x) => [{ name: `${x.name} accent`, hex: x.colors.accent }, { name: `${x.name} page`, hex: x.colors.page }]) },
    ...LIBRARIES,
  ];
  const read = contrast(p.text, p.page);
  const against: Record<ThemeSlot, string> = { accent: p.page, page: p.text, cards: p.text, text: p.page };

  return (
    <Group
      title="Colors"
      icon={PaletteIcon}
      aside={
        theme && (
          <button type="button" onClick={() => onChange(undefined)} className="flex h-7 items-center gap-1 rounded-[8px] px-2 text-[12px] font-medium text-muted hover:bg-fg/[0.06] hover:text-fg">
            <ArrowCounterClockwiseIcon size={12} /> Reset
          </button>
        )
      }
    >
      <div role="radiogroup" aria-label="Palettes" className="grid grid-cols-3 gap-x-2 gap-y-2.5">
        {c.presets.map((x) => (
          <PresetTile key={x.name} name={x.name} colors={x.colors} on={same(p, x.colors)} onPick={() => set(x.colors)} />
        ))}
      </div>
      <div className="space-y-1.5">
        {SLOTS.map((s) => (
          <ColorRow key={s} label={SLOT_LABEL[s]} value={p[s]} base={c.base[s]} swatches={swatches} libraries={libraries} against={against[s]} onChange={slot(s)} />
        ))}
      </div>
      {read < 4.5 && (
        <p className="flex gap-2 text-[12px] leading-snug text-muted">
          <WarningIcon size={14} weight="fill" className="mt-px shrink-0 text-[#e8a200]" />
          Text on the page is {read.toFixed(1)}:1, under the 4.5:1 that small text needs to read well.
        </p>
      )}
      <p className="text-[12px] leading-snug text-muted">Every page and breakpoint takes these colors, and so do your copies to Figma and the code you download.</p>
    </Group>
  );
}
