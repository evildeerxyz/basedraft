import type { SupabaseClient, User } from "@supabase/supabase-js";
import { brand, sendEmail } from "./emails/send";
import { welcome } from "./emails/templates";
import { call } from "./supabase";

/*
 * The emails that follow a change: sent by the route that made it once its answer has gone
 * (Next's after()), so a slow send never holds anyone up. The sign-in code is the one email that
 * isn't here: Supabase asks for it, at src/app/api/auth/email.
 */

/** The welcome email, once per account (the database keeps count), with the name they gave. */
export async function welcomeOnce(db: SupabaseClient, user: User) {
  if (!user.email || !(await call(db, "claim_welcome", {}))) return;
  const m = (user.user_metadata ?? {}) as { name?: string; full_name?: string };
  await sendEmail(user.email, welcome(brand(), { name: m.name || m.full_name }));
}

/** For after(): a failed send is logged, not thrown at a response that's already gone. */
export const later = (send: () => Promise<unknown>) => () => send().catch((e) => console.error("Email not sent:", e instanceof Error ? e.message : e));
