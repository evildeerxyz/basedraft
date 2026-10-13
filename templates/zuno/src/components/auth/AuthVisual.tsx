"use client";

import { motion } from "motion/react";
import { pal } from "@/lib/palette";
import { EASE_OUT } from "@/lib/utils";
import { DitherShader } from "../dither/DitherShader";
import { LogoMark } from "../ui/Logo";

/** The quiet side of the login page: dithered flow and the one sentence you'd see on opening the app. */
export function AuthVisual() {
  return (
    <div className="relative hidden aspect-[4/5] max-h-[720px] w-full overflow-hidden rounded-[32px] border border-white/[0.08] bg-ink-2 lg:block">
      <DitherShader shape="flow" color={pal.dither} opacity={0.6} pixelSize={3} scale={1.1} intensity={0.8} interactive />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.3 }}
        className="absolute inset-x-8 bottom-8 flex gap-4 rounded-[22px] bg-ink/90 p-6 ring-1 ring-white/10"
      >
        <LogoMark size={32} animated={false} className="mt-0.5 shrink-0" />
        <div>
          <div className="text-[16px] text-white/60">While you were away</div>
          <p className="mt-1 text-[19px] leading-relaxed text-white/90">Autopilot made two trades and harvested a $212 loss. Nothing needs your attention.</p>
        </div>
      </motion.div>
    </div>
  );
}
