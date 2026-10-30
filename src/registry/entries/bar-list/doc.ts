import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { BarList } from "@basedraft/ui";

const pages = [
  { name: "/", value: 4812 },
  { name: "/pricing", value: 2481 },
  { name: "/blog/money-that-manages-itself", value: 1734 },
  { name: "/about", value: 912 },
];

export function TopPages() {
  return <BarList label="Top pages" data={pages} />;
}`,
  use: [
    "For the top few of something, ranked: pages, referrers, countries, plans, the files that grew a build.",
    "Give it a limit when the list is long, so the top stays in view and the rest opens on demand.",
    "Make rows links with href, or buttons with onSelect, when each one leads somewhere.",
  ],
  avoid: [
    "For a value over time: use Area chart or Bar chart.",
    "For parts of a whole that add up to one total: use Donut chart.",
    "For one reading against its limit: use Gauge or Meter.",
  ],
  parts: [
    {
      name: "BarList",
      note: "A list of rows, each a name, a number and its bar.",
      props: [
        { name: "data", type: "BarListItem[]", note: "The rows: name, value, and an icon and href if you like.", required: true },
        { name: "format", type: "(value: number) => string", default: "grouped", note: "The numbers as they read." },
        { name: "sort", type: '"desc" | "none" | "asc"', default: '"desc"', note: "Highest first, as given, or lowest first." },
        { name: "limit", type: "number", note: "How many rows show; the rest open from a Show more button." },
        { name: "pattern", type: '"dither" | "dots" | "solid" | "gradient"', default: '"dither"', note: "The bars' fill. Dither and dots thin out toward the value; every pattern ends on a hard edge." },
        { name: "color", type: "string", default: '"var(--bd-ui-viz-1)"', note: "The bars' color: any CSS color." },
        { name: "share", type: "boolean", default: "true", note: "Shows a row's share of the total when it's pointed at or focused." },
        { name: "onSelect", type: "(item: BarListItem) => void", note: "Makes each row a button." },
        { name: "link", type: "ElementType", default: '"a"', note: "Your router's link, like Next.js's Link, for rows with href." },
        { name: "label", type: "string", note: "What the list is, for a screen reader." },
        { name: "className", type: "string", note: "Added to the list's box." },
      ],
    },
  ],
  examples: [
    {
      id: "referrers",
      title: "With icons",
      note: "An icon before each name: a logo, a flag, a favicon.",
      code: `<BarList
  label="Referrers"
  data={[
    { name: "google.com", value: 3120, icon: <GoogleLogoIcon weight="duotone" /> },
    { name: "x.com", value: 1406, icon: <XLogoIcon weight="duotone" /> },
    { name: "github.com", value: 958, icon: <GithubLogoIcon weight="duotone" /> },
    { name: "Newsletter", value: 611, icon: <EnvelopeIcon weight="duotone" /> },
  ]}
/>`,
    },
    {
      id: "patterns",
      title: "Four fills",
      note: "Dither and dots thin out toward the value; solid and gradient for a calmer page. Every bar ends on a hard edge.",
      code: `function Plans() {
  const [pattern, setPattern] = useState("dither");
  return (
    <>
      <Select
        size="sm"
        label="Fill"
        options={[
          { value: "dither", label: "Dither" },
          { value: "dots", label: "Dots" },
          { value: "gradient", label: "Gradient" },
          { value: "solid", label: "Solid" },
        ]}
        value={pattern}
        onValueChange={setPattern}
      />
      <BarList label="Seats by plan" pattern={pattern} data={plans} />
    </>
  );
}`,
    },
    {
      id: "more",
      title: "A long list",
      note: "With limit, the top stays in view and the rest open from a button, sliding in.",
      code: `<BarList
  label="Countries"
  limit={4}
  format={(v) => \`\${v}%\`}
  share={false}
  data={[
    { name: "United States", value: 38 },
    { name: "Germany", value: 14 },
    { name: "United Kingdom", value: 11 },
    { name: "Australia", value: 9 },
    { name: "India", value: 8 },
    { name: "Japan", value: 6 },
  ]}
/>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves between rows that are links or buttons, and to Show more." },
    { keys: "Enter", does: "Follows a row's link, runs onSelect, or opens the rest of the list." },
  ],
  a11y: [
    "A list named by label; each row reads as its name and its number, in that order.",
    "The bars are drawn only and hidden from screen readers; the number says the value.",
    "Show more says whether the rest is open, and which list it opens.",
  ],
};
