/*
 * What each component's page says beyond its name: a short example of it in use, and its props.
 * The source itself is read from src/registry/ui by scripts/registry.mjs into sources.ts.
 */

export type Prop = { name: string; type: string; default?: string; note: string };
export type Doc = { usage: string; props: Prop[] };

const rest = (el: string): Prop => ({ name: "...props", type: `${el} props`, note: `Everything a ${el} takes.` });

export const DOCS: Record<string, Doc> = {
  button: {
    usage: `import { GithubLogoIcon } from "@phosphor-icons/react";
import { Button } from "@/components/basedraft/button";

export function Publish({ busy }: { busy: boolean }) {
  return (
    <div className="flex gap-3">
      <Button variant="metal" size="lg" loading={busy}>
        <GithubLogoIcon weight="duotone" /> Publish to GitHub
      </Button>
      <Button variant="outline" size="lg">Preview</Button>
    </div>
  );
}`,
    props: [
      { name: "variant", type: '"ink" | "metal" | "paper" | "glass" | "outline" | "ghost"', default: '"ink"', note: "Metal is for the one action that matters most on a page." },
      { name: "size", type: '"sm" | "md" | "lg" | "icon"', default: '"md"', note: "32, 40 or 48px tall; icon is a 40px circle." },
      { name: "loading", type: "boolean", default: "false", note: "Swaps the label for pulsing dithered dots, keeping the width, and holds off clicks." },
      rest("button"),
    ],
  },
  "hold-button": {
    usage: `import { TrashIcon } from "@phosphor-icons/react";
import { HoldButton } from "@/components/basedraft/hold-button";

export function DeleteDraft({ onDelete }: { onDelete: () => void }) {
  return (
    <HoldButton tone="stop" done="Deleted" icon={<TrashIcon weight="duotone" />} onConfirm={onDelete}>
      Hold to delete this draft
    </HoldButton>
  );
}`,
    props: [
      { name: "onConfirm", type: "() => void", note: "Called once the hold reaches the end." },
      { name: "duration", type: "number", default: "1400", note: "How long to hold, in milliseconds." },
      { name: "tone", type: '"ink" | "stop"', default: '"ink"', note: "The fill: ink, or red for deleting." },
      { name: "done", type: "ReactNode", default: '"Done"', note: "What it says, with a check, once confirmed." },
      { name: "icon", type: "ReactNode", note: "Leads the label." },
    ],
  },
  "copy-button": {
    usage: `import { CopyButton } from "@/components/basedraft/copy-button";

export function RepoLink() {
  return (
    <div className="flex items-center gap-2 rounded-full border py-1 pl-4 pr-1">
      <code className="text-sm">github.com/fieldwork/zuno-site</code>
      <CopyButton value="https://github.com/fieldwork/zuno-site" variant="pill" />
    </div>
  );
}`,
    props: [
      { name: "value", type: "string", note: "The text that goes on the clipboard." },
      { name: "label", type: "string", default: '"Copy"', note: "What the pill says and a screen reader hears." },
      { name: "variant", type: '"icon" | "pill"', default: '"icon"', note: "A round button with just the icon, or a pill that says Copy, then Copied." },
      rest("button"),
    ],
  },
  "command-line": {
    usage: `import { CommandLine } from "@/components/basedraft/command-line";

export function RunIt() {
  return (
    <CommandLine
      label="after unzipping"
      commands={{ npm: "npm install && npm run dev", pnpm: "pnpm install && pnpm dev", bun: "bun install && bun dev" }}
    />
  );
}`,
    props: [
      { name: "command", type: "string", note: "One command, with no switch." },
      { name: "commands", type: "Record<string, string>", note: "A command per package manager, with a switch between them. The first is shown first." },
      { name: "label", type: "string", note: "A word on what it's for, in the terminal's top bar." },
    ],
  },
  input: {
    usage: `import { GithubLogoIcon } from "@phosphor-icons/react";
import { Input } from "@/components/basedraft/input";

export function Repository() {
  return <Input leading={<GithubLogoIcon weight="duotone" />} placeholder="owner/repository" aria-label="Repository" />;
}`,
    props: [
      { name: "leading", type: "ReactNode", note: "Before the text: an icon, usually." },
      { name: "trailing", type: "ReactNode", note: "After the text: a suffix, a hint, a small button." },
      { name: "aria-invalid", type: "boolean", note: "Rims the field in red while what's in it won't do." },
      rest("input"),
    ],
  },
  textarea: {
    usage: `import { Textarea } from "@/components/basedraft/textarea";

export function Brief() {
  return <Textarea maxLength={160} showCount placeholder="What should change?" aria-label="What to change" />;
}`,
    props: [
      { name: "maxLength", type: "number", note: "The limit, which the count measures against." },
      { name: "showCount", type: "boolean", default: "false", note: "Shows how much is typed against the limit, on a ring that turns amber near it." },
      rest("textarea"),
    ],
  },
  switch: {
    usage: `import { Switch } from "@/components/basedraft/switch";

export function Snap() {
  return (
    <label className="flex items-center justify-between gap-4 text-sm">
      Snap to sections
      <Switch defaultChecked onCheckedChange={(on) => console.log(on)} />
    </label>
  );
}`,
    props: [
      { name: "checked / defaultChecked", type: "boolean", default: "false", note: "Controlled, or where it starts." },
      { name: "onCheckedChange", type: "(checked: boolean) => void", note: "Called each time it flips." },
      { name: "size", type: '"sm" | "md"', default: '"md"', note: "20 or 26px tall." },
      rest("button"),
    ],
  },
  segmented: {
    usage: `import { DeviceMobileIcon, MonitorIcon } from "@phosphor-icons/react";
import { Segmented } from "@/components/basedraft/segmented";

export function Width() {
  return (
    <Segmented
      label="Preview width"
      options={[
        { value: "desktop", label: "Desktop", icon: <MonitorIcon weight="duotone" /> },
        { value: "phone", label: "Phone", icon: <DeviceMobileIcon weight="duotone" /> },
      ]}
    />
  );
}`,
    props: [
      { name: "options", type: "{ value: string; label: ReactNode; icon?: ReactNode }[]", note: "The choices, in order." },
      { name: "value / defaultValue", type: "string", note: "Controlled, or where it starts. The first option by default." },
      { name: "onValueChange", type: "(value: string) => void", note: "Called when the choice changes." },
      { name: "label", type: "string", note: "Names the group for screen readers." },
      { name: "size", type: '"sm" | "md"', default: '"md"', note: "28 or 36px tall inside its track." },
    ],
  },
  slider: {
    usage: `import { Slider } from "@/components/basedraft/slider";

export function Spacing() {
  return (
    <Slider
      label="Space between sections"
      min={0}
      max={160}
      step={8}
      defaultValue={96}
      format={(v) => \`\${v} px\`}
      ticks={[0, 40, 80, 120, 160]}
    />
  );
}`,
    props: [
      { name: "min / max / step", type: "number", default: "0 / 100 / 1", note: "The range and how it moves." },
      { name: "value / defaultValue", type: "number", note: "Controlled, or where it starts." },
      { name: "onValueChange", type: "(value: number) => void", note: "Called as it moves." },
      { name: "label", type: "string", note: "Its name, shown above it with the value." },
      { name: "format", type: "(value: number) => string", default: "String", note: "How a value reads, above the track and in the bubble." },
      { name: "ticks", type: "number[]", note: "Values to mark under the track, each with its number." },
    ],
  },
  tabs: {
    usage: `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/basedraft/tabs";

export function Export() {
  return (
    <Tabs defaultValue="figma">
      <TabsList>
        <TabsTrigger value="figma">Figma</TabsTrigger>
        <TabsTrigger value="code">Code</TabsTrigger>
      </TabsList>
      <TabsContent value="figma">Pasted as auto layout, every layer named.</TabsContent>
      <TabsContent value="code">Next.js or Astro, ready to run.</TabsContent>
    </Tabs>
  );
}`,
    props: [
      { name: "value / defaultValue", type: "string", note: "On Tabs: the selected tab, controlled, or where it starts." },
      { name: "onValueChange", type: "(value: string) => void", note: "On Tabs: called when another tab is picked." },
      { name: "value", type: "string", note: "On TabsTrigger and TabsContent: which tab it belongs to." },
    ],
  },
  accordion: {
    usage: `import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/basedraft/accordion";

export function Questions() {
  return (
    <Accordion defaultValue={["client"]}>
      <AccordionItem value="client">
        <AccordionTrigger>Can I use it for a client?</AccordionTrigger>
        <AccordionContent>With a Team license, yes.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="updates">
        <AccordionTrigger>Do updates cost extra?</AccordionTrigger>
        <AccordionContent>No. Each one lands on your Purchases page.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}`,
    props: [
      { name: "type", type: '"single" | "multiple"', default: '"single"', note: "One answer open at a time, or several." },
      { name: "defaultValue", type: "string[]", default: "[]", note: "The items open to begin with." },
      { name: "numbered", type: "boolean", default: "true", note: "A number before each question." },
      { name: "value", type: "string", note: "On AccordionItem: names it, for defaultValue." },
    ],
  },
  badge: {
    usage: `import { Badge } from "@/components/basedraft/badge";

export function Status() {
  return (
    <div className="flex gap-2">
      <Badge variant="outline" dot="ok" live>Live</Badge>
      <Badge variant="secondary" dot="idle">Draft</Badge>
      <Badge>Pro</Badge>
    </div>
  );
}`,
    props: [
      { name: "variant", type: '"default" | "secondary" | "outline" | "paper" | "metal"', default: '"default"', note: "Ink by default; the rest get quieter, or richer." },
      { name: "dot", type: '"ok" | "wait" | "stop" | "idle"', note: "A status dot before the text." },
      { name: "live", type: "boolean", default: "false", note: "The dot pulses, for something happening now." },
      rest("span"),
    ],
  },
  card: {
    usage: `import { Button } from "@/components/basedraft/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/basedraft/card";

export function Template() {
  return (
    <Card edge className="max-w-[300px]">
      <CardHeader>
        <CardTitle>Zuno</CardTitle>
        <CardDescription>Fintech, 25 pages</CardDescription>
      </CardHeader>
      <CardContent>A dark, calm investing site.</CardContent>
      <CardFooter>
        <Button size="sm">Open in Studio</Button>
      </CardFooter>
    </Card>
  );
}`,
    props: [
      { name: "variant", type: '"surface" | "paper"', default: '"surface"', note: "A plain face, or paper: near white, with fine dots." },
      { name: "edge", type: "boolean", default: "false", note: "A brushed-metal edge, for the card that matters most." },
      rest("div"),
    ],
  },
  avatar: {
    usage: `import { Avatar, AvatarGroup } from "@/components/basedraft/avatar";

export function Seats() {
  return (
    <div className="flex items-center gap-4">
      <Avatar name="Maya Okafor" status="online" />
      <AvatarGroup people={[{ name: "Jonah Park" }, { name: "Lea Moreau" }, { name: "Sami Ito" }]} max={2} />
    </div>
  );
}`,
    props: [
      { name: "name", type: "string", note: "Gives the initials, their tint, and the label screen readers hear." },
      { name: "src", type: "string", note: "A picture. Initials show if there's none or it fails to load." },
      { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', note: "28, 36 or 48px." },
      { name: "status", type: '"online" | "busy" | "away"', note: "A dot in the corner." },
      { name: "people / max", type: "{ name; src?; status? }[] / number", default: "max 4", note: "On AvatarGroup: everyone, and how many show before a count." },
    ],
  },
  kbd: {
    usage: `import { Kbd, KbdGroup } from "@/components/basedraft/kbd";

export function SearchHint() {
  return (
    <p className="flex items-center gap-2 text-sm">
      Search
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </p>
  );
}`,
    props: [
      { name: "children", type: "string", note: "The key as a Mac shows it: ⌘, ⇧, ⌥, ⌃, ↵, Esc, or a letter." },
      { name: "listen", type: "boolean", default: "true", note: "Goes down when that key is pressed on the keyboard." },
      { name: "size", type: '"sm" | "md"', default: '"md"', note: "20 or 28px tall." },
    ],
  },
  tooltip: {
    usage: `import { ExportIcon } from "@phosphor-icons/react";
import { Tooltip } from "@/components/basedraft/tooltip";

export function ExportTool() {
  return (
    <Tooltip content="Export" keys={["⌘", "E"]}>
      <button type="button" aria-label="Export">
        <ExportIcon weight="duotone" />
      </button>
    </Tooltip>
  );
}`,
    props: [
      { name: "content", type: "ReactNode", note: "What the bubble says." },
      { name: "keys", type: "string[]", note: "The action's shortcut, a small cap each." },
      { name: "side", type: '"top" | "bottom"', default: '"top"', note: "Above what it describes, or below." },
      { name: "delay", type: "number", default: "160", note: "How long to wait on hover before it shows, in milliseconds." },
    ],
  },
  meter: {
    usage: `import { Meter } from "@/components/basedraft/meter";

export function Push({ sent, total }: { sent: number; total: number }) {
  return <Meter value={sent} max={total} label="Pushing to GitHub" valueLabel={\`\${sent} of \${total} files\`} />;
}`,
    props: [
      { name: "value / max", type: "number", default: "max 100", note: "How far along, out of what." },
      { name: "label", type: "string", note: "What it measures, above it." },
      { name: "valueLabel", type: "string", note: "The value as it reads. A percent by default." },
      { name: "cols / rows", type: "number", default: "40 / 4", note: "How many dots across and down." },
    ],
  },
};
