/*
 * What's changed in basedraft, newest first, as the What's new page draws it. Each day holds its changes; each change has a title, a line or two on it, a tag
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
    date: "2026-11-11",
    changes: [
      {
        tag: "New",
        title: "basedraft is free and open source",
        body: "Every template, component, screen and block is free now, with all of basedraft's code on GitHub under the MIT license. Pro is gone: Copy for Figma, Download project and Send to GitHub are open to everyone, and every component's file and every screen's code is a click away.",
        href: "https://github.com/evildeerxyz/basedraft",
        link: "See the code",
      },
      {
        tag: "New",
        title: "All 111 components on npm",
        body: "@basedraft/ui 0.4.0 carries every component, the ones that were Pro included: Data table, Globe, Flow, Pipeline, Runway and the rest, from one install.",
        href: "/components/get-started",
        link: "Get started",
      },
      {
        tag: "New",
        title: "Buy me a Claude plan",
        body: "basedraft is built with Claude Code. If it saves you time, the button in the header puts any amount you like toward the Claude plan that builds it. It's never needed for anything.",
      },
    ],
  },
  {
    date: "2026-11-02",
    changes: [
      {
        tag: "New",
        title: "Projects and Billing, two new screens",
        body: "Projects is every project in one table that sorts, picks rows for a floating bar and fits any width, with each project's page opening beside it. Billing leads with the balance and how long it lasts, then what the period will use against the plan, the bills, and credits added with a hold. With Pro.",
        href: "/screens/projects",
        link: "Open Projects",
      },
      {
        tag: "New",
        title: "Runway, Pace, Top up, Score meter and Lanes, with Pro",
        body: "Runway draws a balance's past and where it's heading, down to the day it runs out. Pace sets each allowance against the plan's line. Top up adds money on a tape and a hold. Score meter reads a score in capsules, and Lanes puts many things on one time axis.",
        href: "/components/runway",
        link: "See Runway",
      },
      {
        tag: "Improved",
        title: "The app sidebar, the data table and full screen",
        body: "The sidebar has Home and Activity views, and its rows can carry a count, a New tag, an unread dot or a spinner. Data table rows open on a click, its frame stays whole and its bar floats in view. Full screen keeps its controls in a corner that tucks away.",
        href: "/components/app-sidebar",
        link: "See the sidebar",
      },
    ],
  },
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
