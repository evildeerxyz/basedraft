import { AppleLogoIcon, LinuxLogoIcon, WindowsLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { VERSION } from "@/lib/site";
import { DitherWordmark } from "../dither/dither-wordmark";
import { CopyCommand } from "../ui/copy-command";
import { buttonClass } from "../ui/primitives";
import { FadeIn, RevealText } from "../ui/reveal";
import { SmartLink } from "../ui/smart-link";

const PLATFORMS = [
  { icon: LinuxLogoIcon, label: "Linux", note: ".deb · .rpm · AppImage", href: "/download#linux" },
  { icon: WindowsLogoIcon, label: "Windows", note: "x64 · arm64", href: "/download#windows" },
];

export function FinalCta() {
  return (
    <section id="download" className="bg-ink pt-24 text-paper md:pt-32">
      <div className="container-x">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <h2 className="type-display text-[clamp(2.5rem,5.3vw,4.9rem)] lg:col-span-7">
            <RevealText lines={["Open a folder.", "Auren catches up."]} lineClassNames={[undefined, "text-mute"]} />
          </h2>
          <FadeIn delay={0.2} className="self-end lg:col-span-5">
            <div className="flex flex-wrap gap-3">
              <SmartLink href="/download" className={buttonClass("light", "lg")}>
                <AppleLogoIcon size={17} weight="fill" />
                Download for macOS
              </SmartLink>
              <CopyCommand />
            </div>
            <ul className="mt-6 divide-y divide-paper/10 border-y border-paper/10">
              {PLATFORMS.map(({ icon: Icon, label, note, href }) => (
                <li key={label}>
                  <SmartLink
                    href={href}
                    className="group flex h-12 items-center gap-3 text-[14.5px] text-fog transition-colors hover:text-paper"
                  >
                    <Icon size={17} />
                    {label}
                    <span className="ml-auto font-mono text-[11.5px] text-mute">{note}</span>
                  </SmartLink>
                </li>
              ))}
            </ul>
            <p className="mt-4 font-mono text-[11.5px] text-mute">
              v{VERSION} · Signed and notarized · Auto-updates
            </p>
          </FadeIn>
        </div>

        <div className="mt-20 md:mt-28">
          <DitherWordmark />
        </div>
      </div>
    </section>
  );
}
