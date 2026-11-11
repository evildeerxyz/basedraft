"use client";

import "@/registry/extras.css";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { COMPONENTS } from "@/registry";
import { ENTRY_DEMOS } from "@/registry/catalog-demos";
import { BaseDraftMark } from "@/site/logo";

/*
 * The order: each cut lands on something unlike the last, the strongest pieces open and close it,
 * and the three that dim the whole frame (dialog, sheet, tour) sit far apart, so it never flashes.
 */
const PICK = [
  "navigation-menu", "dither-image", "pricing-table", "gauge", "password-field", "heatmap", "split-button", "ai-chat", "date-picker", "bar-chart",
  "dialog", "timeline", "hold-button", "donut-chart", "select", "compare-slider", "toast", "tree", "area-chart", "chips",
  "inbox", "code-block", "sheet", "funnel", "breadcrumb", "command", "stat", "accordion", "uptime",
  "menu", "sparkline", "card", "carousel", "tour", "slider", "bar-list", "wizard", "segmented", "meter",
  "tabs", "empty-state", "combobox", "app-sidebar", "code-input", "alert", "popover", "onboarding", "number-field", "spinner",
  "toolbar", "sortable-list", "tooltip", "pagination", "file-drop", "resizable", "kbd", "table-of-contents", "checkbox", "marquee",
  "avatar", "radio-group", "skeleton", "copy-button", "hover-card", "badge", "tag-input", "stepper", "inline-edit", "theme-toggle",
  "action-bar", "number", "field", "textarea", "input", "command-line", "switch", "button", "kanban-board",
];
/* Left out of the reel on purpose. */
const SKIP = new Set(["data-table"]);
const known = new Set(COMPONENTS.map((c) => c.name));
const picked = PICK.filter((n) => known.has(n));
// Anything added since joins just before the last frame.
const ORDER = [...picked.slice(0, -1), ...COMPONENTS.map((c) => c.name).filter((n) => !picked.includes(n) && !SKIP.has(n)), ...picked.slice(-1)];

/* Those that open over the page: kept near their own size, so the trigger and what it opens match. */
const CAP: Record<string, number> = { select: 1.1, menu: 1.1, popover: 1.05, combobox: 1.05, "date-picker": 1, "split-button": 1.15, breadcrumb: 1.1, "navigation-menu": 1, "hover-card": 1.1, tooltip: 1.25, inbox: 1, dialog: 1.1, sheet: 1, tour: 1, toast: 1.1 };

/* Those that open downward: placed near the top, so what they open has room below. */
const TOP = new Set(["date-picker", "menu", "inbox", "hover-card", "select", "combobox", "popover", "split-button", "breadcrumb"]);
/* Laid out wider than the frame's box, so they show their desktop layout (all three plans side by side), then scaled down whole. */
const WIDE: Record<string, number> = { "pricing-table": 1120 };

/** How the capture frames a component: moved by dx, dy (CSS px) so what's painted sits in the middle, and grown when it paints small in a wide box. */
type Frame = { dx: number; dy: number; grow: number };

/** The demo, scaled to the largest size that fits the frame (up to max), and kept fitted as it settles. */
function Fit({ max, top = false, wide, grow = 1, children }: { max: number; top?: boolean; wide?: number; grow?: number; children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  useLayoutEffect(() => {
    const s = stage.current;
    const b = box.current;
    if (!s || !b) return;
    const fit = () => {
      const w = Math.max(1, ...[...b.children].map((c) => (c as HTMLElement).offsetWidth));
      const h = Math.max(1, b.offsetHeight);
      setZoom(Math.min(max, Math.min(max, (s.clientWidth - 120) / w, (s.clientHeight - 36) / h) * grow));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(b);
    for (const c of b.children) ro.observe(c);
    return () => ro.disconnect();
  }, [max, grow]);
  return (
    <div ref={stage} className="absolute inset-0">
      <div
        ref={box}
        data-zoom={zoom ?? undefined}
        data-max={max}
        className={top ? "absolute left-1/2 top-4 grid w-max min-w-[760px] place-items-center" : "absolute left-1/2 top-1/2 grid w-max min-w-[760px] place-items-center"}
        style={{ minWidth: wide, transform: `translate(-50%, ${top ? "0" : "-50%"}) scale(${zoom ?? 1})`, transformOrigin: top ? "top center" : undefined, visibility: zoom === null ? "hidden" : undefined }}
      >
        {children}
      </div>
    </div>
  );
}

declare global {
  interface Window {
    __reel?: { show: (i: number, frame?: Frame) => void; end: () => void; count: number; names: string[] };
  }
}

/* The frame the header and caption are laid out for. A frame that needs more room gets a larger viewport, and they scale with it, so they look the same in every frame. */
const BASE_W = 1024;
const BASE_H = 576;

export function Reel() {
  const [i, setI] = useState(0);
  const [take, setTake] = useState(0);
  const [end, setEnd] = useState(false);
  const [k, setK] = useState(1);
  const [frame, setFrame] = useState<Frame>({ dx: 0, dy: 0, grow: 1 });
  const name = ORDER[i];
  const meta = COMPONENTS.find((c) => c.name === name);
  const Demo = ENTRY_DEMOS[name];

  useEffect(() => {
    window.__reel = {
      count: ORDER.length,
      names: ORDER,
      // Showing a frame mounts its demo afresh, even when it's the one already up.
      show: (n: number, by: Frame = { dx: 0, dy: 0, grow: 1 }) => {
        setEnd(false);
        setI(n);
        setFrame(by);
        setTake((t) => t + 1);
      },
      end: () => setEnd(true),
    };
    document.documentElement.dataset.theme = "light";
    document.documentElement.classList.remove("dark");
    const size = () => setK(innerWidth / BASE_W);
    size();
    addEventListener("resize", size);
    return () => removeEventListener("resize", size);
  }, []);

  return (
    <div data-theme="light" data-bd-stage="" className="bd-light bd-paper fixed inset-0 overflow-hidden text-[var(--bd-fg)]" style={{ cursor: "none" }}>
      {/* The demos' hints are for their docs page; here the frame speaks for itself. */}
      <style>{"[data-reel] .bd-hint{display:none}"}</style>
      {!end && (
        <div data-reel={name} className="absolute" style={{ top: 64 * k + frame.dy, bottom: 92 * k - frame.dy, left: frame.dx, right: -frame.dx }}>
          <Fit key={`${name}-${take}`} max={CAP[name] ?? 1.7} top={TOP.has(name)} wide={WIDE[name]} grow={frame.grow}>
            {Demo ? <Demo /> : null}
          </Fit>
        </div>
      )}
      {/* The header and the caption, drawn for the base frame and scaled to this one. */}
      <div className="pointer-events-none absolute left-0 top-0 origin-top-left" style={{ width: BASE_W, height: BASE_H, transform: `scale(${k})` }}>
        <div data-reel-head="" className="absolute inset-x-8 top-6 flex h-6 items-center justify-between">
          <span className="flex items-center gap-2.5 text-[17px] font-medium leading-none tracking-[-0.03em]">
            <BaseDraftMark size={20} /> basedraft UI
          </span>
          {!end && <span className="font-mono text-[13px] leading-none text-[var(--bd-subtle)]">basedraft.site/components</span>}
        </div>
        {end ? (
          <div className="absolute inset-0 grid place-items-center text-center">
            <div className="grid justify-items-center">
              <p className="font-display text-[104px] font-medium leading-none tracking-[-0.055em]">{COMPONENTS.length} components</p>
              <p className="mt-5 text-[22px] text-[var(--bd-muted)]">
                Free and open source, all on npm. Every one of them moves.
              </p>
              <span className="mt-9 flex items-center gap-3 rounded-full bg-[#18181b] px-6 py-3 font-mono text-[19px] text-[#e6edf3] shadow-[0_0_0_1px_rgb(255_255_255/0.08),0_20px_50px_-20px_rgb(0_0_0/0.6)]">
                <span className="text-[#8b949e]">$</span> npm i <span className="text-[#a5d6ff]">@basedraft/ui</span>
              </span>
              <p className="mt-6 text-[16px] text-[var(--bd-subtle)]">basedraft.site/components</p>
            </div>
          </div>
        ) : (
          <div data-reel-caption="" className="absolute bottom-7 left-8 flex h-9 items-center gap-3">
            <span className="font-display text-[34px] font-medium leading-none tracking-[-0.04em]">{meta?.title}</span>
            <span className="text-[16px] leading-none text-[var(--bd-subtle)]">{meta?.group}</span>
          </div>
        )}
      </div>
    </div>
  );
}
