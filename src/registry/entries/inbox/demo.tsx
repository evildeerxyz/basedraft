"use client";

import { ArrowsClockwiseIcon, ReceiptIcon } from "@phosphor-icons/react";
import type { ComponentType } from "react";
import { Inbox, InboxPanel, type InboxItem } from "../../pro-ui/inbox";

/* A basedraft account's day: a sale, an invite, a mention and an update. */
const ITEMS: InboxItem[] = [
  { id: "1", actor: "Riley Parker", text: "bought Zuno", note: "$79, paid with Whop", day: "Today", time: "2m", icon: <ReceiptIcon weight="duotone" /> },
  {
    id: "2",
    actor: "Olivia Bennett",
    text: "invited you to Parker Studio",
    note: "Team, 4 of 10 seats",
    day: "Today",
    time: "1h",
    mention: true,
    actions: [{ label: "Accept", primary: true, onClick: () => ({ actions: undefined, note: "You joined Parker Studio" }) }, { label: "Decline", onClick: () => ({ actions: undefined, note: "Declined" }) }],
  },
  { id: "3", actor: "Jake Morrison", text: "mentioned you in Zuno launch", note: "Can you look at the hero copy before Friday?", day: "Today", time: "3h", mention: true },
  { id: "4", text: "Noma has an update", note: "A dark mode, and two new sections", day: "Yesterday", time: "4:12 PM", icon: <ArrowsClockwiseIcon weight="regular" />, read: true },
  { id: "5", actor: "Sam Ito", text: "bought Pro", note: "$149", day: "Yesterday", time: "9:05 AM", icon: <ReceiptIcon weight="duotone" />, read: true },
];

export function Demo() {
  // On a component's own stage it sits at the top as an app's bar, with room for the card to open under it.
  return (
    <div className="flex w-full justify-center [[data-bd-stage]_&]:min-h-[580px] [[data-bd-stage]_&]:items-start">
      <div className="flex items-center gap-3 rounded-full bg-[var(--bd-surface)] py-1.5 pl-1.5 pr-1.5 shadow-[var(--bd-shadow-resting),0_0_0_1px_var(--bd-line)]">
        <span aria-hidden className="grid size-8 place-items-center rounded-full text-[11px] font-semibold text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]">PS</span>
        <span className="pr-6 text-sm font-medium text-[var(--bd-fg)]">Parker Studio</span>
        <Inbox defaultItems={ITEMS} footer={<span className="text-xs text-[var(--bd-muted)]">Notification settings</span>} />
      </div>
    </div>
  );
}

function Panel() {
  return <InboxPanel defaultItems={ITEMS} className="h-[420px] w-full max-w-[400px]" footer={<span className="text-xs text-[var(--bd-muted)]">See every notification</span>} />;
}

function Mentions() {
  return <InboxPanel defaultItems={ITEMS} defaultTab="mentions" className="h-[360px] w-full max-w-[400px]" empty={{ mentions: { title: "No mentions", note: "When someone names you, it lands here." } }} />;
}

function Empty() {
  return <InboxPanel defaultItems={[]} className="h-[300px] w-full max-w-[400px]" empty={{ all: { title: "All caught up", note: "New purchases and invites show up here." } }} />;
}

export const examples: Record<string, ComponentType> = { panel: Panel, mentions: Mentions, empty: Empty };
