/*
 * @basedraft/ui, built from the components the site shows: every component in src/registry/ui,
 * read when this runs, so a new one is in the next build without a list to update. It writes
 * packages/ui/dist:
 *   <name>.js, <name>.d.ts   one ES module per component, so an import takes only what it uses,
 *                            each a client component ("use client") for React Server Components
 *   index.js, index.d.ts     all of them, re-exported
 *   styles.css               everything the components need, with no Tailwind on your side: the
 *                            theme's tokens in light and dark, the materials, a reset that touches
 *                            only the components' own elements, and the utilities they use
 *   theme.css                the tokens and materials alone, for projects that run Tailwind v4
 * and README.md, with the component list as it stands. Run from anywhere:
 *   npm run ui:build        (or: node packages/ui/scripts/build.mjs)
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const pkg = path.resolve(import.meta.dirname, "..");
const root = path.resolve(pkg, "../..");
const require = createRequire(path.join(root, "package.json"));
const esbuild = require("esbuild");
const { compile, optimize } = require("@tailwindcss/node");
const { Scanner } = require("@tailwindcss/oxide");

const UI = path.join(root, "src/registry/ui");
const SRC = path.join(pkg, "src");
const DIST = path.join(pkg, "dist");
const NAME = JSON.parse(readFileSync(path.join(pkg, "package.json"), "utf8")).name;

/* ---------- the components ---------- */

// A component is a .tsx file that exports something with a capital name; anything else (a helper, a file starting with _) stays out.
const files = readdirSync(UI)
  .filter((f) => f.endsWith(".tsx") && !f.startsWith("_"))
  .filter((f) => /export (function|const) [A-Z]/.test(readFileSync(path.join(UI, f), "utf8")))
  .sort();
const names = files.map((f) => f.replace(/\.tsx$/, ""));

/*
 * Every element a component draws carries data-bd-ui, so the reset in styles.css can reach the
 * components' own buttons and fields without touching anything else on the page. Added to the
 * copies built here, not to the sources the site reads.
 */
const TAGS = "a|button|code|div|fieldset|form|h1|h2|h3|h4|h5|h6|img|input|kbd|label|legend|li|nav|ol|p|pre|section|select|span|table|tbody|td|textarea|th|thead|tr|ul|dialog|header|footer|aside|output|progress|meter|hr|dl|dt|dd|small|strong|em|figure|figcaption";
const mark = (src) =>
  src
    .replace(/^\s*["']use client["'];?\s*\n/, "")
    .replace(new RegExp(`<((?:motion\\.)?(?:${TAGS}))(?=[\\s/>])`, "g"), '<$1 data-bd-ui=""');

rmSync(SRC, { recursive: true, force: true });
rmSync(DIST, { recursive: true, force: true });
mkdirSync(SRC, { recursive: true });
mkdirSync(DIST, { recursive: true });
for (const f of files) writeFileSync(path.join(SRC, f), mark(readFileSync(path.join(UI, f), "utf8")));

// The index re-exports each one. Two components exporting the same name would hide both, so that stops the build.
const seen = new Map();
for (const n of names) {
  const src = readFileSync(path.join(UI, `${n}.tsx`), "utf8");
  for (const [, name] of src.matchAll(/export (?:function|const|type|interface|class) ([A-Za-z0-9_]+)/g)) {
    if (seen.has(name)) throw new Error(`${name} is exported by both ${seen.get(name)} and ${n}: rename one so the index can carry both.`);
    seen.set(name, n);
  }
}
writeFileSync(path.join(SRC, "index.ts"), `${names.map((n) => `export * from "./${n}.js";`).join("\n")}\n`);

// One module per component, the libraries it uses left as imports. The index isn't a client boundary of its own (Next.js refuses export * in one); each component is.
await esbuild.build({
  entryPoints: names.map((n) => path.join(SRC, `${n}.tsx`)),
  outdir: DIST,
  format: "esm",
  platform: "neutral",
  target: "es2022",
  jsx: "automatic",
  bundle: false,
  banner: { js: '"use client";' },
  logLevel: "warning",
});
await esbuild.build({ entryPoints: [path.join(SRC, "index.ts")], outdir: DIST, format: "esm", platform: "neutral", target: "es2022", bundle: false, logLevel: "warning" });

// Types, from the same copies.
execSync(`node ${JSON.stringify(path.join(root, "node_modules/typescript/bin/tsc"))} -p ${JSON.stringify(path.join(pkg, "tsconfig.json"))}`, { stdio: "inherit" });

/* ---------- the styles ---------- */

// The tokens and materials, as the site writes them for public/ui/basedraft.css.
execSync("node scripts/registry.mjs", { cwd: root, stdio: "ignore" });
const theme = readFileSync(path.join(root, "public/ui/basedraft.css"), "utf8").replace(/^\/\*[\s\S]*?\*\/\s*/, "");

const header = (what) => `/*
 * ${NAME}: ${what}
 * https://basedraft.site/components
 */
`;

// Only the components' own elements, at the lowest priority: your styles win over all of it.
const RESET = `@layer basedraft.base {
  :where([data-bd-ui]),
  :where([data-bd-ui])::before,
  :where([data-bd-ui])::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0 solid;
  }
  :where(button, input, textarea, select)[data-bd-ui] {
    font: inherit;
    font-feature-settings: inherit;
    font-variation-settings: inherit;
    letter-spacing: inherit;
    color: inherit;
    background-color: transparent;
    border-radius: 0;
    opacity: 1;
    appearance: none;
  }
  :where(input, textarea)[data-bd-ui]::placeholder {
    opacity: 1;
    color: color-mix(in oklab, currentcolor 50%, transparent);
  }
  :where(textarea)[data-bd-ui] {
    resize: vertical;
  }
  :where(h1, h2, h3, h4, h5, h6)[data-bd-ui] {
    font-size: inherit;
    font-weight: inherit;
  }
  :where(a)[data-bd-ui] {
    color: inherit;
    text-decoration: inherit;
  }
  :where(code, kbd, pre)[data-bd-ui] {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 1em;
  }
  :where(img)[data-bd-ui] {
    display: block;
    max-width: 100%;
    height: auto;
  }
  :where([data-bd-ui]) > svg {
    display: block;
    vertical-align: middle;
  }
}
`;

// The utilities the components use, compiled by the site's own Tailwind v4, their values written in (no theme variables to clash with yours), in a layer below anything of yours.
const input = `@layer basedraft.theme, basedraft.base, basedraft.utilities;
@import "tailwindcss/theme.css" layer(basedraft.theme) theme(inline);
@import "tailwindcss/utilities.css" layer(basedraft.utilities);
@custom-variant dark (&:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *));
`;
const compiler = await compile(input, { base: pkg, onDependency() {} });
const candidates = new Scanner({ sources: [{ base: UI, pattern: "*.tsx", negated: false }] }).scan();
const utilities = optimize(compiler.build(candidates), { minify: false }).code.replace(/^\/\*![^*]*\*\/\s*/, "");

writeFileSync(path.join(DIST, "theme.css"), `${header("the theme alone, its tokens in light and dark and its materials. For projects that run Tailwind v4 and scan the components themselves (see the README).")}
@layer basedraft.theme {
${theme.trim().replace(/^/gm, "  ")}
}
`);
writeFileSync(
  path.join(DIST, "styles.css"),
  `${header("everything the components need. Import it once; no Tailwind setup needed. Dark mode follows a .dark class or data-theme=\"dark\" on any element above the components.")}
@layer basedraft.theme, basedraft.base, basedraft.utilities;

@layer basedraft.theme {
${theme.trim().replace(/^/gm, "  ")}
}

${RESET}
${utilities}`,
);

/* ---------- the README ---------- */

const GROUP_ORDER = ["Actions", "Forms", "Overlays", "Navigation", "Display", "Data", "Patterns", "Feedback"];
const ENTRIES = path.join(root, "src/registry/entries");
const legacy = JSON.parse(readFileSync(path.join(root, "src/registry/meta.json"), "utf8")).map((m, i) => ({ ...m, order: m.order ?? i }));
const entryMeta = existsSync(ENTRIES) ? readdirSync(ENTRIES).filter((d) => existsSync(path.join(ENTRIES, d, "meta.json"))).map((d) => ({ order: 100, ...JSON.parse(readFileSync(path.join(ENTRIES, d, "meta.json"), "utf8")) })) : [];
const known = [...legacy.filter((m) => !entryMeta.some((e) => e.name === m.name)), ...entryMeta].filter((m) => names.includes(m.name));
// A component whose docs aren't written yet still gets its line, under its own name.
const title = (n) => n.charAt(0).toUpperCase() + n.slice(1).replace(/-/g, " ");
const meta = [...known, ...names.filter((n) => !known.some((m) => m.name === n)).map((n) => ({ name: n, title: title(n), group: "More", description: "", order: 999 }))];
const groups = [...GROUP_ORDER, ...new Set(meta.map((m) => m.group))].filter((g, i, all) => all.indexOf(g) === i && meta.some((m) => m.group === g));
const exportsOf = (n) => [...readFileSync(path.join(UI, `${n}.tsx`), "utf8").matchAll(/export (?:function|const) ([A-Z][A-Za-z0-9]*)/g)].map((m) => m[1]);
const list = groups
  .map(
    (g) => `### ${g}

${meta
  .filter((m) => m.group === g)
  .sort((a, b) => a.order - b.order)
  .map((m) => `- [${m.title}](https://basedraft.site/components/${m.name})${m.description ? `: ${m.description}` : ""} \`${exportsOf(m.name).join("`, `")}\``)
  .join("\n")}`,
  )
  .join("\n\n");
const peers = JSON.parse(readFileSync(path.join(pkg, "package.json"), "utf8")).peerDependencies;

writeFileSync(
  path.join(pkg, "README.md"),
  `# ${NAME}

basedraft UI: React components with a material of their own. Ink, brushed metal, paper and glass, depth from light rather than borders, and motion that springs. ${meta.length} components, accessible, light and dark, with one stylesheet and nothing to configure.

Every component has a live page with its props and examples at [basedraft.site/components](https://basedraft.site/components).

## Install

\`\`\`sh
npm install ${NAME} motion @phosphor-icons/react
\`\`\`

React 19 is required. The package needs ${Object.keys(peers)
    .map((p) => `\`${p}\``)
    .join(", ")} as peers; npm installs React for you if your project doesn't have it.

Import the stylesheet once, at the root of your app:

\`\`\`tsx
import "${NAME}/styles.css";
\`\`\`

It holds everything the components need: the theme's tokens, their materials, and the styles they use. There's no Tailwind setup and no config file. It doesn't reset your page: it only reaches the components' own elements, and it sits in cascade layers, so any style of yours wins over it. The components take your page's font, so set the one you want on \`body\`.

## Use

\`\`\`tsx
import { Button, Switch, Tooltip } from "${NAME}";

export function Publish() {
  return (
    <div className="actions">
      <Switch defaultChecked aria-label="Save each change to GitHub" />
      <Tooltip content="Push to GitHub" keys={["⌘", "S"]}>
        <Button variant="metal">Publish</Button>
      </Tooltip>
    </div>
  );
}
\`\`\`

Each component is also its own entry, if you'd rather import it that way: \`import { Button } from "${NAME}/button"\`.

## Next.js

Works in the App Router as it is. Every component is a client component (each file starts with \`"use client"\`), so you can render them from server components and pages. Import the stylesheet in your root \`app/layout.tsx\`.

## Dark mode

The components follow a \`dark\` class or a \`data-theme="dark"\` attribute on any element above them, usually \`<html>\`. That covers next-themes and most theme switchers as they come. Put \`light\` (or \`data-theme="light"\`) on an element to keep what's inside it light.

## Theming

Colors, shadows and materials are CSS variables, all starting with \`--bd-\`. Set any of them after the stylesheet, on \`:root\` or on any element, and the components follow:

\`\`\`css
:root {
  --bd-accent: oklch(52% 0.17 262);
  --bd-surface: #ffffff;
}
.dark {
  --bd-surface: #141414;
}
\`\`\`

The full list, with their light and dark values, is at the top of \`dist/theme.css\`.

## With Tailwind v4

If your project runs Tailwind v4 and you'd rather it build the components' styles along with yours, import the theme alone and let Tailwind scan the package:

\`\`\`css
@import "tailwindcss";
@import "${NAME}/theme.css";
@source "../node_modules/${NAME}/dist";
\`\`\`

Point \`@source\` at the package from your CSS file's folder. Use either this or \`styles.css\`, not both.

## Components

${list}

## With Claude Code

basedraft's guide for AI coding agents is at [basedraft.site/llms.txt](https://basedraft.site/llms.txt). Point Claude Code at it and it'll reach for these components instead of writing its own.

## License

MIT
`,
);

/* ---------- done ---------- */

const size = (dir) => readdirSync(dir).reduce((n, f) => n + statSync(path.join(dir, f)).size, 0);
console.log(`${NAME}: ${names.length} components, dist ${Math.round(size(DIST) / 1024)} KB (styles.css ${Math.round(statSync(path.join(DIST, "styles.css")).size / 1024)} KB)`);
