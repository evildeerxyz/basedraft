import type { Block } from "./types";

export const ROLES = [
  {
    id: "rendering",
    title: "Rendering Engineer",
    team: "Engineering",
    location: "Remote, Europe or Americas",
    summary: "Own the GPU text pipeline: shaping, glyph atlases, damage tracking and the 3.8 ms budget.",
    points: ["Deep Rust experience", "Shipped a renderer, game engine or browser component", "Cares about the last millisecond"],
  },
  {
    id: "agents-infra",
    title: "Agent Infrastructure Engineer",
    team: "Engineering",
    location: "Remote, Europe or Americas",
    summary: "Build the sandboxes, worktrees and schedulers that let four agents run beside you without slowing you down.",
    points: ["Systems programming in Rust or Go", "Containers, namespaces and filesystems", "Comfortable with git internals"],
  },
  {
    id: "ml-on-device",
    title: "ML Engineer, On-device Models",
    team: "Research",
    location: "Remote, Europe",
    summary: "Train and compress the Tab model. Make it smarter without making it slower.",
    points: ["Training small language models", "Quantisation and distillation", "Strong evaluation habits"],
  },
  {
    id: "product-design",
    title: "Product Designer, Editor",
    team: "Design",
    location: "Remote, Americas",
    summary: "Design the review experience: how people read, judge and accept code they did not write.",
    points: ["Portfolio of dense, tool-like interfaces", "Prototypes in code", "Writes clearly"],
  },
  {
    id: "security",
    title: "Security Engineer",
    team: "Engineering",
    location: "Remote, Europe or Americas",
    summary: "Keep the gateway honest. Own our zero retention guarantees, audits and incident response.",
    points: ["Cloud security and threat modelling", "SOC 2 or ISO 27001 experience", "Calm under pressure"],
  },
  {
    id: "devrel",
    title: "Developer Advocate",
    team: "Go to market",
    location: "Remote, Americas",
    summary: "Show working programmers what Auren can do, through docs, talks and very good examples.",
    points: ["Has shipped real software", "Writes and teaches well", "Enjoys being on camera, or at least tolerates it"],
  },
];

export const TEAMS = ["All", "Engineering", "Research", "Design", "Go to market"] as const;

export const LEGAL: Record<string, { title: string; updated: string; blocks: Block[] }> = {
  privacy: {
    title: "Privacy policy",
    updated: "October 1, 2026",
    blocks: [
      {
        type: "p",
        text: "This policy explains what Auren Labs, Inc. collects when you use the Auren editor and this website, why, and what control you have. The short version: your code stays on your machine unless you send it to an agent, and even then we do not keep it.",
      },
      { type: "h2", id: "what-we-collect", text: "What we collect" },
      {
        type: "ul",
        items: [
          "**Account data:** your email address, name and billing details if you subscribe.",
          "**Agent requests:** the text and code context of a request, processed in memory and discarded after the response.",
          "**Product analytics:** feature usage counts and crash reports, never file contents. You can turn analytics off in settings.",
        ],
      },
      { type: "h2", id: "what-we-never-collect", text: "What we never collect" },
      {
        type: "p",
        text: "Your repository, your local index, your Tab predictions, or your keystrokes. None of these leave your machine.",
      },
      { type: "h2", id: "sharing", text: "Sharing" },
      {
        type: "p",
        text: "We share data only with the subprocessors listed on our [security page](/security), each bound by a data processing agreement. We do not sell personal data.",
      },
      { type: "h2", id: "your-rights", text: "Your rights" },
      {
        type: "p",
        text: "You can export or delete your account data at any time from settings, or by writing to privacy@auren.dev. We respond within 30 days.",
      },
    ],
  },
  terms: {
    title: "Terms of service",
    updated: "October 1, 2026",
    blocks: [
      {
        type: "p",
        text: "These terms govern your use of Auren. By installing or using the editor you agree to them. If you use Auren for an organisation, you accept these terms on its behalf.",
      },
      { type: "h2", id: "your-code", text: "Your code is yours" },
      {
        type: "p",
        text: "You keep all rights to the code you write and to the output agents produce for you. We claim no licence to it beyond what is needed to process a request.",
      },
      { type: "h2", id: "acceptable-use", text: "Acceptable use" },
      {
        type: "ul",
        items: [
          "Do not use Auren to build malware or to attack systems you do not own.",
          "Do not resell access to the hosted agent without a written agreement.",
          "Do not try to extract the on-device model weights for redistribution.",
        ],
      },
      { type: "h2", id: "billing", text: "Billing" },
      {
        type: "p",
        text: "Paid plans renew automatically. You can cancel at any time and keep access until the end of the period you paid for.",
      },
      { type: "h2", id: "liability", text: "Liability" },
      {
        type: "p",
        text: "Auren is provided as is. Review agent output before you ship it. Our total liability is limited to the fees you paid in the twelve months before a claim.",
      },
    ],
  },
  dpa: {
    title: "Data processing addendum",
    updated: "October 1, 2026",
    blocks: [
      {
        type: "p",
        text: "This addendum applies when Auren processes personal data on behalf of a Team or Enterprise customer. It forms part of the terms of service.",
      },
      { type: "h2", id: "roles", text: "Roles" },
      { type: "p", text: "The customer is the controller. Auren Labs, Inc. is the processor, acting only on documented instructions." },
      { type: "h2", id: "security-measures", text: "Security measures" },
      {
        type: "ul",
        items: [
          "Encryption in transit with TLS 1.3 and at rest with AES-256.",
          "Zero retention of agent request content.",
          "Annual SOC 2 Type II audit and penetration test.",
        ],
      },
      { type: "h2", id: "transfers", text: "International transfers" },
      { type: "p", text: "Transfers outside the EEA rely on the Standard Contractual Clauses. EU data residency is available on request." },
    ],
  },
};

export const SUBPROCESSORS = [
  ["Cloud hosting", "Gateway and account services", "United States, EU"],
  ["Model providers", "Agent requests, zero retention", "United States, EU"],
  ["Payments", "Billing and invoices", "United States"],
  ["Email", "Transactional email", "United States"],
  ["Error tracking", "Crash reports, no code", "EU"],
];
