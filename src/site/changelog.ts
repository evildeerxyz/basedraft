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
    date: "2026-10-31",
    changes: [
      {
        tag: "New",
        title: "Deployments, a screen made of basedraft UI",
        body: "A project's deployments with the build in flight leading: its stages as a waterfall of time, the running one's output under it as it goes, then a hold to promote it. Every deployment by day under it, each opening beside the list onto its stages, logs and domains, with a hold to roll back. With Pro.",
        href: "/screens/deployments",
        link: "Open Deployments",
      },
      {
        tag: "New",
        title: "Pipeline and Commit, with Pro",
        body: "Pipeline draws a job's stages the way a trace reads: a bar for each on one time axis, a ghost for what's to come, a hairline for now, and the picked stage's output under its row. Commit reads a commit the way people do: the message, who made it, its branch and a hash that copies.",
        href: "/components/pipeline",
        link: "See Pipeline",
      },
    ],
  },
  {
    date: "2026-10-30",
    changes: [
      {
        tag: "New",
        title: "Seven new Pro components",
        body: "Globe, Flow, Live cursors, Swipe deck, Particle text, Dock and Split-flap: a dotted Earth on real coastlines, a node editor, other people's cursors, a deck to decide on, a word made of pixels, a dock of metal keys and a departures board.",
        href: "/components/globe",
        link: "See Globe",
      },
      {
        tag: "New",
        title: "Screens: whole app pages made of basedraft UI",
        body: "Roadmap, a whole app page in one file: a timeline and a board, other people's cursors and a share menu, with Pro. Try it at a desktop's, a tablet's or a phone's width, full screen, in light or dark, copy it to Figma, and open any component in it from its card.",
        href: "/screens",
        link: "See the screens",
      },
      {
        tag: "New",
        title: "Metric tabs, Filter bar and Roadmap, with Pro",
        body: "The figures that lead a dashboard as tabs that pick its chart, filters you edit in place as sentences, and a plan over the weeks you drag by the day.",
        href: "/components/metric-tabs",
        link: "See Metric tabs",
      },
    ],
  },
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
