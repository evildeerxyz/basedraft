import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@basedraft/ui";

export function Export() {
  return (
    <Tabs defaultValue="figma">
      <TabsList>
        <TabsTrigger value="figma">Figma</TabsTrigger>
        <TabsTrigger value="code">Code</TabsTrigger>
      </TabsList>
      <TabsContent value="figma">
        Pasted as auto layout, every layer named.
      </TabsContent>
      <TabsContent value="code">Next.js or Astro, ready to run.</TabsContent>
    </Tabs>
  );
}`,
  use: [
    "For a few views of the same thing, one at a time: Preview and Code, Figma and GitHub.",
    "When every tab's name is short and they fit in one row.",
  ],
  avoid: [
    "For a setting that changes one view rather than swapping panels: use Segmented control.",
    "For sections people may want open together: use Accordion.",
    "For going to another page: use links.",
  ],
  parts: [
    {
      name: "Tabs",
      note: "Holds the state and lays the list over the panels.",
      props: [
        { name: "value", type: "string", note: "The selected tab, when you control it." },
        { name: "defaultValue", type: "string", default: '""', note: "The tab selected to begin with, when it keeps its own state." },
        { name: "onValueChange", type: "(value: string) => void", note: "Called when another tab is picked." },
        { name: "className", type: "string", note: "Added to the column that holds the list and panels. Add items-center to center the list." },
        { name: "children", type: "ReactNode", note: "A TabsList and its TabsContent panels.", required: true },
      ],
    },
    {
      name: "TabsList",
      note: "The row of tabs, in a hairline pill.",
      props: [{ name: "...props", type: "div props", note: "Everything a div takes. Its arrow keys still move between tabs if you add your own onKeyDown." }],
    },
    {
      name: "TabsTrigger",
      note: "One tab. Inked on the sliding pill while selected.",
      props: [
        { name: "value", type: "string", note: "Which panel it shows.", required: true },
        { name: "children", type: "ReactNode", note: "Its name; an icon before it sizes to 16px." },
        { name: "...props", type: "button props", note: "Everything a button takes." },
      ],
    },
    {
      name: "TabsContent",
      note: "One panel, rising in when its tab is picked.",
      props: [
        { name: "value", type: "string", note: "The tab it belongs to.", required: true },
        { name: "className", type: "string", note: "Added to the panel." },
        { name: "children", type: "ReactNode", note: "What it shows." },
      ],
    },
  ],
  examples: [
    {
      id: "basic",
      title: "Two views",
      note: "The plainest form: two names, two panels.",
      code: `<Tabs defaultValue="desktop" className="items-center">
  <TabsList>
    <TabsTrigger value="desktop">Desktop</TabsTrigger>
    <TabsTrigger value="phone">Phone</TabsTrigger>
  </TabsList>
  <TabsContent value="desktop" className="text-sm text-[var(--bd-muted)]">
    1440 px wide, with the full navigation.
  </TabsContent>
  <TabsContent value="phone" className="text-sm text-[var(--bd-muted)]">
    390 px wide, the menu behind a button.
  </TabsContent>
</Tabs>`,
    },
    {
      id: "icons",
      title: "With icons",
      note: "An icon before each name.",
      code: `<Tabs defaultValue="preview" className="items-center">
  <TabsList>
    <TabsTrigger value="preview">
      <EyeIcon weight="duotone" /> Preview
    </TabsTrigger>
    <TabsTrigger value="code">
      <CodeIcon weight="duotone" /> Code
    </TabsTrigger>
  </TabsList>
  <TabsContent value="preview" className="text-sm text-[var(--bd-muted)]">
    The section, live, at any width.
  </TabsContent>
  <TabsContent
    value="code"
    className="font-mono text-[13px] text-[var(--bd-muted)]"
  >
    {"<ZunoHero />"}
  </TabsContent>
</Tabs>`,
    },
    {
      id: "controlled",
      title: "Controlled",
      note: "value and onValueChange, when the selected tab matters elsewhere.",
      code: `function Pages() {
  const [page, setPage] = useState("home");
  return (
    <Tabs value={page} onValueChange={setPage} className="items-center">
      <TabsList>
        <TabsTrigger value="home">Home</TabsTrigger>
        <TabsTrigger value="pricing">Pricing</TabsTrigger>
        <TabsTrigger value="blog">Blog</TabsTrigger>
      </TabsList>
      <TabsContent value="home" className="text-sm text-[var(--bd-muted)]">
        12 sections
      </TabsContent>
      <TabsContent value="pricing" className="text-sm text-[var(--bd-muted)]">
        5 sections
      </TabsContent>
      <TabsContent value="blog" className="text-sm text-[var(--bd-muted)]">
        3 sections
      </TabsContent>
      <p className="font-mono text-xs text-[var(--bd-subtle)]">
        Editing /{page === "home" ? "" : page}
      </p>
    </Tabs>
  );
}`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves focus to the selected tab; Tab again moves into the panel's content." },
    { keys: "← / →", does: "Selects the previous or next tab, wrapping at the ends." },
    { keys: "Enter / Space", does: "Selects the focused tab." },
  ],
  a11y: [
    "A tablist of tabs, each with aria-selected and aria-controls pointing at its panel; each panel is a tabpanel labelled by its tab.",
    "Only the selected tab is in the tab order; the arrow keys move between the rest.",
    "Panels that aren't selected aren't rendered, so screen readers only find the one in view.",
  ],
};
