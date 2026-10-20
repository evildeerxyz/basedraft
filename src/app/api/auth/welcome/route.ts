import { after, type NextRequest } from "next/server";
import { sameOrigin } from "@/server/guard";
import { later, welcomeOnce } from "@/server/mail";
import { asUser, signedInUser } from "@/server/supabase";

/*
 * Asked by the sign in card when a code made a new account, once its name is on it. The welcome
 * goes once per account, however often this is asked.
 */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return Response.json({ error: "Not from this site" }, { status: 403 });
  const db = await asUser();
  const user = await signedInUser(db);
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  after(later(() => welcomeOnce(db, user)));
  return Response.json({ ok: true });
}
