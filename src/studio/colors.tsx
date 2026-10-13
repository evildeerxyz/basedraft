"use client";

import { ArrowCounterClockwiseIcon, CheckIcon, CirclesFourIcon, PaletteIcon, WarningIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { templateOf, type TemplateSlug } from "@/site/live";
import { COLORS, HEX, paletteOf, SLOT_LABEL, SLOTS, type Mode, type Palette, type Theme, type ThemeSlot } from "@/site/theme";
import { ColorPicker, contrast, type Library } from "./color-picker";
import { Group, Segments } from "./ui";

/*
 * The project's colors, in the inspector when nothing is selected: a few palettes made for the
 * template, then its four colors one by one, each with Figma's fill row (swatch, hex, styles). A
 * template with a dark mode has a palette for each mode: the switch above them shows the canvas
 * in that mode and edits its colors.
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

/** Only what differs from `base`: a palette that matches the template's is no change at all. */
const diff = (next: Palette, base: Palette) => Object.fromEntries(SLOTS.filter((s) => next[s].toLowerCase() !== base[s].toLowerCase()).map((s) => [s, next[s].toLowerCase()])) as Partial<Palette>;

/** The theme with its colors replaced, its type and corners kept. */
function withColors(theme: Theme | undefined, light: Partial<Palette>, dark: Partial<Palette> | undefined): Theme | undefined {
  const out: Theme = { ...theme };
  for (const s of SLOTS) delete out[s];
  delete out.dark;
  Object.assign(out, light);
  if (dark && Object.keys(dark).length) out.dark = dark;
  return Object.keys(out).length ? out : undefined;
}

export function ColorsGroup({ template, theme, mode, onMode, onChange }: { template: TemplateSlug; theme?: Theme; mode: Mode; onMode: (m: Mode) => void; onChange: (t: Theme | undefined) => void }) {
  const c = COLORS[template];
  const moded = Boolean(c?.dark);
  const m: Mode = moded ? mode : "light";
  const p = paletteOf(template, theme, m);
  if (!c || !p) return null;
  const t = templateOf(template)!;
  const lightOf = (th?: Theme) => paletteOf(template, th, "light")!;
  /** The dark palette a light accent leads to before any dark color is set: dark mode's own, with that accent. */
  const darkFrom = (accent?: string) => paletteOf(template, accent ? { accent } : undefined, "dark")!;
  const set = (next: Palette) => {
    if (m === "dark") return onChange(withColors(theme, diff(lightOf(theme), c.base), diff(next, darkFrom(theme?.accent))));
    const light = diff(next, c.base);
    onChange(withColors(theme, light, theme?.dark));
  };
  const pick = (x: (typeof c.presets)[number]) => {
    const light = diff(x.colors, c.base);
    onChange(withColors(theme, light, c.dark && x.dark ? diff(x.dark, darkFrom(light.accent)) : theme?.dark));
  };
  const slot = (s: ThemeSlot) => (v: string | undefined) => set({ ...p, [s]: v ?? (m === "dark" ? darkFrom(theme?.accent)[s] : c.base[s]) });
  const base = m === "dark" ? darkFrom(theme?.accent) : c.base;
  const shown = (x: (typeof c.presets)[number]) => (m === "dark" && x.dark ? x.dark : x.colors);
  const on = (x: (typeof c.presets)[number]) => same(lightOf(theme), x.colors) && (!moded || !x.dark || same(paletteOf(template, theme, "dark")!, x.dark));
  const colored = Boolean(theme && (SLOTS.some((s) => theme[s]) || theme.dark));
  const swatches = [...new Set([p.accent, p.page, p.cards, p.text, ...c.presets.map((x) => x.colors.accent)])];
  const libraries: Library[] = [
    { group: `${t.name} / This project`, items: SLOTS.map((s) => ({ name: SLOT_LABEL[s], hex: p[s] })) },
    { group: `${t.name} / Its palettes`, items: c.presets.flatMap((x) => [{ name: `${x.name} accent`, hex: shown(x).accent }, { name: `${x.name} page`, hex: shown(x).page }]) },
    ...LIBRARIES,
  ];
  const read = contrast(p.text, p.page);
  const against: Record<ThemeSlot, string> = { accent: p.page, page: p.text, cards: p.text, text: p.page };

  return (
    <Group
      title="Colors"
      icon={PaletteIcon}
      aside={
        colored && (
          <button type="button" onClick={() => onChange(withColors(theme, {}, undefined))} className="flex h-7 items-center gap-1 rounded-[8px] px-2 text-[12px] font-medium text-muted hover:bg-fg/[0.06] hover:text-fg">
            <ArrowCounterClockwiseIcon size={12} /> Reset
          </button>
        )
      }
    >
      {moded && (
        <Segments
          full
          label="Mode"
          value={m}
          onChange={onMode}
          options={[
            { value: "light", label: "Light", title: "The light palette, and the canvas in light mode" },
            { value: "dark", label: "Dark", title: "The dark palette, and the canvas in dark mode" },
          ]}
        />
      )}
      <div role="radiogroup" aria-label="Palettes" className="grid grid-cols-3 gap-x-2 gap-y-2.5">
        {c.presets.map((x) => (
          <PresetTile key={x.name} name={x.name} colors={shown(x)} on={on(x)} onPick={() => pick(x)} />
        ))}
      </div>
      <div className="space-y-1.5">
        {SLOTS.map((s) => (
          <ColorRow key={`${m}-${s}`} label={SLOT_LABEL[s]} value={p[s]} base={base[s]} swatches={swatches} libraries={libraries} against={against[s]} onChange={slot(s)} />
        ))}
      </div>
      {read < 4.5 && (
        <p className="flex gap-2 text-[12px] leading-snug text-muted">
          <WarningIcon size={14} weight="fill" className="mt-px shrink-0 text-[#e8a200]" />
          Text on the page is {read.toFixed(1)}:1, under the 4.5:1 that small text needs to read well.
        </p>
      )}
      <p className="text-[12px] leading-snug text-muted">{moded ? `Light and dark each keep their own colors, and ${t.name}'s own switch still moves between them.` : "Every page and breakpoint takes these colors, and so do your copies to Figma and the code you download."}</p>
    </Group>
  );
}
