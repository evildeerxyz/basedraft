import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Globe } from "@/components/basedraft/globe";

const regions = [
  { id: "fra", label: "Frankfurt", lat: 50.1, lon: 8.7, detail: "14 ms", tone: "ok" },
  { id: "iad", label: "Washington", lat: 38.9, lon: -77, detail: "76 ms", tone: "ok" },
];

export function Network() {
  return <Globe markers={regions} arcs={[{ from: "fra", to: "iad" }]} label="Edge network" />;
}`,
  use: [
    "For where things are on Earth when the where is the point: regions, offices, customers, routes, a launch's reach.",
    "On a landing page as the thing that moves, with a few markers that mean something rather than hundreds.",
    "Beside a list of the same places: pass selected from the list and the globe turns to face each one.",
  ],
  avoid: [
    "For exact positions or many points: use a real map.",
    "For numbers by country: use Bar list or a table, which can be read and compared.",
    "As decoration with nothing marked: it's a lot of motion for no meaning.",
  ],
  parts: [
    {
      name: "Globe",
      note: "The globe, square, as wide as its box.",
      props: [
        { name: "markers", type: "GlobeMarker[]", note: "The places: id, lat, lon, and a label, detail and tone to show." },
        { name: "arcs", type: "{ from: string; to: string; tone?: GlobeTone }[]", note: "Lines between markers, by id, rising off the surface along the shortest way round." },
        { name: "selected", type: "string | null", note: "The chosen marker: the globe turns to face it and shows its name. Leave it out to let the globe keep its own." },
        { name: "defaultSelected", type: "string | null", note: "The marker chosen to start." },
        { name: "onSelect", type: "(marker | null) => void", note: "Runs when a marker is clicked or chosen from the keys, and with null when it's let go." },
        { name: "center", type: "{ lat: number; lon: number }", default: "{ lat: 20, lon: 0 }", note: "Where it faces to start." },
        { name: "autoRotate", type: "number", default: "6", note: "Degrees a second it turns on its own; 0 holds it still. It pauses while a marker is chosen, and after you drag it." },
        { name: "dither", type: "boolean", default: "true", note: "Toward the night side the dots drop out one by one in an ordered dither; false fades them instead." },
        { name: "label", type: "string", default: '"Globe"', note: "What it shows, for screen readers." },
        { name: "className", type: "string", note: "Added to its box: a width here." },
      ],
    },
    {
      name: "GlobeMarker",
      note: "One place, as an object in markers.",
      props: [
        { name: "id", type: "string", note: "Its key, for arcs and selected.", required: true },
        { name: "lat", type: "number", note: "Latitude, -90 to 90.", required: true },
        { name: "lon", type: "number", note: "Longitude, -180 to 180.", required: true },
        { name: "label", type: "string", note: "Its name, on the tag." },
        { name: "detail", type: "string", note: "A second line on the tag." },
        { name: "tone", type: '"ink" | "ok" | "warn" | "stop"', default: '"ink"', note: "Its color: ink, or a status." },
      ],
    },
  ],
  examples: [
    {
      id: "routes",
      title: "Without dither",
      note: "dither={false} fades the dots toward night instead of dropping them, here under shipping lanes between ports, turning a little faster.",
      code: `<Globe markers={ports} arcs={lanes} dither={false} autoRotate={10} />`,
    },
    {
      id: "office",
      title: "One place, still",
      note: "autoRotate={0}, centered on the place, with it chosen from the start so its name shows.",
      code: `<Globe
  markers={[{ id: "lis", label: "Lisbon studio", lat: 38.7, lon: -9.1 }]}
  defaultSelected="lis"
  autoRotate={0}
  center={{ lat: 38.7, lon: -9.1 }}
/>`,
    },
  ],
  keyboard: [
    { keys: "← → ↑ ↓", does: "With the globe focused, turn it; with Shift, further." },
    { keys: "Tab", does: "Moves on to each place in turn; the globe turns to face it and shows its name." },
    { keys: "Enter Space", does: "Chooses the place that's focused." },
  ],
  a11y: [
    "The coastlines are Natural Earth's, drawn at one degree.",
    "The globe is an image with a label that says how many places it shows and how to turn it.",
    "Every place is also a button in a list for screen readers, with its name and detail.",
    "With reduced motion it doesn't turn on its own, markers don't pulse, and arcs don't run; dragging still works.",
  ],
};
