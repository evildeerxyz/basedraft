import { cn } from "@/lib/utils";
import { DitherReveal } from "./DitherReveal";

/** Two-tone headline: the first clause states, the second (muted) completes. */
export function SectionTitle({
  lead,
  tail,
  className,
  tone = "dark",
  as = "h2",
}: {
  lead: string;
  tail?: string;
  className?: string;
  tone?: "dark" | "light";
  as?: "h1" | "h2";
}) {
  return (
    <DitherReveal
      as={as}
      className={cn("text-[clamp(2.6rem,5.4vw,4.9rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-balance", className)}
    >
      {lead}
      {tail && <span className={tone === "light" ? "text-ink/45" : "text-white/45"}> {tail}</span>}
    </DitherReveal>
  );
}
