import type { Block } from "./types";

export type Doc = { slug: string; title: string; description: string; blocks: Block[] };

export const DOC_NAV = [
  { title: "Getting started", slugs: ["introduction", "installation", "your-first-task"] },
  { title: "Using Auren", slugs: ["agents", "tab", "rules", "keybindings"] },
  { title: "Trust", slugs: ["privacy-and-models"] },
];

export const docHref = (slug: string) => (slug === "introduction" ? "/docs" : `/docs/${slug}`);

export const DOCS: Doc[] = [
  {
    slug: "introduction",
    title: "Introduction",
    description: "What Auren is, how it is put together, and where to start.",
    blocks: [
      {
        type: "p",
        text: "Auren is a native code editor with an agent built in. It indexes your repository on your machine, predicts your next edit with an on-device model, and can take on whole tasks in the background while you keep working.",
      },
      { type: "h2", id: "how-it-fits-together", text: "How it fits together" },
      {
        type: "ul",
        items: [
          "**The editor** is written in Rust and renders on the GPU. It opens in about 180 ms and keeps keystroke latency under 4 ms.",
          "**The index** is a semantic map of your code, history and docs. It is built and stored locally, and updated on every save.",
          "**Tab** is a 1.2B parameter model that runs on your machine. It predicts the next edit, not just the next word.",
          "**Agents** plan, edit and test on an isolated branch, then return a diff for you to review.",
        ],
      },
      { type: "h2", id: "where-to-start", text: "Where to start" },
      {
        type: "p",
        text: "If you have five minutes, [install Auren](/docs/installation) and open a project. If you have fifteen, follow [your first task](/docs/your-first-task) to hand a real change to an agent and review the result.",
      },
      {
        type: "callout",
        tone: "tip",
        text: "Press `⌘K` anywhere in the editor, or on this site, to open the command menu.",
      },
    ],
  },
  {
    slug: "installation",
    title: "Installation",
    description: "Install Auren on macOS, Linux or Windows and sign in.",
    blocks: [
      { type: "h2", id: "macos", text: "macOS" },
      { type: "p", text: "Download the universal build from the [download page](/download), or use Homebrew:" },
      { type: "code", title: "Terminal", code: "brew install --cask auren" },
      { type: "h2", id: "linux", text: "Linux" },
      { type: "p", text: "Packages are available for Debian, Fedora and as an AppImage. The install script detects your distribution:" },
      { type: "code", title: "Terminal", code: "curl -fsSL https://auren.dev/install.sh | sh" },
      { type: "h2", id: "windows", text: "Windows" },
      { type: "code", title: "PowerShell", code: "winget install Auren.Auren" },
      { type: "h2", id: "requirements", text: "Requirements" },
      {
        type: "table",
        head: ["Platform", "Minimum", "Recommended"],
        rows: [
          ["macOS", "13 Ventura, 8 GB", "Apple silicon, 16 GB"],
          ["Linux", "glibc 2.31, Vulkan 1.2", "16 GB, discrete GPU"],
          ["Windows", "Windows 11, DirectX 12", "16 GB"],
        ],
      },
      {
        type: "callout",
        tone: "note",
        text: "The on-device Tab model needs about 1.4 GB of disk space. It downloads in the background on first launch.",
      },
    ],
  },
  {
    slug: "your-first-task",
    title: "Your first task",
    description: "Hand a real change to an agent and review what comes back.",
    blocks: [
      { type: "p", text: "This walkthrough takes about fifteen minutes. You will need a project with a test suite." },
      { type: "h2", id: "open-a-folder", text: "1. Open a folder" },
      {
        type: "p",
        text: "Open your project with `auren .` or drag the folder onto the dock icon. The status bar shows indexing progress; a million lines takes about forty seconds.",
      },
      { type: "h2", id: "describe-the-change", text: "2. Describe the change" },
      {
        type: "p",
        text: "Open the agent panel with `⌘I` and describe what you want in a sentence. Be specific about the outcome, not the steps:",
      },
      { type: "quote", text: "Make POST /charges idempotent, the same way refunds already are." },
      { type: "h2", id: "watch-or-walk-away", text: "3. Watch, or walk away" },
      {
        type: "p",
        text: "The agent narrates what it reads and runs. You can keep editing; it works on its own branch and will not touch your working tree.",
      },
      { type: "h2", id: "review", text: "4. Review the diff" },
      {
        type: "p",
        text: "When it finishes, Auren opens review mode. Each hunk has a short note explaining why it changed. Keep the hunks you agree with, drop the rest, then commit. The agent re-runs your tests on what you kept first.",
      },
      {
        type: "callout",
        tone: "tip",
        text: "If the result is close but not right, reply in the same run. Follow-ups do not count as a new agent run.",
      },
    ],
  },
  {
    slug: "agents",
    title: "Agents",
    description: "How background agents plan, edit, test and hand work back.",
    blocks: [
      {
        type: "p",
        text: "An agent run starts from a sentence and ends with a diff. In between, the agent reads the index, edits files on a dedicated branch, and runs whatever commands your project uses to check itself.",
      },
      { type: "h2", id: "isolation", text: "Isolation" },
      {
        type: "ul",
        items: [
          "Each run gets a git worktree on a branch named `agent/<task>`.",
          "Commands run in a sandbox with your project's toolchain and no access to the rest of your home directory.",
          "Network access is limited to your package registry unless you allow more in settings.",
        ],
      },
      { type: "h2", id: "parallel-runs", text: "Running several at once" },
      {
        type: "p",
        text: "Pro runs up to four agents in parallel, Team up to eight per seat. Start another from the agent panel with `⌘N`. Each one appears in the status bar with its progress.",
      },
      { type: "h2", id: "configuration", text: "Configuration" },
      {
        type: "code",
        title: ".auren/agents.toml",
        code: `[checks]\ntest = "npm test"\ntypecheck = "npx tsc --noEmit"\n\n[sandbox]\nnetwork = ["registry.npmjs.org"]`,
      },
      {
        type: "callout",
        tone: "note",
        text: "If no checks are configured, Auren infers them from package.json, Makefile, Cargo.toml or pyproject.toml.",
      },
    ],
  },
  {
    slug: "tab",
    title: "Tab",
    description: "Next-edit prediction that runs on your machine.",
    blocks: [
      {
        type: "p",
        text: "Tab watches what you just changed and predicts the next edit, wherever it is. Rename a parameter and Tab lines up every use; change a function signature and it proposes the call sites.",
      },
      { type: "h2", id: "accepting", text: "Accepting suggestions" },
      {
        type: "table",
        head: ["Action", "Key"],
        rows: [
          ["Accept the suggestion", "Tab"],
          ["Accept one word", "⌥ Right arrow"],
          ["Jump to the next predicted edit", "Tab (when the gutter marker shows)"],
          ["Dismiss", "Esc"],
        ],
      },
      { type: "h2", id: "on-device", text: "On-device by design" },
      {
        type: "p",
        text: "The model is about 1.2B parameters and quantised to run on a laptop GPU. A prediction takes around 22 ms on Apple silicon. Because nothing is sent to a server, Tab is unlimited on every plan and works offline.",
      },
    ],
  },
  {
    slug: "rules",
    title: "Rules",
    description: "Teach agents your team's conventions in plain Markdown.",
    blocks: [
      {
        type: "p",
        text: "Rules are Markdown files in `.auren/rules/`. Agents read the ones that apply to the files they touch and cite the rule when it shaped a change.",
      },
      {
        type: "code",
        title: ".auren/rules/api.md",
        code: `---\npaths: ["src/api/**"]\n---\n\n- Validate request bodies with zod schemas from lib/schemas.\n- Return errors in the shape defined in lib/errors.ts.\n- Every handler that charges money must be idempotent.`,
      },
      { type: "h2", id: "scoping", text: "Scoping" },
      {
        type: "p",
        text: "The `paths` field takes globs. Rules without it apply everywhere. When rules conflict, the most specific path wins.",
      },
      {
        type: "callout",
        tone: "tip",
        text: "Review rules like code. A rule change is a change to how every agent on the team behaves.",
      },
    ],
  },
  {
    slug: "keybindings",
    title: "Keybindings",
    description: "Default shortcuts, and how to bring your own.",
    blocks: [
      { type: "p", text: "Auren ships keymaps for VS Code, Vim, Emacs and JetBrains. Pick one on first launch or later in settings." },
      { type: "h2", id: "essentials", text: "Essentials" },
      {
        type: "table",
        head: ["Command", "macOS", "Linux and Windows"],
        rows: [
          ["Command menu", "⌘K", "Ctrl K"],
          ["Agent panel", "⌘I", "Ctrl I"],
          ["New background agent", "⌘N", "Ctrl N"],
          ["Ask the codebase", "⌘⇧F", "Ctrl Shift F"],
          ["Accept all hunks", "⌘↵", "Ctrl Enter"],
          ["Go to file", "⌘P", "Ctrl P"],
        ],
      },
      { type: "h2", id: "custom", text: "Custom bindings" },
      { type: "code", title: "~/.config/auren/keys.toml", code: `"cmd-shift-a" = "agent.new"\n"ctrl-t" = "tab.accept_word"` },
    ],
  },
  {
    slug: "privacy-and-models",
    title: "Privacy and models",
    description: "What leaves your machine, and which models see it.",
    blocks: [
      {
        type: "p",
        text: "Auren is built so that the default is local. Your index, your Tab predictions and your settings never leave your machine. Only agent requests do, and only the context they need.",
      },
      { type: "h2", id: "what-is-sent", text: "What is sent" },
      {
        type: "ul",
        items: [
          "The task you wrote and the code snippets the agent selected as context.",
          "Command output the agent needs to read, such as a failing test.",
          "Nothing else: no full repository uploads, no telemetry on your code.",
        ],
      },
      { type: "h2", id: "retention", text: "Retention" },
      {
        type: "p",
        text: "Requests are processed with zero data retention by Auren and by every model provider we route to. Nothing you send is stored or used for training. Read more on the [security page](/security).",
      },
      { type: "h2", id: "your-own-models", text: "Your own models" },
      {
        type: "code",
        title: "~/.config/auren/models.toml",
        code: `[[provider]]\nname = "local"\nbase_url = "http://localhost:11434/v1"\nmodel = "qwen3-coder"`,
      },
    ],
  },
];

export const getDoc = (slug: string) => DOCS.find((d) => d.slug === slug);

export const docOrder = DOC_NAV.flatMap((s) => s.slugs);
