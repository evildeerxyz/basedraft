import { cn } from "@/lib/utils";

/*
 * What a component's, a kind's or a template's page shows for the moment after a click, before
 * the page itself arrives: its parts as soft gray shapes where the real ones land, pulsing gently.
 * A direct visit never sees it, since those pages are prerendered whole.
 */

const BAR = "block rounded-full bg-fg/[0.06]";

/** A piece's page: the back link and arrows, the kicker, name and line, its facts, the dock and the stage. */
export function PieceSkeleton({ dock = false }: { dock?: boolean }) {
  return (
    <div aria-hidden className="animate-pulse motion-reduce:animate-none">
      <div className="flex items-center justify-between gap-3 pt-6">
        <span className={cn(BAR, "h-9 w-[132px]")} />
        <span className={cn(BAR, "h-10 w-[148px]")} />
      </div>
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6 pb-8 pt-10">
        <div className="min-w-0 max-w-[640px] flex-1">
          <span className={cn(BAR, "h-5 w-[112px]")} />
          <span className="mt-4 block h-[42px] w-[min(360px,80%)] rounded-[14px] bg-fg/[0.08] sm:h-[54px]" />
          <span className={cn(BAR, "mt-4 h-[18px] w-full max-w-[580px]")} />
          <span className={cn(BAR, "mt-2.5 h-[18px] w-[72%] max-w-[420px]")} />
        </div>
        <div className="flex gap-2 max-sm:hidden">
          <span className={cn(BAR, "h-8 w-[112px]")} />
          <span className={cn(BAR, "h-8 w-[148px]")} />
        </div>
      </div>
      {dock && <span className={cn(BAR, "mx-auto h-11 w-[min(560px,92%)]")} />}
      <div className="pt-6">
        <div className="bd-panel h-[640px] rounded-[32px] max-sm:h-[900px]" />
      </div>
    </div>
  );
}

/** A template's page under its back link: the mark and price, the name and lines, the buttons, and the card of numbers. */
export function TemplateSkeleton() {
  return (
    <div aria-hidden className="mt-10 grid animate-pulse grid-cols-1 items-end gap-10 motion-reduce:animate-none lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
      <div>
        <div className="flex items-center gap-3">
          <span className="size-[52px] rounded-[16px] bg-fg/[0.08]" />
          <span className={cn(BAR, "h-[22px] w-14")} />
        </div>
        <span className="mt-6 block h-[64px] w-[min(300px,70%)] rounded-[18px] bg-fg/[0.08]" />
        <span className={cn(BAR, "mt-3 h-5 w-32")} />
        <span className={cn(BAR, "mt-5 h-4 w-full max-w-[560px]")} />
        <span className={cn(BAR, "mt-2.5 h-4 w-[64%] max-w-[400px]")} />
        <div className="mt-8 flex gap-3">
          <span className={cn(BAR, "h-12 w-40")} />
          <span className={cn(BAR, "h-12 w-44")} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-[var(--bd-r-stage)] bg-fg/[0.04] p-2">
        {Array.from({ length: 4 }, (_, i) => (
          <span key={i} className="h-[84px] rounded-[20px] bg-fg/[0.05]" />
        ))}
      </div>
    </div>
  );
}
