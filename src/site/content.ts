/* Copy for basedraft's own pages. US English, plain words, no dashes. */

import { SECTIONS, TEMPLATES } from "./live";

export type FeatureIcon = "figma" | "paper" | "code" | "layouts" | "template" | "studio" | "personal" | "pro" | "team" | "client" | "support";
export interface PlanFeature {
  icon: FeatureIcon;
  t: string;
  b: string;
}

/** What Pro adds. The Pro modal shows the same list, with the feature you reached for lifted out. */
export const PRO_FEATURES: PlanFeature[] = [
  { icon: "figma", t: "Copy to Figma", b: "Auto layout and every viewport" },
  { icon: "paper", t: "Copy to Paper and SVG", b: "One responsive frame, named layers" },
  { icon: "code", t: "Code and GitHub", b: "The whole site in Next.js or Astro, downloaded or sent to your repo" },
  { icon: "layouts", t: "Every template and section", b: `All ${TEMPLATES.length} sites and ${SECTIONS.length} sections, plus every new one` },
];

/** Small print, each line led by an icon for what kind of promise it is. */
export type NoteKind = "forever" | "updates" | "seats" | "card" | "refund";
export interface PlanNote {
  kind: NoteKind;
  t: string;
}

export interface PlanInfo {
  name: string;
  icon: FeatureIcon;
  price: string;
  period: string;
  /** Under the price. */
  terms: PlanNote;
  blurb: string;
  features: PlanFeature[];
  cta: { label: string; href: string };
  /** The strip along the bottom of the card. */
  note: PlanNote;
  featured?: boolean;
}

export const PLANS: PlanInfo[] = [
  {
    name: "Free",
    icon: "studio",
    price: "$0",
    period: "",
    terms: { kind: "forever", t: "Free for as long as you like" },
    blurb: "Try it on a real project.",
    features: [
      { icon: "studio", t: "Studio", b: "Arrange and rewrite any template" },
      { icon: "layouts", t: `All ${SECTIONS.length} sections`, b: "Try any of them on your pages" },
      { icon: "template", t: "Every template, live", b: "Click through each one before you buy" },
      { icon: "code", t: "JSON export", b: "Your project, to load back any time" },
    ],
    cta: { label: "Start free", href: "/studio" },
    note: { kind: "card", t: "No card needed" },
  },
  {
    name: "Pro",
    icon: "pro",
    price: "$149",
    period: "once",
    terms: { kind: "updates", t: "Every future update included" },
    blurb: "For founders and designers who ship.",
    features: PRO_FEATURES,
    cta: { label: "Get Pro", href: "/checkout?product=pro" },
    note: { kind: "refund", t: "Full refund within 14 days" },
    featured: true,
  },
  {
    name: "Team",
    icon: "team",
    price: "$399",
    period: "once",
    terms: { kind: "seats", t: "Up to 10 people" },
    blurb: "For studios and agencies.",
    features: [
      { icon: "pro", t: "Everything in Pro", b: "Every template, section and export" },
      { icon: "team", t: "10 seats", b: "One license for the whole team" },
      { icon: "client", t: "Client projects", b: "Build and hand off for clients" },
      { icon: "support", t: "Priority support", b: "Replies within one business day" },
    ],
    cta: { label: "Get Team", href: "/checkout?product=team" },
    note: { kind: "refund", t: "Full refund within 14 days" },
  },
];

export const FAQS = [
  { q: "What do I get?", a: "The source for every template, with every page, in Next.js and in Astro. Make one yours in Studio, then download it as a project or send it to your GitHub, ready to run." },
  { q: "Does it work with Astro?", a: "Yes. Every template also comes as an Astro 7 project: the same pages, components and content, each page drawn with React islands, with its metadata, fonts and social images set up. Pick Astro when you download or send to GitHub, from Studio or your Purchases page." },
  { q: "Does Figma need a plugin?", a: "No. Copy any section, page or your whole site, then press {Cmd V} in Figma. It lands with auto layout, a main component for each section, gradients, shadows and icons as vectors, and layers named for what they are. Paper gets named HTML layers." },
  { q: "Do I need an account?", a: "Not to try Studio. A free account saves your drafts, keeps every version of a page and lets you share a link to it." },
  { q: "Can I use it for client work?", a: "Yes, with Team. Pro covers your own products and sites, as many as you want." },
  { q: "Do I need to know React?", a: "Not to use Studio. It hands you a finished site that runs as it is. You'll want React to change how a section works." },
  { q: "Can it go straight to GitHub?", a: "Yes. Connect GitHub once, then start a new repository with the whole site, or open a pull request on one you already have." },
  { q: "What is it built with?", a: "React 19 and Tailwind 4, typed throughout, as a Next.js 16 app or an Astro 7 site, whichever you choose. Each is standalone: deploy it anywhere that runs Next.js, or anywhere that serves an Astro build." },
  { q: "Can I resell the templates?", a: "No. Sell what you build with them, not the templates or their sections. And the previews are for looking: copying one to recreate a template, by hand, with a scraper or with AI, isn't allowed with or without a license." },
  { q: "How do I get it after I buy?", a: "We email you the moment your payment goes through. Download the whole site as a zip, or connect GitHub and we make the repository for you. Both stay on your Purchases page." },
  { q: "How do updates work?", a: "Updated templates and new ones show up on your Purchases page. Download them again or send them to GitHub whenever you're ready." },
  { q: "Can I get a refund?", a: "Yes. Ask within 14 days and you'll get your money back, no questions asked." },
];
