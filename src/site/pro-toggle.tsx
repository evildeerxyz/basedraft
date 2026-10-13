"use client";

import { cn } from "@/lib/utils";
import { openAuth } from "./auth";
import { PREVIEW_AVAILABLE, setPreview, usePlan } from "./plan";
import { btn, Sheet } from "./sheet";

/** Development only: Pro on a signed-in account without buying it, to try every Pro feature. */
export function ProPreviewToggle() {
  const [plan, { preview, signedIn }] = usePlan();
  if (!PREVIEW_AVAILABLE || (plan === "pro" && !preview)) return null;
  return (
    <Sheet bodyClassName="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
      <div>
        <div className="text-heading">{preview ? "Previewing Pro" : "Preview Pro"}</div>
        <p className="text-ui text-muted">Development only. Unlocks every Pro feature on this signed-in account without a purchase. Production never shows this.</p>
      </div>
      <button type="button" onClick={() => (signedIn ? setPreview(!preview) : openAuth("sign-in"))} className={cn(preview ? btn.quiet : btn.ink)}>
        {!signedIn ? "Sign in to preview" : preview ? "Stop previewing" : "Preview Pro"}
      </button>
    </Sheet>
  );
}
