import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Gauge } from "@basedraft/ui";

export function BuildMinutes({ used }: { used: number }) {
  return (
    <Gauge
      value={used}
      max={1000}
      label="Build minutes"
      zones={[
        { from: 0, tone: "ok" },
        { from: 700, tone: "warn" },
        { from: 900, tone: "stop" },
      ]}
    />
  );
}`,
  use: [
    "For one reading against a known limit, where how close it is matters: build minutes, CPU, storage, a score.",
    "Give it zones when part of the range means trouble, so the dots turn amber, then red, as the value gets there.",
    "Put a few side by side for a machine's vitals; size scales the whole dial and its type.",
  ],
  avoid: [
    "For progress through a task: use Meter, which reads left to right.",
    "For a number with its change over time: use Stat.",
    "For many readings to compare: use Bar list, or a chart.",
  ],
  parts: [
    {
      name: "Gauge",
      note: "A dial of dots, with the number at its center.",
      props: [
        { name: "value", type: "number", note: "The reading.", required: true },
        { name: "min", type: "number", default: "0", note: "Where the dial starts." },
        { name: "max", type: "number", default: "100", note: "Where it ends." },
        { name: "label", type: "string", note: "What it measures, under the number, and its name for screen readers." },
        { name: "format", type: "(value: number) => string", default: "rounded", note: "The number as it reads, at the center and at both ends." },
        { name: "unit", type: "string", note: "Small, after the number: %, ms, GB." },
        { name: "zones", type: "{ from: number; tone: \"ok\" | \"warn\" | \"stop\" }[]", note: "From each from up, the dots take its tone. Ink when there are none." },
        { name: "size", type: "number", default: "220", note: "How wide it is, in pixels. The type scales with it." },
        { name: "ticks", type: "number", default: "42", note: "How many dots round the dial." },
        { name: "rings", type: "number", default: "4", note: "How many dots deep." },
        { name: "dither", type: "boolean", default: "true", note: "The edge at the value dissolves through an ordered dither; false cuts it clean." },
        { name: "...props", type: "div props", note: "Everything a div takes." },
      ],
    },
  ],
  examples: [
    {
      id: "basic",
      title: "In ink",
      note: "With no zones, the dots fill in ink, the edge dithered.",
      code: `<Gauge value={64} unit="%" label="Storage" />`,
    },
    {
      id: "zones",
      title: "With zones",
      note: "Each dot takes the tone of the zone it sits in, so the trouble ahead shows before it's reached.",
      code: `function Minutes() {
  const [used, setUsed] = useState(640);
  return (
    <>
      <Gauge
        value={used}
        max={1000}
        label="Build minutes"
        zones={[
          { from: 0, tone: "ok" },
          { from: 700, tone: "warn" },
          { from: 900, tone: "stop" },
        ]}
      />
      <Button size="sm" variant="outline" onClick={() => setUsed((m) => Math.min(1000, m + 90))}>
        Run a build
      </Button>
    </>
  );
}`,
    },
    {
      id: "vitals",
      title: "Side by side",
      note: "Smaller dials for a machine's vitals, each with its own unit and format; dither={false} cuts the edge clean.",
      code: `<div className="flex flex-wrap justify-center gap-6">
  <Gauge size={150} value={38} unit="%" label="CPU" />
  <Gauge size={150} value={5.1} max={8} unit="GB" format={(v) => v.toFixed(1)} label="Memory" dither={false} />
  <Gauge size={150} value={182} max={500} unit="ms" label="Response" dither={false} />
</div>`,
    },
  ],
  a11y: [
    "The meter role, with its value, min and max, named by label.",
    "Screen readers hear the value as it reads, with its unit, from format and unit.",
    "The dots and the counting number are drawn only; with reduced motion the dial jumps to the value.",
  ],
};
