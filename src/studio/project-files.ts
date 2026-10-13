import { sectionOf, templateOf } from "@/site/live";
import type { TextEdit } from "@/site/text-edits";
import { idOf, type Page, type Project, type SitePage } from "./state";
import { COLORS, FONTS, paletteOf, themeCss } from "@/site/theme";

/*
 * A Studio project as files, for the template's own project. Plain functions, so the server
 * builds the same files when it sends a project to GitHub or packs the whole site.
 */

/*
 * The page as code for its own template: the sections' imports, merged by file, then each tag in
 * order. The template's layout already draws the nav and footer, so those are left to it.
 */
export function pageCode(page: Page) {
  const t = templateOf(page.template)!;
  const sections = page.keys.map((k) => sectionOf(page.template, idOf(k))).filter((s) => s && s.kind !== "nav" && s.kind !== "footer") as NonNullable<ReturnType<typeof sectionOf>>[];
  const byFile = new Map<string, Set<string>>();
  for (const s of sections) {
    const m = s.import.match(/^import \{ (.+) \} from "(.+)";$/);
    if (!m) continue;
    const names = byFile.get(m[2]) ?? new Set<string>();
    m[1].split(",").forEach((n) => names.add(n.trim()));
    byFile.set(m[2], names);
  }
  const imports = [...byFile].map(([file, names]) => `import { ${[...names].sort().join(", ")} } from "${file}";`).join("\n");
  const body = sections.map((s) => `      ${s.tag}`).join("\n");
  return `${imports}

/*
 * ${page.name}, made in basedraft Studio from ${t.name}'s own sections.
 * The template's layout already draws the nav and footer around it.
 */
export default function Page() {
  return (
    <>
${body}
    </>
  );
}
`;
}

/** Where a page's file goes in the template's own project. */
export const pageFile = (page: SitePage) => `${templateOf(page.template)!.pagesDir}${page.path === "/" ? "" : page.path}/page.tsx`;

/** The edits as the words they change, without Studio's bookkeeping. */
export const editList = (edits: TextEdit[]) => [...new Map(edits.map((e) => [`${e.from}\u0000${e.to}`, { from: e.from, to: e.to }])).values()];

/**
 * A script that writes Studio's text edits into the template's code, run from the project's root.
 * It changes text only where it reads exactly as the template wrote it, in a string or between
 * tags, and says where each change landed.
 */
export const EDITS_SCRIPT = String.raw`#!/usr/bin/env node
/*
 * Text you changed in basedraft Studio, written into this project's code.
 * From the project's root:  node basedraft/apply-edits.mjs
 * It only changes text that still reads as the template wrote it, and lists every change.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

const edits = JSON.parse(readFileSync(new URL("./edits.json", import.meta.url), "utf8"));
const skip = new Set(["node_modules", ".next", ".git", "basedraft", "public"]);
const files = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    if (skip.has(f)) continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if ([".tsx", ".ts", ".jsx", ".js", ".mdx", ".md", ".json"].includes(extname(p))) files.push(p);
  }
})(process.cwd());

const escape = (s) => s.replace(/[.*+?^$(){}|[\]\\]/g, "\\$&");
// Text between tags can't hold braces or angle brackets as they are; a string can't hold its own quote.
const inJsx = (s) => s.replace(/[{}<>]/g, (c) => ({ "{": "&#123;", "}": "&#125;", "<": "&lt;", ">": "&gt;" })[c]);
const inQuote = (s, q) => s.split(q).join("\\" + q);
// A JSX attribute ("lead=...") reads no backslashes, so its quotes are written as entities.
const inAttr = (s) => s.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const QUOTES = "\"'" + String.fromCharCode(96);

for (const e of edits) {
  const words = e.from.split(/\s+/).map(escape).join("\\s+");
  const re = new RegExp("([" + QUOTES + ">]\\s*)" + words + "(\\s*[" + QUOTES + "<{])", "g");
  const hits = [];
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    if (!re.test(src)) continue;
    re.lastIndex = 0;
    const put = (a, at, all) => (a.trim() === ">" ? inJsx(e.to) : all[at - 1] === "=" ? inAttr(e.to) : inQuote(e.to, a.trim()));
    writeFileSync(f, src.replace(re, (_, a, b, at, all) => a + put(a, at, all) + b));
    hits.push(relative(process.cwd(), f));
  }
  console.log(hits.length ? 'Changed "' + e.from + '" to "' + e.to + '" in ' + hits.join(", ") : 'Not found, change it by hand: "' + e.from + '"');
}
`;

/** The project's style (colors, type, corners) as CSS for the end of the template's globals.css, or "" when it has the template's own. */
export function colorsCss(project: Project) {
  const css = themeCss(project.template, project.theme, "code");
  if (!css) return "";
  const c = COLORS[project.template];
  const t = project.theme ?? {};
  const p = paletteOf(project.template, t)!;
  const lines = [`Colors: accent ${p.accent}, page ${p.page}, cards ${p.cards}, text ${p.text}.`];
  if (c.dark && t.dark) {
    const d = paletteOf(project.template, t, "dark")!;
    lines.push(`Dark mode: accent ${d.accent}, page ${d.page}, cards ${d.cards}, text ${d.text}.`);
  }
  const fonts = [t.font && `${FONTS[t.font].label} for text`, t.headings && `${FONTS[t.headings].label} for headings`].filter(Boolean);
  if (fonts.length) lines.push(`Type: ${fonts.join(", ")}. Load ${fonts.length > 1 ? "them" : "it"} with next/font in ${c.font.layout} (Download project and GitHub do it for you).`);
  if (t.radius !== undefined && t.radius !== 1) lines.push(`Corners: ${Math.round(t.radius * 100)}% of the template's.`);
  return `/*
 * Style from basedraft Studio.
${lines.map((l) => ` * ${l}`).join("\n")}
 * Add this to the end of ${c.globals}, after the template's own styles.
 */
${css}`;
}

/** Everything a project downloads as: a file per page you built, and your text edits with the script that applies them. */
export function projectFiles(project: Project) {
  const t = templateOf(project.template)!;
  const files: Record<string, string> = {};
  for (const p of project.pages) files[pageFile(p)] = pageCode(p);
  const edits = editList(project.edits);
  if (edits.length) {
    files["basedraft/edits.json"] = JSON.stringify(edits, null, 2) + "\n";
    files["basedraft/apply-edits.mjs"] = EDITS_SCRIPT;
  }
  const colors = colorsCss(project);
  if (colors) files["basedraft/colors.css"] = colors;
  files["basedraft/project.json"] = JSON.stringify({ template: project.template, name: project.name, pages: project.pages.map((p) => ({ name: p.name, path: p.path, sections: p.keys.map(idOf) })), edits, ...(project.theme ? { colors: project.theme } : {}) }, null, 2) + "\n";
  files["basedraft/README.md"] = `# ${project.name}

Made in basedraft Studio from ${t.name}. Copy these files into your ${t.name} project, keeping their folders.

${project.pages.map((p) => `- \`${pageFile(p)}\`: ${p.name}, ${p.keys.length} sections`).join("\n")}
${colors ? `\nYour colors, type and corners are in \`basedraft/colors.css\`: add it to the end of \`${COLORS[project.template].globals}\` (or import it there, after everything else) and the whole site takes them.\n` : ""}${edits.length ? `\nYou changed ${edits.length} ${edits.length === 1 ? "piece" : "pieces"} of text. To write them into the template's code, run this from the project's root:\n\n    node basedraft/apply-edits.mjs\n\nIt changes text only where it still reads as the template wrote it, and lists every change.\n` : ""}
\`basedraft/project.json\` loads back into Studio.
`;
  return files;
}
