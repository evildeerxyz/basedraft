import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * pello's mark: two people side by side, one in ink and one in vermilion. Where they overlap,
 * they're printed over each other as a dither, the way every picture on the site is.
 */
export function Mark({ size = 28, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={cn("shrink-0", className)}>
      <defs>
        <pattern id={`${id}d`} width="2" height="2" patternUnits="userSpaceOnUse">
          <rect width="1" height="1" fill="currentColor" />
          <rect x="1" y="1" width="1" height="1" fill="currentColor" />
        </pattern>
        <clipPath id={`${id}c`}>
          <circle cx="11.5" cy="16" r="9.5" />
        </clipPath>
      </defs>
      <circle cx="11.5" cy="16" r="9.5" fill="currentColor" />
      <circle cx="20.5" cy="16" r="9.5" fill="var(--pl-accent)" />
      <rect width="32" height="32" fill={`url(#${id}d)`} clipPath={`url(#${id}c)`} />
    </svg>
  );
}

export function Logo({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-ink", className)}>
      <Mark size={size} />
      <span className="font-display font-semibold leading-none tracking-[-0.055em]" style={{ fontSize: size * 0.96 }}>
        pello
      </span>
    </span>
  );
}
