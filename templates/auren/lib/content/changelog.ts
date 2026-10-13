export type Release = {
  version: string;
  date: string;
  title: string;
  summary: string;
  kind: "Major" | "Feature" | "Improvement";
  notes: Array<{ heading: "New" | "Improved" | "Fixed"; items: string[] }>;
};

export const releaseId = (version: string) => `v${version.replace(/\./g, "-")}`;

export const RELEASES: Release[] = [
  {
    version: "2.0",
    date: "Oct 6, 2026",
    title: "Background agents",
    kind: "Major",
    summary: "Hand off a task and keep typing. Agents work on their own branch and wait for you with a diff.",
    notes: [
      {
        heading: "New",
        items: [
          "Background agents run on an isolated branch inside a sandbox. Pro and Team plans can run four at once.",
          "The agent panel narrates every step: files read, edits made, commands run, tests passed.",
          "Review mode groups changes into hunks you can keep or drop, with the agent's reasoning beside each one.",
          "Agents re-run your tests on exactly the hunks you keep before anything is committed.",
        ],
      },
      {
        heading: "Improved",
        items: [
          "The index now includes commit messages and PR descriptions, so answers can cite why code changed.",
          "Agent runs survive a restart and pick up where they stopped.",
        ],
      },
      {
        heading: "Fixed",
        items: [
          "Large monorepos no longer stall the first index on machines with less than 16 GB of memory.",
          "Selecting text in the agent panel no longer scrolls the editor.",
        ],
      },
    ],
  },
  {
    version: "1.14",
    date: "Sep 22, 2026",
    title: "Tab follows renames across files",
    kind: "Feature",
    summary: "Next-edit prediction now jumps between files, so a rename is a handful of Tabs.",
    notes: [
      {
        heading: "New",
        items: [
          "Tab predicts edits in other open files and in files the index links to the one you are editing.",
          "A small marker in the gutter shows where the next predicted edit is waiting.",
        ],
      },
      { heading: "Improved", items: ["Median Tab latency dropped from 31 ms to 22 ms on Apple silicon."] },
      { heading: "Fixed", items: ["Ghost text no longer flickers when a language server sends late diagnostics."] },
    ],
  },
  {
    version: "1.13",
    date: "Sep 8, 2026",
    title: "Remote development over SSH",
    kind: "Feature",
    summary: "Open any machine as if it were local. The index is built where the code lives.",
    notes: [
      {
        heading: "New",
        items: [
          "Connect to any host in your SSH config from the command menu.",
          "The index and the Tab model run on the remote host, so nothing is copied to your laptop.",
        ],
      },
      { heading: "Fixed", items: ["Port forwarding now reconnects after the laptop sleeps."] },
    ],
  },
  {
    version: "1.12",
    date: "Aug 25, 2026",
    title: "Team rules",
    kind: "Feature",
    summary: "Commit .auren/rules and every agent on the team follows the same conventions.",
    notes: [
      {
        heading: "New",
        items: [
          "Rules are plain Markdown files in your repository, reviewed like any other change.",
          "Agents cite the rule they followed when a hunk depends on one.",
        ],
      },
      { heading: "Improved", items: ["Rules can be scoped to folders, so the frontend and the API can differ."] },
    ],
  },
  {
    version: "1.11",
    date: "Aug 11, 2026",
    title: "Inline test runner",
    kind: "Improvement",
    summary: "Run the test under your cursor and see failures in the gutter, without leaving the file.",
    notes: [
      { heading: "New", items: ["Supports Vitest, Jest, pytest, Go test and cargo test out of the box."] },
      { heading: "Fixed", items: ["Watch mode no longer leaks file handles on Linux."] },
    ],
  },
  {
    version: "1.10",
    date: "Jul 28, 2026",
    title: "Cold start in 180 ms",
    kind: "Improvement",
    summary: "We moved extension loading off the critical path. Auren opens before your hand leaves the trackpad.",
    notes: [
      {
        heading: "Improved",
        items: [
          "Cold start to an editable frame fell from 410 ms to 180 ms on an M3.",
          "Extensions now load lazily, on the first file that needs them.",
        ],
      },
    ],
  },
  {
    version: "1.9",
    date: "Jul 14, 2026",
    title: "Vim mode, rebuilt",
    kind: "Improvement",
    summary: "A new modal engine with macros, registers, text objects and a faithful dot command.",
    notes: [
      { heading: "New", items: ["Your .vimrc mappings are imported on first launch."] },
      { heading: "Fixed", items: ["Visual block mode now works across wrapped lines."] },
    ],
  },
  {
    version: "1.8",
    date: "Jun 30, 2026",
    title: "Offline mode with local models",
    kind: "Feature",
    summary: "Point Auren at a local model and the agent works on a plane, a train, or an air-gapped network.",
    notes: [
      {
        heading: "New",
        items: [
          "Any OpenAI-compatible local server works, including Ollama and llama.cpp.",
          "A status bar badge shows when no request has left the machine.",
        ],
      },
    ],
  },
];
