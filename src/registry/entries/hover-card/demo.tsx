"use client";

import type { ComponentType } from "react";
import { Avatar } from "../../ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../../ui/hover-card";

const LINK = "font-medium text-[var(--bd-fg)] underline decoration-[rgb(var(--bd-ink)/0.25)] underline-offset-4 transition-[text-decoration-color] duration-150 hover:decoration-[rgb(var(--bd-ink)/0.6)]";

type Template = { slug: string; name: string; category: string; line: string; pages: number; sections: number; price: number };
const ZUNO: Template = { slug: "zuno", name: "Zuno", category: "Fintech", line: "An AI investing app, on a pure black page with dithered lime.", pages: 25, sections: 15, price: 79 };
const NOMA: Template = { slug: "noma", name: "Noma", category: "AI and data", line: "An AI layer for Postgres, drawn like a printed engraving.", pages: 12, sections: 12, price: 79 };

/* What a link to a template shows on the way: its logo, its line, and what's in it. */
function TemplateCard({ t, shot }: { t: Template; shot?: boolean }) {
  return (
    <div className="grid gap-3">
      {shot && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/shots/${t.slug}.jpg`} alt="" className="aspect-[16/9] w-full rounded-[10px] object-cover object-top shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.08)]" />
      )}
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/logos/${t.slug}.svg`} alt="" className="size-10 rounded-[11px]" />
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
        <HoverCardTrigger href="#zuno" className={LINK}>
          Zuno
        </HoverCardTrigger>
        <HoverCardContent>
          <TemplateCard t={ZUNO} shot />
        </HoverCardContent>
      </HoverCard>{" "}
      or{" "}
      <HoverCard>
        <HoverCardTrigger href="#noma" className={LINK}>
          Noma
        </HoverCardTrigger>
        <HoverCardContent>
          <TemplateCard t={NOMA} shot />
        </HoverCardContent>
      </HoverCard>
      , both open in Studio for free.
    </p>
  );
}

function Templates() {
  return (
    <p className="text-sm text-[var(--bd-muted)]">
      Built on{" "}
      <HoverCard>
        <HoverCardTrigger href="#zuno" className={LINK}>
          Zuno
        </HoverCardTrigger>
        <HoverCardContent>
          <TemplateCard t={ZUNO} />
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
          <p className="mt-3 text-[13px] leading-snug text-[var(--bd-muted)]">Rewrote Zuno&apos;s hero and moved Pricing above the FAQ, two hours ago.</p>
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
        <HoverCardTrigger href="#noma" className={LINK}>
          Noma
        </HoverCardTrigger>
        <HoverCardContent side="top" align="start">
          <TemplateCard t={NOMA} />
        </HoverCardContent>
      </HoverCard>{" "}
      for the light version.
    </p>
  );
}

function Timing() {
  return (
    <p className="text-sm text-[var(--bd-muted)]">
      Quick to show:{" "}
      <HoverCard openDelay={120} closeDelay={400}>
        <HoverCardTrigger href="#zuno" className={LINK}>
          Zuno
        </HoverCardTrigger>
        <HoverCardContent>
          <TemplateCard t={ZUNO} />
        </HoverCardContent>
      </HoverCard>
    </p>
  );
}

export const examples: Record<string, ComponentType> = { template: Templates, person: Person, above: Above, timing: Timing };
