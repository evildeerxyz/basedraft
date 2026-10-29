"use client";

import type { ComponentType } from "react";
import { Avatar } from "../../ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../../ui/hover-card";
import { Placeholder, type Layout } from "../_shared/placeholder";

const LINK = "font-medium text-[var(--bd-fg)] underline decoration-[rgb(var(--bd-ink)/0.25)] underline-offset-4 transition-[text-decoration-color] duration-150 hover:decoration-[rgb(var(--bd-ink)/0.6)]";

type Template = { slug: string; name: string; category: string; line: string; pages: number; sections: number; price: number; layout: Layout };
const LAUNCH: Template = { slug: "launch", name: "Launch kit", category: "Marketing", line: "A product's home page, with features, pricing and a FAQ.", pages: 8, sections: 14, price: 49, layout: "landing" };
const ADMIN: Template = { slug: "admin", name: "Admin kit", category: "Dashboards", line: "An app's shell, with a sidebar, charts and settings.", pages: 12, sections: 10, price: 79, layout: "dashboard" };

/* What a link to a template shows on the way: its logo, its line, and what's in it. */
function TemplateCard({ t, shot }: { t: Template; shot?: boolean }) {
  return (
    <div className="grid gap-3">
      {shot && <Placeholder layout={t.layout} ratio={16 / 9} className="w-full rounded-[10px]" />}
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-[rgb(var(--bd-ink)/0.07)] text-[15px] font-semibold text-[var(--bd-muted)]">{t.name[0]}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{t.name}</p>
          <p className="text-xs text-[var(--bd-subtle)]">{t.category}</p>
        </div>
      </div>
      <p className="text-[13px] leading-snug text-[var(--bd-muted)]">{t.line}</p>
      <p className="flex gap-3 text-xs tabular-nums text-[var(--bd-subtle)]">
        <span>{t.pages} pages</span>
        <span>{t.sections} sections</span>
        <span>${t.price}</span>
      </p>
    </div>
  );
}

export function Demo() {
  return (
    <p className="max-w-[340px] text-center text-[15px] leading-relaxed text-[var(--bd-muted)]">
      Start from{" "}
      <HoverCard>
        <HoverCardTrigger href="#launch" className={LINK}>
          the Launch kit
        </HoverCardTrigger>
        <HoverCardContent>
          <TemplateCard t={LAUNCH} shot />
        </HoverCardContent>
      </HoverCard>{" "}
      or{" "}
      <HoverCard>
        <HoverCardTrigger href="#admin" className={LINK}>
          the Admin kit
        </HoverCardTrigger>
        <HoverCardContent>
          <TemplateCard t={ADMIN} shot />
        </HoverCardContent>
      </HoverCard>
      .
    </p>
  );
}

function Templates() {
  return (
    <p className="text-sm text-[var(--bd-muted)]">
      Built on{" "}
      <HoverCard>
        <HoverCardTrigger href="#launch" className={LINK}>
          the Launch kit
        </HoverCardTrigger>
        <HoverCardContent>
          <TemplateCard t={LAUNCH} />
        </HoverCardContent>
      </HoverCard>
      .
    </p>
  );
}

function Person() {
  return (
    <p className="text-sm text-[var(--bd-muted)]">
      Last edited by{" "}
      <HoverCard>
        <HoverCardTrigger href="#maya" className={LINK}>
          Maya Okafor
        </HoverCardTrigger>
        <HoverCardContent className="w-[260px]">
          <div className="flex items-center gap-3">
            <Avatar name="Maya Okafor" size="lg" status="online" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">Maya Okafor</p>
              <p className="text-xs text-[var(--bd-subtle)]">Designer at Fieldwork</p>
            </div>
          </div>
          <p className="mt-3 text-[13px] leading-snug text-[var(--bd-muted)]">Rewrote the hero and moved Pricing above the FAQ, two hours ago.</p>
        </HoverCardContent>
      </HoverCard>
    </p>
  );
}

function Above() {
  return (
    <p className="text-sm text-[var(--bd-muted)]">
      See{" "}
      <HoverCard>
        <HoverCardTrigger href="#admin" className={LINK}>
          the Admin kit
        </HoverCardTrigger>
        <HoverCardContent side="top" align="start">
          <TemplateCard t={ADMIN} />
        </HoverCardContent>
      </HoverCard>{" "}
      for an app&apos;s screens.
    </p>
  );
}

function Timing() {
  return (
    <p className="text-sm text-[var(--bd-muted)]">
      Quick to show:{" "}
      <HoverCard openDelay={120} closeDelay={400}>
        <HoverCardTrigger href="#launch" className={LINK}>
          the Launch kit
        </HoverCardTrigger>
        <HoverCardContent>
          <TemplateCard t={LAUNCH} />
        </HoverCardContent>
      </HoverCard>
    </p>
  );
}

export const examples: Record<string, ComponentType> = { template: Templates, person: Person, above: Above, timing: Timing };
