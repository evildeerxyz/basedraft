import { cn } from "@/lib/cn";
import { BRAND_SVGS, type BrandKey } from "./brand-svgs";

export type { BrandKey };

/** An official brand mark, drawn from static SVG data that ships with the site. */
export function BrandLogo({ brand, className, title }: { brand: BrandKey; className?: string; title?: string }) {
  const { viewBox, body } = BRAND_SVGS[brand];
  return (
    <svg
      viewBox={viewBox}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn("shrink-0", className)}
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}

/** A brand mark on a white tile, so marks designed for light backgrounds read in both themes. */
export function BrandTile({ brand, className, size = "md" }: { brand: BrandKey; className?: string; size?: "sm" | "md" }) {
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-[4px] border border-line bg-white", size === "sm" ? "size-7" : "size-9", className)}>
      <BrandLogo brand={brand} className={size === "sm" ? "size-4" : "size-5"} />
    </span>
  );
}
