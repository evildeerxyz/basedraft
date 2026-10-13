"use client";

import { pal } from "@/lib/palette";
import { DitherShader } from "../dither/DitherShader";

export function NotFoundArt() {
  return (
    <div className="relative aspect-[5/4] w-full overflow-hidden rounded-[32px] border border-white/[0.08] bg-ink-2" aria-hidden>
      <DitherShader shape="text" text="404" color={pal.dither} secondColor={pal.soft} secondOpacity={0.12} pixelSize={4} intensity={1} interactive />
    </div>
  );
}
