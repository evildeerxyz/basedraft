"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Icon } from "@phosphor-icons/react";
import { ArrowRightIcon, LightbulbIcon, LightningIcon, MapPinIcon, SealCheckIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { FUNDING, INVESTORS, ROLES, TEAM, VALUES } from "@/lib/content";
import { FundingScene } from "@/components/gl/lazy";
import { Portrait } from "@/components/site/portrait";
import { Section, SectionHeading } from "@/components/site/ui";

export function Funding() {
  return (
    <Section inner="grid items-center gap-12 py-24 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <SectionHeading
          title={`${FUNDING.total} raised to give every database a voice.`}
          description={`Our ${FUNDING.amount} ${FUNDING.round} was led by ${FUNDING.lead}, with every previous investor joining again.`}
        />
        <ul className="mt-10 grid grid-cols-2 border-l border-t border-line">
          {INVESTORS.map((investor) => (
            <li key={investor.name} className="border-b border-r border-line px-5 py-4">
              <span className="block text-[15px] font-medium tracking-[-0.02em] text-ink">{investor.name}</span>
              <span className="mt-0.5 block text-[13px] text-ink-3">{investor.role}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative aspect-[5/4] w-full">
        <FundingScene rounds={FUNDING.rounds} className="absolute inset-0" />
      </div>
    </Section>
  );
}

const VALUE_ICONS: Icon[] = [SealCheckIcon, LightbulbIcon, LightningIcon, UsersThreeIcon];

function ValueIcon({ index }: { index: number }) {
  const ValueGlyph = VALUE_ICONS[index % VALUE_ICONS.length];
  return <ValueGlyph size={28} weight="duotone" className="text-accent" />;
}

export function Values() {
  return (
    <Section inner="py-24">
      <SectionHeading title={<>Four ideas we don&apos;t compromise on.</>} />
      <div className="mt-12 grid gap-px overflow-hidden border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
        {VALUES.map((value, index) => (
          <article key={value.title} className="bg-surface p-6">
            <ValueIcon index={index} />
            <h3 className="mt-10 text-[18px] font-medium tracking-[-0.02em] text-ink">{value.title}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{value.body}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

function Person({ person }: { person: (typeof TEAM)[number] }) {
  return (
    <li>
      <Portrait name={person.name} className="aspect-square w-full" />
      <p className="mt-4 text-[16px] font-medium text-ink">{person.name}</p>
      <p className="text-[13.5px] text-ink-2">{person.role}</p>
      <p className="mt-2 max-w-[260px] text-[13.5px] leading-snug text-ink-3">{person.bio}</p>
    </li>
  );
}

export function Team() {
  return (
    <Section inner="py-24">
      <SectionHeading
        title={<>Small, senior, and very online.</>}
        description="Thirty one people across San Francisco, New York and wherever the wifi is good. These are the folks you will meet first."
      />
      <ul className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
        {TEAM.map((person) => (
          <Person key={person.name} person={person} />
        ))}
      </ul>
    </Section>
  );
}

const TEAMS = ["All", "Engineering", "Design", "Growth", "Sales"] as const;

export function Careers() {
  const [team, setTeam] = useState<(typeof TEAMS)[number]>("All");
  const roles = ROLES.filter((role) => team === "All" || role.team === team);
  return (
    <Section id="careers" inner="py-24">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading title={<>We are hiring {ROLES.length} people.</>} />
        <div role="tablist" aria-label="Team" className="flex flex-wrap gap-1 border border-line bg-surface p-1">
          {TEAMS.map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={team === option}
              onClick={() => setTeam(option)}
              className={cn("relative isolate h-8  px-4 text-[13px] transition-colors", team === option ? "text-inverse-fg" : "text-ink-2 hover:text-ink")}
            >
              {team === option && <motion.span layoutId="team-tab" className="absolute inset-0 -z-10 bg-inverse" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
              {option}
            </button>
          ))}
        </div>
      </div>
      <motion.ul layout className="mt-10 overflow-hidden border border-line bg-surface">
        <AnimatePresence mode="popLayout" initial={false}>
          {roles.map((role) => (
            <motion.li
              key={role.title}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="border-b border-line-soft last:border-b-0"
            >
              <a
                href={`mailto:jobs@noma.so?subject=${encodeURIComponent(`Application: ${role.title}`)}`}
                className="group flex flex-wrap items-center gap-4 px-6 py-5 transition-colors hover:bg-hover"
              >
                <span className="flex-1 text-[16px] font-medium tracking-[-0.01em] text-ink">{role.title}</span>
                <span className="border border-line px-2.5 py-0.5 font-mono text-[11px] text-ink-2">{role.team}</span>
                <span className="flex items-center gap-1 text-[13px] text-ink-3">
                  <MapPinIcon size={13} weight="duotone" />
                  {role.location}
                </span>
                <span className="grid size-8 place-items-center border border-line text-ink-2 transition-all duration-300 group-hover:border-inverse group-hover:bg-inverse group-hover:text-inverse-fg">
                  <ArrowRightIcon size={13} weight="bold" className="transition-transform duration-300 group-hover:-rotate-45" />
                </span>
              </a>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </Section>
  );
}
