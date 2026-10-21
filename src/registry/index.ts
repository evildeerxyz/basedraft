import META from "./meta.json";

/*
 * basedraft UI's facts, for its pages on the server and in the browser alike: what each component
 * is called, where its one file and the shared theme are, the downloads that bring them into a
 * project, and the prompt that hands one to Claude Code.
 */

export type ComponentMeta = { name: string; title: string; group: string; description: string };
export const COMPONENTS = META as ComponentMeta[];
/** The groups, in the order their first component appears. */
export const GROUPS = [...new Set(COMPONENTS.map((c) => c.group))];
export const componentOf = (name: string) => COMPONENTS.find((c) => c.name === name);

export const SITE = "https://basedraft.site";
/** Where a component's one file is, to download or read. */
export const fileUrl = (name: string) => `${SITE}/ui/${name}.tsx`;
/** The theme every component reads: basedraft's tokens and materials, light and dark. */
export const THEME_URL = `${SITE}/ui/basedraft.css`;
/** The download that brings a component into a project, as one plain curl, no tool to install. */
export const installCommand = (name: string) => `curl -fsSL --create-dirs -o components/basedraft/${name}.tsx ${fileUrl(name)}`;
/** The same for the theme, once per project. */
export const themeCommand = `curl -fsSL --create-dirs -o app/basedraft.css ${THEME_URL}`;

/** The prompt Claude Code needs to add a component: where the file is, the theme it reads, and how to use it. */
export const claudePrompt = (c: ComponentMeta) =>
  `Add basedraft's ${c.title} component to this project. Download ${fileUrl(c.name)} to components/basedraft/${c.name}.tsx; it's one self-contained file. If the project doesn't have basedraft's theme yet, download ${THEME_URL} next to the global stylesheet and import it there once, after Tailwind. Install whichever of motion and @phosphor-icons/react the file imports and the project lacks. Then import it from "@/components/basedraft/${c.name}" where it's needed. Its props and an example are at ${SITE}/components/${c.name}.`;

/** The same for the whole set, pointing Claude Code at llms.txt so it can choose for itself. */
export const claudePromptAll = `Read ${SITE}/llms.txt. It lists basedraft UI, a free library of React components, each one file to download, and the theme file they share. When this project needs one of them (a button, switch, tabs, slider and the rest), download it instead of writing it by hand, add basedraft.css once, and import it from "@/components/basedraft/<name>".`;
