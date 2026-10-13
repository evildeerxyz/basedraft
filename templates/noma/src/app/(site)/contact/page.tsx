import type { Metadata } from "next";
import { ChatsCircleIcon, DatabaseIcon, QuotesIcon, ShieldCheckIcon } from "@phosphor-icons/react/ssr";
import { TESTIMONIALS } from "@/lib/content";
import { ConnectScene } from "@/components/gl/lazy";
import { Frame } from "@/components/shapes/shapes";
import { DemoForm } from "@/components/pages/contact";
import { Portrait } from "@/components/site/portrait";
import { Eyebrow, Section } from "@/components/site/ui";

export const metadata: Metadata = {
  title: "Book a demo",
  description: "Thirty minutes with a solutions engineer, on your own schema. You bring the questions, Noma writes the SQL.",
  alternates: { canonical: "/contact" },
  openGraph: { url: "/contact" },
};

const PERKS = [
  { icon: DatabaseIcon, title: "Demo on your schema", body: "Connect a read-only replica, or we'll bring a sample that looks just like yours." },
  { icon: ChatsCircleIcon, title: "Ask anything", body: "Bring the questions your team has been waiting on." },
  { icon: ShieldCheckIcon, title: "Security review ready", body: "SOC 2 report, DPA and architecture docs on request." },
];

const AGENDA = [
  ["00:00", "Connect a replica or our sample schema"],
  ["00:05", "Ask the questions your team is waiting on"],
  ["00:15", "Approve a write and read the audit log"],
  ["00:25", "Pricing, security review and next steps"],
];

const TRUST = ["SOC 2 Type II", "HIPAA", "GDPR", "99.99% uptime"];

export default function ContactPage() {
  const quote = TESTIMONIALS[1];
  return (
    <Section border={false} inner="grid gap-14 pb-24 pt-16 lg:grid-cols-[1fr_1.05fr] lg:pt-20">
      <div className="flex flex-col gap-8">
        <Eyebrow className="w-fit">Book a demo</Eyebrow>
        <h1 className="text-balance text-[44px] font-medium leading-[1.02] tracking-[-0.05em] text-ink md:text-[60px]">See Noma on your own data.</h1>
        <p className="max-w-lg text-[17px] leading-relaxed text-ink-2">
          Thirty minutes with a solutions engineer. You bring the questions, Noma writes the SQL, and you watch every query wait for approval.
        </p>
        <div className="relative aspect-[16/10] w-full max-w-[560px]">
          <ConnectScene className="absolute inset-0" />
        </div>
        <ul className="grid gap-5">
          {PERKS.map(({ icon: PerkIcon, title, body }) => (
            <li key={title} className="flex gap-4">
              <span className="grid size-10 shrink-0 place-items-center border border-line bg-surface text-accent">
                <PerkIcon size={18} weight="duotone" />
              </span>
              <div>
                <h2 className="text-[15px] font-medium text-ink">{title}</h2>
                <p className="mt-0.5 text-[14px] text-ink-2">{body}</p>
              </div>
            </li>
          ))}
        </ul>
        <Frame cut="ticket" size={12} className="hidden max-w-[520px] p-6 lg:block">
          <p className="text-[14px] font-medium text-ink">Your 30 minutes</p>
          <ol className="mt-4 grid">
            {AGENDA.map(([time, item]) => (
              <li key={time} className="grid grid-cols-[64px_1fr] border-t border-line py-3 text-[14.5px]">
                <span className="font-mono text-[12px] text-accent">{time}</span>
                <span className="text-ink">{item}</span>
              </li>
            ))}
          </ol>
        </Frame>
      </div>
      <div className="flex flex-col gap-5">
        <DemoForm />
        <figure className="border border-line bg-surface-2 p-6">
          <QuotesIcon size={22} weight="duotone" className="text-accent" />
          <blockquote className="mt-3 text-[16px] leading-relaxed tracking-[-0.01em] text-ink">{quote.quote}</blockquote>
          <figcaption className="mt-5 flex items-center gap-3">
            <Portrait name={quote.name} cell={1} className="size-12 shrink-0" />
            <span className="text-[13px]">
              <span className="block font-medium text-ink">{quote.name}</span>
              <span className="block text-ink-3">
                {quote.role}, {quote.company}
              </span>
            </span>
          </figcaption>
        </figure>
        <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] text-ink-3">
          {TRUST.map((item) => (
            <li key={item} className="flex items-center gap-1.5">
              <ShieldCheckIcon size={13} weight="duotone" className="text-ok" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
