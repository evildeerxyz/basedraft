import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc } from "@/components/site/Legal";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The agreement between you and Zuno when you use our apps, website and services.",
};

export default function TermsPage() {
  return (
    <LegalDoc
      title="Terms of service"
      updated="October 1, 2026"
      intro={
        <p>
          These terms are the agreement between you and Zuno Technologies Inc. when you use the Zuno app or website. Investment accounts are also governed by your
          Advisory Agreement with Zuno Advisers LLC and your Customer Agreement with our clearing broker. We have tried to keep this readable. Where it matters,
          we say so plainly.
        </p>
      }
      sections={[
        {
          id: "who-we-are",
          title: "Who we are",
          body: (
            <>
              <p>
                Zuno is a brand of three companies that work together. <strong>Zuno Technologies Inc.</strong> builds and runs the app. <strong>Zuno Advisers LLC</strong>{" "}
                is an SEC-registered investment adviser that manages your portfolio. <strong>Zuno Securities LLC</strong>, a member of FINRA and SIPC, introduces your
                brokerage account to an independent clearing firm, which holds your securities in your name.
              </p>
              <p>Registration with the SEC does not imply a certain level of skill or training.</p>
            </>
          ),
        },
        {
          id: "eligibility",
          title: "Eligibility",
          body: (
            <>
              <p>To open an account you must:</p>
              <ul>
                <li>be at least 18 years old and a US citizen or permanent resident;</li>
                <li>have a valid Social Security number and a US residential address;</li>
                <li>pass our identity checks, which include checks required by federal law.</li>
              </ul>
              <p>We may decline to open an account, or close one, if we can&apos;t verify who you are or if we&apos;re required to by law.</p>
            </>
          ),
        },
        {
          id: "your-account",
          title: "Your account",
          body: (
            <>
              <p>
                You&apos;re responsible for keeping your login details safe and for everything that happens under your account. Turn on Face ID or a passkey, and tell us
                right away at <a href="mailto:security@zuno.com">security@zuno.com</a> if you think someone else has access.
              </p>
              <p>Keep your contact details, employment status and financial information up to date. Autopilot uses them to choose and adjust your portfolio.</p>
            </>
          ),
        },
        {
          id: "autopilot-and-copilot",
          title: "Autopilot and Copilot",
          body: (
            <>
              <p>
                When you switch on Autopilot, you give Zuno Advisers discretionary authority to buy and sell securities in your account according to the rules shown
                in the app. You can pause Autopilot or change those rules at any time. Changes apply to future trades only.
              </p>
              <p>
                Copilot is an AI assistant. It can explain your account, run scenarios and propose changes. It does not place trades outside the rules you have
                switched on, and it asks for confirmation before anything that moves money. Copilot can be wrong. Review its proposals before you accept them, and
                contact support if an answer looks off.
              </p>
            </>
          ),
        },
        {
          id: "fees",
          title: "Fees",
          body: (
            <p>
              Plus and Private are flat subscriptions, billed monthly or yearly from your Zuno Cash balance or linked bank. We never charge a percentage of your
              assets. Fund expense ratios are charged by the fund providers, not by us. The full schedule is on our <Link href="/fees">pricing and fees</Link> page.
              We&apos;ll give you at least 30 days&apos; notice before any fee increase.
            </p>
          ),
        },
        {
          id: "acceptable-use",
          title: "Acceptable use",
          body: (
            <>
              <p>Don&apos;t use Zuno to:</p>
              <ul>
                <li>break the law, including securities, sanctions and anti-money-laundering laws;</li>
                <li>access another person&apos;s account or data without permission;</li>
                <li>scrape, reverse engineer or overload our systems, outside our published API terms;</li>
                <li>try to manipulate Copilot into giving advice about someone else&apos;s account.</li>
              </ul>
            </>
          ),
        },
        {
          id: "risk",
          title: "Investment risk",
          body: (
            <p>
              All investing involves risk, including the possible loss of the money you invest. Past performance does not guarantee future results. Diversification
              and rebalancing do not ensure a profit or protect against loss in a declining market. Read our <Link href="/legal/disclosures">disclosures</Link> for
              details on specific features.
            </p>
          ),
        },
        {
          id: "ending",
          title: "Closing your account",
          body: (
            <p>
              You can close your account in Settings at any time. We&apos;ll sell your holdings or transfer them to another broker, as you choose. Outbound ACATS
              transfers are free. We may close accounts that break these terms, with notice where the law allows.
            </p>
          ),
        },
        {
          id: "disputes",
          title: "Disputes",
          body: (
            <>
              <p>
                If something goes wrong, contact support first. Most issues are solved in a day. If we can&apos;t resolve it, disputes about your brokerage account go to
                FINRA arbitration, as set out in your Customer Agreement. Other disputes are governed by the laws of New York.
              </p>
              <p>Nothing in these terms limits rights you have under federal securities law.</p>
            </>
          ),
        },
        {
          id: "changes",
          title: "Changes to these terms",
          body: (
            <p>
              When we make a material change, we&apos;ll tell you in the app and by email at least 30 days before it takes effect. Continuing to use Zuno after that
              date means you accept the new terms.
            </p>
          ),
        },
      ]}
    />
  );
}
