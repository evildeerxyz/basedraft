import type { ReactNode } from "react";
import { rampMasks } from "@/lib/dither";
import { cn } from "@/lib/site";
import { Scramble } from "./reveal";

/** A dithered seam between a dark and a light section. */
export function DitherBand({
  from,
  to,
  rows = 28,
  scale = 4,
  accent = 0.55,
}: {
  from: string;
  to: string;
  rows?: number;
  scale?: number;
  accent?: number;
}) {
  const { end, mid } = rampMasks(rows, scale, { accent });
  const height = rows * scale;
  const mask = (url: string) => ({
    maskImage: url,
    WebkitMaskImage: url,
    maskSize: `${8 * scale}px ${height}px`,
    WebkitMaskSize: `${8 * scale}px ${height}px`,
    maskRepeat: "repeat-x",
    WebkitMaskRepeat: "repeat-x",
  });
  return (
    <div aria-hidden className="relative" style={{ height, background: from }}>
      {mid && <div className="absolute inset-0 bg-accent" style={mask(mid)} />}
      <div className="absolute inset-0" style={{ background: to, ...mask(end) }} />
    </div>
  );
}

export function SectionLabel({ index, children, className }: { index: string; children: string; className?: string }) {
  return (
    <div className={cn("type-label flex items-center gap-3", className)}>
      <span className="inline-block size-[7px] bg-accent" />
      <span className="opacity-50">{index}</span>
      <span className="opacity-30">/</span>
      <Scramble text={children} />
    </div>
  );
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] border border-current/20 px-1 font-mono text-[10.5px] leading-none opacity-70",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

type Variant = "light" | "dark" | "ghost-dark" | "ghost-light" | "accent";

const VARIANTS: Record<Variant, string> = {
  light: "bg-paper text-ink hover:bg-accent",
  dark: "bg-ink text-paper hover:bg-ink-3",
  accent: "bg-accent text-ink hover:bg-paper",
  "ghost-dark": "border border-paper/15 text-paper hover:border-paper/40 hover:bg-paper/5",
  "ghost-light": "border border-ink/15 text-ink hover:border-ink/40 hover:bg-ink/5",
};

export const buttonClass = (variant: Variant = "light", size: "md" | "lg" = "md") =>
  cn(
    "group inline-flex select-none items-center justify-center gap-2 rounded-[6px] font-medium tracking-[-0.01em] transition-[background-color,border-color,color,transform] duration-200 active:translate-y-px",
    size === "lg" ? "h-12 px-5 text-[15px]" : "h-9 px-3.5 text-[13.5px]",
    VARIANTS[variant],
  );

/** Registration marks for "figure" frames. */
export function CornerMarks({ className }: { className?: string }) {
  return (
    <>
      {["left-2 top-2", "right-2 top-2", "bottom-2 left-2", "bottom-2 right-2"].map((pos) => (
        <span
          key={pos}
          aria-hidden
          className={cn("pointer-events-none absolute font-mono text-[11px] leading-none text-paper/30", pos, className)}
        >
          +
        </span>
      ))}
    </>
  );
}
