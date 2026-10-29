import { ENTRY_META } from "./catalog";
import { EXPORTS } from "./exports";
import META from "./meta.json";
import type { ComponentMeta } from "./types";

/*
 * basedraft UI's facts, for its pages on the server and in the browser alike: what each component
 * is called, the npm package they ship in and how to install and import it, where each one's file
 * is for anyone who'd rather own the code, and the prompts that hand them to Claude Code.
 */

export type { ComponentMeta } from "./types";

/** The groups, in the order the gallery and the docs show them. */
const GROUP_ORDER = ["Actions", "Forms", "Overlays", "Navigation", "Display", "Data", "Patterns", "Feedback"];
const rank = (g: string) => GROUP_ORDER.indexOf(g) + 1 || 99;
const inEntries = new Set(ENTRY_META.map((m) => m.name));

/** Every component: the first ones from meta.json, each newer one from its folder in entries/, by group and then order. */
export const COMPONENTS: ComponentMeta[] = [...(META as ComponentMeta[]).map((m, i) => ({ ...m, order: m.order ?? i })).filter((m) => !inEntries.has(m.name)), ...ENTRY_META.map((m) => ({ ...m, order: m.order ?? 100 }))].sort((a, b) => rank(a.group) - rank(b.group) || (a.order ?? 0) - (b.order ?? 0));
/** The groups that have components, in order. */
export const GROUPS = GROUP_ORDER.filter((g) => COMPONENTS.some((c) => c.group === g)).concat([...new Set(COMPONENTS.map((c) => c.group))].filter((g) => !GROUP_ORDER.includes(g)));
export const componentOf = (name: string) => COMPONENTS.find((c) => c.name === name);

/** How long a component counts as new: this many days after the newest one was added. */
const NEW_DAYS = 30;
const day = (d: string) => Date.parse(`${d}T00:00:00Z`);
const newest = Math.max(0, ...COMPONENTS.map((c) => (c.added ? day(c.added) : 0)));
/** Whether a component wears the New tag: added within NEW_DAYS of the newest. Counted from the components, not the clock, so every page and build agrees. */
export const isNew = (c: { added?: string }) => !!c.added && newest - day(c.added) <= NEW_DAYS * 86_400_000;

export const SITE = "https://basedraft.site";
/** The npm package the components ship in (packages/ui). */
export const PACKAGE = "@basedraft/ui";
/** What the package leans on, which a project may already have. */
export const PEERS = ["motion", "@phosphor-icons/react"];
/** How each package manager adds a package. */
export const ADD = { npm: "npm install", pnpm: "pnpm add", bun: "bun add", yarn: "yarn add" } as const;
export type Runner = keyof typeof ADD;
/** The one install for the whole library, with its peers. */
export const installCommand = (runner: Runner = "npm") => `${ADD[runner]} ${PACKAGE} ${PEERS.join(" ")}`;
/** The stylesheet, imported once in the root layout. */
export const stylesImport = `import "${PACKAGE}/styles.css";`;
/** A component's import line, from what its file exports: from the package, or for a Pro component from its file in the project. */
export const importLine = (name: string) => {
  const names = (EXPORTS[name] ?? [name.replace(/(^|-)(\w)/g, (_, __, c: string) => c.toUpperCase())]).join(", ");
  return componentOf(name)?.pro ? `import { ${names} } from "@/components/basedraft/${name}";` : `import { ${names} } from "${PACKAGE}";`;
};

/** Where a component's one file is, for anyone who'd rather own the code than install the package. */
export const fileUrl = (name: string) => `${SITE}/ui/${name}.tsx`;
/** The theme that file reads: basedraft's tokens and materials, light and dark. */
export const THEME_URL = `${SITE}/ui/basedraft.css`;

/** The prompt Claude Code needs to add a component: the package, its styles once, and the import. */
export const claudePrompt = (c: ComponentMeta) =>
  c.pro
    ? `Add basedraft's ${c.title}, a Pro component. I'm pasting its file: save it as components/basedraft/${c.name}.tsx. If the project doesn't have basedraft's theme yet, run \`${installCommand()}\` and add \`@import "${PACKAGE}/theme.css";\` to the global stylesheet after Tailwind (Tailwind CSS 4 is needed for this file). Then use it where it's needed: \`${importLine(c.name)}\`. Its parts, props, examples and keyboard behavior are at ${SITE}/components/${c.name}.`
    : `Add basedraft's ${c.title} component to this project. If the project doesn't have the ${PACKAGE} package yet, run \`${installCommand()}\` and add \`${stylesImport}\` once to the root layout. Then use it where it's needed: \`${importLine(c.name)}\`. Its parts, props, examples and keyboard behavior are at ${SITE}/components/${c.name}.`;

/** The same for the whole set, pointing Claude Code at llms.txt so it can choose for itself. */
export const claudePromptAll = `Read ${SITE}/llms.txt. It describes basedraft UI, the ${PACKAGE} npm package of React components. When this project needs one of them (a button, dialog, select, toast, tabs and the rest), install ${PACKAGE} with its peers if it isn't there, import "${PACKAGE}/styles.css" once in the root layout, and use the components instead of writing them by hand.`;
