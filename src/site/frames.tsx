"use client";

import { ArrowUpRightIcon, DesktopIcon, DeviceMobileIcon, DeviceTabletIcon } from "@phosphor-icons/react";
import { LayoutGroup, motion } from "motion/react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { DesignCopyMenu, type CopyTarget } from "./design-copy";

export type Device = "desktop" | "tablet" | "phone";
export const DEVICE_WIDTH: Record<Device, number> = { desktop: 1280, tablet: 820, phone: 390 };
const ICONS = { desktop: DesktopIcon, tablet: DeviceTabletIcon, phone: DeviceMobileIcon };

/** Desktop, tablet or phone: a pill track with the width you picked raised on it. */
export function DevicePicker({ value, onChange, widths = DEVICE_WIDTH }: { value: Device; onChange: (d: Device) => void; widths?: Record<Device, number> }) {
  const id = useId();
  return (
    <LayoutGroup id={id}>
      <div role="group" aria-label="Preview width" className="inline-flex rounded-full bg-surface-2 p-1">
        {(Object.keys(widths) as Device[]).map((d) => {
          const Icon = ICONS[d];
          const on = value === d;
          return (
            <button key={d} type="button" onClick={() => onChange(d)} aria-pressed={on} aria-label={`${d[0].toUpperCase()}${d.slice(1)}, ${widths[d]} pixels`} title={`${widths[d]} px`} className={cn("relative grid h-7 w-8 place-items-center rounded-full transition-colors", on ? "text-fg" : "text-subtle hover:text-fg")}>
              {on && <motion.span layoutId="device" className="absolute inset-0 rounded-full bg-raised shadow-[var(--bd-shadow-resting),inset_0_0_0_1px_var(--bd-line-subtle)]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              <Icon weight="duotone" size={15} className="relative" />
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

const NARROW = "(max-width: 639px)";
const onNarrow = (cb: () => void) => {
  const m = matchMedia(NARROW);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};
/** Whether the window is phone width. The server renders as if it isn't; the browser corrects it straight after. */
export const useNarrow = () =>
  useSyncExternalStore(
    onNarrow,
    () => matchMedia(NARROW).matches,
    () => false,
  );

/** A real page in an iframe at device width, scaled to fit. Media queries and scrolling behave exactly as on the device. */
export function DeviceFrame({ src, full = src, title, height = 760, device: initial = "desktop", copy }: { src: string; /** Where Open full screen goes. */ full?: string; title: string; height?: number; device?: Device; copy?: CopyTarget }) {
  // On a phone, a desktop site scaled down to the screen is too small to read: start at phone width.
  const narrow = useNarrow();
  const [picked, setDevice] = useState<Device | null>(null);
  const device = picked ?? (narrow ? "phone" : initial);
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [avail, setAvail] = useState(1200);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setAvail(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const w = device === "desktop" ? 1440 : DEVICE_WIDTH[device];
  const scale = Math.min(1, avail / w);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 sm:mb-3">
        <DevicePicker value={device} onChange={setDevice} />
        {/* Phones have no room for the size; the picker already says which device it is. */}
        <span className="hidden whitespace-nowrap rounded-full bg-surface-2/80 px-2.5 py-1 text-meta tabular-nums text-subtle backdrop-blur sm:inline">
          {w} × {Math.round(height / scale)}
        </span>
        <div className="flex shrink-0 items-center gap-1 sm:gap-4">
          {copy && <DesignCopyMenu targets={[copy]} />}
          <a href={full} target="_blank" rel="noreferrer" aria-label="Open full screen" className="inline-flex size-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-full text-meta text-subtle transition-colors hover:bg-surface-2 hover:text-fg sm:w-auto sm:px-3">
            <span className="hidden sm:inline">Open full screen</span> <ArrowUpRightIcon weight="regular" size={13} />
          </a>
        </div>
      </div>
      <div ref={box} className="overflow-hidden rounded-[14px]" style={{ height }}>
        <div className="mx-auto h-full overflow-hidden rounded-[14px] border border-line transition-[width] duration-500" style={{ width: w * scale }}>
          <div style={{ width: w, height: height / scale, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
            <iframe ref={frame} src={src} title={title} className="h-full w-full border-0 bg-white" loading="lazy" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * One real section in a frame at device width, scaled to fit. The frame takes the section's own
 * height up to a viewport, then scrolls, so tall scroll-driven sections still play as they should.
 */
export function LiveSectionFrame({ src, title, device, viewport = 900 }: { src: string; title: string; device: Device; viewport?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [avail, setAvail] = useState(1000);
  const [height, setHeight] = useState(viewport);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setAvail(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const w = device === "desktop" ? 1440 : DEVICE_WIDTH[device];
  const scale = Math.min(1, avail / w);
  // Reads the section's height once it has drawn, and again whenever it changes.
  const measure = () => {
    const doc = frame.current?.contentDocument;
    const wrap = doc?.querySelector("[data-bd-section]");
    if (!wrap) return;
    const rs = [...wrap.children].map((c) => c.getBoundingClientRect());
    if (!rs.length) return;
    const h = Math.ceil(Math.max(...rs.map((r) => r.bottom)) - Math.min(...rs.map((r) => r.top)));
    setHeight(Math.max(48, Math.min(viewport, h)));
  };
  return (
    <div ref={box}>
      <div className="mx-auto overflow-hidden rounded-[var(--bd-r-inset)] bg-surface shadow-[var(--bd-shadow-float),0_0_0_1px_var(--bd-line)] transition-[width,height] duration-500" style={{ width: w * scale, height: height * scale }}>
        <div style={{ width: w, height, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
          <iframe
            ref={frame}
            src={src}
            title={title}
            loading="lazy"
            className="block h-full w-full border-0"
            onLoad={() => {
              measure();
              const doc = frame.current?.contentDocument;
              if (doc) new ResizeObserver(measure).observe(doc.documentElement);
              setTimeout(measure, 800);
            }}
          />
        </div>
      </div>
    </div>
  );
}
