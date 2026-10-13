/*
 * Sample policy for the Noma template. It is placeholder copy, not legal
 * advice: replace it with your own policy, reviewed by your counsel.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { DatabaseIcon, EyeSlashIcon, HandPalmIcon, TrashIcon } from "@phosphor-icons/react/ssr";
import { LegalDoc, LegalTable } from "@/components/pages/legal";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Noma collects, what it never collects, and the choices you have.",
  alternates: { canonical: "/privacy" },
  openGraph: { url: "/privacy", images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "Noma: Ask your database anything." }] },
};

export default function PrivacyPage() {
  return (
    <LegalDoc
      eyebrow="Privacy"
      title="Your rows never leave home."
      updated="October 1, 2026"
      intro="Noma is built so we need as little of your data as possible. This policy explains what we collect, why, and the choices you have. If anything here is unclear, write to privacy@noma.so and a person will reply."
      summary={[
        { icon: EyeSlashIcon, title: "Schema, not rows", body: "Models see table names, column types and statistics. Row values stay in your database." },
        { icon: HandPalmIcon, title: "We never sell data", body: "Not your account data, not your usage, not to anyone. We do not run ads." },
        { icon: DatabaseIcon, title: "You choose retention", body: "Query results are kept 30 days by default. Set it shorter, or to zero, per workspace." },
        { icon: TrashIcon, title: "Delete means delete", body: "Remove a connection or close your account and the related data is gone within 30 days." },
      ]}
      sections={[
        {
          id: "collect",
          title: "What we collect",
          body: (
            <>
              <p>We collect three kinds of information, and only what we need to run Noma for you.</p>
              <ul>
                <li>
                  <strong>Account details:</strong> your name, work email, company and billing details when you subscribe.
                </li>
                <li>
                  <strong>Workspace metadata:</strong> the schema of databases you connect (table and column names, types, keys and column statistics) and the questions your team asks.
                </li>
                <li>
                  <strong>Product usage:</strong> pages viewed, features used, errors and performance timings, so we can fix problems and improve Noma.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "never",
          title: "What we never collect",
          body: (
            <>
              <p>
                Noma does not copy, index or store the rows in your database. When a query runs, results stream to the people in your workspace and are kept only as long as your retention setting
                allows. Row values are <strong>never sent to a model provider</strong> and never used to train any model.
              </p>
              <p>Database credentials are encrypted with a key held in a dedicated key management service and are never written to logs.</p>
            </>
          ),
        },
        {
          id: "use",
          title: "How we use information",
          body: (
            <ul>
              <li>To draft SQL from your questions and explain it.</li>
              <li>To run approved queries and show the results to your team.</li>
              <li>To keep an audit log of who asked, what ran and who approved it.</li>
              <li>To provide support, send service updates and bill your account.</li>
              <li>To keep Noma secure, including spotting abuse and investigating incidents.</li>
            </ul>
          ),
        },
        {
          id: "models",
          title: "AI model providers",
          body: (
            <p>
              To draft SQL, Noma sends a model provider your question and the parts of your schema it needs. Our agreements with model providers forbid them from storing these requests beyond
              processing or using them for training. Enterprise workspaces can route requests to a provider of their choice, or to a model hosted in their own cloud.
            </p>
          ),
        },
        {
          id: "subprocessors",
          title: "Subprocessors",
          body: (
            <>
              <p>These companies help us run Noma. Each one is bound by a data processing agreement.</p>
              <LegalTable
                head={["Purpose", "What they receive", "Location"]}
                rows={[
                  ["Cloud hosting", "Encrypted workspace data and logs", "United States, European Union"],
                  ["AI model provider", "Questions and schema metadata", "United States, European Union"],
                  ["Payments", "Billing details", "United States"],
                  ["Email delivery", "Name and work email", "United States"],
                  ["Support tooling", "Support conversations", "United States"],
                ]}
              />
            </>
          ),
        },
        {
          id: "retention",
          title: "Retention and deletion",
          body: (
            <ul>
              <li>Query results: 30 days by default, configurable from zero to 365 days.</li>
              <li>Audit logs: one year, or longer on Enterprise.</li>
              <li>Schema metadata: until you remove the connection.</li>
              <li>Account data: until you close your account, then deleted within 30 days unless the law requires us to keep it.</li>
            </ul>
          ),
        },
        {
          id: "rights",
          title: "Your rights",
          body: (
            <p>
              Wherever you live, you can ask to see, correct, export or delete the personal data we hold about you, and object to how we use it. Email privacy@noma.so and we will respond within 30
              days. If you are in the European Union or the United Kingdom, you can also complain to your local data protection authority.
            </p>
          ),
        },
        {
          id: "cookies",
          title: "Cookies",
          body: (
            <p>
              We use cookies to keep you signed in and to remember your theme. We use privacy-friendly analytics on this website that do not track you across other sites. We do not use advertising
              cookies.
            </p>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          body: (
            <p>
              Noma, Inc., 548 Market Street, San Francisco, CA 94104. Email privacy@noma.so. For security questions, see our <Link href="/security">security page</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}
