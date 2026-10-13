/*
 * Writing a text edit into source code: the words as the template wrote them, found where they
 * stand as text (between tags, or as a whole string), changed to the new words in the form that
 * place needs. The same rules as basedraft/apply-edits.mjs, the script a download ships with.
 */

const escape = (s: string) => s.replace(/[.*+?^$(){}|[\]\\]/g, "\\$&");
// Text between tags can't hold braces or angle brackets as they are; a string can't hold its own quote.
const inJsx = (s: string) => s.replace(/[{}<>]/g, (c) => ({ "{": "&#123;", "}": "&#125;", "<": "&lt;", ">": "&gt;" })[c]!);
const inQuote = (s: string, q: string) => s.split(q).join("\\" + q);
// A JSX attribute ("lead=...") reads no backslashes, so its quotes are written as entities.
const inAttr = (s: string) => s.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const QUOTES = "\"'`";

/** Files an edit can land in. */
export const EDITABLE = /\.(tsx|ts|jsx|js|mdx|md|json)$/;

/** `src` with `from` changed to `to` wherever it stands as text, or null when it isn't there. */
export function rewriteText(src: string, from: string, to: string): string | null {
  const words = from.split(/\s+/).map(escape).join("\\s+");
  const re = new RegExp("([" + QUOTES + ">]\\s*)" + words + "(\\s*[" + QUOTES + "<{])", "g");
  if (!re.test(src)) return null;
  re.lastIndex = 0;
  const put = (a: string, at: number, all: string) => (a.trim() === ">" ? inJsx(to) : all[at - 1] === "=" ? inAttr(to) : inQuote(to, a.trim()));
  return src.replace(re, (_, a: string, b: string, at: number, all: string) => a + put(a, at, all) + b);
}

/** Every edit written into the text files given, and where each landed. */
export function rewriteAll(files: Map<string, string>, edits: Array<{ from: string; to: string }>) {
  const report: Array<{ from: string; to: string; files: string[] }> = [];
  for (const e of edits) {
    const hits: string[] = [];
    for (const [path, src] of files) {
      if (!EDITABLE.test(path)) continue;
      const next = rewriteText(src, e.from, e.to);
      if (next === null) continue;
      files.set(path, next);
      hits.push(path);
    }
    report.push({ ...e, files: hits });
  }
  return report;
}
