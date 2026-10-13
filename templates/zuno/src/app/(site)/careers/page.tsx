import type { Metadata } from "next";
import { RolesBoard } from "@/components/pages/company";
import { Block } from "@/components/site/Block";
import { Statements } from "@/components/site/Statements";
import { ButtonLink } from "@/components/site/ButtonLink";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join Zuno. 11 open roles across engineering, design, investing and operations in New York, London and remote.",
};

const BENEFITS = [
  { v: "100%", k: "Health cover", d: "Medical, dental and vision for you, and 85% for dependants." },
  { v: "4%", k: "401(k) match", d: "Vested immediately. Invest it on Zuno Autopilot if you like." },
  { v: "20 weeks", k: "Parental leave", d: "Fully paid, for every parent, however your family grows." },
  { v: "20 days", k: "Time off", d: "Plus the week between Christmas and New Year, when the office closes." },
  { v: "10 years", k: "To exercise options", d: "Meaningful equity for everyone, without a 90-day deadline if you leave." },
  { v: "$2,000", k: "Learning budget", d: "Every year, for courses, books and conferences." },
];

const PROCESS = [
  { when: "Day 1", title: "Intro call", body: "30 minutes with the hiring manager about the role and what you want next.", span: "lg:col-span-3" },
  { when: "Week 1", title: "Work sample", body: "A short, paid exercise based on a real problem. No whiteboard puzzles.", span: "lg:col-span-4" },
  { when: "Week 2", title: "Team day", body: "Meet four people you'd work with, in person or on video.", span: "lg:col-span-3" },
  { when: "Week 3", title: "Offer", body: "A decision within three days, with the full breakdown in writing.", span: "lg:col-span-2" },
];

export default function CareersPage() {
  return (
    <main id="main">
      <PageHero
        lead="Build the calmest"
        tail="money app on earth."
        intro="We're 140 people in New York, London and remote, helping 380,000 members stop worrying about money. Every salary range is published."
        actions={<ButtonLink href="#roles">See 11 open roles</ButtonLink>}
      />

      <Block lead="Small teams." tail="Real ownership.">
        <Statements
          items={[
            { title: "Teams of five.", body: "Each team owns a part of the product end to end, from research to on-call. No hand-offs to a team you've never met." },
            { title: "We ship every Tuesday.", body: "The app updates weekly, so your work is in members' hands within days of it being ready." },
            { title: "Two hubs, one team.", body: "Offices in New York and London, with remote roles across the US and overlap hours that respect both." },
            { title: "Write it down.", body: "Decisions live in short docs, so nobody needs to be in the room to know why something happened." },
          ]}
        />
      </Block>

      <Block lead="Looked after," tail="properly.">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <li key={b.k} className="rounded-[28px] bg-ink-2 p-8">
              <div className="text-[clamp(2.6rem,4.4vw,3.6rem)] font-semibold leading-none tracking-[-0.05em] text-accent">{b.v}</div>
              <div className="mt-5 text-[21px] font-semibold tracking-[-0.02em]">{b.k}</div>
              <p className="mt-2 text-[17px] leading-relaxed text-white/65">{b.d}</p>
            </li>
          ))}
        </ul>
      </Block>

      <Block id="roles" lead="Find your" tail="next role." intro="Every listing shows the salary range for the location. Equity comes on top.">
        <RolesBoard />
      </Block>

      <Block lead="Four steps," tail="about three weeks." intro="We move quickly because good people have options. You'll always know where you stand.">
        <ol className="grid gap-4 lg:grid-cols-12">
          {PROCESS.map((p, i) => (
            <li key={p.title} className={p.span}>
              <div className="h-2.5 rounded-full" style={{ background: "var(--zn-accent)", opacity: 0.35 + i * 0.2 }} />
              <div className="mt-6 text-[17px] font-medium text-accent">{p.when}</div>
              <div className="mt-2 text-[clamp(1.6rem,2.4vw,2.1rem)] font-semibold leading-[1.1] tracking-[-0.035em]">{p.title}</div>
              <p className="mt-3 max-w-[340px] text-[17px] leading-relaxed text-white/65">{p.body}</p>
            </li>
          ))}
        </ol>
      </Block>
    </main>
  );
}
