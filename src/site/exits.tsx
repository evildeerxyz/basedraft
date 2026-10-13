import { CheckIcon, ColumnsIcon, DiamondsFourIcon, GitPullRequestIcon, HashIcon, RowsIcon, SquareIcon, TextTIcon } from "@phosphor-icons/react/ssr";
import type { IconType } from "./icons";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { WithKeys } from "./keys";

/*
 * The three ways a site leaves basedraft, each shown as the thing you'd actually see at the other
 * end: the layers in Figma, the files on your machine, the pull request on GitHub.
 */

function Card({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <li className="bd-reveal flex flex-col overflow-hidden rounded-[var(--bd-r-sheet)] bg-surface shadow-[0_0_0_1px_var(--bd-line)]">
      <div aria-hidden className="relative grid h-[256px] place-items-center overflow-hidden bg-surface-2 px-6">
        {children}
      </div>
      <div className="border-t border-line p-5">
        <h3 className="text-heading">{title}</h3>
        <p className="mt-1.5 text-body text-muted">
          <WithKeys text={body} />
        </p>
      </div>
    </li>
  );
}

const PANEL = "w-full max-w-[290px] rounded-[6px] bg-surface shadow-[0_1px_2px_rgb(var(--bd-shade)/0.06),0_12px_32px_-16px_rgb(var(--bd-shade)/0.25),0_0_0_1px_rgb(var(--bd-ink)/0.07)]";

/** Figma's layers panel, as a pasted section lands in it. */
function FigmaLayers() {
  const rows: Array<{ depth: number; icon: IconType; name: string; on?: boolean; purple?: boolean }> = [
    { depth: 0, icon: DiamondsFourIcon, name: "Zuno / Hero", on: true, purple: true },
    { depth: 1, icon: RowsIcon, name: "Copy" },
    { depth: 2, icon: TextTIcon, name: "Money that manages itself." },
    { depth: 2, icon: TextTIcon, name: "Zuno is an AI investment manager" },
    { depth: 1, icon: ColumnsIcon, name: "Actions" },
    { depth: 2, icon: SquareIcon, name: "Button" },
    { depth: 1, icon: HashIcon, name: "Chart" },
  ];
  return (
    <div className={PANEL}>
      <div className="flex h-8 items-center border-b border-line px-3 text-[12px] font-semibold">Layers</div>
      <ul className="p-1">
        {rows.map((r) => (
          <li key={r.name} className={cn("flex h-[25px] items-center gap-1.5 rounded-[4px] pr-2 text-[12px]", r.on && "bg-[#9747ff]/10")} style={{ paddingLeft: 8 + r.depth * 14 }}>
            <r.icon size={13} weight={r.purple ? "fill" : "regular"} className={cn("shrink-0", r.purple ? "text-[#9747ff]" : "text-subtle")} />
            <span className={cn("truncate", r.purple && "font-medium text-[#9747ff]")}>{r.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The project as it unzips. */
function Files() {
  const rows: Array<[string, string?]> = [
    ["app/(site)/page.tsx", "your home"],
    ["app/(site)/launch/page.tsx", "your page"],
    ["components/sections/Hero.tsx", "your words"],
    ["package.json"],
  ];
  return (
    <div className={cn(PANEL, "max-w-[310px] font-mono text-[11.5px] leading-none")}>
      <div className="flex h-8 items-center gap-1.5 border-b border-line px-3 font-sans text-[12px] font-semibold">acme-money</div>
      <ul className="space-y-0.5 p-2">
        {rows.map(([f, note], i) => (
          <li key={f} className="flex h-[22px] items-center gap-2 px-1">
            <span className="text-subtle">{i === rows.length - 1 ? "└" : "├"}</span>
            <span className="min-w-0 flex-1 truncate text-fg">{f}</span>
            {note && <span className="shrink-0 font-sans text-[11.5px] text-subtle">{note}</span>}
          </li>
        ))}
      </ul>
      <div className="border-t border-line px-3 py-2.5 text-muted">
        <span className="text-subtle">$</span> npm install &amp;&amp; npm run dev
      </div>
    </div>
  );
}

/** The pull request Studio opens on your repository. */
function PullRequest() {
  return (
    <div className={cn(PANEL, "max-w-[310px] p-3.5")}>
      <div className="flex items-start gap-2">
        <GitPullRequestIcon size={16} weight="bold" className="mt-px shrink-0 text-[#1a7f37] dark:text-[#3fb950]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-snug">Acme Money from basedraft</p>
          <p className="mt-0.5 truncate text-[11.5px] text-muted">#3, basedraft/acme-money into main</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#1a7f37] px-2 py-0.5 text-[11px] font-medium text-white dark:bg-[#238636]">Open</span>
      </div>
      <ul className="mt-3 space-y-1 border-t border-line pt-3 font-mono text-[11.5px]">
        {["app/(site)/page.tsx", "app/(site)/launch/page.tsx", "components/sections/Hero.tsx"].map((f) => (
          <li key={f} className="flex items-center gap-2">
            <CheckIcon size={11} weight="bold" className="shrink-0 text-subtle" />
            <span className="truncate">{f}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex gap-2 text-[11.5px] tabular-nums">
        <span className="text-[#1a7f37] dark:text-[#3fb950]">+48</span>
        <span className="text-[#cf222e] dark:text-[#f85149]">−12</span>
        <span className="text-muted">3 files</span>
      </p>
    </div>
  );
}

export function Exits() {
  return (
    <ul className="grid gap-3 md:grid-cols-3">
      <Card title="Paste it into Figma" body="Auto layout, components and named layers, at desktop, tablet and phone. Copy, then {Cmd V}. No plugin.">
        <FigmaLayers />
      </Card>
      <Card title="Download the code" body="The template's own code, in Next.js or Astro, with your pages and your words written in. Install, and it runs.">
        <Files />
      </Card>
      <Card title="Send it to GitHub" body="A new repository with the whole site, or a pull request on one you already have.">
        <PullRequest />
      </Card>
    </ul>
  );
}

/** After a purchase, the same two ways out, for the Pro page's "How you get your template". */
export function DeliveryCards() {
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      <Card title="Download the site" body="A zip of the whole project, in Next.js or Astro, every page included. Unzip it, install, and it runs.">
        <Files />
      </Card>
      <Card title="Send it to GitHub" body="Connect GitHub once and we make a repository with the site in it, or open a pull request on one you have.">
        <PullRequest />
      </Card>
    </ul>
  );
}
