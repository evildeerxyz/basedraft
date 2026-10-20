import { after, type NextRequest } from "next/server";
import { sameOrigin } from "@/server/guard";
import { later, sendTeamInvite } from "@/server/mail";
import { asUser, call } from "@/server/supabase";

/*
 * A team invite, by its owner (the database decides): `{ email }` holds a seat for someone new,
 * `{ memberId }` sends an open invite again. Either way they get the email with the link to join.
 */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return Response.json({ error: "Not from this site" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { email?: string; memberId?: string };
  try {
    const db = await asUser();
    const mail =
      typeof body.email === "string" ? await call(db, "teams_invite", { email: body.email }) : typeof body.memberId === "string" ? await call(db, "teams_resend", { member_id: body.memberId }) : null;
    if (!mail) return Response.json({ error: "Who's it for?" }, { status: 400 });
    after(later(() => sendTeamInvite(mail)));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "That didn't go through." }, { status: 400 });
  }
}
