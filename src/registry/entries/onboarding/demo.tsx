"use client";

import type { ComponentType } from "react";
import { OnboardingChecklist, type OnboardingStep } from "../../ui/onboarding";

/* A new basedraft studio's first five things. */
const STEPS: OnboardingStep[] = [
  { id: "site", title: "Make your first site", meta: "2 min", description: "Start from a template, or a blank page. You can change everything later.", action: { label: "Choose a template" } },
  { id: "brand", title: "Add your brand", meta: "1 min", description: "Your logo, colors and fonts, used by every block.", action: { label: "Open Brand" } },
  { id: "domain", title: "Connect a domain", meta: "5 min", description: "Point your own address at the site. We'll check it for you.", action: { label: "Add a domain" } },
  { id: "invite", title: "Invite your team", description: "Edit together, live, and leave comments on any block.", action: { label: "Invite people" } },
  { id: "publish", title: "Publish", description: "Put it on the web. You can publish again any time.", action: { label: "Publish now" } },
];

export function Demo() {
  return (
    <div className="relative h-[480px] w-full max-w-[760px] overflow-hidden rounded-[18px] bg-[var(--bd-surface)] p-5 shadow-[var(--bd-shadow-resting),0_0_0_1px_var(--bd-line)]">
      <p className="text-[15px] font-semibold text-[var(--bd-fg)]">Parker Studio</p>
      <div className="mt-4 grid max-w-[340px] gap-3">
        <div className="h-24 rounded-[14px] bg-[var(--bd-ui-track)] opacity-60" />
        <div className="h-16 rounded-[14px] bg-[var(--bd-ui-track)] opacity-40" />
      </div>
      <OnboardingChecklist steps={STEPS} defaultDone={["site"]} description="Five steps to a site on the web." contained />
    </div>
  );
}

function Inline() {
  return <OnboardingChecklist steps={STEPS} placement="inline" defaultDone={["site", "brand"]} />;
}

function Finished() {
  return <OnboardingChecklist steps={STEPS} placement="inline" defaultDone={STEPS.map((s) => s.id)} finished={{ title: "Your studio is ready", description: "Your site is live. Here's where to go next.", action: { label: "Open the dashboard" } }} />;
}

export const examples: Record<string, ComponentType> = { inline: Inline, finished: Finished };
