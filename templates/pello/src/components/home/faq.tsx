import { Band } from "@/components/site/ui";

/*
 * What people ask before they start, all of it open: two columns of questions and answers, read
 * the way you'd read a page, with nothing to click to get at them.
 */

export const QUESTIONS = [
  { q: "Does pello make decisions on its own?", a: "Only the ones you let it. You set the rules for each kind of request. Anything outside them goes to the right person with a short summary, and every decision pello makes can be undone." },
  { q: "Where do its answers come from?", a: "From your own handbook, policies and contracts, which you upload or connect from Notion, Google Drive or Confluence. Each answer links to the passage it used. When it can't find one, it says so and asks a person." },
  { q: "Can it run payroll where we are?", a: "pello runs payroll itself in the US, the UK, Germany and Canada. Everywhere else, it connects to your payroll provider and sends them the month's changes." },
  { q: "How long does it take to set up?", a: "Most teams connect their HR data and handbook in an afternoon and go live within two weeks. We do the import with you, and your first payroll run side by side with your old one." },
  { q: "What happens to our data?", a: "It stays yours. It's encrypted, kept in the EU or the US, never used to train models for anyone else, and deleted within 30 days if you leave." },
  { q: "Do our people need another app?", a: "No. They ask in Slack, Teams or email. There's an app for those who want one, and for the People team." },
];

export function Faq() {
  return (
    <Band id="faq" inner="py-24 lg:py-32">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-ink">Before you ask.</h2>
          <p className="mt-5 max-w-[360px] text-[19px] leading-[1.5] text-mute">
            And if yours isn&apos;t here, write to{" "}
            <a href="mailto:hello@pello.example" className="rounded-[4px] text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              hello@pello.example
            </a>
            . A person answers that one.
          </p>
        </div>
        <dl className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
          {QUESTIONS.map((x) => (
            <div key={x.q} className="border-t border-ink pt-4">
              <dt className="text-[18px] font-semibold leading-[1.3] tracking-[-0.02em] text-ink">{x.q}</dt>
              <dd className="mt-3 text-[16px] leading-[1.6] text-mute">{x.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Band>
  );
}
