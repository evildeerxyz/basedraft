/* A screen's facts: its meta.json, with what scripts/screens.mjs reads from its file. */
export type ScreenMeta = {
  slug: string;
  title: string;
  /** What kind of page it is: Dashboard, Settings, Billing and so on. */
  kind: string;
  /** One or two sentences: what the page does, and how. */
  description: string;
  /** The address it would have in the app, shown over its preview. */
  path: string;
  /** A Pro screen: anyone can try it live, but its file is only for Pro. Free screens use free components only. */
  pro?: boolean;
  /** The day it was added, YYYY-MM-DD, for the New tag. */
  added?: string;
  order: number;
  /** Its file's default export, for the import line. */
  name: string;
  /** The components it's made of, in the order its file imports them. */
  uses: string[];
  /** How long its file is, in lines. */
  lines: number;
};
