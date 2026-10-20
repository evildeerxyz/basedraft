import { after, type NextRequest } from "next/server";
import type { Role } from "@/lib/api";
import { sameOrigin } from "@/server/guard";
import { later, sendShared } from "@/server/mail";
import { asUser, call } from "@/server/supabase";

/*
 * Shares a project with someone by email (its owner only: the database decides), and emails them
 * a link to it. Someone it was already shared with just gets their new role, and no email.
 */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return Response.json({ error: "Not from this site" }, { status: 403 });
  const { id, email, role } = (await req.json().catch(() => ({}))) as { id?: string; email?: string; role?: Role };
  if (typeof id !== "string" || typeof email !== "string" || (role !== "edit" && role !== "view")) return Response.json({ error: "That isn't a share." }, { status: 400 });
  try {
    const mail = await call(await asUser(), "projects_invite", { id, email, role });
    if (mail) after(later(() => sendShared(mail)));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "That didn't go through." }, { status: 400 });
  }
}
