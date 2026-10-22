import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardMedia,
  CardTitle,
} from "@basedraft/ui";

export function Template() {
  return (
    <Card interactive className="max-w-[320px]">
      <CardMedia className="aspect-[16/8]">
        <img src="/covers/zuno.png" alt="" />
      </CardMedia>
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
  use: [
    "To group what belongs together, with a title, a body and actions: a template, a plan, a setting.",
    "The shell (the default) raises the content on a white face and sets the actions on the gray under it. Surface is one plain face; paper feels warmer than the page.",
    "interactive for a card that opens something: it lifts, and a soft light follows the pointer.",
  ],
  avoid: [
    "For a list of rows: use a plain list with dividers, not a card each.",
    "For something that floats over the page: use Popover or Dialog.",
    "For an empty view with a next step: use Empty state.",
  ],
  parts: [
    {
      name: "Card",
      note: "The card itself, as a div. On the shell, the head, media and content go on the face, and the foot on the shell under it.",
      props: [
        { name: "variant", type: '"shell" | "surface" | "paper"', default: '"shell"', note: "A raised face on a gray shell; one plain face; or paper, near white with fine dots." },
        { name: "interactive", type: "boolean", default: "false", note: "Lifts when it's pointed at, with a light that follows the pointer across the face. For a card that opens something." },
        { name: "edge", type: "boolean", default: "false", note: "A brushed-metal hairline around it, for the card that matters most. Use it once on a page." },
        { name: "...props", type: "div props", note: "Everything a div takes, on the outermost layer." },
      ],
    },
    { name: "CardMedia", note: "A cover, picture or preview at the top of the face, inset to its curve. Give it an aspect ratio.", props: [{ name: "...props", type: "div props", note: "Everything a div takes." }] },
    { name: "CardHeader", note: "The top, holding the title and the line under it.", props: [{ name: "...props", type: "div props", note: "Everything a div takes." }] },
    { name: "CardTitle", note: "The card's name, as an h3.", props: [{ name: "...props", type: "h3 props", note: "Everything an h3 takes." }] },
    { name: "CardDescription", note: "A quiet line under the title.", props: [{ name: "...props", type: "p props", note: "Everything a p takes." }] },
    { name: "CardContent", note: "The body.", props: [{ name: "...props", type: "div props", note: "Everything a div takes." }] },
    { name: "CardFooter", note: "The actions. On the shell it sits on the gray under the face; on the others, under a hairline.", props: [{ name: "...props", type: "div props", note: "Everything a div takes." }] },
  ],
  examples: [
    {
      id: "surface",
      title: "Surface",
      note: "One plain face: a head, a body and a foot for actions.",
      code: `<Card variant="surface" className="w-full max-w-[300px]">
  <CardHeader>
    <CardTitle>Autosave</CardTitle>
    <CardDescription>Last saved 2 minutes ago</CardDescription>
  </CardHeader>
  <CardContent className="text-[13px] text-[var(--bd-muted)]">
    Every change to this draft is kept in your account.
  </CardContent>
  <CardFooter className="justify-end">
    <Button size="sm" variant="ghost">
      History
    </Button>
    <Button size="sm">Save now</Button>
  </CardFooter>
</Card>`,
    },
    {
      id: "paper",
      title: "Paper",
      note: "Near white, lit softly, with fine dots.",
      code: `<Card variant="paper" className="w-full max-w-[300px]">
  <CardHeader>
    <CardTitle>Every update, included</CardTitle>
    <CardDescription>With Pro, once</CardDescription>
  </CardHeader>
  <CardContent className="text-[13px] text-[var(--bd-paper-muted)]">
    New templates and sections land on your Purchases page as they ship.
  </CardContent>
</Card>`,
    },
    {
      id: "edge",
      title: "Metal edge",
      note: "For the one card on a page that matters most.",
      code: `<Card edge className="w-full max-w-[300px]">
  <CardHeader>
    <CardTitle>Pro</CardTitle>
    <CardDescription>Every template and section</CardDescription>
  </CardHeader>
  <CardContent className="flex items-baseline gap-1.5">
    <span className="text-3xl font-semibold tracking-tight">$149</span>
    <span className="text-sm text-[var(--bd-muted)]">once</span>
  </CardContent>
  <CardFooter>
    <Button variant="metal" size="sm" className="w-full">Get Pro</Button>
  </CardFooter>
</Card>`,
    },
  ],
  a11y: [
    "Plain divs, so it adds nothing to what a screen reader hears; CardTitle is an h3, so cards can be found by heading.",
    "CardTitle is always an h3. Where that's the wrong level for your page, write your own heading there instead and give it the look you want.",
    "interactive is only how it looks and moves. Make the card open something with a link inside it (the title, say), so it can be reached and read as a link.",
    "The lift and the light respect reduced motion: the card stays put.",
  ],
};
