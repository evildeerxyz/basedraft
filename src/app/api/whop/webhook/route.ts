import { after } from "next/server";
import { deliver, later } from "@/server/mail";
import { verified } from "@/server/webhooks";
import { recordEvent } from "@/server/whop";

/*
 * Whop's webhook: payments, refunds and ended subscriptions, signed per Standard Webhooks with
 * WHOP_WEBHOOK_SECRET. Register <site>/api/whop/webhook in Whop's dashboard, for payment.succeeded,
 * refund.created and the membership events. Whop wants an answer within five seconds: the order
 * email goes out after it. Anything that fails answers 500, and Whop delivers it again.
 */
export async function POST(req: Request) {
  const body = await req.text();
  if (!(await verified(req, body, process.env.WHOP_WEBHOOK_SECRET))) return new Response("Bad signature", { status: 401 });
  const event = JSON.parse(body) as { id?: string; type: string; data: Record<string, unknown> };
  const bought = await recordEvent(event, req.headers.get("webhook-id") ?? event.id ?? "");
  if (bought) after(later(() => deliver(bought)));
  return new Response("OK", { status: 200 });
}
