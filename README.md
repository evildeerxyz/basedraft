# basedraft

Finished websites you make your own. basedraft.site sells three complete Next.js sites (Zuno, Noma, Auren), shows every one of their sections on its own, and has Studio, where you rearrange a site's pages and rewrite its words, then paste it into Figma, download the code or send it to GitHub.

| | What it is | Where |
| --- | --- | --- |
| **Templates** | The three sites, live, with every page | `/templates`, `/templates/[slug]` |
| **Components** | All 39 sections, live at any width, with code and a copy for Figma | `/components`, `/components/[kind]` |
| **Studio** | A Framer style canvas over the real site | `/studio` |
| **Pro** | One payment: every template, every export, every update | `/pro` |

```bash
npm install
npm run dev        # basedraft on :3400 with hot reload, the templates on :4101 to :4103
npm run build      # the templates, then basedraft
npm start
```

## How it fits together

Each template is its own Next.js app in `templates/<slug>`, kept exactly as written, and served by basedraft under `/live/<slug>` (multi zones: each zone has `basePath: "/live/<slug>"`, and basedraft's `next.config.ts` rewrites to it). Same origin, so Studio and the exporters can read the live pages directly.

basedraft's own wiring lives beside each template's code, never inside it:

- `bd/manifest.json`: the template's sections, pages, price and where its pages live (`pagesDir`).
- `bd/sections.tsx`, `bd/compose.tsx`, `app/bd/section/[id]` and `app/bd/compose`: a section on its own, and a page made of sections in any order, for Studio and the previews.

```
src/
  app/(site)/        the site: home, templates, components, pro
  app/studio/        Studio
  app/api/           auth/* (sign-in callback, code emails, welcome), whop/webhook, share, team/invite, export (the site as a zip), github/* (connect, repos, push)
  server/            site.ts builds a project's whole site, github.ts sends it, guard.ts gates both; supabase.ts, whop.ts, mail.ts and emails/
  site/              chrome, page blocks, live.ts (the catalog), and the Figma and Paper exporters
  studio/            Studio: canvas, panels, export dialogs, the tour and hints (guide.tsx)
  lib/               zip, rewrite-text (writing text edits into source), supabase.ts (the browser's client), api.ts (the database's functions, typed)
supabase/            migrations/: the tables, the functions that are the API, live channels and image storage
templates/           zuno, noma, auren, pello
scripts/             run.mjs (all apps), zones.mjs (ports), template-source.mjs (what a buyer gets), shots.mjs, convex-to-supabase.mjs (the move)
```

### Studio

- **Canvas** (`src/studio/canvas.tsx`): every breakpoint side by side at full page height, drawn by the template itself in same-origin frames. A camera moves over the board: panning and pinching move one GPU layer every frame without rendering React, and the pages are drawn again at the new size once a zoom comes to rest. Anything sized to the window (a 100vh hero) is pinned at a real window's height first (`src/site/frame-fit.ts`).
- **Text edits** (`src/site/text-edits.ts`): double-click any text. An edit is "in this scope, the nth text reading X now reads Y", laid over the page wherever it's drawn, so the template's code never changes until you export.
- **Pages:** the template's home to start, pages you add (blank or copied), and the template's own pages, editable too.
- **Colors** (`src/site/theme.ts`, `src/studio/colors.tsx`): six palettes made for each template, and its four colors (accent, page, cards, text) to change one by one. The template's other shades follow from those four, mixed the way it mixes its own. The colors are laid over the template's CSS variables in the canvas, the preview, Figma copies and the code you download (added to the end of its `globals.css`; Zuno's JS palette gets them too). A few rules cover places a template writes a color into a class (Noma's button hovers and text on the accent). Shaders and canvases read colors when they're made, so basedraft's wiring in each template (`bd/frame.tsx` in its root layout, `bd/compose.tsx`, `bd/themed.tsx`) draws the page again with new colors, releasing its WebGL contexts first; the download takes the wiring out of the layout.
- **Preview** (`src/studio/preview.tsx`): Play opens the page as it ships, over Studio, at Desktop, Laptop, Tablet, Phone or the window's width (keys 1 to 5), with a page switcher, reload (R) and a way to a tab of its own. Esc comes back. `/studio/preview` is the same in a tab, following Studio's saves.
- **Speed:** the template pages share Studio's main thread, so a breakpoint out of view (or under a panel, or behind the preview) is paused with `content-visibility` and costs nothing until it's back. Copies are read as the pointer reaches Copy.
- **Help:** a four-step tour the first time, a hint line above the toolbar that follows what you're doing, and every shortcut under `?`. A preloader covers Studio until its first page is drawn.

### Working together

Signed in, a project lives in Supabase (`projects_*` in `supabase/migrations`) and its address is `/studio?p=<id>`. Studio saves the whole project a moment after each change, if the account still has the version the change was made on; when someone else saved first, the project's live channel says so, their save arrives, is merged with yours page by page and edit by edit (`merge3` in `src/studio/state.ts`, also used so undo never takes out a teammate's change), and yours saves after it (`src/studio/cloud.ts`).

- **Sharing:** with people by email (edit or view), with your whole team, or as a view-only link. Invites are emailed.
- **Teams** (`/team`, `teams_*`): the Team plan's ten seats. The owner invites by email (`/invite/<token>`, a link that works once, for that address), resends, cancels and removes; anyone can leave. Everyone on a team whose owner has Team has Pro while they're on it.
- **Live:** everyone's cursor on the page they're on, their faces in the top bar, and their selections in their colors, sent on the project's live channel (`src/studio/collab.tsx`, `src/studio/channel.ts`).
- **Comments** (C): a pin on any section at any breakpoint, with replies, resolve and delete, listed in the inspector while commenting (`comments_*`).
- **Library and history:** your drafts, your team's, the ones shared with you and your saved sections; versions you name, and one kept every ten minutes of editing.

### Exports

- **Copy for Figma** needs no plugin. The page is read from a hidden frame at each width and written in Figma's own clipboard format (`src/site/figma-*.ts`): auto layout, components, named layers, vectors, gradients, effects and real text layout. Large pastes are encoded before the click, since Chrome only allows a copy for a moment after one.
- **Download project** (`POST /api/export`) and **Send to GitHub** (`/api/github/*`) hand over the same thing: the template's own code (the files in `scripts/template-source.mjs`, minus basedraft's wiring and base path) with the project's pages written in as pages and its text edits written into the source. A new repository gets the whole site. An existing one gets a pull request: just the changed files if it's already a copy of the template, the whole site otherwise.

### The site

- **Template view** (`/view/<slug>`): a template full window, every page clickable, with a card bottom right: its price, Buy, and Open in Studio. The site's "Open full screen" links go here.
- **Analytics** (`src/instrumentation-client.ts`, `src/site/analytics.tsx`): PostHog, through `/ingest` on the site's own address, and Google Analytics, in production only. Signed-in people are identified by their account; a handful of named events mark the moments that matter (copies, downloads, GitHub sends, sign-ups, comments, invites, shares).

## Astro versions

Every template also downloads (and goes to GitHub) as an Astro 7 project. `scripts/astro.mjs`
makes it from the same files Download project packs, after your pages, text, style and images are
written in: the template's components stay exactly as they are and run as one React island per
page; its `app/` routes move to `src/routes`, each with an Astro page and an island beside it;
metadata, fonts (Astro's fonts API, under next/font's CSS variables), social images, robots.txt
and sitemap.xml are carried over; and `src/next` answers the few `next/*` imports components use.
The conversion is pure string work (about 7 ms), so it runs in the Worker at download time.

After changing a template, check its Astro version still builds (Node.js 22.12 or newer):

    npx tsx --tsconfig tsconfig.json scripts/astro-check.ts

## Environment

See `.env.example`. In `.env.local`:

| Variable | For |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The Supabase project (`rgrnoosyaistemnmmiwl`): its address and publishable key |
| `SUPABASE_SECRET_KEY` | Server only: Whop's webhook records purchases with it |
| `SEND_EMAIL_HOOK_SECRET` | The Send Email hook's secret, which signs each sign-in code Supabase asks the site to send |
| `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` | basedraft's emails, sent through Resend from `hello@basedraft.site` |
| `WHOP_API_KEY`, `WHOP_WEBHOOK_SECRET` | Whop checkout, and its webhook at `<site>/api/whop/webhook` |
| `WHOP_PLAN_ZUNO`, `WHOP_PLAN_NOMA`, `WHOP_PLAN_AUREN`, `WHOP_PLAN_PELLO`, `WHOP_PLAN_PRO`, `WHOP_PLAN_TEAM` | Each product's Whop plan id |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Continue with Google: an OAuth client whose redirect is `<site>/api/auth/callback/google` (development needs `http://localhost:3400/api/auth/callback/google` on it too) |
| `NEXT_PUBLIC_SITE_URL` | This site's address |
| `ZUNO_URL`, `NOMA_URL`, `AUREN_URL`, `PELLO_URL` | Where each template zone is deployed |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Send to GitHub. An OAuth app whose callback is `<site>/api/github/callback` |
| `BD_SESSION_SECRET` | Seals the GitHub token in its httpOnly cookie. Required in production |
| `BD_EXPORT_OPEN` | Lets a production deployment hand out template code before purchases are connected. Leave it off in public |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_GA_ID` | Analytics, production only. Public ids |
| `CONVEX_DEPLOYMENT` | Only until the move is done: `scripts/convex-to-supabase.mjs` reads Convex with it |

Development and the live site share the one Supabase project. To preview the Team plan without buying it ("Preview Pro" on `/team`), a separate development project needs `insert into settings values ('preview_allowed', '1')`; never on the live one.

## Deploying

basedraft runs on Cloudflare Workers, on the free plan, at https://basedraft.site, with the Supabase project `rgrnoosyaistemnmmiwl` behind it. One command builds and deploys everything (Node 22, for wrangler):

    node scripts/cf-deploy.mjs            # build and deploy
    node scripts/cf-deploy.mjs --dry-run  # build, and check the worker's size (the free plan allows 3 MB gzipped)

1. **The app**, built for Workers by [OpenNext](https://opennext.js.org/cloudflare) with the public settings in `.env.cloudflare`. Pages prerendered at build are served from the asset store (`open-next.config.ts`); images are served as they are. `src/proxy.ts` is left out of this build: on Cloudflare `cloudflare/worker.ts` wraps OpenNext's worker and guards the previews.
2. **The templates**, built as plain static files (`BD_STATIC=1`, see each template's `next.config.ts`) and served from the asset store under `/live/<slug>` (`scripts/cf-templates.mjs`). Only their preview pages pass through the worker, for the guard; their scripts and styles don't.
3. **The templates' code**, as their buyers get it, in the private KV namespace `TEMPLATES`, which `src/server/site.ts` reads on Cloudflare (`BD_SOURCE=kv`).
4. **Wrangler** deploys it all (`wrangler.jsonc`). The templates are then rebuilt for local `next start`.

Two workarounds in the script, until OpenNext catches up with Next 16.4: it adds `preview-props.json` to the manifests OpenNext inlines, and makes the instrumentation hook load (basedraft has none) resolve to nothing.

Settings: public ones are in `wrangler.jsonc` `vars` (and built in from `.env.cloudflare`); secrets go in with `npx wrangler secret put`: `BD_SESSION_SECRET`, `SUPABASE_SECRET_KEY`, `SEND_EMAIL_HOOK_SECRET`, `RESEND_API_KEY`, `WHOP_API_KEY`, `WHOP_WEBHOOK_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` once Send to GitHub's OAuth app exists, with its callback at `<site>/api/github/callback`. The plain ones (`EMAIL_FROM`, `WHOP_PLAN_*`) are in `vars`. A change to the database is a new file in `supabase/migrations`, applied with `supabase db push`.

Locally, each template is its own Next app (`next start` on 4101 to 4103) and `next.config.ts` rewrites `/live/<slug>` to it.

## basedraft's own design

- **Neutral and quiet.** White, pure grays with no hue, ink (`#141414`) as the only highlight; light and dark modes. Templates keep their own colors.
- **Words on the page, things in boxes.** Headings sit open on the page (`PageHead`, `SectionHead` in `src/site/heads.tsx`); boxes are for what you look at or use: a live site, a card, a code block.
- **Tight corners.** Sheets and dialogs 12px, anything inside them 6px, cards 8px, controls 7px (`--bd-r-sheet`, `--bd-r-inset`, `--bd-radius`, `--bd-radius-sm`).
- **One type scale.** display 52, title 30, heading 17, lead 17, body 15, ui 14, meta 13. Studio runs at tool density.
- **Copy:** US English, plain words, no em dashes.
- **The mark** is two sheets, one laid over the other (`src/site/logo.tsx`, `src/app/icon.svg`), drawn in ink so it turns light in dark mode.
- **Around every page:** the rail (where you go), a top bar (search with Cmd K, the templates at a glance, resources, pricing, your account), and on desktop the Pro poster as a card in the bottom right corner.
- **Thumbnails** are real renders: `npm run shots` (or `shots -- studio | sections | templates`) while the app runs.

### Fonts

The chrome is set in **Söhne** (Klim Type Foundry) from `public/fonts/sohne/`. Those files are Klim's trial cuts, personal use only, and git-ignored on purpose. **Buy a Söhne web license before launch.** Söhne is never part of anything sold; the templates use free fonts.

## Accounts and data (Supabase)

Supabase holds the accounts (Supabase Auth), the data (Postgres), the live channels Studio works together on (Realtime) and the images people put in templates (Storage). It's all in one migration, `supabase/migrations/20261020000000_basedraft.sql`:

- **The functions are the API.** Every table has row level security on and no policies, so the browser can't read or write one; it calls the functions in the `public` schema (`supabase.rpc()`), which decide who may do what, as whoever is signed in. `src/lib/api.ts` types each one. In the browser, `src/site/db.ts` runs them: `useRpc` shows one's result, shared by every component asking, and fetched again after a change, on sign in and out, when the tab comes back, and when a live channel says so; `change` makes a change and says what it changes. The server calls them as the signed-in person from the session cookie (`src/server/supabase.ts`), and as basedraft itself, with the secret key, only for Whop's webhook.
- **Live channels.** Each project has a private channel, `project:<id>`, that only people who may view it can join (a policy on `realtime.messages`). Triggers announce each save (its rev and the tab that made it), share, version and comment there, and Studio fetches what changed. Pointers and faces go on the same channel from each Studio; they're never stored.
- **Images** go in the public `images` bucket, each account in a folder of its own id; Storage turns away anything that isn't a JPEG, PNG or WebP under 8 MB.

**Sign in:** an email and a 6-digit code, or Google (and GitHub, once it's turned on). A first sign in makes the account; signing up puts your name on it as it's made. Supabase asks the site to send each code (the Send Email hook, `src/app/api/auth/email`), so it goes out in basedraft's own email through Resend; Google comes back through `/api/auth/callback/google`, GitHub and the links in emails through `/api/auth/callback`. The session is a cookie on this site, kept fresh by the browser, so the server reads the same one. `src/site/auth.tsx` keeps the same card, modal (`openAuth()`), `/sign-in` and `/sign-up` pages and `useAuth()` shape.

Settings in the Supabase dashboard (Authentication):

- **Email:** OTP length 6, OTP expiry 600 seconds (both set).
- **URL configuration:** site URL `https://basedraft.site`; redirect URLs `http://localhost:3400/**` and `https://basedraft.site/**` (both set).
- **Hooks, Send Email:** HTTPS, `https://basedraft.site/api/auth/email`, with the secret in `SEND_EMAIL_HOOK_SECRET` (set, and off until the site that answers it is live: until then Supabase sends its own email, with a sign-in link, and only to the project's team). Then raise the email rate limit under Rate Limits.
- **Sign In / Providers, Google:** on, with the site's Google client id and secret. Google sign in goes through the site, not Supabase's address (`src/server/google.ts`): Google sends people back to `<site>/api/auth/callback/google`, the address its OAuth client already allows (and the one its consent screen names), and the site hands Supabase Google's ID token (`signInWithIdToken`). So the site needs `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` too.
- **Sign In / Providers, GitHub:** off. Turned on, it uses Supabase's own flow, with `https://rgrnoosyaistemnmmiwl.supabase.co/auth/v1/callback` as the GitHub OAuth app's callback.

### Moving from Convex

The code has moved; the data moves once, just before the new site goes live:

1. Set the Worker's secrets and vars (see Deploying), copying the values that were on Convex (`npx convex env list --prod`): Resend, Whop and the plan ids.
2. `node scripts/convex-to-supabase.mjs --prod --dry-run`, then without `--dry-run` (Node 22). It copies accounts (same emails, confirmed: people sign in with a code as before), purchases, teams, projects with their shares, versions and comments, saved sections, and moves images to the bucket. Projects keep their Convex ids, so old links still open them.
3. `node scripts/cf-deploy.mjs`, then turn the Send Email hook on, point Whop's webhook at `https://basedraft.site/api/whop/webhook`, and give the Google and GitHub OAuth apps Supabase's callback.

## Selling and delivery (Whop)

Payments run on Whop; what someone owns lives in Supabase (`purchases`), tied to their basedraft account.

1. **Buy:** every Buy and Get Pro button goes to `/checkout?product=<zuno|auren|pro|team>`. Signed out, that's sign up first and straight back. Then the route opens a Whop checkout (`src/server/whop.ts`) for the product's plan, with the buyer's basedraft id and email as metadata, and sends them to it.
2. **Paid:** Whop's `payment.succeeded` webhook lands at `<site>/api/whop/webhook`, signed per Standard Webhooks (`src/server/webhooks.ts`). It records the purchase (each event once, however often Whop delivers it), and `refund.created` or an ended membership takes it away again.
3. **Delivered:** the order email goes out once the webhook has its answer (`src/server/mail.ts`): download the site as a zip, or send it to GitHub. Both links go to `/purchases`, which lists everything the buyer owns, keeps asking after a checkout until the payment lands, and runs the download or GitHub flow from the email's link. Purchases match by account and by email, so buying before signing up works.
4. **Gated:** see below.

### What's gated

- **Pro only (signed in, with Pro or Team):** Copy for Figma, Copy for Paper, Download SVG, the whole site to Figma, and section code on the component pages.
- **Pro, or owning the template:** code export in Studio, Download project and Send to GitHub. `/api/export` and `/api/github/push` check it on the server (`purchases_mine`, in `src/server/guard.ts`), in development too.
- **Free for everyone:** Studio itself, with every template and section to try, and JSON export. Every template is paid: $79 each, or all of them with Pro.
- **Signed out is always Free.** Pro comes only from a purchase in Supabase (`src/site/plan.ts`).
- **Previewing Pro, development only:** the switch on the Pro page (or in the Pro card) turns Pro on for a signed-in account without buying it, shows "Pro preview" in the top bar and Studio, and sends an `x-bd-preview` header the server honors only outside production. `BD_EXPORT_OPEN=1` opens code export on a deployment, for a private preview.

To connect Whop: make a product and plan for each of Zuno, Noma, Auren, Pro and Team, set their plan ids, `WHOP_API_KEY` and the webhook's `WHOP_WEBHOOK_SECRET` in the site's settings, and subscribe the webhook at `<site>/api/whop/webhook` to `payment.succeeded`, `refund.created` and the membership events.

## Email (Resend)

Templates are in `src/server/emails/templates.ts`: the sign-in code, the welcome email (once per account, after its first sign in), the order email for a template or for Pro, a team invite and a shared draft. They're tables and inline styles with a dark mode, and their two images (the mark and the dithered band) are served from `public/email` at content-hashed addresses on the live site, written by `node scripts/email-assets.mjs`. See them all at `/dev/email` in development.

## License

Pro covers the buyer's own products. Team adds client work and seats. No license allows reselling the templates.
