import type { Metadata } from "next";
import { ContactForm } from "@/components/pages/company";
import { CodeSample } from "@/components/pages/resources";
import { Block } from "@/components/site/Block";
import { ButtonLink } from "@/components/site/ButtonLink";
import { DataTable } from "@/components/site/DataTable";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "Developers",
  description: "The Zuno API gives approved partners read-only access to member-authorized portfolio data, with webhooks for activity.",
};

const ENDPOINTS: Array<[string, string, string]> = [
  ["GET", "/v1/portfolios", "List portfolios the member has shared with you"],
  ["GET", "/v1/portfolios/{id}/holdings", "Current holdings with quantity, value and cost basis"],
  ["GET", "/v1/portfolios/{id}/performance", "Time-weighted returns for 1D to all-time"],
  ["GET", "/v1/portfolios/{id}/activity", "Trades, deposits, dividends and harvested losses"],
  ["GET", "/v1/tax/lots", "Lot-level cost basis for tax software"],
  ["POST", "/v1/webhooks", "Subscribe to activity and balance events"],
];

const PLATFORM = [
  { title: "OAuth 2.0 consent", body: "Members approve exactly which accounts and data you can see, and can revoke access any time.", code: "scope=portfolio:read\n      activity:read\n      tax_lots:read" },
  { title: "Signed webhooks", body: "Events for trades, deposits and balance changes, signed with HMAC and retried for 72 hours.", code: '{ "type": "trade.filled",\n  "symbol": "VXUS",\n  "amount": "420.00" }' },
  { title: "Honest rate limits", body: "600 requests a minute per member token, with headers that tell you where you stand.", code: "X-RateLimit-Limit: 600\nX-RateLimit-Remaining: 584\nX-RateLimit-Reset: 31" },
  { title: "Typed SDKs", body: "Clients for JavaScript and Python, generated from a public OpenAPI 3.1 spec.", code: "npm install @zuno/api\npip install zuno" },
];

export default function DevelopersPage() {
  return (
    <main id="main">
      <PageHero
        lead="The Zuno API."
        tail="Read-only, by design."
        intro="Approved partners like tax software, budgeting apps and financial planners can read portfolio data that members choose to share. Nothing in the API can move money or place trades."
        actions={<ButtonLink href="#access">Request access</ButtonLink>}
        aside={<CodeSample />}
      />

      <Block lead="Six endpoints." tail="Nothing that moves money.">
        <DataTable
          caption="API endpoints"
          align="left"
          columns={["Endpoint", "Description"]}
          rows={ENDPOINTS.map(([m, path, d]) => [
            <span key={path} className="font-mono text-[16px]">
              <span className={m === "GET" ? "text-accent" : "text-white"}>{m}</span> <span className="text-white/85">{path}</span>
            </span>,
            <span key={d} className="text-white/70">
              {d}
            </span>,
          ])}
        />
      </Block>

      <Block lead="Built for partners" tail="members can trust.">
        <ul className="grid gap-4 md:grid-cols-2">
          {PLATFORM.map((p) => (
            <li key={p.title} className="flex flex-col rounded-[28px] bg-ink-2 p-8 sm:p-9">
              <h3 className="text-[clamp(1.5rem,2.2vw,1.9rem)] font-semibold tracking-[-0.03em]">{p.title}</h3>
              <p className="mt-3 max-w-[460px] text-[18px] leading-relaxed text-white/70">{p.body}</p>
              <pre className="mt-8 overflow-x-auto rounded-[16px] bg-black/60 p-5 font-mono text-[15px] leading-relaxed text-white/85">{p.code}</pre>
            </li>
          ))}
        </ul>
      </Block>

      <Block id="access" lead="Tell us" tail="what you're building." intro="We review every partner manually. Expect a reply within three business days.">
        <div className="max-w-[760px]">
          <ContactForm defaultTopic="API access" />
        </div>
      </Block>
    </main>
  );
}
