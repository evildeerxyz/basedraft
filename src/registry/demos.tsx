"use client";

import type { ComponentType } from "react";
import { ENTRY_DEMOS, ENTRY_EXAMPLES } from "./catalog-demos";

/*
 * Each component's live demo and its examples now live in its own folder,
 * src/registry/entries/<name>/demo.tsx, gathered by scripts/registry.mjs. FIRST is empty: every
 * component has moved.
 */

const FIRST: Record<string, ComponentType> = {};

/** Every component's main demo: the first ones above, each newer one from its folder in entries/. */
export const DEMOS: Record<string, ComponentType> = { ...FIRST, ...ENTRY_DEMOS };
/** Each component's focused examples, by the ids its doc lists. */
export const EXAMPLES: Record<string, Record<string, ComponentType>> = ENTRY_EXAMPLES;
