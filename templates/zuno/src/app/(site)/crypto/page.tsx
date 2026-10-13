import type { Metadata } from "next";
import { WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { CryptoAssets, CryptoCap, CryptoHero } from "@/components/pages/crypto";
import { FAQ as FAQSection } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Block } from "@/components/site/Block";
import { Statements } from "@/components/site/Statements";
import { ButtonLink } from "@/components/site/ButtonLink";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "Crypto",
  description: "Hold Bitcoin and Ethereum as a capped slice of your portfolio, rebalanced automatically and held by a licensed custodian.",
};

const FAQ = [
  { q: "Which coins can I hold?", a: "Bitcoin and Ethereum. We add assets slowly and only when they meet our custody, liquidity and regulatory bar. We don't list meme coins." },
  { q: "Who holds my crypto?", a: "A licensed, regulated custodian holds your coins in segregated cold storage. Zuno never takes custody of your crypto." },
  { q: "What does it cost?", a: "A 0.5% spread on each trade, shown before you confirm. There are no other crypto fees." },
  { q: "Can I move coins to my own wallet?", a: "Not yet. Transfers out to external wallets are planned for 2027." },
];

export default function CryptoPage() {
  return (
    <main id="main">
      <PageHero
        lead="Crypto, in moderation."
        tail="Never more than you planned."
        intro="Add Bitcoin and Ethereum as a small, capped part of your portfolio. When prices run, Autopilot trims the excess so one asset can't quietly take over."
        actions={<ButtonLink href="/signup">Add crypto to my plan</ButtonLink>}
        aside={<CryptoHero />}
      />

      <Block lead="Two coins." tail="On purpose." intro="We add assets slowly, and only when they clear our custody, liquidity and regulatory bar. No meme coins, no airdrops.">
        <CryptoAssets />
      </Block>

      <Block lead="Crypto can double." tail="Your plan shouldn't." intro="Pick a strategy and push the rally. Autopilot sells whatever goes over the cap and spreads it across the rest of your mix.">
        <CryptoCap />
      </Block>

      <Block lead="Held carefully." tail="Explained honestly.">
        <Statements
          items={[
            { title: "Cold storage, not our balance sheet.", body: "A licensed custodian holds your coins in segregated, insured cold storage. Zuno never takes custody of your crypto." },
            { title: "Kept visibly separate.", body: "Crypto isn't a security and isn't covered by SIPC or the FDIC, so the app shows it apart from everything that is." },
            { title: "One price, shown up front.", body: "You see the exact 0.5% spread before every trade. No hidden markups and no payment for order flow." },
          ]}
        />
        <div role="note" className="mt-20 flex gap-4 rounded-[22px] bg-down/[0.1] p-6 text-[17px] leading-relaxed text-white/85 sm:p-7">
          <WarningCircleIcon size={26} className="shrink-0 text-down" />
          <p>
            Crypto is highly volatile and can lose most or all of its value quickly. Only invest money you can afford to lose. Crypto assets are offered through a licensed third party and are not protected by SIPC or FDIC.
          </p>
        </div>
      </Block>

      <FAQSection items={FAQ} lead="Crypto," tail="answered." />

      <FinalCTA />
    </main>
  );
}
