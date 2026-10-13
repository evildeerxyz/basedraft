"use client";

import { useMemo } from "react";
import { pal } from "@/lib/palette";
import { clamp, cn, mulberry32 } from "@/lib/utils";
import { DitherCanvas, type DitherField } from "./DitherCanvas";

type Tone = "lime" | "paper" | "ink";

const TONES: Record<Tone, { bg: string; text: string }> = {
  lime: { bg: "bg-lime", text: "text-ink" },
  paper: { bg: "bg-paper", text: "text-ink" },
  ink: { bg: "bg-ink-4", text: "text-paper" },
};

/** Sphere shading from a seeded key light; dots fill the shadow side. */
function sphereField(seed: number, invert: boolean): DitherField {
  const rand = mulberry32(seed * 977 + 13);
  const a = rand() * Math.PI * 2;
  const lx = Math.cos(a) * 0.7;
  const ly = Math.sin(a) * 0.5 - 0.35;
  const n = Math.hypot(lx, ly, 0.75);
  const L = [lx / n, ly / n, 0.75 / n];
  return (u, v) => {
    const x = (u - 0.5) * 2;
    const y = (v - 0.5) * 2;
    const d2 = x * x + y * y;
    if (d2 >= 1) return invert ? 0 : 1;
    const diff = clamp(x * L[0] + y * L[1] + Math.sqrt(1 - d2) * L[2], 0, 1);
    return invert ? Math.pow(diff, 1.6) * 0.55 : Math.pow(1 - diff, 1.7) * 0.85;
  };
}

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

interface DitherAvatarProps {
  seed: number;
  name: string;
  size?: number;
  tone?: Tone;
  className?: string;
}

export function DitherAvatar({ seed, name, size = 40, tone = "paper", className }: DitherAvatarProps) {
  const t = TONES[tone];
  const dot = tone === "lime" ? "#0a0a0a" : tone === "paper" ? pal.bg : pal.fg;
  const field = useMemo(() => sphereField(seed, tone === "ink"), [seed, tone]);
  return (
    <span
      role="img"
      aria-label={name}
      className={cn("relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full", t.bg, className)}
      style={{ width: size, height: size }}
    >
      <DitherCanvas field={field} color={dot} opacity={tone === "ink" ? 0.9 : 0.55} pixelSize={1} />
      <span className={cn("relative font-semibold tracking-tight", t.text)} style={{ fontSize: size * 0.36 }}>
        {initialsOf(name)}
      </span>
    </span>
  );
}
