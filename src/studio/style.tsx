"use client";

import { ArrowCounterClockwiseIcon, ShapesIcon, TextAaIcon } from "@phosphor-icons/react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import type { TemplateSlug } from "@/site/live";
import { COLORS, FONTS, type FontId, type Mode, type Theme } from "@/site/theme";
import { ColorsGroup } from "./colors";
import { Select } from "@/ui/select";
import { Slider } from "./slider";
import { Group, Segments } from "./ui";

/*
 * The project's type and corners, in the inspector below its colors: a typeface for everything,
 * headings in one of their own if you like, how heavy and how tight headlines sit, and how round
 * every corner is. Each is laid over the template's own and can go back to it.
 */

const IDS = Object.keys(FONTS) as FontId[];
/** Typefaces Studio offers only to the template that's set in them (pello's Barlow). */
const OWN_ONLY = new Set<FontId>(["barlow"]);

/** The fonts' "Aa", for the tiles: only those two letters of each, so it's a few kilobytes. */
function useTileFonts() {
  useEffect(() => {
    if (document.getElementById("bd-font-tiles")) return;
    const link = document.createElement("link");
    link.id = "bd-font-tiles";
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${IDS.map((f) => `family=${FONTS[f].google}`).join("&")}&text=Aa&display=swap`;
    document.head.appendChild(link);
  }, []);
}

const reset = "flex h-7 items-center gap-1 rounded-[8px] px-2 text-[12px] font-medium text-muted hover:bg-fg/[0.06] hover:text-fg";

/** Drops the settings that are back at the template's own, so an untouched theme is no theme. */
function tidy(t: Theme): Theme | undefined {
  const out = { ...t } as Record<string, unknown>;
  for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k];
  if (out.radius === 1) delete out.radius;
  return Object.keys(out).length ? (out as Theme) : undefined;
}

export function TypeGroup({ template, theme, onChange }: { template: TemplateSlug; theme?: Theme; onChange: (t: Theme | undefined) => void }) {
  useTileFonts();
  const c = COLORS[template];
  const own = c.font.own;
  const font = theme?.font ?? own;
  const set = (patch: Partial<Theme>) => onChange(tidy({ ...theme, ...patch }));
  const changed = Boolean(theme && (theme.font || theme.headings || theme.weight || theme.tracking !== undefined));
  // The template's own typeface first, then the rest. A typeface only one template uses is offered
  // only there, as a wide tile of its own above the others.
  const order = [...(own ? [own] : []), ...IDS.filter((f) => f !== own && !OWN_ONLY.has(f))];
  return (
    <Group
      title="Type"
      icon={TextAaIcon}
      aside={
        changed && (
          <button type="button" onClick={() => set({ font: undefined, headings: undefined, weight: undefined, tracking: undefined })} className={reset}>
            <ArrowCounterClockwiseIcon size={12} /> Reset
          </button>
        )
      }
    >
      <div role="radiogroup" aria-label="Typeface" className="grid grid-cols-3 gap-1.5">
        {order.map((f) => {
          const on = f === font;
          return (
            <button key={f} type="button" role="radio" aria-checked={on} onClick={() => set({ font: f === own ? undefined : f })} className={cn("group min-w-0 rounded-[10px] px-2 pb-1.5 pt-2 text-left transition-[background-color,box-shadow]", OWN_ONLY.has(f) && "col-span-3", on ? "bg-fg/[0.05] shadow-[inset_0_0_0_1.5px_var(--bd-fg)]" : "shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.1)] hover:bg-fg/[0.03]")}>
              <span className="flex items-start justify-between gap-1">
                <span className="text-[22px] font-medium leading-none" style={{ fontFamily: `"${FONTS[f].family}", ${FONTS[f].serif ? "serif" : "sans-serif"}` }}>
                  Aa
                </span>
                {f === own && <span title="The template's own" aria-label="The template's own" className="mt-0.5 size-1.5 shrink-0 rounded-full bg-fg/40" />}
              </span>
              <span className={cn("mt-1.5 block truncate text-[12px]", on ? "font-medium text-fg" : "text-muted")}>{FONTS[f].label}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5">
        <label id="bd-headings-font-label" htmlFor="bd-headings-font" className="w-[64px] shrink-0 text-[12px] text-muted">
          Headings
        </label>
        <div className="min-w-0 flex-1">
          <Select
            id="bd-headings-font"
            size="sm"
            value={theme?.headings ?? ""}
            onChange={(v) => set({ headings: !v || v === font ? undefined : (v as FontId) })}
            options={[{ value: "", label: "Same as text" }, ...order.map((f) => ({ value: f, label: FONTS[f].label }))]}
            className="[&>button]:rounded-[8px] [&>button]:border-transparent [&>button]:bg-fg/[0.05] [&>button]:hover:border-transparent [&>button]:hover:bg-fg/[0.07]"
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-[64px] shrink-0 text-[12px] text-muted">Weight</span>
        <div className="min-w-0 flex-1">
          <Segments
            full
            label="Headline weight"
            value={theme?.weight ?? 0}
            onChange={(v) => set({ weight: v || undefined })}
            options={[
              { value: 0, label: "As is", title: "The template's own" },
              { value: 400, label: "400", title: "Regular" },
              { value: 500, label: "500", title: "Medium" },
              { value: 600, label: "600", title: "Semibold" },
              { value: 700, label: "700", title: "Bold" },
            ]}
          />
        </div>
      </div>
      <Slider
        label="Headline spacing"
        min={-0.08}
        max={0.04}
        step={0.005}
        value={theme?.tracking ?? 0}
        mark={0}
        format={(v) => (theme?.tracking === undefined ? "As is" : `${v > 0 ? "+" : ""}${v.toFixed(3)}em`)}
        onChange={(v) => set({ tracking: v })}
        onReset={() => set({ tracking: undefined })}
      />
    </Group>
  );
}

const PRESETS: Array<{ k: number; label: string }> = [
  { k: 0, label: "Square" },
  { k: 0.5, label: "Soft" },
  { k: 1, label: "As is" },
  { k: 1.5, label: "Round" },
  { k: 2, label: "Rounder" },
];

export function CornersGroup({ theme, onChange }: { theme?: Theme; onChange: (t: Theme | undefined) => void }) {
  const k = theme?.radius ?? 1;
  const set = (radius: number) => onChange(tidy({ ...theme, radius }));
  return (
    <Group
      title="Corners"
      icon={ShapesIcon}
      aside={
        k !== 1 && (
          <button type="button" onClick={() => set(1)} className={reset}>
            <ArrowCounterClockwiseIcon size={12} /> Reset
          </button>
        )
      }
    >
      <div role="radiogroup" aria-label="Corner presets" className="grid grid-cols-5 gap-1">
        {PRESETS.map((p) => {
          const on = Math.abs(p.k - k) < 0.001;
          return (
            <button key={p.k} type="button" role="radio" aria-checked={on} onClick={() => set(p.k)} className={cn("flex min-w-0 flex-col items-center gap-1.5 rounded-[10px] pb-1.5 pt-2.5 transition-[background-color,box-shadow]", on ? "bg-fg/[0.05] shadow-[inset_0_0_0_1.5px_var(--bd-fg)]" : "hover:bg-fg/[0.04]")}>
              <span aria-hidden className={cn("block size-5 border-l-2 border-t-2", on ? "border-fg" : "border-fg/45")} style={{ borderTopLeftRadius: Math.min(16, p.k * 8) }} />
              <span className={cn("max-w-full truncate px-0.5 text-[12px]", on ? "font-medium text-fg" : "text-muted")}>{p.label}</span>
            </button>
          );
        })}
      </div>
      <Slider label="Corner radius" min={0} max={2.5} step={0.05} value={k} mark={1} format={(v) => `${Math.round(v * 100)}%`} onChange={set} onReset={() => set(1)} />
      <p className="text-[12px] leading-snug text-muted">Scales every corner the template rounds. Pills and circles stay round.</p>
    </Group>
  );
}

/** The whole project's style, when nothing is selected: colors (in each mode), type and corners. */
export function StylePanel({ template, theme, mode, onMode, onChange }: { template: TemplateSlug; theme?: Theme; mode: Mode; onMode: (m: Mode) => void; onChange: (t: Theme | undefined) => void }) {
  return (
    <>
      <ColorsGroup template={template} theme={theme} mode={mode} onMode={onMode} onChange={onChange} />
      <TypeGroup template={template} theme={theme} onChange={onChange} />
      <CornersGroup theme={theme} onChange={onChange} />
    </>
  );
}
