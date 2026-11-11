import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Args, Fn, Result } from "@/lib/api";

/*
 * Supabase on the server, for route handlers. `asUser()` is whoever is signed in, from this
 * site's cookies (refreshing their session on the way when it's due), so the database's functions
 * decide what they may do just as they do for the browser.
 */

export const SUPABASE_ON = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export async function asUser() {
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (all) => {
        try {
          for (const { name, value, options } of all) jar.set(name, value, options);
        } catch {
          /* the response has gone: the browser keeps its session fresh itself */
        }
      },
    },
  });
}

/** Runs a database function. If it fails, the error is in the function's own words. */
export async function call<F extends Fn>(db: SupabaseClient, fn: F, args: Args<F>): Promise<Result<F>> {
  const { data, error } = await db.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as Result<F>;
}

/** Who's signed in, as Supabase Auth confirms it, or null. */
export async function signedInUser(db: SupabaseClient): Promise<User | null> {
  const { data } = await db.auth.getUser();
  return data.user;
}
