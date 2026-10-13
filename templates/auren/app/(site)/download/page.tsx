import { pageMeta } from "@/lib/metadata";
import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { Inline } from "@/components/site/blocks";
import { DetectedDownload } from "@/components/site/detected-download";
import { PLATFORM_ICONS } from "@/components/site/platform-icons";
import { PageHero } from "@/components/site/page-hero";
import { CopyCommand } from "@/components/ui/copy-command";
import { SectionLabel } from "@/components/ui/primitives";
import { FadeIn, RevealText } from "@/components/ui/reveal";
import { SmartLink } from "@/components/ui/smart-link";
import { RELEASES, releaseId } from "@/lib/content/changelog";
import { PLATFORMS } from "@/lib/content/downloads";
import { VERSION, cn } from "@/lib/site";

export const metadata = pageMeta("Download", "Download Auren for macOS, Linux and Windows.");

const STEPS = [
  { title: "Open a folder", body: "Run `auren .` in any project, or drag a folder onto the dock icon.", href: "/docs/your-first-task" },
  { title: "Let it read", body: "The local index builds in the background. A million lines takes about forty seconds.", href: "/docs/introduction" },
  { title: "Hand off a task", body: "Press ⌘I, describe a change in a sentence, and keep working while the agent does.", href: "/docs/agents" },
];

export default function DownloadPage() {
  const latest = RELEASES[0];
  return (
    <>
      <PageHero
        index="Auren"
        label="Download"
        title={["Get Auren.", "It takes a minute."]}
        intro={`Version ${VERSION}, released ${latest.date}. Signed, notarized, and it keeps itself up to date.`}
        sun={0.18}
      >
        <DetectedDownload />
      </PageHero>

      <section id="platforms" className="scroll-mt-20 bg-paper text-ink">
        <div className="container-x py-20 md:py-28">
          <SectionLabel index="01">All platforms</SectionLabel>
          <div className="mt-10 grid grid-cols-1 border border-ink/12 lg:grid-cols-3">
            {PLATFORMS.map((p, i) => {
              const Icon = PLATFORM_ICONS[p.id];
              return (
                <FadeIn
                  key={p.id}
                  delay={i * 0.08}
                  className={cn("flex flex-col p-7 md:p-8", i > 0 && "border-t border-ink/12 lg:border-l lg:border-t-0")}
                >
                  <div id={p.id} className="scroll-mt-28" />
                  <Icon size={26} weight="fill" />
                  <h2 className="type-title mt-6 text-[28px]">{p.name}</h2>
                  <p className="mt-1.5 font-mono text-[12px] text-ink/50">{p.requirement}</p>
                  <ul className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
                    {p.artifacts.map((a) => (
                      <li key={a.file}>
                        <SmartLink href={a.href} className="group flex h-14 items-center gap-3 text-[15px]">
                          <DownloadSimpleIcon
                            size={16}
                            className={cn("transition-colors", "primary" in a ? "text-ink" : "text-ink/40 group-hover:text-ink")}
                          />
                          <span>{a.label}</span>
                          <span className="ml-auto font-mono text-[11.5px] text-ink/45">{a.size}</span>
                        </SmartLink>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <div className="type-label mb-3 text-ink/45">From a terminal</div>
                    <CopyCommand command={p.command} tone="light" className="w-full" />
                  </div>
                </FadeIn>
              );
            })}
          </div>
          <p className="mt-5 font-mono text-[12px] text-ink/45">
            Checksums and signatures are published with every release. Looking for older builds? See the{" "}
            <SmartLink href="/changelog" className="text-ink underline decoration-ink/25 underline-offset-4">
              changelog
            </SmartLink>
            .
          </p>
        </div>
      </section>

      <section className="bg-paper pb-24 text-ink md:pb-32">
        <div className="container-x grid grid-cols-1 gap-12 border-t border-ink/12 pt-20 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionLabel index="02">Next</SectionLabel>
            <h2 className="type-display mt-8 text-[clamp(2.25rem,4.6vw,4rem)]">
              <RevealText lines={["Then, open", "a folder."]} />
            </h2>
          </div>
          <ol className="border-t border-ink/12 lg:col-span-7">
            {STEPS.map((s, i) => (
              <FadeIn as="li" key={s.title} delay={i * 0.07}>
                <SmartLink href={s.href} className="group grid grid-cols-[3rem_minmax(0,1fr)] items-baseline gap-4 border-b border-ink/12 py-7 transition-colors hover:bg-ink/[0.03]">
                  <span className="font-dot text-[28px] font-[800] leading-none">{i + 1}</span>
                  <span>
                    <span className="type-title block text-[22px]">{s.title}</span>
                    <span className="mt-1.5 block text-[15px] leading-snug text-ink/55">
                      <Inline text={s.body} />
                    </span>
                  </span>
                </SmartLink>
              </FadeIn>
            ))}
          </ol>
        </div>

        <div className="container-x mt-20">
          <SmartLink
            href={`/changelog#${releaseId(latest.version)}`}
            className="group grid grid-cols-1 gap-6 rounded-[10px] bg-ink p-8 text-paper transition-colors md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:p-10"
          >
            <span className="font-dot text-[56px] font-[800] leading-none text-accent">{latest.version}</span>
            <span>
              <span className="type-label text-mute">What’s new · {latest.date}</span>
              <span className="type-title mt-2 block text-[26px]">{latest.title}</span>
              <span className="mt-1.5 block max-w-[60ch] text-[15px] text-fog">{latest.summary}</span>
            </span>
            <span className="text-[14px] text-fog underline decoration-paper/25 underline-offset-4 transition-colors group-hover:text-paper">
              Release notes
            </span>
          </SmartLink>
        </div>
      </section>
    </>
  );
}
