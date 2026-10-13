/*
 * Sample policy for the Noma template. It is placeholder copy, not legal
 * advice: replace it with your own policy, reviewed by your counsel.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { CreditCardIcon, DatabaseIcon, ScalesIcon, SealCheckIcon } from "@phosphor-icons/react/ssr";
import { LegalDoc } from "@/components/pages/legal";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms of using Noma, in plain language.",
  alternates: { canonical: "/terms" },
  openGraph: { url: "/terms", images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "Noma: Ask your database anything." }] },
};

export default function TermsPage() {
  return (
    <LegalDoc
      eyebrow="Terms"
      title="The terms of using Noma."
      updated="October 1, 2026"
      intro="These terms are an agreement between you and Noma, Inc. We have kept them as short and plain as we can. Enterprise customers may have a signed agreement, and where it differs, that agreement wins."
      summary={[
        { icon: DatabaseIcon, title: "Your data is yours", body: "You own your data and your questions. We only use them to run Noma for you." },
        { icon: SealCheckIcon, title: "You approve the writes", body: "Noma drafts. A person with access decides what runs against your database." },
        { icon: CreditCardIcon, title: "Cancel any time", body: "Monthly plans stop at the end of the month. No cancellation fees." },
        { icon: ScalesIcon, title: "Fair use", body: "Do not use Noma to break the law, attack systems or harm other people." },
      ]}
      sections={[
        {
          id: "acceptance",
          title: "Accepting these terms",
          body: (
            <p>
              By creating an account or using Noma, you agree to these terms. If you use Noma for a company, you confirm you can accept them on its behalf, and &ldquo;you&rdquo; means that company.
            </p>
          ),
        },
        {
          id: "accounts",
          title: "Your account",
          body: (
            <ul>
              <li>Keep your sign-in details safe and tell us at once if you think your account has been misused.</li>
              <li>You are responsible for the people you invite and the access you give them.</li>
              <li>You must be at least 16 years old to use Noma.</li>
            </ul>
          ),
        },
        {
          id: "data",
          title: "Your data",
          body: (
            <p>
              You keep all rights to the data in your databases, the questions you ask and the results Noma returns. You give us permission to process them only to provide and improve the service, as
              described in our <Link href="/privacy">privacy policy</Link>. We never use your rows to train models.
            </p>
          ),
        },
        {
          id: "approvals",
          title: "Approvals and responsibility",
          body: (
            <>
              <p>
                Noma suggests SQL. Read-only queries can run straight away. Anything that writes or changes your schema waits until someone in your workspace approves it. You are responsible for the
                queries you approve, so read them before you do. Noma shows the exact SQL, what it touches and a rollback query where one is possible.
              </p>
            </>
          ),
        },
        {
          id: "use",
          title: "Acceptable use",
          body: (
            <ul>
              <li>Do not connect databases you do not have permission to access.</li>
              <li>Do not try to break, overload or get around the security of Noma or anyone else.</li>
              <li>Do not use Noma to store or process data in a way that breaks the law.</li>
              <li>Do not resell Noma without a written agreement with us.</li>
            </ul>
          ),
        },
        {
          id: "payment",
          title: "Plans and payment",
          body: (
            <p>
              Paid plans are billed per seat, monthly or yearly, in advance. Prices are listed on our <Link href="/pricing">pricing page</Link>. We will tell you at least 30 days before a price change
              affects you. Yearly plans can be refunded pro rata within the first 30 days.
            </p>
          ),
        },
        {
          id: "availability",
          title: "Availability and support",
          body: (
            <p>
              We work hard to keep Noma available and post live updates on our <Link href="/status">status page</Link>. Team and Enterprise plans include the support and uptime commitments described
              in their order form.
            </p>
          ),
        },
        {
          id: "ending",
          title: "Ending the agreement",
          body: (
            <p>
              You can stop using Noma and close your account at any time. We may suspend accounts that break these terms, and will tell you why unless the law prevents us. After closing, you can
              export your data for 30 days before it is deleted.
            </p>
          ),
        },
        {
          id: "liability",
          title: "Warranties and liability",
          body: (
            <p>
              Noma is provided as is. To the extent the law allows, we are not liable for indirect or consequential losses, and our total liability in any year is limited to the amount you paid us in
              the twelve months before the claim. Nothing here limits liability that cannot be limited by law.
            </p>
          ),
        },
        {
          id: "changes",
          title: "Changes to these terms",
          body: (
            <p>
              If we make a material change, we will email the owners of every workspace at least 30 days before it takes effect. The date at the top of this page shows when these terms were last
              updated.
            </p>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          body: (
            <p>
              Noma, Inc., 548 Market Street, San Francisco, CA 94104. Email legal@noma.so, or <Link href="/contact">talk to our team</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}
