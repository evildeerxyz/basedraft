import {
  CheckIcon,
  DiamondIcon,
  GitBranchIcon,
  LayoutIcon,
  StorefrontIcon,
  TagIcon,
} from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { Metadata } from "next";
import { DeliveryCards } from "@/site/exits";
import { SectionHead } from "@/site/heads";
import { ProPreviewToggle } from "@/site/pro-toggle";
import Link from "next/link";
import { FaqSheet, PricingSheet } from "@/site/blocks";
import { btn, Sheet } from "@/site/sheet";
import { SECTIONS, TEMPLATES } from "@/site/live";
import { FEATURE_ICON, Note } from "@/site/plan-parts";

export const metadata: Metadata = {
  title: "basedraft Pro",
  description:
    "Every template and all their sections, copy to Figma and Paper, the code downloaded or sent to GitHub, and every future update, for one payment.",
};

/* Each use leads with the same icon it has on the plan cards, where it has one. */
const LICENSE: Array<[Icon, string, boolean, boolean, boolean]> = [
  [FEATURE_ICON.personal, "Personal projects", true, true, true],
  [FEATURE_ICON.studio, "Studio, with JSON export", true, true, true],
  [FEATURE_ICON.layouts, "Every template and section", false, true, true],
  [FEATURE_ICON.code, "Code download and GitHub", false, true, true],
  [FEATURE_ICON.figma, "Copy to Figma and Paper", false, true, true],
  [StorefrontIcon, "Commercial products you own", false, true, true],
  [GitBranchIcon, "Updates, downloaded or sent to GitHub", false, true, true],
  [FEATURE_ICON.client, "Client projects", false, false, true],
  [FEATURE_ICON.team, "10 seats", false, false, true],
];

/** The small icon tile that leads a row, as in the plan cards' lists. */
function RowIcon({ icon: I }: { icon: Icon }) {
  return (
    <span
      aria-hidden
      className="hidden size-7 shrink-0 place-items-center rounded-[5px] bg-fg/[0.05] text-fg sm:grid"
    >
      <I size={15} weight="duotone" />
    </span>
  );
}

function Mark({ on }: { on: boolean }) {
  return on ? (
    <CheckIcon size={15} weight="bold" aria-label="Included" />
  ) : (
    <span
      className="inline-block h-px w-3 bg-fg/25 align-middle"
      aria-label="Not included"
    />
  );
}

export default function ProPage() {
  const paid = TEMPLATES.filter((t) => t.price !== "free");
  const worth = paid.reduce((n, t) => n + (t.price as number), 0);
  return (
    <main id="main">
      <header className="bd-reveal grid gap-10 px-1 pb-12 pt-10 md:pt-14 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        <div>
          <h1 className="max-w-[560px] text-display">
            Everything in basedraft, paid for once.
          </h1>
          <p className="mt-4 max-w-[520px] text-lead text-muted">
            All {TEMPLATES.length} templates and their {SECTIONS.length}{" "}
            sections, copy to Figma and Paper, the code downloaded or sent to
            GitHub, and every update after today.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <Link href="/checkout?product=pro" prefetch={false} className={btn.ink}>
              Get Pro for $149
            </Link>
            <Link href="#license" className={btn.quiet}>
              Compare licenses
            </Link>
          </div>
        </div>
        <div className="rounded-[var(--bd-r-sheet)] bg-surface p-5 shadow-[0_0_0_1px_var(--bd-line)]">
          <div className="text-ui font-medium">Bought one at a time</div>
          <ul className="mt-3 space-y-2">
            {paid.map((t) => (
              <li
                key={t.slug}
                className="flex items-center justify-between gap-3 text-ui text-muted"
              >
                <span className="flex items-center gap-2.5">
                  <RowIcon icon={LayoutIcon} />
                  {t.name} template
                </span>
                <span className="tabular-nums">${t.price}</span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-3 text-ui text-muted">
              <span className="flex items-center gap-2.5">
                <RowIcon icon={DiamondIcon} />
                Figma copy and code export
              </span>
              <span className="shrink-0">Not sold alone</span>
            </li>
          </ul>
          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="text-heading">With Pro</span>
            <span className="text-title tabular-nums">$149</span>
          </div>
          <Note icon={TagIcon} className="mt-1 text-meta text-muted">
            Already more than ${worth} of templates, and new ones are included
            as they ship.
          </Note>
        </div>
      </header>

      <PricingSheet id="buy" link={false} bare />
      <div className="mt-3 empty:hidden">
        <ProPreviewToggle />
      </div>


      <section className="mt-14 md:mt-20 scroll-mt-20" id="delivery" aria-labelledby="delivery-title">
        <SectionHead
          id="delivery-title"
          title="How you get your template"
          lead="Pay on Whop with a card, Apple Pay or Google Pay. The moment it goes through, we email you from hello@basedraft.site with two ways to take it, and both stay on your Purchases page."
        />
        <DeliveryCards />
        <ol className="mt-6 grid gap-x-8 gap-y-4 px-1 md:grid-cols-3">
          {[
            ["Sign in with the email you buy with", "That's how your purchases find you. Bought before signing up? They're waiting when you do."],
            ["Take it whichever way suits you", "Download it again, or send it to a new repository, as often as you like."],
            ["Updates land on your Purchases page", "When a template improves, the new version is there to download or send to GitHub."],
          ].map(([t, b], i) => (
            <li key={t} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-fg/[0.06] text-meta font-semibold tabular-nums">{i + 1}</span>
              <span>
                <span className="block text-ui font-medium">{t}</span>
                <span className="mt-0.5 block text-ui text-muted">{b}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14 md:mt-20 scroll-mt-20" id="license" aria-labelledby="license-title">
        <SectionHead
          id="license-title"
          title="What each license covers"
          lead="Pro covers everything you make for yourself. Team adds seats and client work. No license allows reselling the templates or their sections, or recreating them from the previews, by hand or with AI."
        />
        <Sheet>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left sm:min-w-[560px]">
              <caption className="sr-only">License comparison</caption>
              <thead>
                <tr className="border-b border-line text-meta text-muted">
                  <th scope="col" className="py-2.5 pl-4 pr-2 font-normal sm:px-4">
                    Use
                  </th>
                  {["Free", "Pro", "Team"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="w-[52px] px-1 py-2.5 text-center font-medium text-fg sm:w-[120px] sm:px-4 sm:text-left"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LICENSE.map(([icon, k, ...cols]) => (
                  <tr key={k} className="border-b border-line last:border-0">
                    <th scope="row" className="py-2.5 pl-4 pr-2 text-ui font-normal sm:px-4 sm:py-2">
                      <span className="flex items-center gap-2.5">
                        <RowIcon icon={icon} />
                        {k}
                      </span>
                    </th>
                    {cols.map((c, i) => (
                      <td key={i} className="px-1 py-2 text-center sm:px-4 sm:text-left">
                        <Mark on={c} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Sheet>
      </section>

      <section className="mt-14 md:mt-20 scroll-mt-20" id="faq" aria-labelledby="faq-title">
        <SectionHead
          id="faq-title"
          title="Questions"
          lead={
            <>
              Something else? Write to{" "}
              <a
                href="mailto:hello@basedraft.site"
                className="text-fg underline-offset-2 hover:underline"
              >
                hello@basedraft.site
              </a>
              .
            </>
          }
        />
        <FaqSheet bare />
      </section>
    </main>
  );
}
