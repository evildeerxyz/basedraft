"use client";

import type { ComponentType } from "react";
import { CodeBlock } from "../../ui/code-block";

const LAYOUT = `import type { ReactNode } from "react";
import "@basedraft/ui/styles.css";
import { Toaster } from "@basedraft/ui";

// The stylesheet once, here, and every component reads the theme from it.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body className="min-h-dvh antialiased">
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}`;

export function Demo() {
  return <CodeBlock filename="app/layout.tsx" code={LAYOUT} highlight={[2, 11]} className="max-w-[560px]" />;
}

function Install() {
  return (
    <CodeBlock
      className="max-w-[520px]"
      tabs={[
        { label: "npm", code: "npm install @basedraft/ui motion @phosphor-icons/react", language: "bash" },
        { label: "pnpm", code: "pnpm add @basedraft/ui motion @phosphor-icons/react", language: "bash" },
        { label: "bun", code: "bun add @basedraft/ui motion @phosphor-icons/react", language: "bash" },
      ]}
    />
  );
}

const THEME = `/* The theme, after Tailwind. */
@import "tailwindcss";
@import "@basedraft/ui/theme.css";

:root {
  --bd-ui-viz-1: oklch(56% 0.16 290);
  --bd-radius: 18px;
}

.card {
  border-radius: var(--bd-radius);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.06);
}`;

function Css() {
  return <CodeBlock filename="app/globals.css" code={THEME} className="max-w-[520px]" />;
}

const PLANS = `export const plans = [
  { id: "free", name: "Free", price: 0, seats: 1, domains: 0, features: ["3 projects", "Every free block", "Publish to a basedraft address"] },
  { id: "team", name: "Team", price: 15, seats: 3, domains: 5, features: ["Unlimited projects", "Pro blocks and templates", "Your own domains", "Comments and live editing"] },
  { id: "business", name: "Business", price: null, seats: Infinity, domains: Infinity, features: ["Everything in Team", "SSO and audit logs", "Invoices, yearly", "A named contact"] },
];

export function priceFor(plan: (typeof plans)[number], seats: number, yearly: boolean) {
  if (plan.price === null) return null;
  const month = plan.price * Math.max(seats, 1);
  return yearly ? Math.round(month * 12 * 0.83) : month;
}

export function canUseDomains(plan: (typeof plans)[number]) {
  return plan.domains > 0;
}`;

function Long() {
  return <CodeBlock filename="lib/plans.ts" code={PLANS} maxLines={6} className="max-w-[560px]" />;
}

export const examples: Record<string, ComponentType> = { install: Install, css: Css, long: Long };
