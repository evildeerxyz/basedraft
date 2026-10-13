"use client";

import type { ReactNode } from "react";
import { EyeIcon, SealCheckIcon, ShieldCheckIcon } from "@phosphor-icons/react/ssr";
import { CityScene, ConnectScene, FundingScene, GateScene, HeroScene, PlansScene, ReleaseScene, StatusScene, StepsScene } from "@/components/gl/lazy";
import { Zigzag } from "@/components/shapes/shapes";
import { LogoMark } from "@/components/site/ui";
import { FUNDING, PLANS } from "@/lib/content";
import { SITE_NAME } from "@/lib/site";

/*
 * Social cards, 1200 × 630, rendered from the live scenes. Only served when
 * OG_STUDIO=1 (see /og/[card] and scripts/og.mjs). Copy and scenes for each
 * card live here; routes, wait times and alt text live in cards.json.
 */

type Card = { label: string; title: string; sub: string; scene: ReactNode; wide?: boolean; fade?: boolean };

const CARDS: Record<string, Card> = {
  home: {
    label: "The AI layer for Postgres",
    title: "Ask your database anything.",
    sub: "Plain English in. SQL you can read, approve and share.",
    scene: <HeroScene className="absolute inset-0" span={14.4} />,
  },
  product: {
    label: "Product",
    title: "One workspace for every question.",
    sub: "Ask, draft, approve and chart, on the Postgres you already run.",
    scene: <StepsScene className="absolute inset-0" follow />,
    fade: true,
  },
  pricing: {
    label: "Pricing",
    title: "Pay for seats, not for questions.",
    sub: "Free for three seats. People who only read answers never pay.",
    scene: <PlansScene plans={PLANS} active={1} className="absolute inset-0" span={14.2} />,
  },
  security: { label: "Security", title: "Every write waits for a human.", sub: "Noma reads your schema, never your rows.", scene: <GateScene className="absolute inset-0" span={11.4} /> },
  status: {
    label: "Status",
    title: "All systems operational.",
    sub: "Checked every minute from three regions.",
    scene: <StatusScene regions={["us-east-1", "eu-west-1", "ap-southeast-1"]} className="absolute inset-0" span={11.6} />,
  },
  customers: {
    label: "Customers",
    title: "Teams that ship answers, not queries.",
    sub: "2,400+ teams turn questions into reviewed SQL.",
    scene: <CityScene className="absolute inset-0" span={16.2} />,
  },
  company: {
    label: "Company",
    title: "The interface between people and their data.",
    sub: `${FUNDING.total} raised to give every database a voice.`,
    scene: <FundingScene rounds={FUNDING.rounds} className="absolute inset-0" span={14.6} />,
  },
  changelog: {
    label: "Changelog",
    title: "New in Noma, every other Tuesday.",
    sub: "Small releases, shipped often.",
    scene: <ReleaseScene versions={["v2.3", "v2.4", "v2.5", "v2.6"]} span={20.5} className="absolute inset-0" />,
    wide: true,
  },
  contact: { label: "Book a demo", title: "See Noma on your own data.", sub: "Thirty minutes, your schema, no slides.", scene: <ConnectScene className="absolute inset-0" span={10.6} /> },
  series: {
    label: "Announcement",
    title: `We raised ${FUNDING.amount} to give every database a voice.`,
    sub: `Our ${FUNDING.round}, led by ${FUNDING.lead}.`,
    scene: <FundingScene rounds={FUNDING.rounds} className="absolute inset-0" span={14.6} />,
  },
};

const TRUST = [
  { icon: EyeIcon, text: "Read only by default" },
  { icon: SealCheckIcon, text: "Writes wait for a human" },
  { icon: ShieldCheckIcon, text: "SOC 2 Type II" },
];

export function OgCard({ id }: { id: string }) {
  const card = CARDS[id];
  if (!card) return null;
  return (
    <div data-theme="light" className="fixed left-0 top-0 z-[1000] h-[630px] w-[1200px] overflow-hidden bg-page text-ink">
      <div className="absolute left-[64px] top-[52px] flex items-center gap-3">
        <LogoMark className="size-10" />
        <span className="text-[26px] font-bold tracking-[-0.03em]">{SITE_NAME}</span>
      </div>
      {card.wide ? (
        <>
          <div className="absolute left-[64px] top-[128px] w-[1072px]">
            <p className="text-[21px] font-medium text-ink-2">{card.label}</p>
            <h1 className="mt-3 text-[58px] font-medium leading-[1.0] tracking-[-0.052em]">{card.title}</h1>
            <p className="mt-4 text-[23px] leading-[1.35] text-ink-2">{card.sub}</p>
          </div>
          <div className="absolute left-[40px] right-[40px] top-[250px] h-[300px]">{card.scene}</div>
        </>
      ) : (
        <>
          <div className="absolute left-[64px] top-[150px] w-[500px]">
            <p className="text-[21px] font-medium text-ink-2">{card.label}</p>
            <h1 className="mt-4 text-balance text-[58px] font-medium leading-[1.0] tracking-[-0.052em]">{card.title}</h1>
            <p className="mt-6 max-w-[470px] text-pretty text-[23px] leading-[1.35] text-ink-2">{card.sub}</p>
          </div>
          <div
            className={
              card.fade
                ? "absolute right-[8px] top-[22px] h-[526px] w-[600px] [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]"
                : "absolute right-[8px] top-[22px] h-[526px] w-[600px]"
            }
          >
            {card.scene}
          </div>
        </>
      )}
      <div className="absolute inset-x-0 bottom-0">
        <Zigzag color="var(--inverse)" className="-mb-px" />
        <div className="flex h-[62px] items-center gap-9 bg-inverse px-[64px] text-[18px] text-inverse-fg">
          {TRUST.map(({ icon: TrustIcon, text }) => (
            <span key={text} className="flex items-center gap-2.5">
              <TrustIcon size={22} weight="duotone" className="text-accent" />
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
