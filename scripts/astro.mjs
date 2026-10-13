/*
 * A template as an Astro project. basedraft's templates are Next.js apps; this turns one (its code
 * as a buyer gets it, with a Studio project's pages, text, style and images already written in)
 * into an Astro 7 site that draws exactly the same pages:
 *
 * - Every component, hook, style and asset is the template's own, unchanged. Astro renders each
 *   page with the template's React components as one island, so every animation, shader and
 *   interaction works as it does in the Next.js version.
 * - Next's routes (app/) become Astro's: each page.tsx gets a page in src/pages, an island in
 *   src/islands that draws it inside its layouts, and its metadata as real head tags. The route
 *   files themselves move to src/routes, unchanged apart from dynamic pages, which read their
 *   params with React's use() instead of await (Astro renders them as components, not on a server).
 * - What components import from Next (next/link, next/navigation, next/dynamic, next/og) resolves to
 *   small stand-ins in src/next, so no component needed rewriting.
 * - Fonts load through Astro's fonts API, under the same CSS variables next/font set.
 *
 * Shared by the server (Download project and Send to GitHub, in Astro) and by scripts that build
 * and check the result. Pure functions over a file map: no disk, no network.
 */

const ASTRO = "^7.3.8";
const VERSIONS = {
  astro: ASTRO,
  "@astrojs/react": "^7.0.1",
  "@astrojs/check": "^0.9.10",
  "@tailwindcss/vite": "^4.3.3",
  tailwindcss: "^4.3.3",
  satori: "^0.54.0",
  "@resvg/resvg-js": "^2.6.2",
};

/** Weight ranges of the variable fonts the templates (and Studio's type choices) use, as Google serves them. */
const WEIGHTS = {
  Geist: "100 900",
  "Geist Mono": "100 900",
  "Mona Sans": "200 900",
  Doto: "100 900",
  Inter: "100 900",
  Manrope: "200 800",
  "DM Sans": "100 1000",
  "Space Grotesk": "300 700",
  "Plus Jakarta Sans": "200 800",
  Fraunces: "100 900",
  Newsreader: "200 800",
};
/** Width ranges, for fonts a template loads with a width axis. */
const WIDTHS = { "Mona Sans": ["75", "125"] };
const SERIF = new Set(["Fraunces", "Newsreader"]);

/** Files Next needs and Astro doesn't. */
const NEXT_ONLY = new Set(["next.config.ts", "next.config.mjs", "next.config.js", "next-env.d.ts", "postcss.config.mjs", "postcss.config.js", "eslint.config.mjs", "vercel.json"]);
/** Folders that stay at the project's root; a template without src/ has its other code folders moved into it. */
const ROOT_DIRS = new Set(["public", "assets", "scripts", "docs", ".github", "basedraft"]);

const posix = {
  dir: (p) => p.slice(0, p.lastIndexOf("/") + 1),
  base: (p) => p.slice(p.lastIndexOf("/") + 1),
};

const pascal = (s) =>
  s
    .replace(/\[\.\.\.(\w+)\]|\[(\w+)\]/g, (_, a, b) => `By ${a ?? b}`)
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("") || "Home";

/** A PNG's size, from its header. */
function pngSize(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 24) return null;
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: v.getUint32(16), height: v.getUint32(20) };
}

/* ---------- the root layout: its shell to Astro, its providers kept as the islands' root ---------- */

function rootLayout(src) {
  const fontImport = src.match(/import\s*\{([^}]*)\}\s*from\s*"next\/font\/google";[^\n]*\n/);
  const names = new Set((fontImport?.[1] ?? "").split(",").map((n) => n.trim()).filter(Boolean));
  const fonts = [];
  let out = src;
  if (fontImport) out = out.replace(fontImport[0], "");
  // Each next/font call: the family, its CSS variable and anything it asks for beyond the default.
  out = out.replace(/(?:^[ \t]*\/\/[^\n]*\n)?^const\s+(\w+)\s*=\s*(\w+)\(\{([\s\S]*?)\}\);\n\n?/gm, (all, id, call, opts) => {
    if (!names.has(call)) return all;
    const variable = opts.match(/variable:\s*"([^"]+)"/)?.[1];
    if (!variable) return all;
    const weight = opts.match(/weight:\s*(\[[^\]]*\]|"[^"]*")/)?.[1];
    fonts.push({
      id,
      family: call.replace(/_/g, " "),
      variable,
      weights: weight ? JSON.parse(weight.replace(/'/g, '"')) : null,
      axes: (opts.match(/axes:\s*\[([^\]]*)\]/)?.[1] ?? "").match(/"(\w+)"/g)?.map((a) => a.slice(1, -1)) ?? [],
      italic: /style:\s*\[[^\]]*italic/.test(opts),
    });
    return "";
  });
  const html = out.match(/<html([\s\S]*?)>/);
  if (!html) throw new Error("The root layout has no <html> element.");
  const lang = html[1].match(/lang="([^"]+)"/)?.[1] ?? "en";
  const htmlClass = (html[1].match(/className=\{`([^`]*)`\}|className="([^"]*)"/) ?? []).slice(1).find((x) => x !== undefined) ?? "";
  const scripts = [...(out.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? "").matchAll(/<script\s+dangerouslySetInnerHTML=\{\{\s*__html:\s*(\w+)\s*\}\}\s*\/>/g)].map((m) => m[1]);
  const body = out.match(/<body([^>]*)>([\s\S]*?)<\/body>/);
  if (!body) throw new Error("The root layout has no <body> element.");
  const bodyClass = body[1].match(/className="([^"]*)"/)?.[1] ?? "";
  const inner = body[2].trim();
  // The <html> … </html> the layout returns becomes what was inside <body>: the islands draw from there.
  const start = out.indexOf(html[0]);
  const end = out.indexOf("</html>", start) + "</html>".length;
  out = `${out.slice(0, start)}<>\n      ${inner}\n    </>${out.slice(end)}`;
  const shell = {
    lang,
    htmlClass: htmlClass.replace(/\$\{[^}]+\}/g, "").replace(/\s+/g, " ").trim(),
    bodyClass,
  };
  out = out.replace(
    /export default function (\w+)/,
    `/**
 * In the Astro version, src/layouts/Site.astro draws the page around this: <html> and <head> (with
 * the metadata above, and the fonts set up in astro.config.mjs) and <body>, taking these from here.
 */
export const shell = { lang: ${JSON.stringify(shell.lang)}, htmlClass: ${JSON.stringify(shell.htmlClass)}, bodyClass: ${JSON.stringify(shell.bodyClass)}, scripts: [${scripts.join(", ")}] };

export default function $1`,
  );
  return { module: out, fonts };
}

/** A dynamic page reads its params as Next hands them (a promise); here it's handed them already kept, and reads them with use(). */
function syncPage(src, file) {
  const m = src.match(/export default async function (\w+)\s*\(/);
  if (!m) return src;
  const start = src.indexOf(m[0]);
  let out = src.slice(0, start) + src.slice(start).replace(/^export default async function/, "export default function");
  const head = out.slice(0, start);
  let body = out.slice(start);
  body = body.replace(/await (params|searchParams)\b/g, "use($1)");
  const end = body.indexOf("\n}\n");
  if (/\bawait\b/.test(end > 0 ? body.slice(0, end) : body)) throw new Error(`${file} waits for something other than its params; it can't be drawn as a component.`);
  out = head + body;
  const react = out.match(/import\s*\{([^}]*)\}\s*from\s*"react";/);
  if (react) out = out.replace(react[0], `import { ${[...new Set([...react[1].split(",").map((x) => x.trim()).filter(Boolean), "use"])].join(", ")} } from "react";`);
  else out = out.replace(/^((?:"use client";\n\n?)?)/, `$1import { use } from "react";\n`);
  return out;
}

/* ---------- the stand-ins for Next, in src/next ---------- */

const SHIMS = {
  "src/next/index.ts": `/*
 * The types the template's pages and layouts import from "next", for this Astro version (see
 * astro.config.mjs, which points "next" here). They describe the same objects Next reads; here
 * src/next/metadata.ts reads them and src/layouts/Site.astro writes them into each page's head.
 */
export type Metadata = {
  metadataBase?: URL | null;
  title?: string | { default?: string; template?: string; absolute?: string } | null;
  description?: string | null;
  applicationName?: string;
  keywords?: string | string[];
  alternates?: { canonical?: string | URL | null };
  openGraph?: Record<string, unknown> | null;
  twitter?: Record<string, unknown> | null;
  robots?: string | { index?: boolean; follow?: boolean } | null;
  [key: string]: unknown;
};
export type ResolvingMetadata = Promise<Metadata>;
export type Viewport = { themeColor?: string | Array<{ media?: string; color: string }>; [key: string]: unknown };
export declare namespace MetadataRoute {
  type Robots = { rules: Record<string, unknown> | Array<Record<string, unknown>>; sitemap?: string | string[]; host?: string };
  type Sitemap = Array<{ url: string; lastModified?: string | Date; changeFrequency?: string; priority?: number }>;
  type Manifest = Record<string, unknown>;
}
export {};
`,
  "src/next/env.d.ts": `/* The props Next hands pages and layouts, as the template's route files type them. */
declare global {
  type PageProps<Route extends string = string> = {
    params: Promise<Record<string, string>>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
  };
  type LayoutProps<Route extends string = string> = {
    children: import("react").ReactNode;
    params: Promise<Record<string, string>>;
  };
}
export {};
`,
  "src/next/link.tsx": `import { forwardRef, type AnchorHTMLAttributes } from "react";

/*
 * next/link, for this Astro version: a plain link. Astro prefetches the page it points at as the
 * pointer comes near (see prefetch in astro.config.mjs), then loads it whole.
 */

type Url = string | { pathname?: string; query?: Record<string, string | number | ReadonlyArray<string>>; hash?: string };

export type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: Url;
  prefetch?: boolean | "auto" | null;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  locale?: string | false;
  passHref?: boolean;
  legacyBehavior?: boolean;
  onNavigate?: (e: { preventDefault(): void }) => void;
};

/** A link's address, from either form Next takes. */
export function addressOf(href: Url) {
  if (typeof href === "string") return href;
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(href.query ?? {})) for (const x of Array.isArray(v) ? v : [v]) q.append(k, String(x));
  const search = q.toString();
  return \`\${href.pathname ?? ""}\${search ? \`?\${search}\` : ""}\${href.hash ? \`#\${href.hash.replace(/^#/, "")}\` : ""}\`;
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ href, prefetch, replace: _replace, scroll: _scroll, shallow: _shallow, locale: _locale, passHref: _passHref, legacyBehavior: _legacy, onNavigate: _onNavigate, ...rest }, ref) {
  return <a ref={ref} href={addressOf(href)} {...(prefetch === false ? { "data-astro-prefetch": "false" } : {})} {...rest} />;
});

export default Link;
`,
  "src/next/navigation.ts": `import { createContext, use, useMemo, useSyncExternalStore } from "react";

/*
 * next/navigation, for this Astro version. Each page's island is handed the page's path and params
 * (see src/next/route.tsx), so usePathname and useParams read the same while it's drawn at build
 * time and once it runs in the browser. Moving to another page loads it, as any Astro page does.
 */

export const RouteContext = createContext<{ path: string; params: Record<string, string | string[]> }>({ path: "/", params: {} });

export function usePathname() {
  return use(RouteContext).path;
}

export function useParams<T extends Record<string, string | string[]> = Record<string, string | string[]>>() {
  return use(RouteContext).params as T;
}

const subscribe = (change: () => void) => {
  window.addEventListener("popstate", change);
  return () => window.removeEventListener("popstate", change);
};

/** The address's query: empty while the page is drawn at build time, the real one in the browser. */
export function useSearchParams() {
  const search = useSyncExternalStore(subscribe, () => window.location.search, () => "");
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function useRouter() {
  return {
    push: (href: string) => window.location.assign(href),
    replace: (href: string) => window.location.replace(href),
    back: () => window.history.back(),
    forward: () => window.history.forward(),
    refresh: () => window.location.reload(),
    prefetch: () => {},
  };
}

export class NotFound extends Error {
  constructor() {
    super("Not found");
  }
}

/** Every page here is built ahead of time, for the params its getStaticPaths lists, so this only stops a page that shouldn't exist. */
export function notFound(): never {
  throw new NotFound();
}

export function redirect(href: string): never {
  if (typeof window !== "undefined") window.location.replace(href);
  throw new Error(\`Redirect to \${href}\`);
}
export const permanentRedirect = redirect;
`,
  "src/next/dynamic.tsx": `import { lazy, Suspense, useEffect, useState, type ComponentType, type ReactNode } from "react";

/*
 * next/dynamic, for this Astro version: a component loaded on its own, after the page. With
 * { ssr: false } it's left out of the page drawn at build time and comes in once the page runs.
 */

type Loaded<P> = ComponentType<P> | { default: ComponentType<P> };

export default function dynamic<P extends object>(load: () => Promise<Loaded<P>>, options: { ssr?: boolean; loading?: () => ReactNode } = {}) {
  const Lazy = lazy(async () => {
    const m = await load();
    return "default" in m ? m : { default: m };
  });
  const fallback = options.loading?.() ?? null;
  return function Dynamic(props: P) {
    const [ready, setReady] = useState(options.ssr !== false);
    useEffect(() => setReady(true), []);
    if (!ready) return fallback;
    return (
      <Suspense fallback={fallback}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}
`,
  "src/next/og.ts": `import { Resvg } from "@resvg/resvg-js";
import type { ReactElement } from "react";
import satori from "satori";

/*
 * next/og, for this Astro version: ImageResponse, drawn with the two libraries Next's is built on.
 * satori lays the card out as SVG, resvg turns it into a PNG. The template's opengraph-image.tsx
 * files use it unchanged; the endpoints beside the pages in src/pages run them when the site is built.
 */

type Font = { name: string; data: ArrayBuffer | Uint8Array; weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900; style?: "normal" | "italic" };
type Options = { width?: number; height?: number; fonts?: Font[]; headers?: Record<string, string>; status?: number };

export class ImageResponse extends Response {
  constructor(element: ReactElement, { width = 1200, height = 630, fonts = [], headers, status = 200 }: Options = {}) {
    const body = new ReadableStream({
      async start(c) {
        const svg = await satori(element, { width, height, fonts: fonts.map((f) => ({ ...f, data: f.data instanceof Uint8Array ? f.data : new Uint8Array(f.data) })) as never });
        c.enqueue(new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng());
        c.close();
      },
    });
    super(body, { status, headers: { "Content-Type": "image/png", ...headers } });
  }
}
`,
  "src/next/route.tsx": `import type { ReactNode } from "react";
import { RouteContext } from "./navigation";

export type Params = Record<string, string>;
export interface RouteProps {
  path: string;
  params?: Params;
}

/**
 * A promise that's already kept, the way Next hands pages their params: React's use() reads it at
 * once, while the page is drawn at build time and as it comes alive in the browser alike.
 */
export function settled<T>(value: T): Promise<T> {
  const p = Promise.resolve(value) as Promise<T> & { status?: string; value?: T };
  p.status = "fulfilled";
  p.value = value;
  return p;
}

/** Around every page's island: where it is, for usePathname and useParams. */
export function Route({ path, params = {}, children }: RouteProps & { children: ReactNode }) {
  return <RouteContext value={{ path, params }}>{children}</RouteContext>;
}
`,
  "src/next/metadata.ts": `import type { Metadata, Viewport } from "./index";

/*
 * Next's metadata, as head tags: what the root layout, the layouts and the page export (or work out
 * in generateMetadata), merged the way Next merges them, for src/layouts/Site.astro to write.
 */

type Module = { metadata?: Metadata; generateMetadata?: (props: unknown, parent: Promise<Metadata>) => Metadata | Promise<Metadata> };
export type Image = { url: string; alt?: string; width?: number; height?: number };
export type Head = {
  title: string;
  description?: string;
  canonical?: string;
  meta: Array<Record<string, string>>;
  themeColor: Array<{ color: string; media?: string }>;
};

const text = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export async function headOf(modules: Module[], { params = {}, path, image, viewport }: { params?: Record<string, string>; path: string; image?: Image; viewport?: Viewport }): Promise<Head> {
  let title: string | undefined;
  let template: string | undefined;
  let merged: Metadata = {};
  let og: Record<string, unknown> = {};
  let twitter: Record<string, unknown> = {};
  for (const m of modules) {
    const md = m.generateMetadata ? await m.generateMetadata({ params: Promise.resolve(params), searchParams: Promise.resolve({}) }, Promise.resolve(merged)) : m.metadata;
    if (!md) continue;
    const t = md.title;
    if (typeof t === "string") title = template ? template.replace("%s", t) : t;
    else if (t?.absolute) title = t.absolute;
    else if (t?.default) title = t.default;
    if (t && typeof t === "object" && t.template) template = t.template;
    og = { ...og, ...(md.openGraph ?? {}) };
    twitter = { ...twitter, ...(md.twitter ?? {}) };
    merged = { ...merged, ...md };
  }
  const base = merged.metadataBase ? new URL(String(merged.metadataBase)) : undefined;
  const abs = (u: string) => (base ? new URL(u, base).toString() : u);
  const description = text(merged.description);
  const canonical = merged.alternates?.canonical ? abs(String(merged.alternates.canonical)) : undefined;
  const meta: Array<Record<string, string>> = [];
  const add = (key: "name" | "property", k: string, v: unknown) => {
    if (typeof v === "string" && v) meta.push({ [key]: k, content: v });
  };
  add("name", "application-name", merged.applicationName);
  add("name", "keywords", Array.isArray(merged.keywords) ? merged.keywords.join(", ") : merged.keywords);
  const robots = merged.robots;
  add("name", "robots", typeof robots === "string" ? robots : robots ? [robots.index === false ? "noindex" : "index", robots.follow === false ? "nofollow" : "follow"].join(", ") : undefined);
  add("property", "og:title", text(og.title) ?? title);
  add("property", "og:description", text(og.description) ?? description);
  add("property", "og:site_name", og.siteName);
  add("property", "og:type", og.type ?? "website");
  add("property", "og:locale", og.locale);
  add("property", "og:url", og.url ? abs(String(og.url)) : base ? abs(path) : undefined);
  if (image) {
    add("property", "og:image", abs(image.url));
    add("property", "og:image:alt", image.alt);
    if (image.width) add("property", "og:image:width", String(image.width));
    if (image.height) add("property", "og:image:height", String(image.height));
  }
  add("name", "twitter:card", twitter.card ?? (image ? "summary_large_image" : undefined));
  add("name", "twitter:title", text(twitter.title) ?? text(og.title) ?? title);
  add("name", "twitter:description", text(twitter.description) ?? text(og.description) ?? description);
  if (image) add("name", "twitter:image", abs(image.url));
  const tc = viewport?.themeColor;
  const themeColor = typeof tc === "string" ? [{ color: tc }] : Array.isArray(tc) ? tc : [];
  return { title: title ?? "", description, canonical, meta, themeColor };
}
`,
  "src/next/metadata-routes.ts": `import type { MetadataRoute } from "./index";

/* The template's robots.ts and sitemap.ts, as the files they describe (see the endpoints in src/pages). */

export function robotsTxt(r: MetadataRoute.Robots) {
  const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
  const lines: string[] = [];
  for (const rule of rules) {
    for (const ua of [rule.userAgent ?? "*"].flat()) lines.push(\`User-Agent: \${ua}\`);
    for (const a of [rule.allow ?? []].flat()) lines.push(\`Allow: \${a}\`);
    for (const d of [rule.disallow ?? []].flat()) lines.push(\`Disallow: \${d}\`);
    if (rule.crawlDelay) lines.push(\`Crawl-delay: \${rule.crawlDelay}\`);
    lines.push("");
  }
  if (r.host) lines.push(\`Host: \${r.host}\`);
  for (const s of [r.sitemap ?? []].flat()) lines.push(\`Sitemap: \${s}\`);
  return lines.join("\\n").trim() + "\\n";
}

export function sitemapXml(entries: MetadataRoute.Sitemap) {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const rows = entries.map((e) => {
    const parts = [\`<loc>\${esc(e.url)}</loc>\`];
    if (e.lastModified) parts.push(\`<lastmod>\${new Date(e.lastModified).toISOString()}</lastmod>\`);
    if (e.changeFrequency) parts.push(\`<changefreq>\${e.changeFrequency}</changefreq>\`);
    if (e.priority !== undefined) parts.push(\`<priority>\${e.priority}</priority>\`);
    return \`  <url>\${parts.join("")}</url>\`;
  });
  return \`<?xml version="1.0" encoding="UTF-8"?>\\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n\${rows.join("\\n")}\\n</urlset>\\n\`;
}
`,
};

/* ---------- the conversion ---------- */

/**
 * `files`: the Next template (paths from its root; text as strings, the rest as bytes). Returns the
 * Astro project's files. `name`: what to call it, for its README.
 */
export function toAstro(files, { name } = {}) {
  const hasSrc = [...files.keys()].some((k) => k.startsWith("src/app/"));
  const appDir = hasSrc ? "src/app/" : "app/";
  if (![...files.keys()].some((k) => k.startsWith(appDir))) throw new Error("There's no app/ folder to make pages from.");
  const out = new Map();
  const where = (rel) => {
    if (rel.startsWith(appDir)) return `src/routes/${rel.slice(appDir.length)}`;
    if (hasSrc || !rel.includes("/")) return rel;
    const top = rel.slice(0, rel.indexOf("/"));
    return ROOT_DIRS.has(top) ? rel : `src/${rel}`;
  };
  const og = new Map(); // route folder → its social image
  const icons = [];
  const textOf = (rel) => (typeof files.get(rel) === "string" ? files.get(rel) : undefined);

  for (const [rel, v] of files) {
    const base = posix.base(rel);
    if (NEXT_ONLY.has(rel)) continue;
    if (rel.startsWith(appDir)) {
      const inApp = rel.slice(appDir.length);
      const folder = posix.dir(inApp);
      // File-based metadata: social images and icons are files the site serves.
      const at = `/${urlOf(folder)}`.replace(/\/$/, "");
      if (base === "opengraph-image.alt.txt" || base === "twitter-image.alt.txt") continue;
      if (/^opengraph-image\.(png|jpe?g)$/.test(base)) {
        const url = `${at}/${base}`;
        out.set(`public${url}`, v);
        og.set(folder, { kind: "file", folder, url, alt: textOf(`${appDir}${folder}opengraph-image.alt.txt`)?.trim(), size: pngSize(v) });
        continue;
      }
      if (base === "opengraph-image.tsx") og.set(folder, { kind: "code", folder, url: `${at}/opengraph-image.png`, module: `@/routes/${folder}opengraph-image` });
      if (!folder && /^(icon|apple-icon)\.(svg|png|ico)$|^favicon\.ico$/.test(base)) {
        out.set(`public/${base}`, v);
        icons.push(base);
        continue;
      }
    }
    out.set(where(rel), v);
  }

  // The root layout: providers for the islands, shell and fonts for Astro.
  const layoutRel = `src/routes/layout.tsx`;
  const { module: rootModule, fonts } = rootLayout(out.get(layoutRel));
  out.set(layoutRel, rootModule);

  // Pages, with the layouts (and templates) around each, from the root down.
  const routeFiles = [...out.keys()].filter((k) => k.startsWith("src/routes/"));
  const has = (rel) => out.has(rel);
  const pages = routeFiles.filter((k) => posix.base(k) === "page.tsx").sort();
  const made = [];
  for (const rel of pages) {
    const folder = rel.slice("src/routes/".length, -"page.tsx".length);
    const segs = folder.split("/").filter(Boolean);
    if (segs.some((s) => s.startsWith("_") || s.startsWith("@"))) continue;
    const src = out.get(rel);
    // A page for designing the template's social cards, only when its OG studio is switched on.
    if (/process\.env\.OG_STUDIO/.test(src)) continue;
    out.set(rel, syncPage(src, rel));
    const url = `/${urlOf(folder)}`;
    const dynamic = /\[/.test(url);
    const chain = [];
    for (let i = 0; i <= segs.length; i++) {
      const d = segs.slice(0, i).join("/");
      const prefix = d ? `${d}/` : "";
      if (i > 0 && has(`src/routes/${prefix}layout.tsx`)) chain.push({ kind: "layout", spec: `@/routes/${prefix}layout` });
      if (has(`src/routes/${prefix}template.tsx`)) chain.push({ kind: "template", spec: `@/routes/${prefix}template` });
    }
    let image;
    for (let i = segs.length; i >= 0 && !image; i--) image = og.get(segs.slice(0, i).map((s) => `${s}/`).join(""));
    made.push({ rel, folder, url, dynamic, chain, image, file: url === "/" ? "index" : url.slice(1) });
  }

  // Each page: an island that draws it, and an Astro page around the island.
  for (const p of made) {
    const id = pascal(p.file === "index" ? "Home" : p.file);
    const imports = [`import Root from "@/routes/layout";`, ...p.chain.map((c, i) => `import ${c.kind === "layout" ? "Layout" : "Template"}${i} from "${c.spec}";`), `import Page from "@/routes/${p.folder}page";`, `import { Route, settled, type RouteProps } from "@/next/route";`];
    let tree = `<Page params={params} searchParams={settled({})} />`;
    for (let i = p.chain.length - 1; i >= 0; i--) {
      const c = p.chain[i];
      tree = c.kind === "layout" ? `<Layout${i} params={params}>${tree}</Layout${i}>` : `<Template${i}>${tree}</Template${i}>`;
    }
    out.set(
      `src/islands/${p.file}.tsx`,
      `${imports.join("\n")}

/** ${p.url}: the template's page inside its layouts, as one React island (see src/pages/${p.file}.astro). */
export default function ${id}Island(props: RouteProps) {
  const params = settled(props.params ?? {});
  return (
    <Route {...props}>
      <Root params={params}>${tree}</Root>
    </Route>
  );
}
`,
    );
    const metaModules = p.chain.filter((c) => c.kind === "layout").map((c, i) => ({ name: `layout${i}`, spec: c.spec }));
    const imageCode = !p.image
      ? ""
      : p.image.kind === "file"
        ? `const image = ${JSON.stringify({ url: p.image.url, alt: p.image.alt, ...(p.image.size ?? {}) })};\n`
        : /\[/.test(p.image.url)
          ? `const image = { url: \`${p.image.url}\`.replace(/\\[(\\w+)\\]/g, (_, k) => params[k]), alt: og.alt, ...og.size };\n`
          : `const image = { url: ${JSON.stringify(p.image.url)}, alt: og.alt, ...og.size };\n`;
    const ogImport = p.image?.kind === "code" ? `import * as og from "${p.image.module}";\n` : "";
    out.set(
      `src/pages/${p.file}.astro`,
      `---
import Site from "@/layouts/Site.astro";
import Island from "@/islands/${p.file}";
${metaModules.map((m) => `import * as ${m.name} from "${m.spec}";`).join("\n")}${metaModules.length ? "\n" : ""}import * as page from "@/routes/${p.folder}page";
${ogImport}${
        p.dynamic
          ? `
export async function getStaticPaths() {
  return (await page.generateStaticParams()).map((params: Record<string, string>) => ({ params }));
}

const params = Astro.params as Record<string, string>;
const path = \`${p.url}\`.replace(/\\[(\\w+)\\]/g, (_, k) => params[k]);
`
          : `
const params = {};
const path = ${JSON.stringify(p.url)};
`
      }${imageCode}---

<Site modules={[${[...metaModules.map((m) => m.name), "page"].join(", ")}]} params={params} path={path}${p.image ? " image={image}" : ""}>
  <Island client:load path={path} params={params} />
</Site>
`,
    );
  }

  // Each social image the template draws in code: an endpoint that draws it when the site is built.
  for (const o of og.values()) {
    if (o.kind !== "code") continue;
    const at = o.url.replace(/^\//, "");
    const dynamic = /\[/.test(at);
    if (dynamic && !has(`src/routes/${o.folder}page.tsx`)) continue;
    out.set(
      `src/pages/${at}.ts`,
      `import type { APIRoute } from "astro";
import Image from "${o.module}";
${dynamic ? `import * as page from "@/routes/${o.folder}page";\n\nexport async function getStaticPaths() {\n  return (await page.generateStaticParams()).map((params: Record<string, string>) => ({ params }));\n}\n` : ""}
/** ${o.url}: the social card the template draws in its own opengraph-image.tsx, made when the site is built. */
export const GET: APIRoute = ({ params }) => Image(${dynamic ? "{ params: Promise.resolve(params) }" : ""}) as Response | Promise<Response>;
`,
    );
  }

  // The template's not-found page, inside its root layout.
  if (has("src/routes/not-found.tsx")) {
    out.set(
      "src/islands/404.tsx",
      `import Root from "@/routes/layout";
import NotFound from "@/routes/not-found";
import { Route, settled, type RouteProps } from "@/next/route";

/** The template's page for an address that isn't there. */
export default function NotFoundIsland(props: RouteProps) {
  return (
    <Route {...props}>
      <Root params={settled({})}>
        <NotFound />
      </Root>
    </Route>
  );
}
`,
    );
    out.set(
      "src/pages/404.astro",
      `---
import Site from "@/layouts/Site.astro";
import Island from "@/islands/404";
import * as page from "@/routes/not-found";
---

<Site modules={[page]} path="/404">
  <Island client:load path="/404" />
</Site>
`,
    );
  }

  // robots.ts and sitemap.ts, as the files they describe.
  if (has("src/routes/robots.ts"))
    out.set("src/pages/robots.txt.ts", `import type { APIRoute } from "astro";\nimport robots from "@/routes/robots";\nimport { robotsTxt } from "@/next/metadata-routes";\n\nexport const GET: APIRoute = () => new Response(robotsTxt(robots()), { headers: { "Content-Type": "text/plain; charset=utf-8" } });\n`);
  if (has("src/routes/sitemap.ts"))
    out.set("src/pages/sitemap.xml.ts", `import type { APIRoute } from "astro";\nimport sitemap from "@/routes/sitemap";\nimport { sitemapXml } from "@/next/metadata-routes";\n\nexport const GET: APIRoute = async () => new Response(sitemapXml(await sitemap()), { headers: { "Content-Type": "application/xml; charset=utf-8" } });\n`);

  for (const [k, v] of Object.entries(SHIMS)) out.set(k, v);

  // The page around every island: <html>, the head (metadata, fonts, the template's own head scripts), <body>.
  const fontTags = fonts.map((f) => `    <Font cssVariable="${f.variable}" preload />`).join("\n");
  const iconTags = icons
    .map((i) => (i === "favicon.ico" ? `    <link rel="icon" href="/favicon.ico" sizes="any" />` : i.startsWith("apple-icon") ? `    <link rel="apple-touch-icon" href="/${i}" />` : `    <link rel="icon" href="/${i}"${i.endsWith(".svg") ? ' type="image/svg+xml"' : ""} />`))
    .join("\n");
  out.set(
    "src/layouts/Site.astro",
    `---
/*
 * Every page's document: the template's root layout drew <html>, <head> and <body> in Next; here
 * they're drawn from what it exports (its metadata, viewport and shell), with the fonts from
 * astro.config.mjs. The page's island goes in the body.
 */
import { Font } from "astro:assets";
import "@/routes/globals.css";
import * as root from "@/routes/layout";
import { headOf, type Image } from "@/next/metadata";

interface Props {
  modules?: Array<Record<string, unknown>>;
  params?: Record<string, string>;
  path: string;
  image?: Image;
}
const { modules = [], params = {}, path, image } = Astro.props;
const head = await headOf([root, ...modules] as Parameters<typeof headOf>[0], { params, path, image, viewport: root.viewport });
const { shell } = root;
---

<!doctype html>
<html lang={shell.lang} class={shell.htmlClass || undefined}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    {shell.scripts.map((code: string) => <script is:inline set:html={code} />)}
${fontTags}
    <title>{head.title}</title>
    {head.description && <meta name="description" content={head.description} />}
    {head.canonical && <link rel="canonical" href={head.canonical} />}
    {head.themeColor.map((t) => <meta name="theme-color" content={t.color} media={t.media} />)}
    {head.meta.map((m) => <meta {...m} />)}
${iconTags}
  </head>
  <body class={shell.bodyClass || undefined}>
    <slot />
  </body>
</html>
`,
  );

  // Every process.env the code reads, given its value when the site is built (the browser has no process).
  const envKeys = new Set();
  for (const [k, v] of out) if (typeof v === "string" && /\.(tsx?|jsx?|mjs)$/.test(k) && k.startsWith("src/")) for (const m of v.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) envKeys.add(m[1]);
  const usesOg = [...og.values()].some((o) => o.kind === "code");
  const usesThree = typeof out.get("package.json") === "string" && /"three"\s*:/.test(out.get("package.json"));

  out.set(
    "astro.config.mjs",
    `// @ts-check
import { fileURLToPath } from "node:url";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

const here = (/** @type {string} */ p) => fileURLToPath(new URL(p, import.meta.url));
/** An environment variable as the code reads it when the site is built: its value, or undefined when it isn't set. */
const env = (/** @type {string} */ k) => (process.env[k] === undefined ? "undefined" : JSON.stringify(process.env[k]));

export default defineConfig({
  // Your site's address, for absolute links in metadata: SITE_URL=https://example.com npm run build
  site: process.env.SITE_URL || undefined,
  integrations: [react()],
  // Pages load ahead as a link comes into view, so moving between them feels instant.
  prefetch: { prefetchAll: true, defaultStrategy: "viewport" },
  // The template's typefaces, under the CSS variables its styles read (next/font set the same ones).
  fonts: [
${fonts.map((f) => fontEntry(f)).join(",\n")}
  ],
  vite: {
    plugins: [tailwindcss()],${usesThree ? `\n    // three.js, which the WebGL scenes load after the page is up, is one chunk of its own, bigger than Vite's usual warning.\n    build: { chunkSizeWarningLimit: 1200 },` : ""}${usesOg ? `\n    // The social cards' renderer runs in Node as it's published, not bundled.\n    ssr: { external: ["@resvg/resvg-js"] },` : ""}
    resolve: {
      // What the template's components import from Next, answered by the stand-ins in src/next.
      alias: [
        { find: /^next$/, replacement: here("./src/next/index.ts") },
        { find: /^next\\/link$/, replacement: here("./src/next/link.tsx") },
        { find: /^next\\/navigation$/, replacement: here("./src/next/navigation.ts") },
        { find: /^next\\/dynamic$/, replacement: here("./src/next/dynamic.tsx") },
        { find: /^next\\/og$/, replacement: here("./src/next/og.ts") },
      ],
    },
    define: {
${[...envKeys].sort().map((k) => `      "process.env.${k}": env("${k}"),`).join("\n")}
    },
  },
});
`,
  );

  // package.json: the template's own packages, Astro's in place of Next's.
  const pkg = JSON.parse(out.get("package.json"));
  const drop = (o = {}) => Object.fromEntries(Object.entries(o).filter(([k]) => !/^(next|eslint|eslint-config-next|@next\/.*|@tailwindcss\/(postcss|turbopack))$/.test(k)));
  const deps = { ...drop(pkg.dependencies), astro: VERSIONS.astro, "@astrojs/react": VERSIONS["@astrojs/react"], "@tailwindcss/vite": VERSIONS["@tailwindcss/vite"], tailwindcss: VERSIONS.tailwindcss, ...(usesOg ? { satori: VERSIONS.satori, "@resvg/resvg-js": VERSIONS["@resvg/resvg-js"] } : {}) };
  const dev = { ...drop(pkg.devDependencies), "@astrojs/check": VERSIONS["@astrojs/check"] };
  delete dev.tailwindcss;
  out.set(
    "package.json",
    `${JSON.stringify(
      {
        name: pkg.name,
        version: pkg.version,
        private: true,
        type: "module",
        scripts: { dev: "astro dev", build: "astro build", preview: "astro preview", check: "astro check" },
        dependencies: Object.fromEntries(Object.entries(deps).sort(([a], [b]) => a.localeCompare(b))),
        devDependencies: Object.fromEntries(Object.entries(dev).sort(([a], [b]) => a.localeCompare(b))),
        engines: { node: ">=22.12" },
      },
      null,
      2,
    )}\n`,
  );

  out.set(
    "tsconfig.json",
    `${JSON.stringify(
      {
        extends: "astro/tsconfigs/strict",
        include: [".astro/types.d.ts", "**/*"],
        exclude: ["dist"],
        compilerOptions: { baseUrl: ".", paths: { "@/*": ["./src/*"] }, jsx: "react-jsx", jsxImportSource: "react" },
      },
      null,
      2,
    )}\n`,
  );

  const ignore = typeof out.get(".gitignore") === "string" ? out.get(".gitignore") : "node_modules\n";
  out.set(".gitignore", `${ignore.replace(/^\/?\.next\/?\n|^\/?out\/?\n|^next-env\.d\.ts\n/gm, "").trimEnd()}\n\n# Astro\ndist/\n.astro/\n`);

  // The template's own README was written for its Next.js version: kept beside this one, as notes.
  const readme = out.get("README.md");
  if (typeof readme === "string") out.set("docs/template-notes.md", `> Written for the Next.js version of this template. The pages, components and content are the same here; how it runs is in the README.\n\n${readme}`);
  out.set("README.md", astroReadme(name ?? pkg.name, made.length, fonts));
  return out;
}

/** A route folder's address: route groups dropped, dynamic segments kept in Astro's [param] form. */
function urlOf(folder) {
  return folder
    .split("/")
    .filter((s) => s && !/^\(.*\)$/.test(s))
    .map((s) => s.replace(/^\[\[\.\.\.(\w+)\]\]$/, "[...$1]"))
    .join("/");
}

function fontEntry(f) {
  const serif = SERIF.has(f.family);
  const mono = /mono/i.test(f.family);
  const width = f.axes.includes("wdth") && WIDTHS[f.family];
  const entry = {
    name: f.family,
    cssVariable: f.variable,
    weights: f.weights ?? [WEIGHTS[f.family] ?? "400"],
    styles: f.italic ? ["normal", "italic"] : ["normal"],
    subsets: ["latin"],
    fallbacks: mono ? ["ui-monospace", "SFMono-Regular", "monospace"] : serif ? ["ui-serif", "Georgia", "serif"] : ["ui-sans-serif", "system-ui", "sans-serif"],
  };
  const fields = Object.entries(entry).map(([k, v]) => `      ${k}: ${JSON.stringify(v)},`);
  if (width) fields.push(`      options: { experimental: { variableAxis: { wdth: [${JSON.stringify(width)}] } } },`);
  return `    {\n      provider: fontProviders.google(),\n${fields.join("\n")}\n    }`;
}

function astroReadme(name, pages, fonts) {
  return `# ${name}

This is the Astro version of the template: the same pages, components and content as its Next.js
version, built with [Astro](https://astro.build) 7 and React 19, styled with Tailwind CSS 4.

## Run it

You need Node.js 22.12 or newer.

\`\`\`sh
npm install
npm run dev       # http://localhost:4321
npm run build     # the finished site, in dist/
npm run preview   # serve what you built
\`\`\`

Set \`SITE_URL\` when you build for your domain (\`SITE_URL=https://example.com npm run build\`) so links in
each page's metadata are absolute.

## How it's put together

- \`src/pages\`: one Astro page for each of the ${pages} pages, plus the 404 page and anything the
  template serves as a file (its social images, robots.txt, sitemap.xml).
- \`src/islands\`: each page's React tree: the template's providers and layouts around the page. Astro
  draws it to HTML when you build, then brings it to life in the browser (\`client:load\`), so every
  animation and interaction works as designed.
- \`src/routes\`: the template's pages and layouts (\`page.tsx\`, \`layout.tsx\`), where its Next.js
  version keeps them in \`app/\`. Edit a page here; its Astro page picks it up.
- \`src/components\`, \`src/lib\`: the template's components and code, unchanged.
- \`src/layouts/Site.astro\`: the HTML document around every page: metadata from each page's
  \`metadata\` export, the fonts, and the root layout's \`<html>\` and \`<body>\` classes.
- \`src/next\`: small stand-ins for the few Next.js imports the components use (\`next/link\`,
  \`next/navigation\`, \`next/dynamic\`), so they run here unchanged. \`astro.config.mjs\` points those
  imports at them.

## Fonts

${fonts.length ? `The typefaces (${[...new Set(fonts.map((f) => f.family))].join(", ")}) come through Astro's fonts API, set up in \`astro.config.mjs\`: they're downloaded when you build and served from your site, under the same CSS variables the styles read.` : "The template uses the system's fonts."}

## Adding a page

Make \`src/routes/(site)/your-page/page.tsx\` like the others, then \`src/islands/your-page.tsx\` and
\`src/pages/your-page.astro\` like the ones beside them.
`;
}
