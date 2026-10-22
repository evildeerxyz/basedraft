import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { RocketLaunchIcon } from "@phosphor-icons/react";
import { Timeline, TimelineGroup, TimelineItem, TimelineMeta, TimelineQuote } from "@basedraft/ui";

export function Activity() {
  return (
    <Timeline continues>
      <TimelineGroup label="Today">
        <TimelineItem time="09:42" person={{ name: "Lea Moreau" }} title="commented on Pricing">
          <TimelineQuote>Can the yearly price round to $12?</TimelineQuote>
        </TimelineItem>
        <TimelineItem time="09:30" tone="ok" icon={<RocketLaunchIcon weight="duotone" />} title="Published to zuno.site">
          <TimelineMeta items={["main", "a3f9c1e", "41s"]} />
        </TimelineItem>
        <TimelineItem minor time="09:12" person={{ name: "Maya Okafor" }} title="changed the headline" />
      </TimelineGroup>
    </Timeline>
  );
}`,
  use: [
    "For a history of what happened to something: a site's deploys, a ticket's changes, who did what on a page.",
    "Mark the small events minor, so the ones that matter keep their weight: a publish beside a dozen edits.",
    "Gather by day with TimelineGroup when the history spans more than one; mark live the one event still running.",
  ],
  avoid: [
    "For the steps of a task someone is going through: use Stepper.",
    "For notifications people read and clear: use Inbox.",
    "For a short note on the page right now: use Alert.",
  ],
  parts: [
    {
      name: "Timeline",
      note: "An ordered list of events, newest first, with a gutter for times and one rail through every bead.",
      props: [
        { name: "continues", type: "boolean", default: "false", note: "There's more history below: the rail runs on past the last event and fades out." },
        { name: "children", type: "TimelineItem | TimelineGroup", note: "The events, or days of them. Key them, and ones added later slide in." },
        { name: "...props", type: "ol props", note: "Everything an ol takes." },
      ],
    },
    {
      name: "TimelineGroup",
      note: "A day's events under its name.",
      props: [
        { name: "label", type: "ReactNode", note: "The day or stretch: Today, Yesterday, Monday, October 12.", required: true },
        { name: "children", type: "TimelineItem[]", note: "Its events.", required: true },
      ],
    },
    {
      name: "TimelineItem",
      note: "One event.",
      props: [
        { name: "title", type: "ReactNode", note: "What happened, in a line. With a person, it follows their name.", required: true },
        { name: "time", type: "ReactNode", note: "When, in the gutter: 09:42, 2m, Oct 14." },
        { name: "dateTime", type: "string", note: "The moment for machines, like 2026-10-14T09:42, on the time element." },
        { name: "children", type: "ReactNode", note: "More on it, under the title: words, a TimelineQuote, a TimelineMeta." },
        { name: "icon", type: "ReactNode", note: "In the bead, at 14px. A small dot when there's none." },
        { name: "person", type: "{ name: string; src?: string }", note: "Who did it: their initials or picture in the bead, their name leading the line." },
        { name: "tone", type: '"default" | "ok" | "warn" | "stop"', default: '"default"', note: "The bead's color, or the minor ring's." },
        { name: "minor", type: "boolean", default: "false", note: "A small event: a ring on the rail and a quieter line." },
        { name: "live", type: "boolean", default: "false", note: "Still happening: a ring of dots turns round the bead." },
      ],
    },
    {
      name: "TimelineQuote",
      note: "What someone wrote, in a bubble that points back at their bead. Takes everything a blockquote does.",
      props: [{ name: "children", type: "ReactNode", note: "The words." }],
    },
    {
      name: "TimelineMeta",
      note: "A row of small facts, set apart by dots.",
      props: [{ name: "items", type: "ReactNode[]", note: "A branch, a commit, how long it took.", required: true }],
    },
  ],
  examples: [
    {
      id: "deploys",
      title: "A site's deploys",
      note: "Icons in tones for what the system did, facts in a meta row, and continues for the history further back.",
      code: `<Timeline continues>
  <TimelineItem time="09:30" tone="ok" icon={<RocketLaunchIcon weight="duotone" />} title="Published to zuno.site">
    <TimelineMeta items={["main", "a3f9c1e", "41s"]} />
  </TimelineItem>
  <TimelineItem time="09:18" icon={<GitCommitIcon weight="duotone" />} title="Pushed 3 commits to main" />
  <TimelineItem time="08:52" tone="stop" icon={<WarningIcon weight="duotone" />} title="Build failed">
    pricing/plans.ts: Type 'string' is not assignable to type 'number'.
  </TimelineItem>
</Timeline>`,
    },
    {
      id: "comments",
      title: "A conversation",
      note: "Each comment in a bubble that points back at the person who wrote it.",
      code: `<Timeline>
  <TimelineItem time="2m" person={{ name: "Lea Moreau" }} title="commented on Pricing">
    <TimelineQuote>Can the yearly price round to $12?</TimelineQuote>
  </TimelineItem>
  <TimelineItem time="1h" person={{ name: "Maya Okafor" }} title="replied">
    <TimelineQuote>It can. I'll change it in the plans file.</TimelineQuote>
  </TimelineItem>
</Timeline>`,
    },
    {
      id: "days",
      title: "Days, and small things",
      note: "TimelineGroup gathers a day; minor events sit on the rail as rings, so the publish stands out from the edits.",
      code: `<Timeline>
  <TimelineGroup label="Today">
    <TimelineItem time="11:04" person={maya} title="published zuno.site" />
    <TimelineItem minor time="10:51" person={maya} title="changed the headline" />
    <TimelineItem minor time="10:47" person={maya} title="moved Pricing above FAQ" />
  </TimelineGroup>
  <TimelineGroup label="Monday, October 12">
    <TimelineItem time="16:20" person={jonah} title="invited Lea Moreau" />
    <TimelineItem minor time="16:02" tone="warn" title="Domain check is still waiting on DNS" />
  </TimelineGroup>
</Timeline>`,
    },
    {
      id: "live",
      title: "Still running",
      note: "live puts a turning ring of dots round the bead until it's done.",
      code: `<Timeline>
  <TimelineItem time="now" live icon={<HammerIcon weight="duotone" />} title="Building zuno.site">
    Step 2 of 3: rendering 14 pages.
  </TimelineItem>
  <TimelineItem minor time="18s" tone="ok" title="Installed packages" />
</Timeline>`,
    },
  ],
  a11y: [
    "An ordered list, with each day a list of its own under its name, so a screen reader says how many events there are and goes through them in order.",
    "Each time is a time element, with dateTime for the exact moment when you give it.",
    "Beads, rings and the rail are drawn only; a person's name is said in the line itself.",
    "With reduced motion, new events appear without sliding and the running ring holds still.",
  ],
};
