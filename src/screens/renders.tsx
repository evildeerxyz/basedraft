"use client";

/* Written by scripts/screens.mjs from src/screens/<slug>: each screen, live, for its previews. Don't edit by hand. */
import type { ComponentType } from "react";
import s_projects from "./projects/screen";
import s_deployments from "./deployments/screen";
import s_billing from "./billing/screen";
import s_roadmap from "./roadmap/screen";

export const SCREEN_RENDERS: Record<string, ComponentType> = {
  "projects": s_projects,
  "deployments": s_deployments,
  "billing": s_billing,
  "roadmap": s_roadmap,
};
