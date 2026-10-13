"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MagnifyingGlassIcon, ThumbsDownIcon, ThumbsUpIcon } from "@phosphor-icons/react/dist/ssr";
import { DOC_NAV, DOCS, docHref } from "@/lib/content/docs";
import { PALETTE_EVENT, cn } from "@/lib/site";
import { Kbd } from "../ui/primitives";
import { SmartLink } from "../ui/smart-link";

const titleOf = (slug: string) => DOCS.find((d) => d.slug === slug)?.title ?? slug;

export function DocsSidebar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Documentation">
      {/* compact, scrollable list on small screens */}
      <ul className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:hidden">
        {DOC_NAV.flatMap((s) => s.slugs).map((slug) => {
          const active = pathname === docHref(slug);
          return (
            <li key={slug} className="shrink-0">
              <SmartLink
                href={docHref(slug)}
                prefetch
                className={cn(
                  "block rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                  active ? "border-ink bg-ink text-paper" : "border-ink/15 text-ink/65 hover:border-ink/40",
                )}
              >
                {titleOf(slug)}
              </SmartLink>
            </li>
          );
        })}
      </ul>
      <div className="sticky top-24 hidden space-y-8 lg:block">
        {DOC_NAV.map((section) => (
          <div key={section.title}>
            <div className="type-label text-ink/45">{section.title}</div>
            <ul className="mt-3 space-y-0.5">
              {section.slugs.map((slug) => {
                const active = pathname === docHref(slug);
                return (
                  <li key={slug}>
                    <SmartLink
                      href={docHref(slug)}
                      prefetch
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-[6px] py-1.5 pl-2 pr-3 text-[14px] transition-colors",
                        active ? "bg-ink/[0.06] text-ink" : "text-ink/60 hover:text-ink",
                      )}
                    >
                      <span className={cn("size-1.5 shrink-0 transition-colors", active ? "bg-accent" : "bg-transparent")} />
                      {titleOf(slug)}
                    </SmartLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

export function DocsSearch() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(PALETTE_EVENT))}
      className="flex h-11 w-full max-w-[320px] items-center gap-3 rounded-[6px] border border-paper/15 bg-ink-2 pl-3.5 pr-2 text-[14px] text-mute transition-colors hover:border-paper/35 hover:text-fog"
    >
      <MagnifyingGlassIcon size={15} />
      Search the site
      <span className="ml-auto flex gap-0.5 text-paper">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </span>
    </button>
  );
}

export function Helpful() {
  const [vote, setVote] = useState<"yes" | "no" | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3 text-[14px] text-ink/55">
      {vote ? (
        <span>{vote === "yes" ? "Glad it helped." : "Thanks. We read every one of these."}</span>
      ) : (
        <>
          <span>Was this page helpful?</span>
          {(["yes", "no"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVote(v)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-ink/15 px-3 transition-colors hover:border-ink/40 hover:text-ink"
            >
              {v === "yes" ? <ThumbsUpIcon size={14} /> : <ThumbsDownIcon size={14} />}
              {v === "yes" ? "Yes" : "No"}
            </button>
          ))}
        </>
      )}
    </div>
  );
}
