import { after, NextResponse, type NextRequest } from "next/server";
import { later, welcomeOnce } from "@/server/mail";
import { asUser, SUPABASE_ON } from "@/server/supabase";

/*
 * Back from Google or GitHub (or from the link in a sign-in email), with a code that becomes the
 * session, in this site's cookies. Then on to `next`, the page they set out from: only ever a page
 * of this site. A new account gets its welcome on the way.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const next = q.get("next") ?? "/";
  const to = new URL(next.startsWith("/") && !next.startsWith("//") ? next : "/", req.url);
  const code = q.get("code");
  if (code && SUPABASE_ON) {
    const db = await asUser();
    const { data } = await db.auth.exchangeCodeForSession(code);
    const user = data.user;
    if (user && Date.now() - new Date(user.created_at).getTime() < 120_000) after(later(() => welcomeOnce(db, user)));
  }
  return NextResponse.redirect(to);
}
