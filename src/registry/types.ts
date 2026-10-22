/*
 * The shape of a component's documentation, the same for every component: what its page says
 * beyond the live demo. Kept apart from the demos, which run in the browser, so pages rendered
 * on the server can read it.
 */

export type ComponentMeta = {
  name: string;
  title: string;
  /** Actions, Forms, Overlays, Navigation, Display or Feedback. */
  group: string;
  /** One sentence: what it is and what makes it basedraft's. */
  description: string;
  /** Its place within its group; lower comes first. */
  order?: number;
  /**
   * A Pro component: anyone can see and try it, but its source is only for Pro. It lives in
   * src/registry/pro-ui rather than ui, so the npm package and the public files never carry it.
   */
  pro?: boolean;
};

export type Prop = { name: string; type: string; default?: string; note: string; required?: boolean };

/** A part of a component that takes its own props, as AccordionItem does inside Accordion. */
export type Part = { name: string; note?: string; props: Prop[] };

/** A focused example: its code here, its live demo in the entry's demo.tsx under the same id. */
export type Example = { id: string; title: string; note?: string; code: string };

export type ComponentDoc = {
  /** The shortest useful example, written as it would be in a project. */
  usage: string;
  /** When it's the right component. */
  use?: string[];
  /** When another is, and which. */
  avoid?: string[];
  /** Its parts and their props, in the order you'd write them. */
  parts?: Part[];
  /** One part's props, for a component without parts. */
  props?: Prop[];
  examples?: Example[];
  /** What each key does while it has focus. */
  keyboard?: Array<{ keys: string; does: string }>;
  /** Roles, labels and what a screen reader hears. */
  a11y?: string[];
};
