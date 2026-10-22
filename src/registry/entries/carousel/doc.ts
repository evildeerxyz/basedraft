import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Carousel, CarouselSlide } from "@basedraft/ui";

export function Templates({
  templates,
}: {
  templates: { slug: string; name: string }[];
}) {
  return (
    <Carousel label="Templates">
      {templates.map((t) => (
        <CarouselSlide key={t.slug} label={t.name} className="w-[82%]">
          <img src={\`/shots/\${t.slug}.jpg\`} alt="" draggable={false} />
        </CarouselSlide>
      ))}
    </Carousel>
  );
}`,
  use: [
    "For a row of things to browse one at a time where showing them all at once would crowd the page: screenshots, quotes, cards.",
    "With slides narrower than the view, so the next one peeks in and says there's more.",
    "With autoPlay only for something decorative; it waits whenever someone is looking closely.",
  ],
  avoid: [
    "For things people compare side by side: a grid shows them all at once.",
    "For an endless row of logos that drifts on its own: use Marquee.",
    "For switching between a few views of one thing: use Tabs.",
  ],
  parts: [
    {
      name: "Carousel",
      props: [
        { name: "label", type: "string", required: true, note: "What the slides are, for screen readers." },
        { name: "children", type: "ReactNode", required: true, note: "CarouselSlides." },
        { name: "indicator", type: '"dots" | "progress" | "none"', default: '"dots"', note: "A dot per stop, a thin bar that fills as you go (and follows a drag), or nothing." },
        { name: "buttons", type: "boolean", default: "true", note: "The previous and next buttons." },
        { name: "loop", type: "boolean", default: "false", note: "Past the last slide comes the first again, and before the first the last." },
        { name: "autoPlay", type: "number", note: "Move on its own every this many milliseconds. It waits while it's off screen, the tab is hidden, it's pointed at or focused, and with reduced motion." },
        { name: "gap", type: "number", default: "16", note: "The space between slides, in pixels." },
        { name: "align", type: '"start" | "center"', default: '"start"', note: "Line each slide up with the start of the view, or center it." },
        { name: "index", type: "number", note: "Controlled: which stop it's at." },
        { name: "defaultIndex", type: "number", default: "0", note: "Where it starts, uncontrolled." },
        { name: "onIndexChange", type: "(index: number) => void", note: "Called each time it settles on a new stop." },
        { name: "className", type: "string", note: "Goes on the whole carousel, to size it." },
      ],
    },
    {
      name: "CarouselSlide",
      note: "One slide. Slides can be any width; the last ones share a stop rather than leaving blank space after them.",
      props: [
        { name: "children", type: "ReactNode", required: true, note: "What the slide shows. Set draggable={false} on images so a drag moves the carousel, not the picture." },
        { name: "label", type: "string", note: 'A name read after its number: "2 of 4: Noma".' },
        { name: "className", type: "string", default: '"w-full"', note: 'Its width: "w-[82%]", "w-[260px]".' },
      ],
    },
  ],
  examples: [
    {
      id: "dots",
      title: "Slides that peek",
      note: "Each slide is 82% of the view, so the next one shows at the edge. Drag or flick it, and it carries on with your speed and settles on a slide.",
      code: `<Carousel label="Templates" gap={12}>
  {shots.map((s) => (
    <CarouselSlide key={s.slug} label={s.name} className="w-[82%]">
      <Shot s={s} />
    </CarouselSlide>
  ))}
</Carousel>`,
    },
    {
      id: "progress",
      title: "Narrow slides and a bar",
      note: "Several slides to a view; the bar fills as the row moves, even mid-drag.",
      code: `<Carousel label="Templates" indicator="progress" gap={12}>
  {shots.map((s) => (
    <CarouselSlide key={s.slug} label={s.name} className="w-[240px]">
      <Shot s={s} />
    </CarouselSlide>
  ))}
</Carousel>`,
    },
    {
      id: "widths",
      title: "Slides of any width",
      note: "Each quote as wide as it needs; it still settles on each one.",
      code: `<Carousel label="What people say" gap={12}>
  {quotes.map((q) => (
    <CarouselSlide
      key={q.who}
      label={q.who}
      className={
        q.text.length > 80 ? "w-[420px] max-w-[88%]" : "w-[260px] max-w-[70%]"
      }
    >
      <blockquote>
        <p>&ldquo;{q.text}&rdquo;</p>
        <footer>{q.who}</footer>
      </blockquote>
    </CarouselSlide>
  ))}
</Carousel>`,
    },
    {
      id: "autoplay",
      title: "Playing on its own",
      note: "It moves every 3.2 seconds and loops, and waits while you point at it or tab into it.",
      code: `<Carousel label="Templates" loop autoPlay={3200} gap={12}>
  {shots.map((s) => (
    <CarouselSlide key={s.slug} label={s.name}>
      <Shot s={s} />
    </CarouselSlide>
  ))}
</Carousel>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Focuses the slides, then the dots and the buttons." },
    { keys: "ArrowLeft / ArrowRight", does: "On the slides, moves a slide back or on." },
    { keys: "Home / End", does: "On the slides, goes to the first or the last." },
    { keys: "Enter / Space", does: "On a dot or a button, goes to that slide or the next one." },
  ],
  a11y: [
    'It\'s a region with the role description "carousel" and its label; each slide is a group with the role description "slide" and a name like "2 of 4: Noma".',
    "Moves made with the buttons, the dots, the keys or a drag are said through a polite live region; moves it makes on its own aren't.",
    "A vertical swipe still scrolls the page; only a mostly sideways drag moves the carousel.",
    "With reduced motion it moves without gliding and doesn't play on its own.",
  ],
};
