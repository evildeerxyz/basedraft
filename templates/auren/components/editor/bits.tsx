"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { ditherTile, rampMasks } from "@/lib/dither";
import { cn } from "@/lib/site";
import { LogoGlyph } from "../ui/logo";

// dither textures; masks follow the accent theme
export const WASH = ditherTile(12, 1);
export const FIELD = ditherTile(6, 1);
export const TRACK = ditherTile(9, 1, "#efebe2");
const EDGE = rampMasks(12, 2, { axis: "x" }).end;

export const LINE_H = 20;
// inner panes scroll natively, then hand the wheel back to the page
export const PANE_SCROLL = "no-scrollbar overflow-y-auto overscroll-auto";

export const mask = (url: string) => ({ maskImage: url, WebkitMaskImage: url, maskSize: "8px 8px", WebkitMaskSize: "8px 8px" });
export const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Accent progress fill with a dithered leading edge. */
export function Fill({ width }: { width: string }) {
  return (
    <div className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-500" style={{ width }}>
      <div className="absolute inset-y-0 left-full w-5 -scale-x-100 bg-accent" style={{ maskImage: EDGE, WebkitMaskImage: EDGE }} />
    </div>
  );
}

export function Track({ progress, className }: { progress: number; className?: string }) {
  return (
    <div className={cn("relative h-[5px]", className)} style={{ backgroundImage: TRACK, backgroundSize: "8px 8px" }}>
      <Fill width={`${Math.min(1, progress) * 100}%`} />
    </div>
  );
}

export function AgentLine({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn("flex gap-2.5 text-[13px] leading-[1.6]", muted ? "text-paper/45" : "text-paper/75")}
    >
      <LogoGlyph size={12} className="mt-[5px] shrink-0 text-accent" />
      <div className="min-w-0">{children}</div>
    </motion.div>
  );
}

/** A file or query reference in a transcript; clickable when it maps to a file. */
export function Chip({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  const cls =
    "min-w-0 truncate rounded-[4px] border border-paper/10 bg-paper/[0.04] px-1.5 py-px font-mono text-[11px] text-paper/85";
  return onClick ? (
    <button type="button" onClick={onClick} className={cn(cls, "transition-colors hover:border-accent/60 hover:text-paper")}>
      {children}
    </button>
  ) : (
    <span className={cls}>{children}</span>
  );
}

/** Small anchored menu that closes on outside click or Escape. */
export function Popover({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.parentElement?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 2 }}
          transition={{ duration: 0.16 }}
          className={cn(
            "absolute bottom-full z-30 mb-2 min-w-[220px] overflow-hidden rounded-[8px] border border-paper/12 bg-ink-3 p-1 text-[12.5px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)]",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Menu row: label on top, an optional note underneath, a check when selected. */
export function MenuItem({
  active,
  selected,
  onClick,
  children,
  note,
}: {
  active?: boolean;
  selected?: boolean;
  onClick: () => void;
  children: ReactNode;
  note?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-[5px] px-2.5 py-1.5 text-left transition-colors",
        active ? "bg-paper/[0.08] text-paper" : "text-paper/70 hover:bg-paper/[0.05] hover:text-paper",
      )}
    >
      <span className="flex min-w-0 flex-col">
        <span className="flex min-w-0 items-center gap-2 whitespace-nowrap">{children}</span>
        {note && <span className="mt-0.5 truncate font-mono text-[10.5px] text-paper/35">{note}</span>}
      </span>
      {selected && <CheckIcon size={12} weight="bold" className="ml-auto shrink-0 text-accent" />}
    </button>
  );
}
