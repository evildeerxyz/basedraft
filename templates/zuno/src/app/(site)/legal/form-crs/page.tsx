import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc } from "@/components/site/Legal";

export const metadata: Metadata = {
  title: "Form CRS",
  description: "Zuno's client relationship summary: our services, fees, conflicts of interest and legal history.",
};

function Ask({ children }: { children: string }) {
  return (
    <blockquote>
      <p>
        <strong>Questions to ask us:</strong> {children}
      </p>
    </blockquote>
  );
}

export default function FormCrsPage() {
  return (
    <LegalDoc
      title="Form CRS"
      updated="October 1, 2026"
      intro={
        <p>
          Zuno Advisers LLC is registered with the SEC as an investment adviser. Zuno Securities LLC is registered as a broker-dealer and is a member of FINRA and
          SIPC. Brokerage and advisory services and fees differ, and it is important for you to understand the differences. Free tools to research firms and
          financial professionals are available at <a href="https://www.investor.gov/CRS">Investor.gov/CRS</a>.
        </p>
      }
      sections={[
        {
          id: "services",
          title: "What services can you provide me?",
          body: (
            <>
              <p>
                We offer automated investment advice to retail investors. We build a diversified portfolio of low-cost ETFs, and optionally individual stocks and
                crypto, based on your goals and risk tolerance. With your permission, we monitor your account every trading day and rebalance it. You can also ask
                Copilot for advice about your account.
              </p>
              <p>
                Our accounts are discretionary: we buy and sell without asking you first, within the rules you set. You can pause this at any time. There is no
                account minimum. We do not recommend specific mutual funds or offer advice on assets held outside Zuno, except on the Private plan.
              </p>
              <Ask>Given my financial situation, should I choose an advisory service? Why or why not? How will you choose investments to recommend to me?</Ask>
            </>
          ),
        },
        {
          id: "fees",
          title: "What fees will I pay?",
          body: (
            <>
              <p>
                You pay a flat monthly subscription: $0 for Basic, $8 for Plus or $29 for Private. We do not charge a percentage of your assets, so our fee does not grow
                as your account grows. You also pay the expense ratios of the funds you hold, which go to the fund providers, and small regulatory fees on sales.
              </p>
              <p>
                You will pay fees and costs whether you make or lose money on your investments. Fees and costs will reduce any amount of money you make on your
                investments over time. Please make sure you understand what fees and costs you are paying. See our <Link href="/fees">full fee schedule</Link>.
              </p>
              <Ask>Help me understand how these fees and costs might affect my investments. If I give you $10,000 to invest, how much will go to fees and costs?</Ask>
            </>
          ),
        },
        {
          id: "conflicts",
          title: "What are your legal obligations to me, and how else do you make money?",
          body: (
            <>
              <p>
                When we act as your investment adviser, we have to act in your best interest and not put our interest ahead of yours. The way we make money creates
                some conflicts with your interests. You should understand and ask us about these conflicts.
              </p>
              <ul>
                <li>
                  <strong>Cash sweep.</strong> We earn a share of the interest program banks pay on Zuno Cash balances. This gives us an incentive to keep more of your
                  money in Cash.
                </li>
                <li>
                  <strong>Crypto spread.</strong> We earn part of the 0.5% spread on crypto trades, which gives us an incentive to encourage crypto trading.
                </li>
              </ul>
              <p>We do not receive payment for order flow on stock and ETF trades.</p>
              <Ask>How might your conflicts of interest affect me, and how will you address them?</Ask>
            </>
          ),
        },
        {
          id: "pay",
          title: "How do your financial professionals make money?",
          body: (
            <p>
              Our advisers on the Private plan are salaried employees. They do not earn commissions, and their pay is not linked to the products you choose or the
              assets you hold with us.
            </p>
          ),
        },
        {
          id: "history",
          title: "Do you or your financial professionals have legal or disciplinary history?",
          body: (
            <>
              <p>
                No. Visit <a href="https://www.investor.gov/CRS">Investor.gov/CRS</a> for a free and simple search tool to research us and our financial professionals.
              </p>
              <Ask>As a financial professional, do you have any disciplinary history? For what type of conduct?</Ask>
            </>
          ),
        },
        {
          id: "more",
          title: "Additional information",
          body: (
            <p>
              You can find more about our services in our Form ADV Part 2A brochure, available in the app under <strong>Settings, Documents</strong>. To request a copy
              of this summary, email <a href="mailto:compliance@zuno.com">compliance@zuno.com</a> or call (212) 555 0174. If you have a problem with your account, tell
              us first; you can also contact the SEC or FINRA.
            </p>
          ),
        },
      ]}
    />
  );
}
