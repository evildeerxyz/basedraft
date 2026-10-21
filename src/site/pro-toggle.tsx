"use client";

import { cn } from "@/lib/utils";
import { openAuth } from "./auth";
import { PREVIEW_AVAILABLE, setPreview, usePlan } from "./plan";
import { btn } from "./sheet";

/** Development only: Pro on a signed-in account without buying it, to try every Pro feature. */
export function ProPreviewToggle() {
  const [plan, { preview, signedIn }] = usePlan();
  if (!PREVIEW_AVAILABLE || (plan === "pro" && !preview)) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--bd-r-sheet)] border border-line-subtle bg-surface p-[26px]">
      <div className="min-w-0">
        <div className="text-[16px] font-medium tracking-[-0.01em]">{preview ? "Previewing Pro" : "Preview Pro"}</div>
        <p className="mt-1.5 text-ui leading-[1.55] text-muted">Development only. Unlocks every Pro feature on this signed-in account without a purchase. Production never shows this.</p>
      </div>
      <button type="button" onClick={() => (signedIn ? setPreview(!preview) : openAuth("sign-in"))} className={cn(preview ? btn.outline : btn.ink)}>
        {!signedIn ? "Sign in to preview" : preview ? "Stop previewing" : "Preview Pro"}
      </button>
    </div>
  );
}
