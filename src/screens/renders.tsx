"use client";

/* Written by scripts/screens.mjs from src/screens/<slug>: each screen, live, for its previews. Don't edit by hand. */
import type { ComponentType } from "react";
import s_roadmap from "./roadmap/screen";

export const SCREEN_RENDERS: Record<string, ComponentType> = {
  "roadmap": s_roadmap,
};
