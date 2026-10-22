/*
 * What each component's page says beyond its name now lives in its own folder,
 * src/registry/entries/<name>/doc.ts, gathered by scripts/registry.mjs. FIRST is empty: every
 * component has moved. The source itself is read from src/registry/ui into sources.ts.
 */

import { ENTRY_DOCS } from "./catalog";
import type { ComponentDoc } from "./types";

export type { Prop } from "./types";
export type Doc = ComponentDoc;

const FIRST: Record<string, Doc> = {};

/** Every component's documentation: the first ones above, each newer one from its folder in entries/. */
export const DOCS: Record<string, Doc> = { ...FIRST, ...ENTRY_DOCS };
