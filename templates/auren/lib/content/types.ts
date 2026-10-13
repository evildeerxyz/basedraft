/** Structured long-form content shared by docs, blog posts and legal pages. */
export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string; id: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; code: string; title?: string }
  | { type: "callout"; text: string; tone?: "note" | "tip" | "warn" }
  | { type: "quote"; text: string; cite?: string }
  | { type: "table"; head: string[]; rows: string[][] };

export const headings = (blocks: Block[]) =>
  blocks.flatMap((b) => (b.type === "h2" ? [{ id: b.id, text: b.text }] : []));
