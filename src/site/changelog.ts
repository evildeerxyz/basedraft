/*
 * What's changed in basedraft, newest first: the What's new page draws it, and the Pro page shows
 * the latest few. Each day holds its changes; each change has a title, a line or two on it, a tag
 * for what kind of change it is, and where to see it. US English, plain words, no dashes.
 */

export type ChangeTag = "New" | "Improved" | "Coming";

export interface Change {
  title: string;
  body: string;
  tag?: ChangeTag;
  /** Where to see it, if it's somewhere on the site. */
  href?: string;
  link?: string;
}

export interface ChangeDay {
  /** ISO date, YYYY-MM-DD. */
  date: string;
  changes: Change[];
}

export const CHANGELOG: ChangeDay[] = [
  {
    date: "2026-10-29",
    changes: [
      {
        tag: "New",
        title: "Seven more free components",
        body: "Context menu, Time picker, Scroll area, Banner, Lightbox, Consent and Countdown. Each one has full docs, works from the keyboard, and comes with examples.",
        href: "/components/context-menu",
        link: "See Context menu",
      },
      {
        tag: "New",
        title: "Five new Pro components",
        body: "Scheduler, Sign-in, Code diff, Log viewer and Color picker: whole pieces of an app, from booking a call to reviewing a change.",
        href: "/components/scheduler",
        link: "See Scheduler",
      },
      {
        tag: "Improved",
        title: "New components are easy to spot",
        body: "Anything added in the last month carries a New tag that shimmers, and the gallery has a New filter to see them all at once.",
        href: "/components",
        link: "Browse components",
      },
    ],
  },
  {
    date: "2026-10-23",
    changes: [
      {
        tag: "New",
        title: "13 more free components",
        body: "Alert, Breadcrumb, Pagination, Table of contents, Timeline, Split button, Password field, Chips, Compare slider, Code block, Sparkline, Gauge and Bar list. Each one has full docs, works from the keyboard, and comes with examples.",
        href: "/components",
        link: "Browse components",
      },
      {
        tag: "New",
        title: "Seven new Pro components",
        body: "Navigation menu, Tour, Funnel, Heatmap, Uptime, Tree and Dither image: the most involved pieces yet, for product sites and dashboards.",
        href: "/components/navigation-menu",
        link: "See Navigation menu",
      },
      {
        tag: "Improved",
        title: "Dither where it helps, with a switch",
        body: "Alert, Gauge, Uptime, Sparkline and Funnel take a dither prop, so the dithered look is yours to turn on or off. The charts and Bar list keep their choice of fill.",
      },
    ],
  },
  {
    date: "2026-10-21",
    changes: [
      {
        tag: "New",
        title: "basedraft UI, our own components, free",
        body: "Buttons, switches, sliders and more, made in basedraft's own style. Each one is a single file to copy or download, and they share one theme file, in light and dark.",
        href: "/components",
        link: "Browse components",
      },
      {
        tag: "New",
        title: "Ready for Claude Code",
        body: "Template pages give you a prompt that sets the site up in Claude Code, and /llms.txt points AI tools at the components and templates.",
        href: "/templates",
        link: "See a template",
      },
      {
        tag: "Improved",
        title: "Template sections are now Blocks",
        body: "Every section from the templates lives at /blocks, sorted by what it does. Old links to them still work.",
        href: "/blocks",
        link: "Browse blocks",
      },
      {
        tag: "Improved",
        title: "A new look for basedraft",
        body: "Geist Pixel headings, soft gradients with fine dots, light and dark modes, and a header that gathers into a capsule as you scroll.",
      },
      {
        tag: "Coming",
        title: "Dashboard templates",
        body: "Dashboard designs are next, in the same style. Like every template, they'll come with Pro when they ship.",
      },
    ],
  },
  {
    date: "2026-10-20",
    changes: [
      {
        tag: "Improved",
        title: "A simpler Studio",
        body: "Studio now shows one breakpoint at a time, with fewer panels. Comments, sharing, version history and custom colors, fonts and corners are gone, so making a template yours is quicker. The palettes stay, and your drafts still save.",
        href: "/studio",
        link: "Open Studio",
      },
      {
        tag: "Improved",
        title: "Accounts and drafts moved to Supabase",
        body: "Sign-in, saved drafts and purchases now run on Supabase. You sign in the same way, with an email code or Google, though you may need to sign in once more.",
      },
    ],
  },
];

/** A day as people read it: "October 21, 2026". */
export const dayLabel = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
