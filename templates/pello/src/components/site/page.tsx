import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container } from "./ui";

/* The top of an inner page: its headline, what it's about, and anything that goes beside them. */
export function PageHead({ title, lead, children, className }: { title: ReactNode; lead?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <section className={cn("pb-16 pt-16 lg:pb-20 lg:pt-24", className)}>
      <Container>
        <h1 className="max-w-[1100px] text-balance font-display text-[clamp(3.6rem,9vw,8.6rem)] font-extrabold leading-[0.84] tracking-[-0.01em] text-ink">{title}</h1>
        {lead && <p className="mt-8 max-w-[660px] text-pretty text-[clamp(1.2rem,1.6vw,1.38rem)] leading-[1.45] text-ink-2">{lead}</p>}
        {children}
      </Container>
    </section>
  );
}

/** Long reading: the legal pages and blog posts. */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "max-w-[720px] text-[19px] leading-[1.65] text-ink-2 [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mb-4 [&_h2]:mt-14 [&_h2]:font-display [&_h2]:text-[40px] [&_h2]:font-extrabold [&_h2]:leading-[0.95] [&_h2]:text-ink [&_h3]:mb-3 [&_h3]:mt-10 [&_h3]:font-display [&_h3]:text-[28px] [&_h3]:font-bold [&_h3]:text-ink [&_li]:mt-2 [&_p]:mt-5 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:mt-5 [&_ul]:list-disc [&_ul]:pl-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
