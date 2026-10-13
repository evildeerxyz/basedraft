"use client";

import { useSyncExternalStore } from "react";
import { DiscordLogoIcon, GithubLogoIcon, XLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { FOOTER_COLUMNS, SOCIAL_LINKS } from "@/lib/routes";
import { PALETTE_EVENT, THEMES, THEME_EVENT, cn, setTheme, type ThemeId } from "@/lib/site";
import { Logo } from "../ui/logo";
import { SmartLink } from "../ui/smart-link";

const SOCIAL = [
  { icon: GithubLogoIcon, label: "GitHub", href: SOCIAL_LINKS.github },
  { icon: XLogoIcon, label: "X", href: SOCIAL_LINKS.x },
  { icon: DiscordLogoIcon, label: "Discord", href: SOCIAL_LINKS.discord },
];

export function Footer() {
  const theme = useSyncExternalStore(
    (onChange) => {
      window.addEventListener(THEME_EVENT, onChange);
      return () => window.removeEventListener(THEME_EVENT, onChange);
    },
    () => (document.documentElement.dataset.theme as ThemeId) || "aurum",
    () => "aurum" as ThemeId,
  );

  return (
    <footer className="bg-ink text-paper">
      <div className="container-x">
        <div className="grid grid-cols-1 gap-12 border-t border-paper/10 py-16 md:grid-cols-12">
          <div className="md:col-span-4">
            <SmartLink href="/" aria-label="Auren home">
              <Logo />
            </SmartLink>
            <p className="mt-4 max-w-[30ch] text-[14px] leading-relaxed text-mute">
              A native code editor for people who would rather review than type.
            </p>
            <div className="mt-8">
              <div className="type-label text-mute">Accent</div>
              <div role="radiogroup" aria-label="Accent colour" className="mt-3 flex gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={theme === t.id}
                    aria-label={t.label}
                    title={t.label}
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      "grid size-8 place-items-center rounded-[6px] border transition-colors",
                      theme === t.id ? "border-paper/40" : "border-paper/10 hover:border-paper/25",
                    )}
                  >
                    <span className="size-3" style={{ background: t.swatch }} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="md:col-span-2">
              <div className="type-label text-mute">{col.title}</div>
              <ul className="mt-4 space-y-2.5 text-[14px]">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <SmartLink href={l.href} className="text-fog transition-colors hover:text-paper">
                      {l.label}
                    </SmartLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div className="md:col-span-2">
            <div className="type-label text-mute">Community</div>
            <ul className="mt-4 flex gap-2">
              {SOCIAL.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="grid size-9 place-items-center rounded-[6px] border border-paper/10 text-fog transition-colors hover:border-paper/30 hover:text-paper"
                  >
                    <Icon size={16} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-paper/10 py-6 font-mono text-[11.5px] text-mute">
          <span>© 2026 Auren Labs, Inc.</span>
          <SmartLink href="/status" className="flex items-center gap-2 transition-colors hover:text-paper">
            <span className="size-1.5 bg-add" />
            All systems normal
          </SmartLink>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(PALETTE_EVENT))}
            className="ml-auto transition-colors hover:text-paper"
          >
            Press <span className="text-fog">⌘K</span> anywhere
          </button>
        </div>
      </div>
    </footer>
  );
}
