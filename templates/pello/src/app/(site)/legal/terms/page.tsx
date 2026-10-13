import type { Metadata } from "next";
import { PageHead, Prose } from "@/components/site/page";
import { Container } from "@/components/site/ui";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms for using pello and this site.",
};

export default function TermsPage() {
  return (
    <>
      <PageHead title="Terms" lead="Last updated September 1, 2026. This is a template: have it checked by your own lawyer before you use it." />
      <section className="pb-28">
        <Container>
          <Prose>
            <h2>The agreement</h2>
            <p>These terms are between pello Inc. and the company that signs up. By using pello, the company agrees to them on behalf of everyone it invites.</p>
            <h2>Your account</h2>
            <p>You&apos;re responsible for who you invite and what they can see. Keep sign in details private, and tell us at security@pello.example if you think someone else has them.</p>
            <h2>Your data</h2>
            <p>Everything you put into pello stays yours. You give us permission to use it only to run pello for you. You can export all of it at any time, in a format other systems can read.</p>
            <h2>What pello decides</h2>
            <p>pello acts within the rules you set. You can review and undo any decision it makes. Payroll is never paid without approval from someone you&apos;ve named.</p>
            <h2>Paying</h2>
            <ul>
              <li>Plans are priced per person, per month, for the people in your company on the first day of each month.</li>
              <li>Yearly plans are paid up front, and cost 20% less.</li>
              <li>You can cancel at any time. Monthly plans stop at the end of the month.</li>
            </ul>
            <h2>When things go wrong</h2>
            <p>We aim for pello to be available 99.9% of the time, and we credit you if it isn&apos;t. If a payroll mistake is ours, we fix it and pay any fees it caused.</p>
            <h2>Changes to these terms</h2>
            <p>We&apos;ll tell you 30 days before any change that affects you, by email and in the app.</p>
          </Prose>
        </Container>
      </section>
    </>
  );
}
