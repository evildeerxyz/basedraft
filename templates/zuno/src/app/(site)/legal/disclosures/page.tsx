import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc } from "@/components/site/Legal";

export const metadata: Metadata = {
  title: "Disclosures",
  description: "Important information about investing with Zuno, including risks, Cash, crypto, tax-loss harvesting and Copilot.",
};

export default function DisclosuresPage() {
  return (
    <LegalDoc
      title="Disclosures"
      updated="October 1, 2026"
      intro={<p>The fine print for every feature, written so you can actually read it. If anything here is unclear, ask Copilot or our support team.</p>}
      sections={[
        {
          id: "general",
          title: "General investing",
          body: (
            <>
              <p>
                Advisory services are provided by Zuno Advisers LLC, an SEC-registered investment adviser. Brokerage services are provided by Zuno Securities LLC,
                member <a href="https://www.finra.org" rel="noreferrer">FINRA</a> and <a href="https://www.sipc.org" rel="noreferrer">SIPC</a>. Securities are held
                in your name by an independent clearing firm.
              </p>
              <p>
                Investments are <strong>not FDIC insured, not bank guaranteed and may lose value</strong>. Past performance is not a guarantee of future results. Any
                projections in the app are hypothetical, based on assumptions that may not hold, and do not reflect actual results.
              </p>
            </>
          ),
        },
        {
          id: "sipc",
          title: "SIPC protection",
          body: (
            <p>
              SIPC protects securities customers of its members up to $500,000, including $250,000 for claims for cash. SIPC does not protect against market losses.
              Our clearing firm also carries excess coverage through third-party insurers. Details are available on request.
            </p>
          ),
        },
        {
          id: "cash",
          title: "Zuno Cash",
          body: (
            <>
              <p>
                Zuno Cash is offered by Zuno Securities LLC, not a bank. Uninvested cash is swept to program banks, where it is eligible for FDIC insurance up to $2.5
                million in total ($250,000 per bank across up to ten banks) once it arrives. FDIC insurance covers the failure of a program bank, not of Zuno.
              </p>
              <p>
                The annual percentage yield is variable and may change at any time. The 4.10% APY shown is accurate as of October 1, 2026. No minimum balance is
                required.
              </p>
            </>
          ),
        },
        {
          id: "autopilot",
          title: "Autopilot and rebalancing",
          body: (
            <p>
              Autopilot rebalances when your allocation drifts beyond the thresholds you&apos;ve set. Rebalancing may create taxable gains in taxable accounts.
              Autopilot estimates the tax impact of each trade before placing it, but estimates may differ from your final tax liability. Single-stock caps and
              volatility pauses reduce, but do not remove, concentration risk.
            </p>
          ),
        },
        {
          id: "tlh",
          title: "Tax-loss harvesting",
          body: (
            <>
              <p>
                Tax-loss harvesting is not suitable for everyone. It may defer rather than eliminate taxes, because replacement securities carry a lower cost basis.
                Benefits depend on your tax bracket, the length of time you hold investments and future tax law.
              </p>
              <p>
                Zuno monitors the wash sale rule across the accounts you hold with us. We can&apos;t see trades in accounts elsewhere, including your spouse&apos;s,
                which may cause a harvested loss to be disallowed. Zuno does not provide tax advice. Consult a tax professional about your situation.
              </p>
            </>
          ),
        },
        {
          id: "crypto",
          title: "Crypto",
          body: (
            <p>
              Crypto trading is offered through Zuno Crypto LLC and custodied by a licensed third-party custodian. Crypto assets are not securities in most cases, are
              not protected by SIPC or the FDIC, and are highly volatile. You could lose all of the money you put in. Autopilot limits crypto to the cap you choose,
              up to 5% of your portfolio. A spread of 0.5% is included in each price.
            </p>
          ),
        },
        {
          id: "copilot",
          title: "Copilot",
          body: (
            <p>
              Copilot uses large language models to answer questions about your account. Answers are generated automatically and may contain errors. Copilot does not
              place trades without your approval, except under Autopilot rules you&apos;ve switched on. Proposals from Copilot are personalized advice from Zuno Advisers
              and are subject to our fiduciary duty.
            </p>
          ),
        },
        {
          id: "performance",
          title: "Performance figures",
          body: (
            <p>
              Performance shown on this website is for illustrative purposes. Model portfolio returns are net of the Plus plan fee and fund expenses, assume dividends
              are reinvested, and do not reflect taxes. Your results will differ based on deposits, withdrawals, timing and plan. See our{" "}
              <Link href="/legal/form-crs">Form CRS</Link> for conflicts of interest.
            </p>
          ),
        },
      ]}
    />
  );
}
