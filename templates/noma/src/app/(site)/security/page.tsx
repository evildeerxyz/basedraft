import type { Metadata } from "next";
import {
  BugIcon,
  CertificateIcon,
  ClockCounterClockwiseIcon,
  CloudIcon,
  EnvelopeSimpleIcon,
  EyeSlashIcon,
  FileTextIcon,
  GlobeHemisphereWestIcon,
  LockKeyIcon,
  SealCheckIcon,
  ShieldCheckIcon,
  TimerIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/ssr";
import { GateScene } from "@/components/gl/lazy";
import { LegalTable } from "@/components/pages/legal";
import { ButtonLink, Container, PageHero, Section, SectionHeading } from "@/components/site/ui";

export const metadata: Metadata = {
  title: "Security",
  description: "Noma reads your schema, not your rows, and every write waits for a human. SOC 2 Type II, HIPAA and GDPR ready.",
  alternates: { canonical: "/security" },
  openGraph: { url: "/security" },
};

const SAFEGUARDS = [
  { icon: EyeSlashIcon, title: "Schema, never rows", body: "Models see table names, types and column statistics to draft SQL. Row values never leave your database." },
  { icon: SealCheckIcon, title: "Approval on every write", body: "INSERT, UPDATE, DELETE and DDL wait for someone with access. Enterprise can require two approvers." },
  { icon: TimerIcon, title: "Safe by default", body: "A read-only role, 30 second statement timeouts, 500 row caps and read replicas whenever you have one." },
  { icon: ClockCounterClockwiseIcon, title: "A complete audit trail", body: "Who asked, what ran, who approved it and how long it took. Export it to your SIEM." },
  { icon: LockKeyIcon, title: "Encrypted everywhere", body: "TLS 1.2 or newer in transit, AES-256 at rest. Credentials live in a key management service, never in logs." },
  { icon: UsersThreeIcon, title: "Access you control", body: "SSO with Google, Okta or any SAML provider, roles per workspace and SCIM provisioning on Enterprise." },
  { icon: CloudIcon, title: "Runs where you need it", body: "Connect over a private link or VPC peering, or self-host Noma in your own cloud on Enterprise." },
  { icon: BugIcon, title: "Tested from the outside", body: "Independent penetration tests every year, plus continuous dependency and container scanning." },
];

const COMPLIANCE = [
  { icon: CertificateIcon, title: "SOC 2 Type II", body: "Audited every year. Report available under NDA." },
  { icon: ShieldCheckIcon, title: "HIPAA", body: "We sign a business associate agreement on Enterprise." },
  { icon: FileTextIcon, title: "GDPR", body: "Data processing agreement and standard contractual clauses." },
  { icon: GlobeHemisphereWestIcon, title: "Data residency", body: "Choose United States or European Union hosting." },
];

export default function SecurityPage() {
  return (
    <>
      <PageHero
        eyebrow="Security"
        title="Your data stays yours. Every write waits for a human."
        description="Noma reads your schema, not your rows, and nothing that changes your database runs without a signature. These guardrails are on from the first connection."
        aside={
          <figure>
            <div className="relative mx-auto aspect-[16/11] w-full max-w-[600px]">
              <GateScene className="absolute inset-0" />
            </div>
            <figcaption className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13.5px] text-ink-2">
              <span className="flex items-center gap-2">
                <span className="size-3 bg-blue" />A read runs straight through
              </span>
              <span className="flex items-center gap-2">
                <span className="size-3 bg-accent" />A write waits at the gate for approval
              </span>
            </figcaption>
          </figure>
        }
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/contact" size="lg" icon={ShieldCheckIcon}>
            Talk to our security team
          </ButtonLink>
          <ButtonLink href="/privacy" variant="secondary" size="lg">
            Read the privacy policy
          </ButtonLink>
        </div>
      </PageHero>

      <Section inner="py-24">
        <SectionHeading title="Guardrails that come switched on." description="Every workspace starts with the safest settings. Loosen them only where you choose to." />
        <ul className="mt-12 grid border-l border-t border-line sm:grid-cols-2 lg:grid-cols-4">
          {SAFEGUARDS.map(({ icon: ItemIcon, title, body }) => (
            <li key={title} className="border-b border-r border-line p-6">
              <ItemIcon size={28} weight="duotone" className="text-accent" />
              <h3 className="mt-6 text-[17px] font-medium tracking-[-0.02em] text-ink">{title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section inner="grid gap-10 py-20 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <div>
          <h2 className="text-balance text-[38px] font-medium leading-[1.04] tracking-[-0.045em] text-ink md:text-[46px]">Exactly what leaves your database.</h2>
          <p className="mt-5 max-w-[420px] text-[17px] leading-relaxed text-ink-2">So your security review takes an afternoon, not a quarter.</p>
        </div>
        <LegalTable
          head={["Data", "Where it goes"]}
          rows={[
            ["Table and column names", "To the model provider, to draft SQL"],
            ["Column types and statistics", "To the model provider, to pick the right joins"],
            ["Your question", "To the model provider, then kept in your workspace history"],
            ["Row values", "Never to a model. Shown only to people in your workspace"],
            ["Query results", "Kept 30 days by default, zero to 365 days by choice"],
            ["Database credentials", "Encrypted in a key management service, never logged"],
          ]}
        />
      </Section>

      <Section inner="py-20">
        <SectionHeading title="Compliance, ready for review." />
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COMPLIANCE.map(({ icon: ItemIcon, title, body }) => (
            <li key={title} className="flex gap-4 rounded-[6px] border border-line bg-surface p-5">
              <ItemIcon size={26} weight="duotone" className="shrink-0 text-ok" />
              <div>
                <h3 className="text-[16px] font-medium text-ink">{title}</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <section className="border-t border-line">
        <Container className="grid gap-8 py-20 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="text-[30px] font-medium tracking-[-0.04em] text-ink md:text-[38px]">Found a vulnerability?</h2>
            <p className="mt-3 max-w-[560px] text-[16px] leading-relaxed text-ink-2">
              Email security@noma.so with the details. We reply within one business day, keep you updated until it is fixed, and pay bounties for valid reports.
            </p>
          </div>
          <ButtonLink href="mailto:security@noma.so" size="lg" icon={EnvelopeSimpleIcon}>
            security@noma.so
          </ButtonLink>
        </Container>
      </section>
    </>
  );
}
