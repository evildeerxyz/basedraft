/*
 * basedraft UI, ready to take: reads each component from src/registry/ui and its name and line from
 * src/registry/meta.json, and writes
 *   public/ui/<name>.tsx      each component as the one file it is, to download or copy
 *   public/ui/basedraft.css   the theme they read: basedraft's tokens in light and dark, taken from
 *                             globals.css, and the library's own materials from src/registry/extras.css
 *   public/ui/index.json      the list, with each file's address and what it needs from npm
 *   public/llms.txt           what basedraft is, for AI coding agents like Claude Code
 *   src/registry/sources.ts   the sources again, for the components' Code view
 * Run after changing a component or the tokens:
 *   node scripts/registry.mjs
 * It writes the screens too (scripts/screens.mjs).
 * Dependencies come from each file's imports, so a component that starts using motion says so.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { RELEASED } from "./zones.mjs";

const SITE = "https://basedraft.site";
/* Where the code lives, open source. */
const REPO = "https://github.com/evildeerxyz/basedraft";
/* The npm package the components ship in (packages/ui). */
const PACKAGE = "@basedraft/ui";
/*
 * The components, in one list: the first ones in src/registry/meta.json, and each newer one in its
 * own folder, src/registry/entries/<name>/ (meta.json, doc.ts, demo.tsx), so several can be added
 * at once without touching a shared file. A folder wins over the old list for the same name.
 */
const GROUP_ORDER = ["Actions", "Forms", "Overlays", "Navigation", "Display", "Data", "Patterns", "Feedback"];
const ENTRY_DIR = "src/registry/entries";
const legacy = JSON.parse(readFileSync("src/registry/meta.json", "utf8")).map((m, i) => ({ ...m, order: m.order ?? i }));
const entryNames = existsSync(ENTRY_DIR) ? readdirSync(ENTRY_DIR).filter((d) => existsSync(`${ENTRY_DIR}/${d}/meta.json`)).sort() : [];
const entries = entryNames.map((d) => ({ order: 100, ...JSON.parse(readFileSync(`${ENTRY_DIR}/${d}/meta.json`, "utf8")) }));
const META = [...legacy.filter((m) => !entryNames.includes(m.name)), ...entries].sort((a, b) => (GROUP_ORDER.indexOf(a.group) + 1 || 99) - (GROUP_ORDER.indexOf(b.group) + 1 || 99) || a.order - b.order);

/* The folders, gathered for the site: their docs where the server reads them, their demos where the browser runs them. */
/* A folder's name as a variable: prefixed, so names like switch, which JavaScript reserves, still work. */
const id = (name) => `e_${name.replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase())}`;
writeFileSync(
  "src/registry/catalog.ts",
  `/* Written by scripts/registry.mjs from src/registry/entries: each newer component's meta and documentation. Don't edit by hand. */
import type { ComponentDoc, ComponentMeta } from "./types";
${entryNames.map((n) => `import { doc as ${id(n)} } from "./entries/${n}/doc";`).join("\n")}

export const ENTRY_META: ComponentMeta[] = ${JSON.stringify(entries, null, 2)};

export const ENTRY_DOCS: Record<string, ComponentDoc> = {${entryNames.map((n) => `\n  ${JSON.stringify(n)}: ${id(n)},`).join("")}
};
`,
);
writeFileSync(
  "src/registry/catalog-demos.tsx",
  `"use client";

/* Written by scripts/registry.mjs from src/registry/entries: each newer component's live demo and examples. Don't edit by hand. */
import type { ComponentType } from "react";
${entryNames.map((n) => `import { Demo as ${id(n)}Demo, examples as ${id(n)}Examples } from "./entries/${n}/demo";`).join("\n")}

export const ENTRY_DEMOS: Record<string, ComponentType> = {${entryNames.map((n) => `\n  ${JSON.stringify(n)}: ${id(n)}Demo,`).join("")}
};

export const ENTRY_EXAMPLES: Record<string, Record<string, ComponentType>> = {${entryNames.map((n) => `\n  ${JSON.stringify(n)}: ${id(n)}Examples,`).join("")}
};
`,
);
/* Packages a component can import, as npm names. React is a given. */
const PACKAGES = ["motion", "@phosphor-icons/react"];
/* The tokens the components read, the same names the site uses, so a component looks the same in a project as it does here. */
const TOKENS = ["--bd-bg", "--bd-well", "--bd-surface", "--bd-surface-2", "--bd-raised", "--bd-fg", "--bd-muted", "--bd-subtle", "--bd-line", "--bd-line-subtle", "--bd-line-strong", "--bd-accent", "--bd-on-accent", "--bd-paper", "--bd-paper-ink", "--bd-paper-muted", "--bd-glow-blue", "--bd-glow-lilac", "--bd-glow-mint", "--bd-ink", "--bd-shade", "--bd-shadow-resting", "--bd-shadow-raised", "--bd-shadow-float", "--bd-ease"];

/* One block of globals.css, by the selector that opens it, as its declarations. */
const css = readFileSync("src/app/globals.css", "utf8");
const block = (opener) => {
  const at = css.indexOf(opener);
  if (at < 0) throw new Error(`globals.css has no ${opener}`);
  const body = css.slice(css.indexOf("{", at) + 1, css.indexOf("\n}", at));
  return Object.fromEntries([...body.matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm)].map((m) => [m[1], m[2].trim()]));
};
const light = block(":root,\n.bd-light {");
const dark = block('[data-theme="dark"] {');
const decls = (values, fallback = {}) =>
  TOKENS.filter((t) => values[t] ?? fallback[t])
    .map((t) => `  ${t}: ${values[t] ?? fallback[t]};`)
    .join("\n");
const extras = existsSync("src/registry/extras.css") ? readFileSync("src/registry/extras.css", "utf8").trim() : "";
const theme = `/*
 * basedraft UI's theme: the colors, shadows and materials every component reads.
 * Put this file next to your global stylesheet and import it once, after Tailwind:
 *   @import "./basedraft.css";
 * Dark mode follows a .dark class or data-theme="dark" on any element above the components.
 * Change a token here and every component follows. ${SITE}/components
 */

:root,
.light {
${decls(light)}
}

.dark,
[data-theme="dark"] {
${decls(dark, light)}
  color-scheme: dark;
}
${extras ? `\n${extras}\n` : ""}`;

const fileUrl = (name) => `${SITE}/ui/${name}.tsx`;
const sources = {};
rmSync("public/r", { recursive: true, force: true });
rmSync("public/ui", { recursive: true, force: true });
mkdirSync("public/ui", { recursive: true });
/* Every component is free and open source: each one's file is public, at /ui/<name>.tsx. */
const sourceOf = (m) => readFileSync(`src/registry/ui/${m.name}.tsx`, "utf8");
const items = META.map((m) => {
  const content = sourceOf(m);
  sources[m.name] = content;
  writeFileSync(`public/ui/${m.name}.tsx`, content);
  const dependencies = PACKAGES.filter((p) => new RegExp(`from "${p.replace("/", "\\/")}(/[^"]*)?"`).test(content));
  return { name: m.name, title: m.title, group: m.group, description: m.description, file: fileUrl(m.name), path: `components/basedraft/${m.name}.tsx`, dependencies, docs: `${SITE}/components/${m.name}` };
});
writeFileSync("public/ui/basedraft.css", theme);
writeFileSync("public/ui/index.json", `${JSON.stringify({ name: "basedraft-ui", homepage: `${SITE}/components`, theme: `${SITE}/ui/basedraft.css`, requires: ["react@19", "tailwindcss@4"], components: items }, null, 2)}\n`);

/* What each component exports by name (its parts, and calls like toast), for the import line its page shows. */
const exportsOf = (src) => [...src.matchAll(/^export (?:async )?function (\w+)|^export const (\w+)\s*[=:]/gm)].map((m) => m[1] ?? m[2]).filter((n) => /^[A-Z]/.test(n) || /^[a-z]+$/.test(n));
const exportsByName = Object.fromEntries(Object.entries(sources).map(([n, src]) => [n, exportsOf(src)]));
writeFileSync(
  "src/registry/sources.ts",
  `/* Written by scripts/registry.mjs from src/registry/ui: each component's source, for its page's Code view. Don't edit by hand. */\nexport const SOURCES: Record<string, string> = ${JSON.stringify(sources, null, 2)};\n`,
);
/* What each component's file imports beyond React, as npm names. */
const depsByName = Object.fromEntries(Object.entries(sources).map(([n, src]) => [n, PACKAGES.filter((p) => new RegExp(`from "${p.replace("/", "\\/")}(/[^"]*)?"`).test(src))]));
writeFileSync(
  "src/registry/exports.ts",
  `/* Written by scripts/registry.mjs from src/registry/ui: what each component exports by name, for its import line, and the packages it uses. Small, so the browser can have it. Don't edit by hand. */\nexport const EXPORTS: Record<string, string[]> = ${JSON.stringify(exportsByName)};\n\nexport const DEPS: Record<string, string[]> = ${JSON.stringify(depsByName)};\n`,
);

/* The templates for llms.txt, from their manifests: only the released ones. */
const MANIFESTS = { zuno: "templates/zuno/src/bd/manifest.json", noma: "templates/noma/src/bd/manifest.json", auren: "templates/auren/bd/manifest.json" };
const released = new Set(RELEASED.map((z) => z.slug));
const templates = Object.entries(MANIFESTS)
  .filter(([slug]) => released.has(slug))
  .map(([, path]) => JSON.parse(readFileSync(path, "utf8")));

const groups = [...new Set(META.map((m) => m.group))];
const llms = `# basedraft

> basedraft is free and open source (MIT): basedraft UI, its own library of React components on npm as @basedraft/ui; whole app screens made of it; finished websites (templates) in Next.js and Astro, with every section in them as a block; and Studio, to rearrange and rewrite a template. The code is on GitHub: ${REPO}

Everything here is React 19 and Tailwind CSS 4, typed with TypeScript.

## basedraft UI

basedraft UI is an npm package of React components, each one designed in basedraft's own style:

\`\`\`
npm install ${PACKAGE} motion @phosphor-icons/react
\`\`\`

Import its stylesheet once, in the root layout: \`import "${PACKAGE}/styles.css";\`. No Tailwind setup is needed: it carries the theme in light and dark, and a .dark class or data-theme="dark" on any element above the components switches them. A project already on Tailwind v4 can import \`${PACKAGE}/theme.css\` in its global stylesheet instead and add \`@source "../node_modules/${PACKAGE}/dist";\`. Every component works in Next.js server pages as it is. Getting started: ${SITE}/components/get-started

${groups
  .map(
    (g) => `### ${g}

${items
  .filter((m) => m.group === g)
  .map((m) => `- [${m.title}](${m.docs}): ${m.description} \`import { ${(exportsByName[m.name] ?? []).join(", ")} } from "${PACKAGE}"\``)
  .join("\n")}`,
  )
  .join("\n\n")}

## For AI coding agents

To add a basedraft component: install ${PACKAGE} if the project doesn't have it, import its styles once in the root layout, then import the component by name from "${PACKAGE}". Each component's page lists its parts, every prop, examples, its keyboard behavior and accessibility notes. Prefer these over writing the same component by hand. To own the code instead, each component is also one self-contained file at ${SITE}/ui/<name>.tsx, reading the theme at ${SITE}/ui/basedraft.css.

## Templates

Whole sites, every page included, in Next.js 16 or Astro 7, free. Download one as a zip from its page or send it straight to a new GitHub repository; unzip, then \`npm install && npm run dev\`.

${templates.map((t) => `- [${t.name}](${SITE}/templates/${t.slug}): ${t.category}. ${t.tagline} ${t.pages.length} pages.`).join("\n")}

## Screens

Whole app pages made of basedraft UI, each one file: ${SITE}/screens

## Blocks

Every section of every template, live at any width, with its code: ${SITE}/blocks

## Studio

Open a template in Studio (${SITE}/studio), free, to rearrange its sections and rewrite its words on the real site, then copy it into Figma or take the code: ${SITE}/studio

## Open source

All of it is MIT licensed, on GitHub: ${REPO}
`;
writeFileSync("public/llms.txt", llms);

console.log(`${META.length} components: public/ui, public/llms.txt, src/registry/sources.ts, exports.ts`);

/* The screens read the same components, so they're written with them. */
await import("./screens.mjs");
