import posthog from "posthog-js";

/*
 * Product analytics, started before the app is interactive: PostHog records pages, clicks and the
 * moments that matter (see src/site/analytics.tsx), tied to someone's account once they sign in.
 * Events go through /ingest on basedraft's own address (rewritten in next.config.ts), so blockers
 * that drop third-party trackers don't drop them. Production only: development never reports.
 */
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
if (key && process.env.NODE_ENV === "production") {
  try {
    posthog.init(key, { api_host: "/ingest", ui_host: "https://us.posthog.com", defaults: "2026-05-30", person_profiles: "identified_only" });
  } catch {
    /* analytics never stops the site */
  }
}
