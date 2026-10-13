import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { rewriteAll } from "@/lib/rewrite-text";
import { SKIP_DIRS, skipFile, TEMPLATE_DIRS, TEMPLATE_FILES } from "../../scripts/template-source.mjs";
import { templateOf, type LiveTemplate } from "@/site/live";
import { editList, pageCode, pageFile, projectFiles } from "@/studio/project-files";
import type { Project } from "@/studio/state";
import { COLORS, themeCode, themeCss } from "@/site/theme";

/*
 * A Studio project as a whole site: the template's own code, as its buyer gets it, with the pages
 * you built written in as its pages and the text you changed written into its code. This is what
 * a new GitHub repository starts from and what "Download project" packs.
 *
 * The templates are read from templates/<slug> as they sit in this repo: the files and folders in
 * scripts/template-source.mjs, minus what only basedraft needs to serve them (their bd/ folders,
 * and the base path that puts them under /live/<slug>). On Cloudflare there's no disk: the same
 * files are in a private KV namespace, one bundle per template, put there by scripts/cf-deploy.mjs.
 */

export type Files = Map<string, Uint8Array | string>;

const ROOT = path.join(process.cwd(), "templates");


const utf8 = new TextDecoder("utf-8", { fatal: true });
/** A file's text, or null for an image, a font or anything else that isn't text. */
function asText(buf: Uint8Array) {
  if (buf.includes(0)) return null;
  try {
    return utf8.decode(buf);
  } catch {
    return null;
  }
}

/** Where basedraft's own wiring sits in a template: its bd/ folder beside app/, and app/bd/. */
function plumbing(t: LiveTemplate) {
  const app = t.pagesDir.replace(/\(site\)\/?$/, "");
  const src = app.replace(/app\/$/, "");
  return [`${src}bd/`, `${app}bd/`];
}

/** A layout without basedraft's wiring: its import, and the wrapper around the page. */
const unwire = (src: string) => src.replace(/^import \{ BdFrame \} from "@\/bd\/frame";[^\n]*\n/m, "").replace(/<BdFrame>\{children\}<\/BdFrame>/g, "{children}");

/** next.config without basedraft's wiring: the base path that serves it under /live/<slug>, and its static build for Cloudflare. */
const standalone = (config: string) =>
  config
    .replace(/^[ \t]*\/\/ Served by basedraft[^\n]*\n/gim, "")
    .replace(/^[ \t]*basePath:[^\n]*\n/m, "")
    .replace(/^[ \t]*\.\.\.\(process\.env\.BD_STATIC[^\n]*\n/m, "");

async function walk(dir: string, rel = ""): Promise<string[]> {
  const out: string[] = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    // At the root, only what a buyer gets.
    if (!rel && !(e.isDirectory() ? TEMPLATE_DIRS : TEMPLATE_FILES).includes(e.name)) continue;
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) out.push(...(await walk(path.join(dir, e.name), r)));
    } else if (e.isFile() && !skipFile(e.name)) out.push(r);
  }
  return out;
}

/** A template's files, as bytes: from KV on Cloudflare (BD_SOURCE=kv), from disk otherwise. */
async function readTemplate(slug: string, dir: string): Promise<Array<[string, Uint8Array]>> {
  if (process.env.BD_SOURCE === "kv") {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    const kv = (env as unknown as { TEMPLATES: { get: (key: string, type: "json") => Promise<unknown> } }).TEMPLATES;
    const bundle = (await kv.get(`source:${slug}`, "json")) as { files: Record<string, string> } | null;
    if (!bundle) throw new Error(`${slug}'s files aren't in the template store yet.`);
    return Object.entries(bundle.files)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([rel, b64]) => [rel, Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))]);
  }
  const out: Array<[string, Uint8Array]> = [];
  for (const rel of (await walk(dir)).sort()) out.push([rel, new Uint8Array(await readFile(path.join(dir, rel)))]);
  return out;
}

/** A template's code as its buyer gets it. */
export async function templateSource(slug: string): Promise<Files> {
  const t = templateOf(slug);
  if (!t) throw new Error(`No template called ${slug}`);
  const dir = path.join(ROOT, t.slug);
  const off = plumbing(t);
  const files: Files = new Map();
  for (const [rel, buf] of await readTemplate(t.slug, dir)) {
    if (off.some((p) => rel.startsWith(p))) continue;
    files.set(rel, asText(buf) ?? buf);
  }
  const config = files.get("next.config.ts");
  if (typeof config === "string") files.set("next.config.ts", standalone(config));
  // basedraft's wiring in the root layout (it lets Studio recolor the template's own pages) comes out.
  for (const [rel, v] of files) if (typeof v === "string" && v.includes("@/bd/frame")) files.set(rel, unwire(v));
  return files;
}

/** The name in a template's package.json, which a copy of it keeps. */
export async function packageNameOf(slug: string) {
  const t = templateOf(slug);
  if (!t) return undefined;
  const pkg = (await readTemplate(t.slug, path.join(ROOT, t.slug))).find(([rel]) => rel === "package.json")?.[1];
  return pkg ? (JSON.parse(new TextDecoder().decode(pkg)) as { name?: string }).name : undefined;
}

const isText = (v: Uint8Array | string | undefined): v is string => typeof v === "string";

/** The project's pages and its text edits, written over a copy of the site in `files`. */
export function writeProject(files: Files, project: Project) {
  for (const p of project.pages) files.set(pageFile(p), pageCode(p));
  const text = new Map([...files].filter((e): e is [string, string] => isText(e[1]) && !e[0].startsWith("basedraft/")));
  const report = rewriteAll(text, editList(project.edits));
  for (const [k, v] of text) files.set(k, v);
  // Your colors, after the template's own, so its variables take them.
  const css = themeCss(project.template, project.theme);
  const globals = COLORS[project.template]?.globals;
  const sheet = globals ? files.get(globals) : undefined;
  if (css && globals && typeof sheet === "string") files.set(globals, `${sheet.replace(/\n*\/\* Colors from basedraft Studio[\s\S]*$/, "")}\n\n/* Colors from basedraft Studio */\n${css}`);
  // And the colors the template keeps in code for its JS drawings (shaders, charts).
  for (const [file, src] of themeCode(project.template, project.theme, (f) => (isText(files.get(f)) ? (files.get(f) as string) : undefined))) files.set(file, src);
  files.set("basedraft/project.json", projectFiles(project)["basedraft/project.json"]);
  return report;
}

/** The whole site for a project, ready to run: `npm install`, then `npm run dev`. */
export async function siteFiles(project: Project) {
  const t = templateOf(project.template)!;
  const files = await templateSource(project.template);
  const report = writeProject(files, project);
  files.set("basedraft/README.md", readme(project, t, report));
  return { files, report };
}

function readme(project: Project, t: LiveTemplate, report: ReturnType<typeof writeProject>) {
  const missed = report.filter((r) => !r.files.length);
  return `# ${project.name}

Made in [basedraft](https://basedraft.site) Studio from ${t.name}. It's the template's own Next.js code, with your pages and your text written in.

    npm install
    npm run dev

Your pages:

${project.pages.map((p) => `- \`${p.path}\` ${p.name}: \`${pageFile(p)}\``).join("\n")}
${report.length ? `\nYour text, written into the code: ${report.length - missed.length} of ${report.length} ${report.length === 1 ? "change" : "changes"}.\n` : ""}${missed.length ? `\nThese didn't match the code as written, so change them by hand:\n\n${missed.map((m) => `- "${m.from}" to "${m.to}"`).join("\n")}\n` : ""}
\`basedraft/project.json\` opens this project in Studio again.
`;
}
