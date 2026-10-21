import { CheckIcon, ColumnsIcon, DiamondsFourIcon, GitPullRequestIcon, HashIcon, RowsIcon, SquareIcon, TextTIcon } from "@phosphor-icons/react/ssr";
import type { IconType } from "./icons";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { WithKeys } from "./keys";
import { Scene } from "./showcase";
import type { Glow } from "./stage";

/*
 * The ways a site leaves basedraft, each shown as the thing you'd actually see at the other end:
 * the layers in Figma, the files on your machine, the pull request on GitHub. The home page shows
 * them one at a time (export-scene.tsx); the Pro page shows the two a purchase arrives by.
 */

/** One way out: what you'd see at the other end, set on a scene in the hero's light, and a line on it underneath. */
function Card({ title, body, glow, children }: { title: string; body: string; glow: Glow; children: ReactNode }) {
  return (
    <li className="bd-reveal flex flex-col">
      <Scene glow={glow} className="grid h-[320px] place-items-center px-6 sm:h-[360px]">
        <div aria-hidden className="contents">
          {children}
        </div>
      </Scene>
      <div className="mt-4 px-1">
        <h3 className="text-[16px] font-medium leading-[1.1] tracking-[-0.03em]">{title}</h3>
        <p className="mt-2 max-w-[460px] text-ui leading-[1.65] text-muted">
          <WithKeys text={body} />
        </p>
      </div>
    </li>
  );
}

const PANEL = "w-full max-w-[290px] overflow-hidden rounded-[var(--bd-r-inset)] bg-surface shadow-[var(--bd-shadow-raised),0_0_0_1px_var(--bd-line)]";

/** Figma's layers panel, as a pasted section lands in it. */
export function FigmaLayers() {
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
      <div className="flex h-10 items-center border-b border-line px-4 text-[12px] font-semibold">Layers</div>
      <ul className="p-1">
        {rows.map((r) => (
          <li key={r.name} className={cn("flex h-[25px] items-center gap-1.5 rounded-[8px] pr-2 text-[12px]", r.on && "bg-[#9747ff]/10")} style={{ paddingLeft: 8 + r.depth * 14 }}>
            <r.icon size={13} weight="duotone" className={cn("shrink-0", r.purple ? "text-[#9747ff]" : "text-subtle")} />
            <span className={cn("truncate", r.purple && "font-medium text-[#9747ff]")}>{r.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The project as it unzips. */
export function Files() {
  const rows: Array<[string, string?]> = [
    ["app/(site)/page.tsx", "your home"],
    ["app/(site)/launch/page.tsx", "your page"],
    ["components/sections/Hero.tsx", "your words"],
    ["package.json"],
  ];
  return (
    <div className={cn(PANEL, "max-w-[310px] font-mono text-[11.5px] leading-none")}>
      <div className="flex h-10 items-center gap-1.5 border-b border-line px-4 font-sans text-[12px] font-semibold">acme-money</div>
      <ul className="space-y-0.5 p-2">
        {rows.map(([f, note], i) => (
          <li key={f} className="flex h-[22px] items-center gap-2 px-1">
            <span className="text-subtle">{i === rows.length - 1 ? "└" : "├"}</span>
            <span className="min-w-0 flex-1 truncate text-fg">{f}</span>
            {note && <span className="shrink-0 font-sans text-[11.5px] text-subtle">{note}</span>}
          </li>
        ))}
      </ul>
      <div className="border-t border-line px-4 py-3 text-muted">
        <span className="text-subtle">$</span> npm install &amp;&amp; npm run dev
      </div>
    </div>
  );
}

/** The pull request Studio opens on your repository. */
export function PullRequest() {
  return (
    <div className={cn(PANEL, "max-w-[310px] p-4")}>
      <div className="flex items-start gap-2">
        <GitPullRequestIcon size={16} weight="duotone" className="mt-px shrink-0 text-[#1a7f37] dark:text-[#3fb950]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-snug">Acme Money from basedraft</p>
          <p className="mt-0.5 truncate text-[11.5px] text-muted">#3, basedraft/acme-money into main</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#1a7f37] px-2 py-0.5 text-[11px] font-medium text-white dark:bg-[#238636]">Open</span>
      </div>
      <ul className="mt-3 space-y-1 border-t border-line pt-3 font-mono text-[11.5px]">
        {["app/(site)/page.tsx", "app/(site)/launch/page.tsx", "components/sections/Hero.tsx"].map((f) => (
          <li key={f} className="flex items-center gap-2">
            <CheckIcon size={11} weight="duotone" className="shrink-0 text-subtle" />
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

/** After a purchase, the same two ways out, for the Pro page's "How you get your template". */
export function DeliveryCards() {
  return (
    <ul className="grid gap-x-6 gap-y-12 md:grid-cols-2">
      <Card title="Download the site" glow="c" body="A zip of the whole project, in Next.js or Astro, every page included. Unzip it, install, and it runs.">
        <Files />
      </Card>
      <Card title="Send it to GitHub" glow="d" body="Connect GitHub once and we make a repository with the site in it, or open a pull request on one you have.">
        <PullRequest />
      </Card>
    </ul>
  );
}
