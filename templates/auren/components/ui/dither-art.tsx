import { ditherPaths, type ArtVariant } from "@/lib/dither-art";
import { cn } from "@/lib/site";

/** Procedural, server-rendered dither art: three inks, one ordered-dither pass. */
export function DitherArt({
  variant,
  seed,
  cols = 72,
  rows = 45,
  className,
}: {
  variant: ArtVariant;
  seed: number;
  cols?: number;
  rows?: number;
  className?: string;
}) {
  const { mid, hi } = ditherPaths(variant, seed, cols, rows);
  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="crispEdges"
      aria-hidden
      className={cn("block bg-ink", className)}
    >
      <path d={mid} className="fill-accent" />
      <path d={hi} className="fill-paper" />
    </svg>
  );
}
