import { cn } from "@/lib/cn";

/** pello's mark: two people side by side, one of them the one who does the paperwork. */
export function Mark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={cn("shrink-0", className)}>
      <circle cx="12.5" cy="16" r="8.5" fill="currentColor" />
      <circle cx="19.5" cy="16" r="8.5" fill="var(--pl-accent)" fillOpacity="0.94" />
    </svg>
  );
}

export function Logo({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-ink", className)}>
      <Mark size={size} />
      <span className="text-[24px] font-semibold leading-none tracking-[-0.05em]" style={{ fontSize: size * 0.86 }}>
        pello
      </span>
    </span>
  );
}
