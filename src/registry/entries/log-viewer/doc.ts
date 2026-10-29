import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { LogViewer, type LogLine } from "@/components/basedraft/log-viewer";

export function DeployLogs({ lines, running }: { lines: LogLine[]; running: boolean }) {
  return <LogViewer title="Deploy" lines={lines} live={running} />;
}`,
  use: [
    "For a deploy's or a job's output as it runs, or a server's recent lines on its page.",
    "Pass live while lines are still coming: it keeps to the newest, and stops when someone scrolls up to read.",
    "Give lines fields for what doesn't fit in a message: a request's user, a job's id, an error's detail.",
  ],
  avoid: [
    "For a list of events people act on: use Timeline, or Inbox for notifications.",
    "For code: use Code block.",
    "For huge histories: it keeps the newest lines, a thousand by default. Search older ones on the server.",
  ],
  parts: [
    {
      name: "LogViewer",
      note: "A header with the title, filters and actions, and the lines below.",
      props: [
        { name: "lines", type: "LogLine[]", note: "The lines, oldest first.", required: true },
        { name: "title", type: "string", default: '"Logs"', note: "What the logs are of: Deploy, api-7f9c." },
        { name: "live", type: "boolean", default: "false", note: "Lines are still coming: a live dot, and it keeps to the newest." },
        { name: "height", type: "number | string", default: "360", note: "How tall the lines' box is." },
        { name: "wrap", type: "boolean", default: "false", note: "Long lines wrap to start. The button in the header switches." },
        { name: "timeZone", type: "string", default: '"UTC"', note: "The zone the times show in. UTC keeps the server and the browser in step; pass the viewer's own zone if you know it." },
        { name: "max", type: "number", default: "1000", note: "The most lines it keeps, the newest." },
        { name: "className", type: "string", note: "Added to its box." },
      ],
    },
    {
      name: "LogLine",
      note: "One line, as an object in lines.",
      props: [
        { name: "time", type: "Date | number | string", note: "When it happened.", required: true },
        { name: "message", type: "string", note: "What happened.", required: true },
        { name: "level", type: '"debug" | "info" | "warn" | "error"', default: '"info"', note: "Errors and warnings get a mark down the edge and a tint." },
        { name: "source", type: "string", note: "Where it came from, in brackets before the message." },
        { name: "fields", type: "Record<string, unknown>", note: "More about it. The line opens to show them." },
        { name: "id", type: "string | number", note: "A key that stays with the line." },
      ],
    },
  ],
  examples: [
    {
      id: "server",
      title: "A server's requests",
      note: "Not live, wrapping, and most lines carrying fields: open one to see who asked and what came back.",
      code: `<LogViewer title="api-7f9c" lines={lines} height={240} wrap />`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves through the search, the level chips, the buttons, the lines' box and the lines that open." },
    { keys: "↑ ↓ Page Up Page Down", does: "In the lines' box, scroll." },
    { keys: "Enter Space", does: "Opens or closes a line's fields." },
    { keys: "Esc", does: "In the search, clears it." },
  ],
  a11y: [
    "The lines are a log region; live, new lines are announced politely.",
    "Each level is said in words before its short label, and the chips say whether they're on.",
    "Lines with fields are buttons that say whether they're open.",
  ],
};
