"use client";

import type { ComponentType } from "react";
import { PricingTable, type PricingCompareGroup, type PricingPlan } from "../../ui/pricing-table";

/* A design tool's three plans: free, per seat, and one you talk about. */
const PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "For one person and a first site.",
    price: { monthly: 0, yearly: 0 },
    features: ["3 projects", "Every free block", "Publish to a basedraft address", { label: "Your own domain", included: false }],
    cta: { label: "Start free" },
  },
  {
    id: "team",
    name: "Team",
    description: "For a studio shipping sites together.",
    price: { monthly: 18, yearly: 15 },
    seats: { min: 2, max: 50, default: 3 },
    features: ["Unlimited projects", "Pro blocks and templates", "Your own domains", "Comments and live editing"],
    cta: { label: "Start a trial" },
    recommended: true,
    badge: "Most picked",
  },
  {
    id: "business",
    name: "Business",
    description: "For companies with rules to follow.",
    priceLabel: "Let's talk",
    features: ["Everything in Team", "SSO and audit logs", "Invoices, yearly", "A named contact"],
    cta: { label: "Talk to us" },
  },
];

const COMPARE: PricingCompareGroup[] = [
  {
    label: "Building",
    rows: [
      { label: "Projects", values: { starter: "3", team: "Unlimited", business: "Unlimited" } },
      { label: "Pro blocks", values: { starter: false, team: true, business: true } },
      { label: "Export to code", note: "Next.js, with your components", values: { starter: false, team: true, business: true } },
    ],
  },
  {
    label: "Working together",
    rows: [
      { label: "Live editing", values: { starter: false, team: true, business: true } },
      { label: "Roles", values: { starter: false, team: "Editor, viewer", business: "Custom" } },
      { label: "SSO", values: { starter: false, team: false, business: true } },
    ],
  },
];

export function Demo() {
  return <PricingTable plans={PLANS} className="w-full max-w-[920px] py-4" />;
}

function Compare() {
  return <PricingTable plans={PLANS} compare={COMPARE} defaultCompareOpen className="w-full py-2" />;
}

function Monthly() {
  return <PricingTable plans={PLANS} defaultPeriod="monthly" currency="EUR" locale="de-DE" className="w-full py-2" />;
}

export const examples: Record<string, ComponentType> = { compare: Compare, monthly: Monthly };
