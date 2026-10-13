import { connection, type NextRequest } from "next/server";
import { configured, sessionOf } from "@/server/github";

/** Whether GitHub is set up here, and who's connected. */
export async function GET(req: NextRequest) {
  // Always at request time: the keys are read when the site runs, not when it builds.
  await connection();
  const s = configured() ? sessionOf(req) : null;
  return Response.json({ configured: configured(), user: s ? { login: s.login, avatar: s.avatar } : null }, { headers: { "Cache-Control": "no-store" } });
}
