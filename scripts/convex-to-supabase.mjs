#!/usr/bin/env node
/*
 * Copies basedraft's data from Convex to Supabase, once, when moving: accounts, purchases, teams,
 * projects with who they're shared with, their versions and comments, saved sections, and the
 * images projects use.
 *
 *   node scripts/convex-to-supabase.mjs --prod --dry-run   read production Convex, say what would be copied
 *   node scripts/convex-to-supabase.mjs --prod             copy it
 *
 * Convex is read with its CLI, as you're logged in to it (`npx convex data`: CONVEX_DEPLOYMENT in
 * .env.local, or its production deployment with --prod). Supabase is written with
 * NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY from .env.local, and must have its tables
 * (supabase/migrations) and no projects, purchases or teams in them yet.
 *
 * Accounts are made with the same emails, already confirmed, so people sign in with a code as
 * before (and Google or GitHub join up with them by email); someone who already signed in to the
 * Supabase site keeps that account. Ids change: each project keeps its Convex id (legacy_id), so
 * links to it still open it, and images move from Convex's storage to the "images" bucket.
 * Presence isn't copied: it's live state. Run it after the last purchase on the old site, just
 * before the new one goes live.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(import.meta.dirname, "..");
const prod = process.argv.includes("--prod");
const dry = process.argv.includes("--dry-run");
const env = {
  ...Object.fromEntries(
    readFileSync(path.join(root, ".env.local"), "utf8")
      .split("\n")
      .filter((l) => /^[A-Z_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
  ),
  ...process.env,
};
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SECRET_KEY) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first.");
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

/** The most rows the CLI reads from a table at once: far more than basedraft has. */
const LIMIT = 10000;

/** A Convex table, every row of it. */
function convex(table, component) {
  const args = ["--yes", "convex@1.46.0", "data", ...(prod ? ["--prod"] : []), ...(component ? ["--component", component] : []), table, "--limit", String(LIMIT), "--format", "jsonl"];
  const out = execFileSync("npx", args, { cwd: root, encoding: "utf8", maxBuffer: 1 << 30, env: { ...process.env, CONVEX_DEPLOYMENT: env.CONVEX_DEPLOYMENT } });
  const rows = out
    .split("\n")
    .filter((l) => l.startsWith("{"))
    .map((l) => JSON.parse(l));
  if (rows.length >= LIMIT) throw new Error(`${table} has ${LIMIT} rows or more: copy it in parts.`);
  return rows.sort((a, b) => a._creationTime - b._creationTime);
}

const at = (ms) => new Date(ms).toISOString();
const skipped = [];
const skip = (what, why) => skipped.push(`${what}: ${why}`);

async function insert(table, rows) {
  if (dry || !rows.length) return;
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await db.from(table).insert(rows.slice(i, i + 200));
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

console.log(`Reading Convex (${prod ? "production" : "development"})…`);
const read = {
  users: convex("user", "betterAuth"),
  purchases: convex("purchases"),
  webhookEvents: convex("webhookEvents"),
  teams: convex("teams"),
  teamMembers: convex("teamMembers"),
  projects: convex("projects"),
  projectMembers: convex("projectMembers"),
  versions: convex("versions"),
  comments: convex("comments"),
  saved: convex("saved"),
};
console.log(Object.entries(read).map(([k, v]) => `${k} ${v.length}`).join(", "));

// Supabase has to be empty of what's copied, so nothing is copied twice.
for (const t of ["projects", "purchases", "teams", "saved"]) {
  const { count, error } = await db.from(t).select("*", { count: "exact", head: true });
  if (error) throw new Error(`Supabase ${t}: ${error.message}. Are the migrations applied?`);
  if (count) throw new Error(`Supabase already has ${count} ${t}: this copies into an empty project only.`);
}

/* ---------- accounts ---------- */

const existing = new Map();
for (let page = 1; ; page++) {
  const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw error;
  for (const u of data.users) if (u.email) existing.set(u.email.toLowerCase(), u.id);
  if (data.users.length < 1000) break;
}
const userId = new Map();
let madeUsers = 0;
for (const u of read.users) {
  const email = u.email.toLowerCase();
  let id = existing.get(email);
  if (!id && !dry) {
    const { data, error } = await db.auth.admin.createUser({ email, email_confirm: true, user_metadata: u.name?.trim() ? { name: u.name.trim() } : {} });
    if (error) throw new Error(`account ${email}: ${error.message}`);
    id = data.user.id;
  }
  if (!existing.has(email)) madeUsers++;
  userId.set(u._id, id ?? `dry:${u._id}`);
}
// They've had their welcome.
await insert("welcomed", [...new Set(userId.values())].map((user_id) => ({ user_id })));
const user = (id) => (id ? (userId.get(id) ?? null) : null);

/* ---------- images ---------- */

const CONVEX_IMAGE = /^https:\/\/[a-z0-9-]+\.convex\.cloud\/api\/storage\/[0-9a-f-]{20,}$/i;
const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const moved = new Map();
async function moveImage(url, owner) {
  if (moved.has(url)) return moved.get(url);
  let to = url;
  if (!dry) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`image ${url}: ${res.status}`);
    const type = res.headers.get("content-type") ?? "image/jpeg";
    const key = `${owner}/${crypto.randomUUID()}.${EXT[type] ?? "jpg"}`;
    const { error } = await db.storage.from("images").upload(key, new Uint8Array(await res.arrayBuffer()), { contentType: type, cacheControl: "31536000" });
    if (error) throw new Error(`image ${url}: ${error.message}`);
    to = db.storage.from("images").getPublicUrl(key).data.publicUrl;
  }
  moved.set(url, to);
  return to;
}
/** A project's data, its images in Supabase's storage. */
async function withImages(data, owner) {
  if (!data?.images || typeof data.images !== "object") return data;
  const images = {};
  for (const [file, img] of Object.entries(data.images)) images[file] = img?.url && CONVEX_IMAGE.test(img.url) ? { ...img, url: await moveImage(img.url, owner) } : img;
  return { ...data, images };
}

/* ---------- the rest ---------- */

const ids = new Map();
const idFor = (convexId) => {
  if (!ids.has(convexId)) ids.set(convexId, crypto.randomUUID());
  return ids.get(convexId);
};

const teams = read.teams.filter((t) => user(t.ownerId) || skip(`team ${t._id}`, "its owner's account is gone"));
await insert("teams", teams.map((t) => ({ id: idFor(t._id), owner_id: user(t.ownerId), name: t.name, created_at: at(t._creationTime) })));
await insert(
  "team_members",
  read.teamMembers
    .filter((m) => ids.has(m.teamId) || skip(`team seat ${m._id}`, "its team is gone"))
    .map((m) => ({ id: idFor(m._id), team_id: ids.get(m.teamId), email: m.email, user_id: user(m.userId), role: m.role, status: m.status, token: m.token ?? null, invited_by: user(m.invitedBy), created_at: at(m._creationTime) })),
);

const projects = [];
for (const p of read.projects) {
  const owner = user(p.ownerId);
  if (!owner) {
    skip(`project ${p._id}`, "its owner's account is gone");
    continue;
  }
  projects.push({
    id: idFor(p._id),
    legacy_id: p._id,
    owner_id: owner,
    name: p.name,
    template: p.template,
    data: await withImages(p.data, owner),
    team_id: p.teamId ? (ids.get(p.teamId) ?? null) : null,
    link_access: p.linkAccess,
    updated_at: at(p.updatedAt),
    updated_by: user(p.updatedBy),
    updated_client: p.updatedClient ?? null,
    rev: p.rev,
    created_at: at(p._creationTime),
  });
}
await insert("projects", projects);
const ownerOf = new Map(projects.map((p) => [p.id, p.owner_id]));
const inProject = (what) => (r) => ids.has(r.projectId) || skip(`${what} ${r._id}`, "its project wasn't copied");

await insert("project_members", read.projectMembers.filter(inProject("share")).map((m) => ({ id: idFor(m._id), project_id: ids.get(m.projectId), email: m.email, role: m.role, invited_by: user(m.invitedBy), created_at: at(m._creationTime) })));

const versions = [];
for (const v of read.versions.filter(inProject("version")))
  versions.push({ id: idFor(v._id), project_id: ids.get(v.projectId), name: v.name ?? null, data: await withImages(v.data, ownerOf.get(ids.get(v.projectId))), author_id: user(v.authorId), author_name: v.authorName, auto: v.auto, created_at: at(v._creationTime) });
await insert("versions", versions);

// Pins before their replies.
const comments = read.comments.filter(inProject("comment"));
const row = (c) => ({ id: idFor(c._id), project_id: ids.get(c.projectId), view: c.view, device: c.device ?? null, anchor: c.anchor ?? null, x: c.x, y: c.y, parent_id: c.parentId ? idFor(c.parentId) : null, author_id: user(c.authorId), author_name: c.authorName, body: c.body, resolved: Boolean(c.resolved), created_at: at(c._creationTime) });
const pins = comments.filter((c) => !c.parentId);
const pinIds = new Set(pins.map((c) => c._id));
await insert("comments", pins.map(row));
await insert("comments", comments.filter((c) => c.parentId && (pinIds.has(c.parentId) || skip(`reply ${c._id}`, "its pin is gone"))).map(row));

await insert("saved", read.saved.filter((s) => user(s.userId) || skip(`saved section ${s._id}`, "its account is gone")).map((s) => ({ user_id: user(s.userId), template: s.template, section_id: s.sectionId, created_at: at(s._creationTime) })));
// Purchases go across whoever they're on: their email finds the account either way.
await insert("purchases", read.purchases.map((p) => ({ user_id: user(p.userId), email: p.email, product: p.product, status: p.status, payment_id: p.paymentId ?? null, membership_id: p.membershipId ?? null, plan_id: p.planId ?? null, amount: p.amount ?? null, currency: p.currency ?? null, created_at: at(p._creationTime) })));
await insert("webhook_events", read.webhookEvents.map((e) => ({ event_id: e.eventId, created_at: at(e._creationTime) })));

console.log(
  `${dry ? "Would copy" : "Copied"}: ${read.users.length} accounts (${madeUsers} new, ${read.users.length - madeUsers} already on Supabase), ${read.purchases.length} purchases, ${teams.length} teams, ${projects.length} projects, ${versions.length} versions, ${comments.length} comments, ${read.saved.length} saved sections, ${moved.size} images.`,
);
if (skipped.length) console.log(`Not copied, ${skipped.length}:\n  ${skipped.join("\n  ")}`);
