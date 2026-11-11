import { BookOpenTextIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { claudePromptAll, COMPONENTS, GROUPS, PACKAGE, stylesImport, THEME_URL } from "@/registry";
import { CodeBlock } from "@/site/code";
import { PieceHead, PieceNav, PiecePart, SectionDock } from "@/site/library";
import { LIB_WRAP } from "@/site/library-css";
import { withCard } from "@/site/og";
import { ClaudeCodeButton, CopyLine, InstallLine } from "@/site/ui-library";

export const metadata: Metadata = withCard("components", { title: "Get started with basedraft UI", description: `Install ${PACKAGE}, add its styles once, and use any component. Dark mode, theming, Tailwind, Next.js and Claude Code.` });

/*
 * Getting basedraft UI into a project, start to finish: the install, the styles, a first
 * component, then dark mode, theming, Tailwind, Next.js and Claude Code, each a part of its own
 * with the code to copy. Every component's own page carries the rest.
 */

const USE = `import { Button, Switch } from "${PACKAGE}";

export function Publish() {
  return (
    <div className="flex items-center gap-4">
      <Switch defaultChecked aria-label="Save each change to GitHub" />
      <Button variant="metal">Publish to GitHub</Button>
    </div>
  );
}`;

const LAYOUT = `// app/layout.tsx (or main.tsx in Vite)
${stylesImport}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`;

const DARK = `<!-- Either of these, on <html> or any element above the components -->
<html class="dark">
<html data-theme="dark">`;

const THEME = `/* After the styles, in your own CSS */
:root {
  --bd-accent: oklch(32% 0.09 265);    /* the ink of solid buttons, checks and fills */
  --bd-on-accent: oklch(99% 0 0);      /* text and icons on it */
  --bd-surface: oklch(100% 0 0);       /* cards, fields, menus */
  --bd-fg: oklch(18% 0.01 265);        /* text */
}
.dark {
  --bd-accent: oklch(92% 0.04 265);
  --bd-on-accent: oklch(18% 0 0);
}`;

const TAILWIND = `/* app/globals.css */
@import "tailwindcss";
@import "${PACKAGE}/theme.css";
@source "../node_modules/${PACKAGE}/dist";`;

const SUBPATH = `// One component, without the rest of the index
import { Dialog } from "${PACKAGE}/dialog";`;

/* The tokens worth knowing first, with what each one paints. */
const TOKENS: Array<[string, string]> = [
  ["--bd-fg", "Text, and the ink of icons."],
  ["--bd-muted", "Quieter text: hints, notes, placeholders."],
  ["--bd-surface", "Cards, fields, menus and dialogs."],
  ["--bd-surface-2", "Wells and tracks: what controls sit in."],
  ["--bd-line", "Hairlines and rings."],
  ["--bd-accent", "Solid buttons, checks, filled tracks."],
  ["--bd-on-accent", "Text and icons on the accent."],
  ["--bd-paper", "The paper surface, lit by the glows."],
  ["--bd-ui-metal-edge", "The brushed edge of metal buttons and cards."],
];

/** A short paragraph and its code, the way each part of the setup reads. */
function Block({ children, code, file }: { children: ReactNode; code?: string; file?: string }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-10">
      <div className="text-pretty text-[15px] leading-[1.65] text-muted [&_code]:rounded-[6px] [&_code]:bg-fg/[0.05] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-fg [&_p+p]:mt-3">{children}</div>
      {code ? <CodeBlock code={code} file={file} /> : null}
    </div>
  );
}

export default function GetStarted() {
  const sections = [
    { id: "install", label: "Install" },
    { id: "styles", label: "Styles" },
    { id: "use", label: "Use" },
    { id: "dark", label: "Dark mode" },
    { id: "theme", label: "Theming" },
    { id: "tailwind", label: "Tailwind" },
    { id: "nextjs", label: "Next.js" },
    { id: "claude", label: "Claude Code" },
    { id: "pro", label: "Pro" },
    { id: "all", label: "Every component" },
  ];
  return (
    <main id="main" className={LIB_WRAP}>
      <PieceNav back={{ href: "/components", label: "Components" }} />
      <PieceHead
        kicker={
          <>
            <span className="grid size-8 place-items-center rounded-[10px] bg-surface text-fg shadow-[var(--bd-shadow-resting),inset_0_0_0_1px_var(--bd-line-subtle)]">
              <BookOpenTextIcon size={16} weight="duotone" />
            </span>
            basedraft UI
          </>
        }
        title="Get started"
        lead={`Install ${PACKAGE}, add its styles once, and every component is ready, in light and dark, with or without Tailwind.`}
      />
      <SectionDock label="This page" items={sections} />

      <PiecePart id="install" title="Install">
        <Block>
          <p>One package holds every component. It leans on React 19, and on motion and Phosphor&apos;s icons, which the command adds too if your project doesn&apos;t have them.</p>
        </Block>
        <div className="mt-5 max-w-[760px] lg:ml-[400px]">
          <InstallLine />
        </div>
      </PiecePart>

      <PiecePart id="styles" title="Add the styles once">
        <Block code={LAYOUT} file="layout.tsx">
          <p>
            Import the stylesheet in the file every page shares. It holds the theme in light and dark, the materials (ink, the brushed metal edge, paper), and the styles the components use, in their own cascade layer so your styles win where they meet.
          </p>
          <p>There&apos;s no Tailwind setup to do. If your project runs Tailwind v4 already, see Tailwind below for the smaller route.</p>
        </Block>
      </PiecePart>

      <PiecePart id="use" title="Use a component">
        <Block code={USE} file="publish.tsx">
          <p>Import what you need by name. Each component&apos;s page lists its parts, every prop, focused examples, and what each key does.</p>
          <p>
            <Link href="/components" className="font-medium text-fg underline-offset-4 hover:underline">
              Browse all {COMPONENTS.length} components
            </Link>
          </p>
        </Block>
      </PiecePart>

      <PiecePart id="dark" title="Dark mode">
        <Block code={DARK} file="index.html">
          <p>
            The components follow a <code>dark</code> class or <code>data-theme=&quot;dark&quot;</code> on any element above them, so they work with next-themes and any toggle you already have. Nothing else to wire.
          </p>
        </Block>
      </PiecePart>

      <PiecePart id="theme" title="Make it yours">
        <Block code={THEME} file="globals.css">
          <p>Every color, shadow and material is a CSS variable. Set a few after the styles and every component follows, in light and dark.</p>
        </Block>
        <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TOKENS.map(([t, does]) => (
            <li key={t} className="rounded-[16px] bg-surface p-4 shadow-[inset_0_0_0_1px_var(--bd-line)]">
              <code className="font-mono text-[12.5px] text-[var(--code-key)]">{t}</code>
              <p className="mt-1 text-meta text-muted">{does}</p>
            </li>
          ))}
        </ul>
      </PiecePart>

      <PiecePart id="tailwind" title="Already on Tailwind v4?">
        <Block code={TAILWIND} file="globals.css">
          <p>
            Import <code>theme.css</code> instead of <code>styles.css</code>, and point Tailwind at the package so your own build makes the styles the components use. The output is smaller, and your theme&apos;s variants and layers apply to them too.
          </p>
        </Block>
      </PiecePart>

      <PiecePart id="nextjs" title="Next.js">
        <Block code={SUBPATH} file="page.tsx">
          <p>
            Every component file starts with <code>&quot;use client&quot;</code>, so you can use them straight from server pages and layouts in the App Router. Each one is its own module, so a page only ships the ones it imports, from the index or from a path of its own.
          </p>
        </Block>
      </PiecePart>

      <PiecePart id="claude" title="With Claude Code">
        <Block>
          <p>
            Claude Code can set the library up and choose components for you. The prompt points it at basedraft&apos;s{" "}
            <a href="/llms.txt" className="font-medium text-fg underline-offset-4 hover:underline">
              llms.txt
            </a>
            , which lists every component, its import and its page.
          </p>
          <div className="mt-5">
            <ClaudeCodeButton prompt={claudePromptAll} />
          </div>
        </Block>
      </PiecePart>

      <PiecePart id="own" title="Rather own the code?">
        <Block>
          <p>
            Every component is also one self-contained file. Open a component&apos;s page and choose Copy the code, then add the theme it reads, <a href={THEME_URL} className="font-medium text-fg underline-offset-4 hover:underline">basedraft.css</a>, to your global CSS.
          </p>
        </Block>
        <div className="mt-4 max-w-[760px] lg:ml-[400px]">
          <CopyLine command={`@import "./basedraft.css";`} code />
        </div>
      </PiecePart>

      <PiecePart id="pro" title="Pro components">
        <Block>
          <p>
            Some components are composed pieces of a product: charts, a data table, a kanban board, an AI chat, pricing, a sidebar and more. They come with Pro. Anyone can try them on their pages; with Pro, each one&apos;s page gives you its file to copy into your project, where it reads the same theme.
          </p>
          <p>They&apos;re source files for projects on Tailwind CSS 4: import the package&apos;s <code>theme.css</code> in your global stylesheet, as in Tailwind above.</p>
        </Block>
      </PiecePart>

      <PiecePart id="all" title="Every component">
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {GROUPS.map((g) => (
            <section key={g} aria-label={g}>
              <p className="text-meta font-medium text-subtle">{g}</p>
              <ul className="mt-2 grid">
                {COMPONENTS.filter((c) => c.group === g).map((c) => (
                  <li key={c.name}>
                    <Link href={`/components/${c.name}`} className="group flex items-baseline justify-between gap-4 rounded-[10px] py-1.5 text-ui text-fg">
                      <span className="underline-offset-4 group-hover:underline">{c.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </PiecePart>
    </main>
  );
}
