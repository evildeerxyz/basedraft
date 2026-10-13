import { GLYPH_PATH } from "@/lib/dither";
import { cn } from "@/lib/site";

export function LogoGlyph({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 -0.5 11 11"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d={GLYPH_PATH} />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoGlyph className="text-accent" />
      <span className="text-[17px] font-[620] tracking-[-0.03em] [font-stretch:115%]">Auren</span>
    </span>
  );
}
