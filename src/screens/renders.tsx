"use client";

/* Written by scripts/screens.mjs from src/screens/<slug>: each screen, live, for its previews. Don't edit by hand. */
import type { ComponentType } from "react";
import s_deployments from "./deployments/screen";
import s_roadmap from "./roadmap/screen";

export const SCREEN_RENDERS: Record<string, ComponentType> = {
  "deployments": s_deployments,
  "roadmap": s_roadmap,
};
