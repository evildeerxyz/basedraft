import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DataTable } from "@/components/site/DataTable";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "Pricing & fees",
  description: "Every fee Zuno charges, in one place. If it's not on this page, we don't charge it.",
};

function FeeGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-auto grid max-w-[1280px] gap-8 px-5 py-14 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:py-20">
      <h2 className="text-[clamp(2rem,3.4vw,3rem)] font-semibold leading-none tracking-[-0.045em] lg:col-span-4">{title}</h2>
      <div className="min-w-0 lg:col-span-8">{children}</div>
    </section>
  );
}

export default function FeesPage() {
  return (
    <main id="main" className="pb-24">
      <PageHero
        lead="Every fee,"
        tail="in one place."
        intro="If it isn't on this page, we don't charge it. Effective October 1, 2026."
      />

      <FeeGroup title="Plans">
        <DataTable
          caption="Plan fees"
          columns={["Plan", "Monthly", "Billed yearly"]}
          rows={[
            ["Basic", "$0", "$0"],
            ["Plus", "$8", "$72 ($6 a month)"],
            ["Private", "$29", "$288 ($24 a month)"],
          ]}
        />
      </FeeGroup>

      <FeeGroup title="Trading">
        <DataTable
          caption="Trading fees"
          columns={["", "Fee"]}
          rows={[
            ["Stock and ETF trades", "$0"],
            ["Fractional shares", "$0"],
            ["Crypto trades", "0.5% spread, shown before you confirm"],
            ["Regulatory fees on sales (SEC and FINRA)", "Passed through at cost, usually a few cents"],
            ["Fund expense ratios", "Charged by the fund. Zuno portfolios average 0.06%"],
          ]}
        />
      </FeeGroup>

      <FeeGroup title="Moving money">
        <DataTable
          caption="Transfer fees"
          columns={["", "Fee"]}
          rows={[
            ["Bank deposits and withdrawals", "$0"],
            ["Incoming wires", "$0"],
            ["Outgoing domestic wires", "$0"],
            ["Transfers in from another broker (ACATS)", "$0, and we reimburse up to $150"],
            ["Transfers out to another broker", "$0"],
            ["Returned deposits", "$0 the first time, then $15"],
          ]}
        />
      </FeeGroup>

      <FeeGroup title="Account">
        <DataTable
          caption="Account fees"
          columns={["", "Fee"]}
          rows={[
            ["Account opening, maintenance or closing", "$0"],
            ["Inactivity", "$0"],
            ["Statements and tax documents", "$0, delivered electronically"],
            ["IRA annual fee", "$0"],
          ]}
        />
      </FeeGroup>
    </main>
  );
}
