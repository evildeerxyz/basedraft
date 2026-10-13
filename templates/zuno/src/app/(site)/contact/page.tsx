import type { Metadata } from "next";
import { ContactForm } from "@/components/pages/company";
import { Block } from "@/components/site/Block";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to a real person at Zuno. Median reply time is four minutes in the app.",
};

const CHANNELS = [
  { title: "Member support", body: "Chat in the app, 24/7. Median reply time is four minutes.", link: "support@zuno.com" },
  { title: "Press", body: "Interviews, data requests and brand assets.", link: "press@zuno.com" },
  { title: "Partnerships", body: "Employers, advisers and fintech platforms.", link: "partners@zuno.com" },
  { title: "Security", body: "Report a vulnerability. We reply within one business day.", link: "security@zuno.com" },
];

export default function ContactPage() {
  return (
    <main id="main">
      <PageHero
        lead="Talk to"
        tail="a human."
        intro="No phone trees, no bots pretending to be people. Pick the right inbox below, or send us a note and we'll route it."
      />

      <section className="mx-auto grid max-w-[1280px] gap-14 px-5 pb-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-8">
        <ul className="space-y-11">
          {CHANNELS.map((c) => (
            <li key={c.title}>
              <h2 className="text-[clamp(1.5rem,2.2vw,1.9rem)] font-semibold tracking-[-0.03em]">{c.title}</h2>
              <p className="mt-2 text-[18px] leading-relaxed text-white/70">{c.body}</p>
              <a href={`mailto:${c.link}`} className="mt-3 inline-block text-[18px] text-accent underline-offset-4 hover:underline">
                {c.link}
              </a>
            </li>
          ))}
        </ul>
        <ContactForm />
      </section>

      <Block lead="Or come and see us." tail="We have good coffee.">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { city: "New York", lines: ["225 Varick Street, 6th floor", "New York, NY 10014"] },
            { city: "London", lines: ["12 Hatton Garden", "London EC1N 8AN"] },
          ].map((o) => (
            <address key={o.city} className="rounded-[28px] bg-ink-2 p-8 not-italic sm:p-10">
              <div className="text-[clamp(2.2rem,4vw,3.25rem)] font-semibold leading-none tracking-[-0.045em]">{o.city}</div>
              <div className="mt-5 text-[18px] leading-relaxed text-white/70">
                {o.lines.map((l) => (
                  <div key={l}>{l}</div>
                ))}
              </div>
            </address>
          ))}
        </div>
      </Block>
    </main>
  );
}
