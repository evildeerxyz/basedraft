import { cn } from "@/lib/cn";
import { BRANDS, type Brand } from "@/lib/brands";

/** An official brand mark, drawn from static SVG data that ships with the site. */
export function BrandMark({ brand, className, title }: { brand: Brand; className?: string; title?: string }) {
  const { viewBox, body } = BRANDS[brand];
  return <svg viewBox={viewBox} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} className={cn("shrink-0", className)} dangerouslySetInnerHTML={{ __html: body }} />;
}
