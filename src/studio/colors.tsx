"use client";

import { ArrowCounterClockwiseIcon, CheckIcon, PaletteIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { templateOf, type TemplateSlug } from "@/site/live";
import { COLORS, paletteOf, SLOTS, type Mode, type Palette, type Theme } from "@/site/theme";
import { Group, Segments } from "./ui";

/*
 * The project's colors, in the inspector when nothing is selected: a few palettes made for the
 * template, one click each. A template with a dark mode has a palette for each mode, and the
 * switch above them shows the canvas in that mode.
 */

const same = (a: Palette, b: Palette) => SLOTS.every((s) => a[s].toLowerCase() === b[s].toLowerCase());

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

/** The theme with its colors replaced, anything else a draft keeps from before (its type, its corners) kept. */
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
  if (!c || !paletteOf(template, theme, m)) return null;
  const t = templateOf(template)!;
  const lightOf = (th?: Theme) => paletteOf(template, th, "light")!;
  /** The dark palette a light accent leads to before any dark color is set: dark mode's own, with that accent. */
  const darkFrom = (accent?: string) => paletteOf(template, accent ? { accent } : undefined, "dark")!;
  const pick = (x: (typeof c.presets)[number]) => {
    const light = diff(x.colors, c.base);
    onChange(withColors(theme, light, c.dark && x.dark ? diff(x.dark, darkFrom(light.accent)) : theme?.dark));
  };
  const shown = (x: (typeof c.presets)[number]) => (m === "dark" && x.dark ? x.dark : x.colors);
  const on = (x: (typeof c.presets)[number]) => same(lightOf(theme), x.colors) && (!moded || !x.dark || same(paletteOf(template, theme, "dark")!, x.dark));

  return (
    <Group
      title="Colors"
      icon={PaletteIcon}
      aside={
        theme && (
          <button type="button" onClick={() => onChange(undefined)} title={`Back to ${t.name}'s own look`} className="flex h-7 items-center gap-1 rounded-[8px] px-2 text-[12px] font-medium text-muted hover:bg-fg/[0.06] hover:text-fg">
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
            { value: "light", label: "Light", title: "The canvas in light mode" },
            { value: "dark", label: "Dark", title: "The canvas in dark mode" },
          ]}
        />
      )}
      <div role="radiogroup" aria-label="Palettes" className="grid grid-cols-3 gap-x-2 gap-y-2.5">
        {c.presets.map((x) => (
          <PresetTile key={x.name} name={x.name} colors={shown(x)} on={on(x)} onPick={() => pick(x)} />
        ))}
      </div>
      <p className="text-[12px] leading-snug text-muted">Every page takes these colors, and so do your copies to Figma and the code you download.</p>
    </Group>
  );
}
