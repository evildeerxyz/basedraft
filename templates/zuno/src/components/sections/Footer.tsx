import { InstagramLogoIcon, LinkedinLogoIcon, TiktokLogoIcon, XLogoIcon, YoutubeLogoIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { FOOTER_COLUMNS } from "@/lib/site";
import { Logo } from "../ui/Logo";

const SOCIAL = [
  { icon: XLogoIcon, label: "X" },
  { icon: InstagramLogoIcon, label: "Instagram" },
  { icon: TiktokLogoIcon, label: "TikTok" },
  { icon: YoutubeLogoIcon, label: "YouTube" },
  { icon: LinkedinLogoIcon, label: "LinkedIn" },
];

export function Footer() {
  return (
    <footer className="relative bg-ink">
      <div className="mx-auto max-w-[1280px] px-5 pb-14 pt-24 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Logo />
            <p className="mt-6 max-w-[320px] text-[17px] leading-relaxed text-white/65">The AI that invests while you live your life. Built in New York for the long run.</p>
            <div className="mt-6 flex gap-2">
              {SOCIAL.map(({ icon: Icon, label }) => (
                <a key={label} href="#" aria-label={label} className="grid size-10 place-items-center rounded-full border border-white/10 text-white/60 transition-colors hover:border-lime hover:bg-lime hover:text-on-lime">
                  <Icon size={17} />
                </a>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-4">
            {FOOTER_COLUMNS.map((c) => (
              <nav key={c.title} aria-label={c.title}>
                <div className="text-[16px] font-medium text-white">{c.title}</div>
                <ul className="mt-5 space-y-3">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-[16px] text-white/65 transition-colors hover:text-accent">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-20 max-w-[980px] space-y-4 text-[14px] leading-relaxed text-white/60">
          <p>
            Advisory services are provided by Zuno Advisers LLC, an SEC-registered investment adviser. Brokerage services are provided by Zuno
            Securities LLC, member FINRA/SIPC. Registration does not imply a certain level of skill or training. Cash balances are swept to
            program banks where they are eligible for FDIC insurance up to applicable limits; FDIC insurance does not cover investments.
          </p>
          <p>
            Investing involves risk, including the possible loss of principal. Past performance does not guarantee future results. Hypothetical
            projections are for illustrative purposes only. APY is variable and subject to change. Crypto assets are offered through a licensed
            third party, are not SIPC- or FDIC-protected, and are highly volatile. *Average tax saved based on internal 2025 data for Plus
            members with harvesting enabled. Hours saved is an internal estimate.
          </p>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-4 text-[15px] text-white/60 sm:flex-row sm:items-center">
          <span>© 2026 Zuno Technologies, Inc. All rights reserved.</span>
          <Link href="/status" className="flex items-center gap-2 transition-colors hover:text-white">
            <span className="size-2 rounded-full bg-lime" /> All systems normal
          </Link>
        </div>
      </div>
    </footer>
  );
}
