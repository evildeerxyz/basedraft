"use client";

import { BrowserIcon, SquaresFourIcon, TagIcon, TextHOneIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { Resizable, ResizablePanel } from "../../ui/resizable";

/** A few lines of a hero's code, colored the way an editor colors them. */
function Code() {
  const line = "block whitespace-pre";
  return (
    <div className="h-full bg-[var(--bd-surface)] p-4 font-mono text-[11.5px] leading-[1.75] text-[var(--bd-fg)]">
      <p className="mb-2 font-sans text-[11px] font-medium text-[var(--bd-subtle)]">hero.tsx</p>
      <code className={line}>
        <span className="text-[var(--bd-muted)]">{"<"}</span>Hero
      </code>
      <code className={line}>
        {"  "}title=<span className="text-[var(--bd-muted)]">&quot;Money that manages itself.&quot;</span>
      </code>
      <code className={line}>
        {"  "}action=<span className="text-[var(--bd-muted)]">&quot;Get started&quot;</span>
      </code>
      <code className={line}>
        <span className="text-[var(--bd-muted)]">{"/>"}</span>
      </code>
    </div>
  );
}

/** The same hero, drawn small, as the page shows it. */
function Preview() {
  return (
    <div className="grid h-full place-items-center bg-[color-mix(in_oklab,var(--bd-surface),var(--bd-fg)_3%)] p-4">
      <div className="w-full max-w-[260px] rounded-[12px] bg-[oklch(16%_0_0)] p-4 text-white shadow-[var(--bd-shadow-raised)]">
        <p className="text-[15px] font-semibold leading-tight tracking-[-0.02em]">Money that manages itself.</p>
        <p className="mt-1.5 text-[10.5px] leading-snug text-white/55">An AI investment manager that builds and rebalances your portfolio.</p>
        <span className="mt-3 inline-flex h-6 items-center rounded-full bg-[oklch(90%_0.2_125)] px-2.5 text-[10px] font-semibold text-black">Get started</span>
      </div>
    </div>
  );
}

export function Demo() {
  return (
    <div className="h-[230px] w-full max-w-[560px]">
      <Resizable defaultSize={46} snap={[50]} label="Resize the code and the preview">
        <ResizablePanel>
          <Code />
        </ResizablePanel>
        <ResizablePanel>
          <Preview />
        </ResizablePanel>
      </Resizable>
    </div>
  );
}

function Snaps() {
  const [size, setSize] = useState(50);
  return (
    <div className="grid w-full max-w-[640px] gap-2.5">
      <div className="h-[220px]">
        <Resizable defaultSize={50} snap={[33, 50, 67]} onSizeChange={setSize} label="Resize the code and the preview">
          <ResizablePanel>
            <Code />
          </ResizablePanel>
          <ResizablePanel>
            <Preview />
          </ResizablePanel>
        </Resizable>
      </div>
      <p className="px-1 text-[12px] tabular-nums text-[var(--bd-subtle)]">Code takes {Math.round(size)}%. It catches at a third, half and two thirds. Double-click the line to go back.</p>
    </div>
  );
}

function Vertical() {
  return (
    <div className="h-[300px] w-full max-w-[520px]">
      <Resizable direction="vertical" defaultSize={60} min={25} max={85} label="Resize the code and the terminal">
        <ResizablePanel>
          <Code />
        </ResizablePanel>
        <ResizablePanel>
          <div className="h-full bg-[oklch(17%_0_0)] p-4 font-mono text-[11.5px] leading-[1.75] text-white/80">
            <p>
              <span className="text-white/40">$ </span>npm run dev
            </p>
            <p className="text-white/50">ready on http://localhost:3000</p>
          </div>
        </ResizablePanel>
      </Resizable>
    </div>
  );
}

/* Studio's outline: the page's sections down the side, folded away when there isn't room for it. */
const OUTLINE = [
  { name: "Navigation", icon: BrowserIcon },
  { name: "Hero", icon: TextHOneIcon },
  { name: "Features", icon: SquaresFourIcon },
  { name: "Pricing", icon: TagIcon },
];

function Collapse() {
  return (
    <div className="grid w-full max-w-[600px] gap-2.5">
      <div className="h-[230px]">
        <Resizable defaultSize={34} min={24} max={50} collapsible="start" label="Resize the outline">
          <ResizablePanel>
            <ul className="grid gap-0.5 p-2">
              {OUTLINE.map((o) => (
                <li key={o.name} className="flex items-center gap-2.5 whitespace-nowrap rounded-[10px] px-2.5 py-2 text-[13px] hover:bg-[color-mix(in_oklab,var(--bd-surface),var(--bd-fg)_4%)]">
                  <o.icon size={15} weight="duotone" className="shrink-0 text-[var(--bd-subtle)]" />
                  {o.name}
                </li>
              ))}
            </ul>
          </ResizablePanel>
          <ResizablePanel>
            <Preview />
          </ResizablePanel>
        </Resizable>
      </div>
      <p className="px-1 text-[12px] text-[var(--bd-subtle)]">Drag the outline well past its least and it folds away; Enter on the line folds it and brings it back.</p>
    </div>
  );
}

function Controlled() {
  const [size, setSize] = useState(50);
  return (
    <div className="grid w-full max-w-[560px] gap-3">
      <div className="flex gap-1.5">
        {[30, 50, 70].map((s) => (
          <button key={s} type="button" onClick={() => setSize(s)} className="h-8 rounded-full bg-[var(--bd-surface)] px-3.5 text-[13px] font-medium tabular-nums shadow-[0_0_0_1px_var(--bd-line)] transition-[scale] active:scale-[0.96]">
            {s}%
          </button>
        ))}
      </div>
      <div className="h-[200px]">
        <Resizable size={size} onSizeChange={setSize} label="Resize the code and the preview">
          <ResizablePanel>
            <Code />
          </ResizablePanel>
          <ResizablePanel>
            <Preview />
          </ResizablePanel>
        </Resizable>
      </div>
    </div>
  );
}

export const examples: Record<string, ComponentType> = {
  snaps: Snaps,
  vertical: Vertical,
  collapse: Collapse,
  controlled: Controlled,
};
