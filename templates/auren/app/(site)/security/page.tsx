import { pageMeta } from "@/lib/metadata";
import {
  CertificateIcon,
  CloudIcon,
  EyeSlashIcon,
  FingerprintIcon,
  LaptopIcon,
  LockKeyIcon,
  ShieldCheckIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import { PageHero } from "@/components/site/page-hero";
import { DitherReveal, FadeIn, RevealText } from "@/components/ui/reveal";
import { SectionLabel, buttonClass } from "@/components/ui/primitives";
import { SmartLink } from "@/components/ui/smart-link";
import { SUBPROCESSORS } from "@/lib/content/company";
import { rampMasks } from "@/lib/dither";

export const metadata = pageMeta("Security", "What leaves your machine, how it is protected, and who processes it.");

const FLOW = [
  {
    icon: LaptopIcon,
    title: "Your machine",
    tag: "Stays here",
    items: ["Your repository", "The semantic index", "Tab model and predictions", "Settings and keybindings"],
  },
  {
    icon: ShieldCheckIcon,
    title: "Auren gateway",
    tag: "In memory only",
    items: ["The task you wrote", "Snippets the agent selected", "Command output it needs", "Dropped after the response"],
  },
  {
    icon: CloudIcon,
    title: "Model provider",
    tag: "Zero retention",
    items: ["Receives the request", "Contractually forbidden to store it", "Never trains on it", "Or skip it: run a local model"],
  },
];

const PRACTICES = [
  { icon: LockKeyIcon, title: "Encryption", body: "TLS 1.3 in transit. AES-256 at rest for account data." },
  { icon: EyeSlashIcon, title: "Zero retention", body: "Agent request content is never written to disk or logs." },
  { icon: CertificateIcon, title: "SOC 2 Type II", body: "Audited annually. Report available under NDA." },
  { icon: FingerprintIcon, title: "SSO and SCIM", body: "SAML and OIDC sign-in, automated provisioning on Team." },
  { icon: UsersThreeIcon, title: "Least privilege", body: "Production access is time-boxed, reviewed and logged." },
  { icon: ShieldCheckIcon, title: "Pen testing", body: "Third-party tests twice a year, with fixes tracked to close." },
];

const LINK = rampMasks(24, 3, { axis: "x" }).end;

export default function SecurityPage() {
  return (
    <>
      <PageHero
        label="Security"
        title={["Your code", "stays yours."]}
        intro="Auren is built so the default is local. Here is exactly what leaves your machine, how it is protected, and who touches it."
        sun={0.26}
      />

      <section className="bg-paper py-20 text-ink md:py-28">
        <div className="container-x">
          <SectionLabel index="01">Data flow</SectionLabel>
          <h2 className="type-display mt-8 text-[clamp(2.25rem,4.6vw,4rem)]">
            <RevealText lines={["What goes where."]} />
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_4rem_1fr_4rem_1fr] lg:gap-0">
            {FLOW.map((f, i) => (
              <div key={f.title} className="contents">
                {i > 0 && (
                  <div aria-hidden className="relative hidden lg:block">
                    <div
                      className="absolute inset-x-1 top-1/2 h-[9px] -translate-y-1/2 bg-ink"
                      style={{ maskImage: LINK, WebkitMaskImage: LINK, maskSize: "100% 100%", WebkitMaskSize: "100% 100%" }}
                    />
                  </div>
                )}
                <DitherReveal scale={4} delay={i * 180} className="h-full">
                  <div className={i === 0 ? "h-full rounded-[10px] bg-ink p-7 text-paper" : "h-full rounded-[10px] border border-ink/15 p-7"}>
                    <div className="flex items-center justify-between">
                      <f.icon size={22} />
                      <span className={i === 0 ? "type-label text-accent" : "type-label text-ink/45"}>{f.tag}</span>
                    </div>
                    <h3 className="type-title mt-8 text-[24px]">{f.title}</h3>
                    <ul className={i === 0 ? "mt-5 space-y-2 text-[15px] text-fog" : "mt-5 space-y-2 text-[15px] text-ink/65"}>
                      {f.items.map((item) => (
                        <li key={item} className="flex items-center gap-3">
                          <span className={i === 0 ? "size-1.5 bg-accent" : "size-1.5 bg-ink/30"} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </DitherReveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper pb-20 text-ink md:pb-28">
        <div className="container-x">
          <SectionLabel index="02">Practices</SectionLabel>
          <ul className="mt-10 grid grid-cols-1 gap-px border-y border-ink/12 bg-ink/12 sm:grid-cols-2 lg:grid-cols-3">
            {PRACTICES.map(({ icon: Icon, title, body }, i) => (
              <FadeIn as="li" key={title} delay={(i % 3) * 0.06} className="bg-paper py-8 sm:px-8 sm:first:pl-0">
                <Icon size={22} />
                <h3 className="type-title mt-6 text-[21px]">{title}</h3>
                <p className="mt-2 max-w-[34ch] text-[15px] leading-[1.55] text-ink/60">{body}</p>
              </FadeIn>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-paper pb-24 text-ink md:pb-32">
        <div className="container-x grid grid-cols-1 gap-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionLabel index="03">Subprocessors</SectionLabel>
            <div className="mt-10 overflow-x-auto">
              <table className="w-full min-w-[520px] border-t border-ink/12 text-left text-[14.5px]">
                <thead>
                  <tr className="border-b border-ink/12">
                    {["Category", "Purpose", "Location"].map((h) => (
                      <th key={h} className="type-label py-3 pr-4 font-normal text-ink/45">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SUBPROCESSORS.map((row) => (
                    <tr key={row[0]} className="border-b border-ink/12">
                      <td className="py-3.5 pr-4 text-ink">{row[0]}</td>
                      <td className="py-3.5 pr-4 text-ink/65">{row[1]}</td>
                      <td className="py-3.5 pr-4 font-mono text-[12.5px] text-ink/55">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[14px] text-ink/50">
              Named vendors and contracts are listed in our{" "}
              <SmartLink href="/legal/dpa" className="text-ink underline decoration-ink/25 underline-offset-4">
                data processing addendum
              </SmartLink>
              .
            </p>
          </div>
          <div className="lg:col-span-5">
            <SectionLabel index="04">Disclosure</SectionLabel>
            <div className="mt-10 rounded-[10px] bg-ink p-8 text-paper">
              <h3 className="type-title text-[26px]">Found something?</h3>
              <p className="mt-3 text-[15.5px] leading-[1.6] text-fog">
                Write to security@auren.dev. We acknowledge reports within one business day, never pursue good-faith
                research, and pay bounties for valid findings.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="mailto:security@auren.dev" className={buttonClass("light")}>
                  Report a vulnerability
                </a>
                <SmartLink href="/legal/privacy" className={buttonClass("ghost-dark")}>
                  Privacy policy
                </SmartLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
