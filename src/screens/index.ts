import { SCREEN_META } from "./catalog";

/*
 * Screens: whole pages of an app built from basedraft UI, each one file. Their facts, for the
 * site's pages on the server and in the browser alike. The screens themselves are in renders.tsx,
 * which only the browser needs.
 */

export type { ScreenMeta } from "./types";

export const SCREENS = SCREEN_META;
export const screenOf = (slug: string) => SCREENS.find((s) => s.slug === slug);
/** The screens a component is part of, for its page. */
export const screensUsing = (name: string) => SCREENS.filter((s) => s.uses.includes(name));
/** Where a free screen's file is, to download. */
export const screenFile = (slug: string) => `/ui/screens/${slug}.tsx`;
