import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Band } from "./ui";

/* The top of an inner page, set against the left edge: its headline, what it's about, and anything that goes under them. */
export function PageHead({ title, lead, children, className, align = "left" }: { title: ReactNode; lead?: ReactNode; children?: ReactNode; className?: string; align?: "left" | "center" }) {
  return (
    <Band inner={cn("pb-14 pt-16 lg:pb-20 lg:pt-24", align === "center" && "text-center", className)}>
      <h1 className={cn("max-w-[900px] text-balance text-[clamp(2.8rem,5.8vw,4.8rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-ink", align === "center" && "mx-auto")}>{title}</h1>
      {lead && <p className={cn("mt-6 max-w-[620px] text-pretty text-[19px] leading-[1.5] text-mute", align === "center" && "mx-auto")}>{lead}</p>}
      {children}
    </Band>
  );
}

/** Long reading: the legal pages and blog posts. */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "max-w-[700px] text-[18px] leading-[1.7] text-ink-2 [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mb-3 [&_h2]:mt-12 [&_h2]:text-[30px] [&_h2]:font-semibold [&_h2]:leading-[1.15] [&_h2]:tracking-[-0.035em] [&_h2]:text-ink [&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:text-[22px] [&_h3]:font-semibold [&_h3]:tracking-[-0.02em] [&_h3]:text-ink [&_li]:mt-2 [&_p]:mt-5 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:mt-5 [&_ul]:list-disc [&_ul]:pl-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
