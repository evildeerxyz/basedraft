import { brand, sendEmail } from "@/server/emails/send";
import { signInCode } from "@/server/emails/templates";
import { verified } from "@/server/webhooks";

/*
 * Supabase's Send Email hook: each time someone asks for a sign-in code, Supabase asks this site
 * to send it, so it goes out in basedraft's own email, through Resend. Signed per Standard
 * Webhooks with SEND_EMAIL_HOOK_SECRET (set the same one on the hook: Authentication, Hooks).
 * Codes last 10 minutes (Authentication, Email, "Email OTP Expiration": 600).
 */

type Hook = { user: { email?: string }; email_data: { token: string; email_action_type: string } };
const fail = (status: number, message: string) => Response.json({ error: { http_code: status, message } }, { status });

export async function POST(req: Request) {
  const body = await req.text();
  if (!(await verified(req, body, process.env.SEND_EMAIL_HOOK_SECRET))) return fail(401, "Bad signature");
  const { user, email_data: e } = JSON.parse(body) as Hook;
  // A code to sign in (making the account, the first time) is the only email basedraft asks Supabase for.
  if (!["signup", "magiclink", "email"].includes(e.email_action_type)) return fail(400, `basedraft doesn't send "${e.email_action_type}" emails.`);
  if (!user.email) return fail(400, "No address to send it to.");
  try {
    await sendEmail(user.email, signInCode(brand(), { code: e.token, minutes: 10 }));
  } catch (err) {
    return fail(500, err instanceof Error ? err.message : "The email didn't send.");
  }
  return Response.json({});
}
