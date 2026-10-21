"use client";

import { CheckIcon, CopyIcon, DownloadSimpleIcon, GithubLogoIcon, TerminalWindowIcon } from "@phosphor-icons/react";
import { LayoutGroup, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DeviceFrame } from "./frames";
import { composeUrl, liveUrl, templateOf, viewUrl } from "./live";
import { ShellLine } from "./shell-line";

const SLIDE = { type: "spring", stiffness: 520, damping: 42 } as const;

/*
 * A template's real site in the device frame, on a frame in the hero's light, with its pages as a
 * row of chips over it: pick one and it opens in the frame. Copying takes the home page, every
 * section in order.
 */
export function TemplateLive({ slug }: { slug: string }) {
  const t = templateOf(slug)!;
  const id = useId();
  const [path, setPath] = useState("/");
  const names = Object.fromEntries(t.sections.map((s) => [s.id, `${t.name} / ${s.name}`]));
  const keys = t.home.map((sid, i) => `${sid}:home${i}`);
  const page = t.pages.find((p) => p.path === path);
  return (
    <section aria-labelledby="live-title" className="scroll-mt-28">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
        <h2 id="live-title" className="text-title">
          Every page, live
        </h2>
        <p className="text-ui text-muted">{t.pages.length} pages, every one in the download. Pick one to open it.</p>
      </div>
      <div className="bd-panel rounded-[var(--bd-r-stage)] p-2 sm:p-3">
        <LayoutGroup id={id}>
          <div role="tablist" aria-label="Page" className="no-scrollbar mb-2 flex gap-0.5 overflow-x-auto rounded-full bg-paper/60 p-1 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--bd-paper-ink)_8%,transparent)] backdrop-blur [mask-image:linear-gradient(to_right,#000_92%,transparent)] sm:mb-3">
            {t.pages.map((p) => {
              const on = p.path === path;
              return (
                <button key={p.path} type="button" role="tab" aria-selected={on} onClick={() => setPath(p.path)} className={cn("relative h-8 shrink-0 rounded-full px-3.5 text-meta transition-colors", on ? "text-paper-ink" : "text-paper-muted hover:text-paper-ink")}>
                  {on && <motion.span layoutId="page" className="absolute inset-0 rounded-full bg-raised shadow-[var(--bd-shadow-resting),inset_0_0_0_1px_var(--bd-line-subtle)]" transition={SLIDE} />}
                  <span className="relative font-medium">{p.label}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
        <div className="overflow-hidden rounded-[16px] border border-line bg-surface p-2 shadow-[var(--bd-shadow-raised)]">
          <DeviceFrame key={path} src={liveUrl(slug, path)} full={viewUrl(slug, path)} title={`${t.name}, ${page?.label ?? "home"}, live`} height={684} copy={path === "/" ? { name: `${t.name} home`, get: () => null, live: { url: composeUrl(slug, keys), names } } : undefined} />
        </div>
      </div>
    </section>
  );
}

/** A copy button that says so for a moment after it has. */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <button type="button" aria-label={copied ? "Copied" : label} onClick={() => void navigator.clipboard?.writeText(text).then(() => setCopied(true))} className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-fg">
      {copied ? <CheckIcon weight="regular" size={14} className="text-brand-ink" /> : <CopyIcon weight="duotone" size={14} />}
    </button>
  );
}

/** A command on one line, colored as a shell line, on a quiet field, with a button that copies it. */
export function CopyCommand({ command }: { command: string }) {
  return (
    <div className="flex min-h-12 items-center gap-2 rounded-[14px] bg-surface-2 py-1.5 pl-4 pr-1.5">
      <div className="no-scrollbar min-w-0 flex-1 overflow-x-auto whitespace-nowrap py-1">
        <ShellLine command={command} />
      </div>
      <CopyButton text={command} label="Copy the command" />
    </div>
  );
}

/*
 * The getting-it module at the foot of a template's page: three ways to take it home, as tabs.
 * Download a zip, send it to GitHub, or hand it to Claude Code with a prompt ready to paste.
 * Every way needs the template or Pro; the Purchases page is where the files are.
 */
const WAYS = [
  { id: "download", label: "Download", icon: DownloadSimpleIcon },
  { id: "github", label: "GitHub", icon: GithubLogoIcon },
  { id: "claude", label: "Claude Code", icon: TerminalWindowIcon },
] as const;
type Way = (typeof WAYS)[number]["id"];

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="grid grid-cols-[22px_minmax(0,1fr)] items-start gap-3 text-ui leading-[1.55] text-muted">
          <span className="mt-px grid size-[22px] place-items-center rounded-full bg-brand-soft text-[11px] font-semibold tabular-nums text-brand-ink">{i + 1}</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

const linkCls = "font-medium text-fg underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-fg";

export function TakeHome({ slug }: { slug: string }) {
  const t = templateOf(slug)!;
  const id = useId();
  const [way, setWay] = useState<Way>("download");
  const [astro, setAstro] = useState(false);
  // The zip is named for the template (and -astro for Astro); a new repository just for the template.
  const base = t.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const folder = `${base}${astro ? "-astro" : ""}`;
  const pages = astro ? "src/pages" : t.pagesDir;
  const prompt = `I bought the basedraft ${t.name} template and downloaded ${folder}.zip. Unzip it into this folder, run npm install and npm run dev, then walk me through ${pages} so I can start changing the copy. basedraft's notes for agents are at https://basedraft.site/llms.txt.`;
  return (
    <div className="rounded-[24px] bg-paper/65 p-2 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--bd-paper-ink)_8%,transparent),var(--bd-shadow-resting)] backdrop-blur-md">
      <LayoutGroup id={id}>
        <div role="tablist" aria-label="How to take it" className="grid grid-cols-3 gap-0.5 rounded-full bg-paper-ink/[0.05] p-1">
          {WAYS.map((w) => {
            const on = w.id === way;
            return (
              <button key={w.id} type="button" role="tab" aria-selected={on} aria-controls={`${id}-panel`} onClick={() => setWay(w.id)} className={cn("relative flex h-9 items-center justify-center gap-1.5 rounded-full text-ui transition-colors", on ? "text-paper-ink" : "text-paper-muted hover:text-paper-ink")}>
                {on && <motion.span layoutId="way" className="absolute inset-0 rounded-full bg-raised shadow-[var(--bd-shadow-resting),inset_0_0_0_1px_var(--bd-line-subtle)]" transition={SLIDE} />}
                <w.icon weight="duotone" size={15} className="relative" />
                <span className="relative font-medium max-sm:text-meta">{w.label}</span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>
      <motion.div key={way} id={`${id}-panel`} role="tabpanel" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="mt-2 rounded-[18px] bg-surface p-5 text-fg sm:p-6">
        {way === "download" && (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-heading">A zip of the whole project</p>
              <div role="group" aria-label="Framework" className="flex rounded-full bg-surface-2 p-0.5 text-meta">
                {[false, true].map((a) => (
                  <button key={String(a)} type="button" aria-pressed={astro === a} onClick={() => setAstro(a)} className={cn("h-7 rounded-full px-3 font-medium transition-colors", astro === a ? "bg-raised text-fg shadow-[var(--bd-shadow-resting)]" : "text-muted hover:text-fg")}>
                    {a ? "Astro" : "Next.js"}
                  </button>
                ))}
              </div>
            </div>
            <Steps
              items={[
                <>
                  Buy {t.name}, or get{" "}
                  <Link href="/pro" className={linkCls}>
                    Pro
                  </Link>{" "}
                  for every template.
                </>,
                <>
                  On your{" "}
                  <Link href="/purchases" className={linkCls}>
                    Purchases page
                  </Link>
                  , download it in {astro ? "Astro" : "Next.js"}. It comes as {folder}.zip.
                </>,
                "Unzip it, install, and it runs as it is:",
              ]}
            />
            <div className="mt-3 sm:pl-[34px]">
              <CopyCommand command={`unzip ${folder}.zip && cd ${folder} && npm install && npm run dev`} />
            </div>
          </>
        )}
        {way === "github" && (
          <>
            <p className="mb-5 text-heading">A repository made for you</p>
            <Steps
              items={[
                <>
                  Buy {t.name}, or get{" "}
                  <Link href="/pro" className={linkCls}>
                    Pro
                  </Link>
                  .
                </>,
                <>
                  On your{" "}
                  <Link href="/purchases" className={linkCls}>
                    Purchases page
                  </Link>
                  , connect GitHub once, then send it to a new repository, or as a pull request on one you have.
                </>,
                "Clone it and run it:",
              ]}
            />
            <div className="mt-3 sm:pl-[34px]">
              <CopyCommand command={`git clone https://github.com/you/${base}.git && cd ${base} && npm install && npm run dev`} />
            </div>
          </>
        )}
        {way === "claude" && (
          <>
            <p className="mb-5 text-heading">Set it up with Claude Code</p>
            <Steps
              items={[
                <>
                  Download {t.name} from your{" "}
                  <Link href="/purchases" className={linkCls}>
                    Purchases page
                  </Link>
                  .
                </>,
                "In the folder you saved it to, start Claude Code with this prompt:",
              ]}
            />
            <div className="mt-3 flex items-start gap-2 rounded-[14px] bg-surface-2 py-3 pl-4 pr-1.5 sm:ml-[34px]">
              <p className="min-w-0 flex-1 py-1 font-mono text-[12.5px] leading-[1.65]">
                <span className="select-none text-[var(--code-comment)]">$ </span>
                <span className="text-[var(--code-call)]">claude</span> <span className="text-[var(--code-string)]">&quot;{prompt}&quot;</span>
              </p>
              <CopyButton text={`claude "${prompt}"`} label="Copy the command" />
            </div>
            <p className="mt-4 text-meta leading-[1.6] text-muted sm:pl-[34px]">
              Claude Code can also download basedraft UI&apos;s free components, one file each, and read{" "}
              <a href="/llms.txt" className={linkCls}>
                /llms.txt
              </a>{" "}
              for what&apos;s in each template.
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
