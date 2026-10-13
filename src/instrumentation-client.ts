/*
 * Product analytics: PostHog records pages, clicks and the moments that matter (see
 * src/site/analytics.tsx), tied to someone's account once they sign in. Events go through /ingest
 * on basedraft's own address (rewritten in next.config.ts), so blockers that drop third-party
 * trackers don't drop them. Production only: development never reports.
 *
 * It loads once the browser is idle, after the page is up and taking input, so it never costs a
 * visitor the first paint or the first click. Anything tracked before then waits for it.
 */
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
if (key && process.env.NODE_ENV === "production") {
  const start = () =>
    import("posthog-js")
      .then(({ default: posthog }) => {
        posthog.init(key, { api_host: "/ingest", ui_host: "https://us.posthog.com", defaults: "2026-05-30", person_profiles: "identified_only" });
        // Where src/site/analytics.tsx finds it.
        (window as { posthog?: typeof posthog }).posthog = posthog;
        window.dispatchEvent(new Event("bd-analytics"));
      })
      .catch(() => {
        /* analytics never stops the site */
      });
  if ("requestIdleCallback" in window) requestIdleCallback(start, { timeout: 4000 });
  else setTimeout(start, 2000);
}
