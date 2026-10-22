"use client";

import { useState, type ComponentType } from "react";
import { ClaudeMark } from "@/site/claude-mark";
import { Textarea } from "../../ui/textarea";

export function Demo() {
  return (
    <div className="grid w-full max-w-[350px] gap-2">
      <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--bd-muted)]">
        <ClaudeMark size={13} /> Tell Claude Code what to change
      </p>
      <Textarea maxLength={160} showCount defaultValue="Make the hero about tax-loss harvesting, and keep the headline to two lines." aria-label="What to change" />
    </div>
  );
}

function Basic() {
  return <Textarea placeholder="Notes for the next person who opens this draft" aria-label="Notes" className="max-w-[340px]" />;
}

function Count() {
  return <Textarea maxLength={120} showCount placeholder="A line for the template's card" aria-label="Card line" className="max-w-[340px]" />;
}

function Tagline() {
  const [text, setText] = useState("Zuno is an AI investment manager. It builds your portfolio and rebalances it daily.");
  return <Textarea maxLength={90} showCount value={text} onChange={(e) => setText(e.target.value)} aria-label="Tagline" className="max-w-[340px]" />;
}

function Disabled() {
  return <Textarea disabled defaultValue="Locked while the site publishes." aria-label="Notes" className="max-w-[340px]" />;
}

export const examples: Record<string, ComponentType> = { basic: Basic, count: Count, limit: Tagline, disabled: Disabled };
