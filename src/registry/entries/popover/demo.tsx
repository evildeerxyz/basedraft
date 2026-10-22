"use client";

import { CaretDownIcon, CheckIcon, LinkSimpleIcon, RulerIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { Button } from "../../ui/button";
import { CopyButton } from "../../ui/copy-button";
import { Input } from "../../ui/input";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Switch } from "../../ui/switch";
import { hint } from "../_shared/kit";

/* The accents Studio offers for Zuno, by name. */
const ACCENTS = [
  { name: "Lime", hex: "#C8FF3E" },
  { name: "Mint", hex: "#62E3B3" },
  { name: "Sky", hex: "#7CC4FF" },
  { name: "Iris", hex: "#9B8CFF" },
  { name: "Coral", hex: "#FF7A59" },
  { name: "Sand", hex: "#E8D9AD" },
];

/** The accent for a template, picked in a small card that opens from its swatch. */
export function Demo() {
  const [accent, setAccent] = useState(ACCENTS[0]);
  return (
    <div className="grid justify-items-center gap-3">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="lg" className="pl-2.5">
            <span className="size-6 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]" style={{ background: accent.hex }} />
            Accent: {accent.name}
            <CaretDownIcon weight="regular" />
          </Button>
        </PopoverTrigger>
        <PopoverContent label="Accent" className="w-[272px]">
          <p className="text-sm font-medium">Accent</p>
          <p className="mt-0.5 text-xs text-[var(--bd-muted)]">Buttons, links and the chart on Zuno.</p>
          <div role="radiogroup" aria-label="Accent" className="mt-4 grid grid-cols-6 gap-2">
            {ACCENTS.map((a) => {
              const on = a.hex === accent.hex;
              return (
                <button
                  key={a.hex}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={a.name}
                  title={a.name}
                  onClick={() => setAccent(a)}
                  className="relative grid aspect-square place-items-center rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)] transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
                  style={{ background: a.hex }}
                >
                  {on && <CheckIcon weight="bold" className="size-3.5 text-[#0b0b0c]" />}
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <Input value={accent.hex} readOnly aria-label="Hex" leading={<span className="size-3.5 rounded-full" style={{ background: accent.hex }} />} />
          </div>
          <PopoverClose asChild>
            <Button size="sm" className="mt-4 w-full">
              Done
            </Button>
          </PopoverClose>
        </PopoverContent>
      </Popover>
      <p className={hint}>Opens beside its button, and follows it as the page scrolls.</p>
    </div>
  );
}

function Share() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <LinkSimpleIcon weight="duotone" /> Share
        </Button>
      </PopoverTrigger>
      <PopoverContent label="Share this draft" align="start" className="w-[320px]">
        <p className="text-sm font-medium">Share this draft</p>
        <div className="mt-3 flex items-center gap-2 rounded-full bg-[var(--bd-surface)] py-1 pl-4 pr-1 shadow-[inset_0_0_0_1px_var(--bd-line)]">
          <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-[var(--bd-muted)]">basedraft.site/d/zuno-spring</span>
          <CopyButton value="https://basedraft.site/d/zuno-spring" label="Copy" variant="pill" />
        </div>
        <label className="mt-4 flex items-center justify-between gap-4 text-sm">
          Anyone with the link can look
          <Switch size="sm" defaultChecked aria-label="Anyone with the link can look" />
        </label>
      </PopoverContent>
    </Popover>
  );
}

function Aligned() {
  return (
    <div className="flex flex-wrap gap-2.5">
      {(["start", "center", "end"] as const).map((a) => (
        <Popover key={a}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              {a}
            </Button>
          </PopoverTrigger>
          <PopoverContent align={a} label={`Aligned to the ${a}`} className="w-[220px]">
            <p className="text-sm">
              Lined up with the button&apos;s <span className="font-medium">{a}</span>.
            </p>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  );
}

function Above() {
  const [width, setWidth] = useState("1440");
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <RulerIcon weight="duotone" /> {width} px
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" label="Preview width" className="w-[240px]">
        <p className="text-sm font-medium">Preview width</p>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {["1440", "820", "390"].map((w) => (
            <PopoverClose key={w} asChild>
              <Button variant={w === width ? "ink" : "outline"} size="sm" onClick={() => setWidth(w)}>
                {w}
              </Button>
            </PopoverClose>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export const examples: Record<string, ComponentType> = { share: Share, align: Aligned, top: Above };
