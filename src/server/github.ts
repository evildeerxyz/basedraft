import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { gunzipSync } from "node:zlib";
import type { NextRequest, NextResponse } from "next/server";
import { templateOf } from "@/site/live";
import { pageFile } from "@/studio/project-files";
import type { Project } from "@/studio/state";
import { packageNameOf, siteFiles, writeImages, writeProject, type Files, type Framework } from "./site";

/*
 * Sending a Studio project to GitHub, for people who'd rather not download a zip.
 *
 * You connect GitHub once (an OAuth app; the token lives sealed in an httpOnly cookie, never in
 * the page). Then a project goes either to a new repository, as the whole runnable site, or to one
 * you already have, as a pull request: into a copy of the template it writes just your pages and
 * your text; into anything else, the whole site, for you to review before it merges.
 *
 * Needs GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET (the OAuth app's callback is
 * <site>/api/github/callback), and BD_SESSION_SECRET in production.
 */

const API = "https://api.github.com";
export const SESSION = "bd_github";
export const STATE = "bd_github_state";
const COOKIE_PATH = "/api/github";

const secret = () => process.env.BD_SESSION_SECRET || (process.env.NODE_ENV === "production" ? "" : "basedraft-local-development-only");
export const configured = () => Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && secret());

/* ---------- sealed cookies ---------- */

const key = () => createHash("sha256").update(secret()).digest();

function seal(value: unknown) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([c.update(JSON.stringify(value), "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]).toString("base64url");
}

function unseal<T>(raw: string | undefined): T | null {
  if (!raw || !secret()) return null;
  try {
    const buf = Buffer.from(raw, "base64url");
    const d = createDecipheriv("aes-256-gcm", key(), buf.subarray(0, 12));
    d.setAuthTag(buf.subarray(12, 28));
    return JSON.parse(Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString("utf8")) as T;
  } catch {
    return null;
  }
}

const cookie = (maxAge: number) => ({ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: COOKIE_PATH, maxAge });

export interface Session {
  token: string;
  login: string;
  avatar: string;
}

export const sessionOf = (req: NextRequest) => unseal<Session>(req.cookies.get(SESSION)?.value);
export const setSession = (res: NextResponse, s: Session) => res.cookies.set(SESSION, seal(s), cookie(60 * 60 * 24 * 30));
export const clearSession = (res: NextResponse) => res.cookies.set(SESSION, "", cookie(0));

/* ---------- signing in ---------- */

/** Only a path on this site to come back to, never somewhere else. */
export const safeReturn = (to: string | null) => (to && to.startsWith("/") && !to.startsWith("//") && !to.includes("\\") ? to : "/studio");

/** A one-time value for the trip to GitHub and back, kept sealed until GitHub returns it. */
export const newState = () => randomBytes(18).toString("base64url");
export const keepState = (res: NextResponse, state: string, back: string) => res.cookies.set(STATE, seal({ state, back, at: Date.now() }), cookie(600));

export function authorizeUrl(origin: string, state: string) {
  const u = new URL("https://github.com/login/oauth/authorize");
  u.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID!);
  u.searchParams.set("redirect_uri", `${origin}/api/github/callback`);
  // Private repositories too: most people keep a site's code private.
  u.searchParams.set("scope", "repo");
  u.searchParams.set("state", state);
  return u;
}

export function checkState(req: NextRequest, state: string | null) {
  const saved = unseal<{ state: string; back: string; at: number }>(req.cookies.get(STATE)?.value);
  if (!saved || !state || Date.now() - saved.at > 600_000) return { ok: false, back: saved?.back ?? "/studio" };
  const a = Buffer.from(saved.state);
  const b = Buffer.from(state);
  return { ok: a.length === b.length && timingSafeEqual(a, b), back: saved.back };
}

export async function exchange(code: string, origin: string) {
  const r = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code, redirect_uri: `${origin}/api/github/callback` }),
    cache: "no-store",
  });
  const j = (await r.json().catch(() => ({}))) as { access_token?: string; error_description?: string };
  if (!j.access_token) throw new Error(j.error_description ?? "GitHub didn't hand over a token");
  const user = await gh<{ login: string; avatar_url: string }>(j.access_token, "/user");
  return { token: j.access_token, login: user.login, avatar: user.avatar_url } satisfies Session;
}

/* ---------- the API ---------- */

export class GitHubError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function gh<T>(token: string, path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const r = await fetch(path.startsWith("https://") ? path : `${API}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "basedraft",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  if (!r.ok) {
    const j = (await r.json().catch(() => ({}))) as { message?: string; errors?: Array<{ message?: string }> };
    throw new GitHubError(r.status, j.errors?.[0]?.message ?? j.message ?? r.statusText);
  }
  return (r.status === 204 ? undefined : await r.json()) as T;
}

export interface RepoRow {
  name: string;
  private: boolean;
  branch: string;
  pushed: string;
}

/** Repositories you can push to, the most recently pushed first. */
export async function repos(token: string): Promise<RepoRow[]> {
  type R = { full_name: string; private: boolean; default_branch: string; pushed_at: string; permissions?: { push?: boolean }; archived: boolean };
  const out: R[] = [];
  for (let page = 1; page <= 3; page++) {
    const list = await gh<R[]>(token, `/user/repos?per_page=100&sort=pushed&page=${page}&affiliation=owner,collaborator,organization_member`);
    out.push(...list);
    if (list.length < 100) break;
  }
  return out.filter((r) => r.permissions?.push && !r.archived).map((r) => ({ name: r.full_name, private: r.private, branch: r.default_branch, pushed: r.pushed_at }));
}

/* ---------- writing files ---------- */

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const b64 = (v: Uint8Array | string) => Buffer.from(v).toString("base64");

/** A tree of `files` and a commit of it on `parent`: text goes inline, anything else as its own blob. */
async function commitFiles(token: string, repo: string, files: Files, opts: { parent: string; base?: string; message: string }) {
  const entries: Array<{ path: string; mode: "100644"; type: "blob"; content?: string; sha?: string }> = [];
  const binary = [...files].filter(([, v]) => typeof v !== "string");
  for (const [path, v] of files) if (typeof v === "string") entries.push({ path, mode: "100644", type: "blob", content: v });
  // A few at a time: GitHub turns away a burst of writes.
  for (let i = 0; i < binary.length; i += 4) {
    const made = await Promise.all(binary.slice(i, i + 4).map(([, v]) => gh<{ sha: string }>(token, `/repos/${repo}/git/blobs`, { method: "POST", body: { content: b64(v), encoding: "base64" } })));
    made.forEach((m, k) => entries.push({ path: binary[i + k][0], mode: "100644", type: "blob", sha: m.sha }));
  }
  const tree = await gh<{ sha: string }>(token, `/repos/${repo}/git/trees`, { method: "POST", body: { ...(opts.base ? { base_tree: opts.base } : {}), tree: entries } });
  const commit = await gh<{ sha: string }>(token, `/repos/${repo}/git/commits`, { method: "POST", body: { message: opts.message, tree: tree.sha, parents: [opts.parent] } });
  return commit.sha;
}

async function head(token: string, repo: string, branch: string) {
  const ref = await gh<{ object: { sha: string } }>(token, `/repos/${repo}/git/ref/heads/${encodeURIComponent(branch)}`);
  const commit = await gh<{ tree: { sha: string } }>(token, `/repos/${repo}/git/commits/${ref.object.sha}`);
  return { sha: ref.object.sha, tree: commit.tree.sha };
}

/** A repository's files at a branch, from one tarball. */
async function filesAt(token: string, repo: string, branch: string): Promise<Map<string, Uint8Array>> {
  const r = await fetch(`${API}/repos/${repo}/tarball/${encodeURIComponent(branch)}`, { headers: { Authorization: `Bearer ${token}`, "User-Agent": "basedraft" }, cache: "no-store" });
  if (!r.ok) throw new GitHubError(r.status, "Couldn't read the repository");
  const buf = new Uint8Array(await r.arrayBuffer());
  if (buf.length > 60 * 1024 * 1024) throw new GitHubError(413, "That repository is too big to update from Studio. Try a new one.");
  return untar(gunzipSync(buf));
}

/** The files in a tar, without the folder GitHub wraps them in. */
function untar(buf: Uint8Array) {
  const out = new Map<string, Uint8Array>();
  const str = (b: Uint8Array) => Buffer.from(b.subarray(0, b.indexOf(0) < 0 ? b.length : b.indexOf(0))).toString("utf8");
  let long: string | null = null;
  for (let i = 0; i + 512 <= buf.length; ) {
    const h = buf.subarray(i, i + 512);
    if (h.every((x) => x === 0)) break;
    const size = parseInt(str(h.subarray(124, 136)).trim() || "0", 8);
    const type = String.fromCharCode(h[156]);
    const data = buf.subarray(i + 512, i + 512 + size);
    i += 512 + Math.ceil(size / 512) * 512;
    if (type === "x") {
      long = /\d+ path=([^\n]*)\n/.exec(Buffer.from(data).toString("utf8"))?.[1] ?? null;
      continue;
    }
    if (type === "L") {
      long = str(data);
      continue;
    }
    const prefix = str(h.subarray(345, 500));
    const name = long ?? (prefix ? `${prefix}/${str(h.subarray(0, 100))}` : str(h.subarray(0, 100)));
    long = null;
    if (type !== "0" && type !== "\0") continue;
    const rel = name.split("/").slice(1).join("/");
    if (rel) out.set(rel, new Uint8Array(data));
  }
  return out;
}

const utf8 = new TextDecoder("utf-8", { fatal: true });
const textOf = (b: Uint8Array) => {
  if (b.includes(0)) return null;
  try {
    return utf8.decode(b);
  } catch {
    return null;
  }
};

function packageName(b: Uint8Array | undefined) {
  try {
    return b ? (JSON.parse(textOf(b) ?? "null") as { name?: string } | null)?.name : undefined;
  } catch {
    return undefined;
  }
}

/* ---------- sending a project ---------- */

export type Target = { kind: "new"; name: string; private: boolean } | { kind: "existing"; repo: string; direct: boolean };

/** Whether two files are the same bytes. */
function sameBytes(a: Uint8Array, b: Uint8Array) {
  if (a.byteLength !== b.byteLength) return false;
  for (let i = 0; i < a.byteLength; i++) if (a[i] !== b[i]) return false;
  return true;
}

export interface Sent {
  url: string;
  repo: string;
  /** "site": the whole site was written; "update": just your pages and text, into a copy of the template. */
  wrote: "site" | "update";
  files: number;
  pull?: number;
  missed: string[];
}

const REPO_NAME = /^[A-Za-z0-9._-]{1,100}$/;
const FULL_NAME = /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "site";

export async function send(token: string, project: Project, target: Target, framework: Framework = "next"): Promise<Sent> {
  const t = templateOf(project.template)!;
  if (target.kind === "new") {
    if (!REPO_NAME.test(target.name) || target.name.startsWith(".")) throw new GitHubError(422, "A repository name can use letters, numbers, dots, dashes and underscores.");
    const repo = await gh<{ full_name: string; default_branch: string; html_url: string }>(token, "/user/repos", {
      method: "POST",
      body: { name: target.name, private: target.private, auto_init: true, description: `${project.name}, made in basedraft from ${t.name}` },
    }).catch((e: unknown) => {
      if (e instanceof GitHubError && e.status === 422) throw new GitHubError(422, `You already have a repository called ${target.name}.`);
      throw e;
    });
    // A new repository's first commit takes a moment to land.
    let base: Awaited<ReturnType<typeof head>> | null = null;
    for (let i = 0; i < 8 && !base; i++) base = await head(token, repo.full_name, repo.default_branch).catch(() => wait(600).then(() => null));
    if (!base) throw new GitHubError(504, "GitHub made the repository but it isn't ready yet. Try again in a moment.");
    const { files, report } = await siteFiles(project, framework);
    const sha = await commitFiles(token, repo.full_name, files, { parent: base.sha, message: `${project.name}, from basedraft Studio\n\n${t.name}${framework === "astro" ? " (Astro)" : ""} with ${project.pages.length} ${project.pages.length === 1 ? "page" : "pages"} you built.` });
    await gh(token, `/repos/${repo.full_name}/git/refs/heads/${encodeURIComponent(repo.default_branch)}`, { method: "PATCH", body: { sha } });
    return { url: repo.html_url, repo: repo.full_name, wrote: "site", files: files.size, missed: report.filter((r) => !r.files.length).map((r) => r.from) };
  }

  if (!FULL_NAME.test(target.repo)) throw new GitHubError(422, "Pick a repository.");
  const repo = await gh<{ full_name: string; default_branch: string; html_url: string; permissions?: { push?: boolean } }>(token, `/repos/${target.repo}`);
  if (!repo.permissions?.push) throw new GitHubError(403, `You can't push to ${repo.full_name}.`);
  let base = await head(token, repo.full_name, repo.default_branch).catch((e: unknown) => {
    if (e instanceof GitHubError && (e.status === 409 || e.status === 404)) return null;
    throw e;
  });
  // An empty repository has nothing to branch from: give it a first commit, then the site.
  const empty = !base;
  if (!base) {
    await gh(token, `/repos/${repo.full_name}/contents/README.md`, { method: "PUT", body: { message: "Start", content: b64(`# ${project.name}\n`) } });
    base = await head(token, repo.full_name, repo.default_branch);
  }

  // Is this already the template? Then only your pages and your text go in, over its own code.
  const now = empty ? new Map<string, Uint8Array>() : await filesAt(token, repo.full_name, repo.default_branch);
  const ours = now.has("basedraft/project.json") || packageName(now.get("package.json")) === (await packageNameOf(t.slug));
  // Which version is there: an Astro one says so in its project.json, or has Astro's config.
  const astroThere = /"framework":\s*"astro"/.test(textOf(now.get("basedraft/project.json") ?? new Uint8Array()) ?? "") || now.has("astro.config.mjs");
  if (ours && astroThere !== (framework === "astro"))
    throw new GitHubError(409, `${repo.full_name} has the ${astroThere ? "Astro" : "Next.js"} version of ${t.name}. Send that version there, or start a new repository for the ${framework === "astro" ? "Astro" : "Next.js"} one.`);
  let files: Files;
  let missed: string[];
  if (framework === "astro") {
    // The Astro version is made whole each time; what goes in is what differs from the repository.
    const site = await siteFiles(project, "astro");
    files = new Map([...site.files].filter(([k, v]) => !now.has(k) || (typeof v === "string" ? v !== textOf(now.get(k)!) : !sameBytes(v, now.get(k)!))));
    missed = site.report.filter((r) => !r.files.length).map((r) => r.from);
  } else if (ours) {
    const copy: Files = new Map([...now].map(([k, v]) => [k, textOf(v) ?? v]));
    const report = writeProject(copy, project);
    // Your images go in over the template's files: they're not text, so they're sent as they are.
    const images = new Set(await writeImages(copy, project));
    files = new Map([...copy].filter(([k, v]) => images.has(k) || (typeof v === "string" && v !== (now.has(k) ? textOf(now.get(k)!) : null))));
    // Text already changed by an earlier send reads as the new words: not a miss.
    const all = [...copy.values()].filter((v): v is string => typeof v === "string");
    missed = report.filter((r) => !r.files.length && !all.some((v) => v.includes(r.to))).map((r) => r.from);
  } else {
    const site = await siteFiles(project);
    files = site.files;
    missed = site.report.filter((r) => !r.files.length).map((r) => r.from);
  }
  if (!files.size) return { url: repo.html_url, repo: repo.full_name, wrote: "update", files: 0, missed };

  const message = ours ? `${project.name}: pages and text from basedraft Studio` : `${project.name}, from basedraft Studio`;
  const sha = await commitFiles(token, repo.full_name, files, { parent: base.sha, base: base.tree, message });
  const wrote = ours ? "update" : "site";
  if (target.direct || empty) {
    await gh(token, `/repos/${repo.full_name}/git/refs/heads/${encodeURIComponent(repo.default_branch)}`, { method: "PATCH", body: { sha } });
    return { url: `${repo.html_url}/commit/${sha}`, repo: repo.full_name, wrote, files: files.size, missed };
  }
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
  const branch = `basedraft/${slug(project.name)}-${stamp}`;
  await gh(token, `/repos/${repo.full_name}/git/refs`, { method: "POST", body: { ref: `refs/heads/${branch}`, sha } });
  const pages = project.pages.map((p) => `- \`${p.path}\` ${p.name} (\`${pageFile(p)}\`)`).join("\n");
  const body = `${ours ? `Your pages and text from basedraft Studio, written into ${t.name}'s code.` : `${t.name}'s code with the pages you built in basedraft Studio. Your files with the same paths are replaced.`}\n\n${pages}${missed.length ? `\n\nThese text changes didn't match the code, so make them by hand:\n${missed.map((m) => `- "${m}"`).join("\n")}` : ""}`;
  const pr = await gh<{ html_url: string; number: number }>(token, `/repos/${repo.full_name}/pulls`, { method: "POST", body: { title: `${project.name} from basedraft`, head: branch, base: repo.default_branch, body } });
  return { url: pr.html_url, repo: repo.full_name, wrote, files: files.size, pull: pr.number, missed };
}
