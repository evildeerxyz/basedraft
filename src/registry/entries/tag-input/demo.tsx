"use client";

import type { ComponentType } from "react";
import { TagInput } from "../../ui/tag-input";
import { hint } from "../_shared/kit";

/* An address that looks like one: something, an at, a domain with a dot. */
const email = (t: string) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? null : "not an email address");

export function Demo() {
  return (
    <div className="grid w-full max-w-[360px] gap-2">
      <p className="px-1 text-xs font-medium text-[var(--bd-muted)]">Invite to your Team</p>
      <TagInput label="Invite to your Team" placeholder="Add an email, then Enter" defaultValue={["emily@larkspur.co", "jake@larkspur.co", "sarah@larkspur"]} validate={email} max={10} transform={(t) => t.toLowerCase()} />
      <p className={`px-1 ${hint}`}>Paste a list to add them all. Ten seats on a Team license.</p>
    </div>
  );
}

function Keywords() {
  return <TagInput label="Keywords" placeholder="Add a keyword" defaultValue={["fintech", "dark", "dithered"]} transform={(t) => t.toLowerCase()} className="max-w-[360px]" />;
}

function Emails() {
  return <TagInput label="Invite" placeholder="Add an email, then Enter" defaultValue={["emily@larkspur.co", "ryan@larkspur"]} validate={email} max={10} className="max-w-[360px]" />;
}

function Limit() {
  return <TagInput label="Accent colors" placeholder="Up to three" defaultValue={["lime", "ink"]} max={3} className="max-w-[320px]" />;
}

function Separators() {
  return <TagInput label="Pages" placeholder="Type, then space or comma" defaultValue={["home", "pricing"]} separators={[",", " "]} transform={(t) => t.toLowerCase().replace(/^\/+/, "")} className="max-w-[340px]" />;
}

function Small() {
  return <TagInput size="sm" label="Labels" defaultValue={["launch", "q4"]} className="max-w-[280px]" />;
}

export const examples: Record<string, ComponentType> = { keywords: Keywords, emails: Emails, limit: Limit, separators: Separators, small: Small };
