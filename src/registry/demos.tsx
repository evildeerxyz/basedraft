"use client";

import {
  ArrowCounterClockwiseIcon,
  CheckIcon,
  CodeIcon,
  CursorIcon,
  DeviceMobileIcon,
  DeviceTabletIcon,
  ExportIcon,
  FigmaLogoIcon,
  GitBranchIcon,
  GithubLogoIcon,
  GlobeIcon,
  ImageSquareIcon,
  MagnetIcon,
  MonitorIcon,
  TextTIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Avatar, AvatarGroup } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { CommandLine } from "./ui/command-line";
import { CopyButton } from "./ui/copy-button";
import { HoldButton } from "./ui/hold-button";
import { Input } from "./ui/input";
import { Kbd, KbdGroup } from "./ui/kbd";
import { Meter } from "./ui/meter";
import { Segmented } from "./ui/segmented";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { Tooltip } from "./ui/tooltip";
import { ClaudeMark } from "@/site/claude-mark";

/*
 * Each component in a small moment from basedraft's world: publishing a site to GitHub, a Studio
 * toolbar, seats on a Team license. Live, so the switch flips and the hold fills. They fit a
 * gallery tile, a large stage and a phone alike.
 */

const PEOPLE = [{ name: "Maya Okafor" }, { name: "Jonah Park" }, { name: "Lea Moreau" }, { name: "Sami Ito" }, { name: "Ana Ruiz" }, { name: "Ben Adeyemi" }];
const hint = "text-xs text-[var(--bd-subtle)]";

/** Publish: the dither runs while it pushes, then it says so, then it rests. */
function ButtonDemo() {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState(state === "busy" ? "done" : "idle"), state === "busy" ? 1800 : 2000);
    return () => clearTimeout(t);
  }, [state]);
  return (
    <div className="flex max-w-full flex-wrap items-center justify-center gap-3">
      <Button variant="metal" size="lg" loading={state === "busy"} onClick={() => setState("busy")}>
        {state === "done" ? <CheckIcon weight="bold" /> : <GithubLogoIcon weight="duotone" />}
        {state === "done" ? "Published" : "Publish to GitHub"}
      </Button>
      <Button variant="outline" size="lg">
        Preview
      </Button>
    </div>
  );
}

function HoldDemo() {
  return (
    <div className="grid justify-items-center gap-3">
      <HoldButton tone="stop" done="Deleted" icon={<TrashIcon weight="duotone" />}>
        Hold to delete this draft
      </HoldButton>
      <p className={hint}>Let go early to keep it.</p>
    </div>
  );
}

function CopyDemo() {
  return (
    <div className="flex w-full max-w-[330px] items-center gap-2.5 rounded-full bg-[var(--bd-surface)] py-1 pl-4 pr-1 shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]">
      <GithubLogoIcon size={16} weight="duotone" className="shrink-0 text-[var(--bd-subtle)]" />
      <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-[var(--bd-muted)]">github.com/fieldwork/zuno-site</span>
      <CopyButton value="https://github.com/fieldwork/zuno-site" label="Copy" variant="pill" />
    </div>
  );
}

function InputDemo() {
  return (
    <div className="grid w-full max-w-[330px] gap-2.5">
      <Input leading={<GithubLogoIcon weight="duotone" />} defaultValue="fieldwork/zuno-site" aria-label="Repository" />
      <Input leading={<GlobeIcon weight="duotone" />} placeholder="Custom domain" trailing="Optional" aria-label="Custom domain" />
    </div>
  );
}

function TextareaDemo() {
  return (
    <div className="grid w-full max-w-[350px] gap-2">
      <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--bd-muted)]">
        <ClaudeMark size={13} /> Tell Claude Code what to change
      </p>
      <Textarea maxLength={160} showCount defaultValue="Make the hero about tax-loss harvesting, and keep the headline to two lines." aria-label="What to change" />
    </div>
  );
}

/** Studio's settings, a switch each. */
function SwitchDemo() {
  const rows: Array<[ReactNode, string, boolean]> = [
    [<MagnetIcon key="i" size={16} weight="duotone" />, "Snap to sections", true],
    [<GitBranchIcon key="i" size={16} weight="duotone" />, "Save each change to GitHub", false],
  ];
  return (
    <div className="w-full max-w-[330px] divide-y divide-[var(--bd-line-subtle)] rounded-[20px] bg-[var(--bd-surface)] px-4 shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]">
      {rows.map(([icon, label, on]) => (
        <label key={label} className="flex cursor-pointer items-center justify-between gap-4 py-3.5 text-sm text-[var(--bd-fg)]">
          <span className="flex items-center gap-2.5">
            <span className="text-[var(--bd-subtle)]">{icon}</span>
            {label}
          </span>
          <Switch defaultChecked={on} />
        </label>
      ))}
    </div>
  );
}

const WIDTHS: Record<string, string> = { desktop: "1440", tablet: "820", phone: "390" };

function SegmentedDemo() {
  const [w, setW] = useState("desktop");
  return (
    <div className="grid justify-items-center gap-3">
      <Segmented
        label="Preview width"
        value={w}
        onValueChange={setW}
        options={[
          { value: "desktop", label: "Desktop", icon: <MonitorIcon weight="duotone" /> },
          { value: "tablet", label: "Tablet", icon: <DeviceTabletIcon weight="duotone" /> },
          { value: "phone", label: "Phone", icon: <DeviceMobileIcon weight="duotone" /> },
        ]}
      />
      <p className="font-mono text-xs tabular-nums text-[var(--bd-subtle)]">{WIDTHS[w]} px wide</p>
    </div>
  );
}

function SliderDemo() {
  return <Slider label="Space between sections" min={0} max={160} step={8} defaultValue={96} format={(v) => `${v} px`} ticks={[0, 40, 80, 120, 160]} className="max-w-[330px]" />;
}

/** Where a page can go from Studio, a tab each. */
function TabsDemo() {
  const panel = "flex items-center gap-3 rounded-[16px] bg-[var(--bd-surface)] p-3 pr-4 text-left text-sm text-[var(--bd-muted)] shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]";
  const tile = "grid size-9 shrink-0 place-items-center rounded-[10px] bg-[var(--bd-surface-2)] text-[var(--bd-fg)] shadow-[var(--bd-ui-well)]";
  return (
    <Tabs defaultValue="figma" className="w-full max-w-[340px] items-center">
      <TabsList>
        <TabsTrigger value="figma">Figma</TabsTrigger>
        <TabsTrigger value="code">Code</TabsTrigger>
        <TabsTrigger value="github">GitHub</TabsTrigger>
      </TabsList>
      <TabsContent value="figma" className={panel}>
        <span className={tile}>
          <FigmaLogoIcon size={18} weight="duotone" />
        </span>
        Pasted as auto layout, every layer named.
      </TabsContent>
      <TabsContent value="code" className={panel}>
        <span className={tile}>
          <CodeIcon size={18} weight="duotone" />
        </span>
        Next.js or Astro, ready for npm run dev.
      </TabsContent>
      <TabsContent value="github" className={panel}>
        <span className={tile}>
          <GithubLogoIcon size={18} weight="duotone" />
        </span>
        A new repository, or a pull request to yours.
      </TabsContent>
    </Tabs>
  );
}

function AccordionDemo() {
  return (
    <Accordion defaultValue={["download"]} className="w-full max-w-[380px]">
      <AccordionItem value="download">
        <AccordionTrigger>What&apos;s in the download?</AccordionTrigger>
        <AccordionContent>The whole site in Next.js or Astro, every page wired and written.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="client">
        <AccordionTrigger>Can I use it for a client?</AccordionTrigger>
        <AccordionContent>With a Team license, yes. Pro covers what you make for yourself.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="updates">
        <AccordionTrigger>Do updates cost extra?</AccordionTrigger>
        <AccordionContent>No. Each one lands on your Purchases page.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function BadgeDemo() {
  return (
    <div className="flex max-w-[330px] flex-wrap items-center justify-center gap-2">
      <Badge variant="outline" dot="ok" live>
        Live
      </Badge>
      <Badge variant="outline" dot="wait">
        Deploying
      </Badge>
      <Badge variant="secondary" dot="idle">
        Draft
      </Badge>
      <Badge>Pro</Badge>
      <Badge variant="metal">Team</Badge>
      <Badge variant="paper">53 sections</Badge>
    </div>
  );
}

/** A template, on a card inside a metal edge. */
function CardDemo() {
  return (
    <Card edge className="w-full max-w-[300px]">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-[#c8ff3e] font-mono text-[17px] font-bold text-black shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)]">
            Z
          </span>
          <span className="min-w-0 flex-1">
            <CardTitle>Zuno</CardTitle>
            <CardDescription>Fintech, 25 pages</CardDescription>
          </span>
          <Badge>Pro</Badge>
        </div>
      </CardHeader>
      <CardContent className="text-[13px] leading-relaxed text-[var(--bd-muted)]">A dark, calm investing site with a dithered portfolio chart.</CardContent>
      <CardFooter className="justify-between">
        <span className="text-sm font-medium tabular-nums">$79</span>
        <Button size="sm">Open in Studio</Button>
      </CardFooter>
    </Card>
  );
}

/** Who's on a Team license, and who's editing right now. */
function AvatarDemo() {
  return (
    <div className="grid justify-items-center gap-4">
      <div className="flex items-center gap-3 rounded-full bg-[var(--bd-surface)] py-1.5 pl-1.5 pr-5 shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)]">
        <Avatar name="Maya Okafor" status="online" />
        <span className="text-left">
          <span className="block text-sm font-medium text-[var(--bd-fg)]">Maya Okafor</span>
          <span className="block text-xs text-[var(--bd-subtle)]">Editing the hero</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <AvatarGroup people={PEOPLE} max={4} />
        <span className={hint}>6 of 10 seats</span>
      </div>
    </div>
  );
}

function KbdDemo() {
  const rows: Array<[string, string[]]> = [
    ["Search", ["⌘", "K"]],
    ["Undo", ["⌘", "Z"]],
    ["Preview", ["P"]],
  ];
  return (
    <div className="grid w-full max-w-[280px] gap-3">
      {rows.map(([label, keys]) => (
        <div key={label} className="flex items-center justify-between gap-4 text-sm text-[var(--bd-muted)]">
          {label}
          <KbdGroup>
            {keys.map((k) => (
              <Kbd key={k}>{k}</Kbd>
            ))}
          </KbdGroup>
        </div>
      ))}
      <p className={`${hint} pt-1 text-center`}>Press them on your keyboard.</p>
    </div>
  );
}

/** Studio's toolbar, its tools named on hover with their keys. */
function TooltipDemo() {
  const tools: Array<[ComponentType<{ size?: number; weight?: "duotone" }>, string, string[]]> = [
    [CursorIcon, "Select", ["V"]],
    [TextTIcon, "Text", ["T"]],
    [ImageSquareIcon, "Image", ["I"]],
    [ExportIcon, "Export", ["⌘", "E"]],
  ];
  return (
    <div className="grid justify-items-center gap-4">
      <div className="flex items-center gap-0.5 rounded-full bg-[var(--bd-surface)] p-1 shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-raised)]">
        {tools.map(([I, label, keys]) => (
          <Tooltip key={label} content={label} keys={keys}>
            <button type="button" aria-label={label} className="grid size-10 place-items-center rounded-full text-[var(--bd-muted)] transition-colors hover:bg-[var(--bd-surface-2)] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]">
              <I size={18} weight="duotone" />
            </button>
          </Tooltip>
        ))}
      </div>
      <p className={hint}>Point at a tool, or tab to it.</p>
    </div>
  );
}

const TOTAL = 61;

/** A push to GitHub, a few files at a time. Again starts a fresh one. */
function Push({ onAgain }: { onAgain: () => void }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((x) => Math.min(TOTAL, x + 1 + Math.floor(Math.random() * 4))), 140);
    return () => clearInterval(t);
  }, []);
  const done = n >= TOTAL;
  return (
    <div className="w-full max-w-[340px]">
      <Meter value={n} max={TOTAL} label={done ? "Pushed to GitHub" : "Pushing to GitHub"} valueLabel={`${n} of ${TOTAL} files`} />
      <div className="mt-3.5 flex items-center justify-between gap-3">
        <Badge variant="outline" dot={done ? "ok" : "wait"} live={!done}>
          fieldwork/zuno-site
        </Badge>
        <Button variant="ghost" size="sm" onClick={onAgain}>
          <ArrowCounterClockwiseIcon weight="regular" /> Again
        </Button>
      </div>
    </div>
  );
}

function MeterDemo() {
  const [run, setRun] = useState(0);
  return <Push key={run} onAgain={() => setRun((r) => r + 1)} />;
}

export const DEMOS: Record<string, ComponentType> = {
  button: ButtonDemo,
  "hold-button": HoldDemo,
  "copy-button": CopyDemo,
  "command-line": () => <CommandLine label="zuno, unzipped" className="w-full max-w-[360px]" commands={{ npm: "npm install && npm run dev", pnpm: "pnpm install && pnpm dev", bun: "bun install && bun dev" }} />,
  input: InputDemo,
  textarea: TextareaDemo,
  switch: SwitchDemo,
  segmented: SegmentedDemo,
  slider: SliderDemo,
  tabs: TabsDemo,
  accordion: AccordionDemo,
  badge: BadgeDemo,
  card: CardDemo,
  avatar: AvatarDemo,
  kbd: KbdDemo,
  tooltip: TooltipDemo,
  meter: MeterDemo,
};
