"use client";

import { ArrowCounterClockwiseIcon, FileZipIcon } from "@phosphor-icons/react";
import { useEffect, useState, type ComponentType } from "react";
import { Button } from "../../ui/button";
import { Skeleton, SkeletonAvatar, SkeletonText } from "../../ui/skeleton";

/*
 * Your purchases, loading: three rows in their final shape, then the downloads themselves in the
 * same places, so nothing moves when they land. Again loads them once more.
 */

const FILES = [
  { name: "zuno.zip", detail: "Next.js, 4.2 MB" },
  { name: "noma.zip", detail: "Next.js, 3.8 MB" },
  { name: "auren-astro.zip", detail: "Astro, 2.9 MB" },
];

export function Demo() {
  const [loaded, setLoaded] = useState(false);
  const [run, setRun] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 2200);
    return () => clearTimeout(t);
  }, [run]);
  return (
    <div className="w-full max-w-[340px]">
      <section aria-busy={!loaded} aria-label="Your purchases" className="grid gap-3.5">
        {!loaded && <span className="sr-only">Loading your purchases</span>}
        {FILES.map((f) => (
          <div key={f.name} className="flex h-10 items-center gap-3">
            {loaded ? (
              <>
                <span className="grid size-10 shrink-0 place-items-center rounded-[12px] text-[var(--bd-fg)] [background:var(--bd-ui-raised)] shadow-[var(--bd-ui-lift),inset_0_0_0_1px_rgb(var(--bd-ink)/0.06)]">
                  <FileZipIcon weight="duotone" className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-[var(--bd-fg)]">{f.name}</span>
                  <span className="block text-xs text-[var(--bd-muted)]">{f.detail}</span>
                </span>
              </>
            ) : (
              <>
                <Skeleton className="size-10 shrink-0" />
                <SkeletonText lines={2} className="max-w-[200px]" />
              </>
            )}
          </div>
        ))}
      </section>
      {/* Under the list, its arrow in the files' column, not off on its own at the far edge. */}
      <div className="mt-4 flex">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setLoaded(false);
            setRun((r) => r + 1);
          }}
        >
          <ArrowCounterClockwiseIcon weight="regular" /> Again
        </Button>
      </div>
    </div>
  );
}

export const examples: Record<string, ComponentType> = {
  text: () => <SkeletonText lines={3} className="max-w-[320px]" />,
  card: () => (
    <div className="w-[260px] rounded-[18px] bg-[var(--bd-surface)] p-3 shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.07)]">
      <Skeleton className="aspect-[16/10] w-full" />
      <div className="mt-3 flex items-center gap-2.5 px-1">
        <SkeletonAvatar size="sm" />
        <SkeletonText lines={2} />
      </div>
    </div>
  ),
  people: () => (
    <div className="grid w-full max-w-[300px] gap-4">
      {(["lg", "md", "sm"] as const).map((size) => (
        <div key={size} className="flex items-center gap-3">
          <SkeletonAvatar size={size} />
          <SkeletonText lines={2} className="max-w-[180px]" />
        </div>
      ))}
    </div>
  ),
  shapes: () => (
    <div className="flex items-center gap-4">
      <Skeleton className="h-16 w-24" />
      <Skeleton shape="line" className="w-28" />
      <Skeleton shape="circle" className="size-12" />
    </div>
  ),
};
