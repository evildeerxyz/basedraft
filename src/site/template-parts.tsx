import Image from "next/image";
import { cn } from "@/lib/utils";
import { templateLogo } from "./live";

/*
 * Small pieces the template pages share: a template's logo, its older color mark, and the second
 * button beside an ink one.
 */

export const secondary = "inline-flex h-12 shrink-0 items-center justify-center gap-2.5 whitespace-nowrap rounded-full px-6 text-ui font-medium text-fg shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--bd-fg)_14%,transparent)] transition-colors hover:bg-surface-2";

/** A template's own app icon, from its project (public/logos), with a hairline so it holds on any surface. */
export function TemplateLogo({ slug, size = 40, className }: { slug: string; size?: number; className?: string }) {
  return (
    <span className={cn("relative inline-block shrink-0 overflow-hidden rounded-[24%] shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_1px_rgb(0_0_0/0.06)]", className)} style={{ width: size, height: size }}>
      <Image src={templateLogo(slug)} alt="" width={size} height={size} unoptimized className="block size-full" />
    </span>
  );
}

/** A template's mark as a rounded tile in its accent: kept for the places that haven't moved to its logo. */
export function TemplateMark({ accent, size = 40 }: { accent: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="shrink-0">
      <rect x="4" y="4" width="24" height="24" rx="7" fill={accent} />
      <rect x="4.5" y="4.5" width="23" height="23" rx="6.5" fill="none" stroke="currentColor" strokeOpacity="0.08" />
    </svg>
  );
}
