import type { ReactNode } from "react";
import { cn } from "@/lib/site";
import { LogoGlyph } from "../../ui/logo";

/** Dark product surface used by every feature visual. */
export function Panel({
  title,
  meta,
  footer,
  children,
  className,
}: {
  title: string;
  meta?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-[10px] border border-ink/10 bg-ink text-paper shadow-[0_50px_90px_-50px_rgba(10,10,9,0.6)]",
        className,
      )}
    >
      <div className="flex h-10 shrink-0 items-center gap-2.5 border-b border-paper/8 px-4">
        <LogoGlyph size={11} className="text-accent" />
        <span className="type-label text-paper/55">{title}</span>
        {meta && <span className="ml-auto font-mono text-[11px] text-paper/35">{meta}</span>}
      </div>
      <div className="relative min-h-0 flex-1">{children}</div>
      {footer && (
        <div className="flex min-h-10 shrink-0 items-center gap-3 border-t border-paper/8 px-4 py-2 font-mono text-[11px] text-paper/40">
          {footer}
        </div>
      )}
    </div>
  );
}
