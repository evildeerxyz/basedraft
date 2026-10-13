import type { Block } from "./types";

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  readTime: string;
  art: { variant: "sun" | "waves" | "rings" | "grid"; seed: number };
  blocks: Block[];
};

export const POSTS: Post[] = [
  {
    slug: "background-agents",
    title: "Background agents, and why they work on a branch",
    excerpt:
      "Auren 2.0 lets you hand off a task and keep typing. Here is how agents stay out of your way, and why the diff is the product.",
    date: "Oct 6, 2026",
    author: "The Agents team",
    readTime: "6 min read",
    art: { variant: "sun", seed: 3 },
    blocks: [
      {
        type: "p",
        text: "The first version of the Auren agent worked like most: it edited your files while you watched. It was useful and it was nerve-wracking. You could not type while it worked, and you could not tell which of the changes on screen were yours.",
      },
      { type: "h2", id: "a-branch-of-its-own", text: "A branch of its own" },
      {
        type: "p",
        text: "In 2.0 every run gets its own git worktree and branch. The agent edits there, runs your checks there, and only touches your working tree when you accept its diff. You keep typing. It keeps working.",
      },
      {
        type: "quote",
        text: "The agent is not finished when the code compiles. It is finished when you have read the diff and agreed with it.",
      },
      { type: "h2", id: "the-diff-is-the-product", text: "The diff is the product" },
      {
        type: "p",
        text: "We spent more time on review mode than on the agent itself. Every hunk carries a one-line reason. You can keep or drop hunks individually, and the agent re-runs your tests on exactly what you kept before it commits.",
      },
      {
        type: "ul",
        items: [
          "Median time from request to reviewable diff: 2 minutes 40 seconds.",
          "Share of hunks kept as proposed during our beta: 81%.",
          "Share of runs where at least one hunk was dropped: 34%.",
        ],
      },
      {
        type: "p",
        text: "That last number is the one we are proudest of. Dropping a hunk should be easy, normal and cheap. Background agents are available today on every plan; Pro and Team can run four or more at once.",
      },
    ],
  },
  {
    slug: "tab-on-device",
    title: "Making Tab fast enough to run on your laptop",
    excerpt: "How we got next-edit prediction down to 22 ms on Apple silicon without sending a byte to a server.",
    date: "Sep 22, 2026",
    author: "The Tab team",
    readTime: "9 min read",
    art: { variant: "waves", seed: 7 },
    blocks: [
      {
        type: "p",
        text: "A completion that arrives after you have typed the next character is worse than no completion. Our budget for Tab was set by that rule: under 30 ms, every time, on a three-year-old laptop.",
      },
      { type: "h2", id: "small-model-big-context", text: "A small model with the right context" },
      {
        type: "p",
        text: "Tab is a 1.2B parameter model. It is small because it does not need to know everything; the local index tells it what matters. We feed it your last few edits, the symbols they touch and the files that reference them.",
      },
      { type: "h2", id: "what-we-measured", text: "What we measured" },
      {
        type: "table",
        head: ["Machine", "p50", "p99"],
        rows: [
          ["M3 MacBook Air", "22 ms", "38 ms"],
          ["M1 MacBook Pro", "29 ms", "51 ms"],
          ["Ryzen 7 + RTX 3060", "18 ms", "33 ms"],
        ],
      },
      {
        type: "p",
        text: "Running on-device has a pleasant side effect: Tab costs us nothing to serve, so it is unlimited on every plan, including the free one.",
      },
    ],
  },
  {
    slug: "no-electron",
    title: "Why Auren is not built on Electron",
    excerpt: "A code editor is an instrument. We wanted one that never makes you wait for it.",
    date: "Aug 12, 2026",
    author: "Auren Engineering",
    readTime: "7 min read",
    art: { variant: "grid", seed: 11 },
    blocks: [
      {
        type: "p",
        text: "Electron made modern editors possible, and we have shipped Electron apps ourselves. But an editor with an agent running in the background has a harder job than most apps: it must stay responsive while a lot of work happens behind it.",
      },
      { type: "h2", id: "the-renderer", text: "The renderer" },
      {
        type: "p",
        text: "Auren draws every glyph on the GPU from a shaped glyph atlas. Scrolling a 50,000 line file costs the same as scrolling a 50 line one. Keystroke to pixel is 3.8 ms at the median.",
      },
      { type: "h2", id: "trade-offs", text: "What it cost us" },
      {
        type: "ul",
        items: [
          "We had to build accessibility support ourselves. It works with VoiceOver, Orca and NVDA today, and we test it every release.",
          "Extensions run in a separate process and speak a VS Code compatible API, so most of the ecosystem works.",
        ],
      },
    ],
  },
  {
    slug: "zero-retention",
    title: "Zero retention, explained",
    excerpt: "What actually happens to an agent request, from your laptop to the model and back.",
    date: "Jul 21, 2026",
    author: "Security team",
    readTime: "5 min read",
    art: { variant: "rings", seed: 5 },
    blocks: [
      {
        type: "p",
        text: "We say your code is never stored and never used for training. That is a strong claim, so here is exactly how a request moves through our systems.",
      },
      { type: "h2", id: "on-your-machine", text: "On your machine" },
      {
        type: "p",
        text: "The agent chooses context from your local index. Only those snippets, your request and any command output the agent needs are sent. The request is encrypted with TLS 1.3.",
      },
      { type: "h2", id: "in-our-gateway", text: "In our gateway" },
      {
        type: "p",
        text: "The gateway holds the request in memory, routes it to a model, streams the answer back and drops it. Logs record timing and token counts, never content.",
      },
      { type: "h2", id: "at-the-model-provider", text: "At the model provider" },
      {
        type: "p",
        text: "Every provider we route to has signed a zero data retention agreement. If you would rather not trust anyone, run a local model and nothing leaves your machine at all.",
      },
    ],
  },
];

export const getPost = (slug: string) => POSTS.find((p) => p.slug === slug);
