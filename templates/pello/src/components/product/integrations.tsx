"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Container, SectionHead } from "@/components/site/ui";
import { cn } from "@/lib/cn";

/* The tools pello connects to, by what they're for. Pick a kind to bring its tools forward. */

const GROUPS = [
  { id: "chat", label: "Where people ask", tools: ["Slack", "Microsoft Teams", "Email"] },
  { id: "docs", label: "Where policies live", tools: ["Notion", "Confluence", "Google Drive", "SharePoint"] },
  { id: "id", label: "Accounts and access", tools: ["Google Workspace", "Okta", "Microsoft Entra", "1Password"] },
  { id: "money", label: "Finance", tools: ["Xero", "QuickBooks", "NetSuite", "Ramp"] },
  { id: "hire", label: "Hiring", tools: ["Greenhouse", "Ashby", "Lever"] },
];

export function Integrations() {
  const [on, setOn] = useState<string | null>(null);
  return (
    <section id="integrations" className="scroll-mt-20 py-28 lg:py-36">
      <Container>
        <SectionHead title="Works with what you already use." lead="pello reads from and writes to the tools your company runs on, so nobody copies anything from one to the other again." />
        <div className="mt-12 flex flex-wrap gap-2">
          {GROUPS.map((g) => (
            <button key={g.id} type="button" aria-pressed={on === g.id} onClick={() => setOn(on === g.id ? null : g.id)} className={cn("h-11 rounded-full px-5 text-[16px] font-medium transition-colors", on === g.id ? "bg-ink text-page" : "bg-surface text-ink-2 shadow-[inset_0_0_0_1px_var(--pl-line)] hover:text-ink")}>
              {g.label}
            </button>
          ))}
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {GROUPS.flatMap((g) =>
            g.tools.map((t) => {
              const lit = !on || on === g.id;
              return (
                <motion.li key={t} layout animate={{ opacity: lit ? 1 : 0.32, scale: lit ? 1 : 0.97 }} transition={{ type: "spring", stiffness: 380, damping: 32 }} className="flex h-24 items-center justify-center rounded-[20px] bg-surface px-4 text-center text-[17px] font-semibold tracking-[-0.02em] text-ink shadow-[inset_0_0_0_1px_var(--pl-line)]">
                  {t}
                </motion.li>
              );
            }),
          )}
        </ul>
      </Container>
    </section>
  );
}
