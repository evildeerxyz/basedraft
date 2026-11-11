# basedraft

Finished websites you make your own. basedraft.site has three complete Next.js sites (Zuno, Noma, Auren), every one of their sections on its own, 111 React components, whole app screens made of them, and Studio, where you rearrange a site's pages and rewrite its words, then paste it into Figma, download the code or send it to GitHub.

**basedraft is free and open source, under the MIT license.** Every template, component, screen and block is free, with nothing behind a paywall. If it saves you time, the site's "Buy me a Claude plan" button puts any amount toward the Claude plan that builds it.

| | What it is | Where |
| --- | --- | --- |
| **Templates** | The three sites, live, with every page | `/templates`, `/templates/[slug]` |
| **Components** | basedraft UI, our own React components, all 111 in the npm package `@basedraft/ui` (also each one file at `/ui/<name>.tsx`) | `/components`, `/components/[name]`, `/components/get-started` |
| **Screens** | Whole app pages made of basedraft UI, each one file (`/ui/screens/<slug>.tsx`) | `/screens`, `/screens/[slug]` |
| **Blocks** | Every section from the templates, live at any width, with code and a copy for Figma (moved from `/components`, which redirects) | `/blocks`, `/blocks/[kind]` |
| **Studio** | A Framer style canvas over the real site | `/studio` |

```bash
npm install
npm run dev        # basedraft on :3400 with hot reload, the templates on :4101 to :4103
npm run build      # the templates, then basedraft
npm start
```

## How it fits together

Each template is its own Next.js app in `templates/<slug>`, kept exactly as written, and served by basedraft under `/live/<slug>` (multi zones: each zone has `basePath: "/live/<slug>"`, and basedraft's `next.config.ts` rewrites to it). Same origin, so Studio and the exporters can read the live pages directly.

basedraft's own wiring lives beside each template's code, never inside it:

- `bd/manifest.json`: the template's sections, pages and where its pages live (`pagesDir`).
- `bd/sections.tsx`, `bd/compose.tsx`, `app/bd/section/[id]` and `app/bd/compose`: a section on its own, and a page made of sections in any order, for Studio and the previews.

```
src/
  app/(site)/        the site: home, templates, components, screens, blocks
  app/studio/        Studio
  app/api/           auth/* (sign-in callback, code emails, welcome), export (the site as a zip), github/* (connect, repos, push), tip (a Whop checkout)
  server/            site.ts builds a project's whole site, github.ts sends it, guard.ts checks writes come from the site; supabase.ts, whop.ts, mail.ts and emails/
  site/              chrome, page blocks, live.ts (the catalog), and the Figma and Paper exporters
  studio/            Studio: canvas, panels, the drafts dialog and export
  lib/               zip, rewrite-text (writing text edits into source), supabase.ts (the browser's client), api.ts (the database's functions, typed)
supabase/            migrations/: the tables, the functions that are the API, live channels and image storage
templates/           zuno, noma, auren
scripts/             run.mjs (all apps), zones.mjs (ports), template-source.mjs (what a download carries), shots.mjs, convex-to-supabase.mjs (the move)
```

### Studio

Studio is kept small on purpose: pick a template, arrange its pages and sections, rewrite its words, then preview it and take it to Figma or the code.

- **Canvas** (`src/studio/canvas.tsx`): one breakpoint at a time (Desktop, Tablet or Phone, switched in the toolbar) at full page height, drawn by the template itself in a same-origin frame. A camera moves over it: panning (Space-drag or the trackpad) and pinching move one GPU layer every frame without rendering React, and the page is drawn again at the new size once a zoom comes to rest. Anything sized to the window (a 100vh hero) is pinned at a real window's height first (`src/site/frame-fit.ts`).
- **Text edits** (`src/site/text-edits.ts`): click any text and type; Enter keeps it, Esc puts it back. An edit is "in this scope, the nth text reading X now reads Y", laid over the page wherever it's drawn, so the template's code never changes until you export.
- **Pages:** the template's home to start, pages you add (blank or copied), and the template's own pages, editable too.
- **Sections:** add one from the template's sections, reorder, duplicate, delete, or swap it for another of its kind, from the Layers tab or the bar over the selected section.
- **Colors** (`src/site/theme.ts`, `src/studio/colors.tsx`): six palettes made for each template, one click each, and the template's light or dark mode where it has both. A palette is laid over the template's CSS variables in the canvas, the preview, Figma copies and the code you download (added to the end of its `globals.css`; Zuno's JS palette gets them too). Shaders and canvases read colors when they're made, so basedraft's wiring in each template (`bd/frame.tsx` in its root layout, `bd/compose.tsx`, `bd/themed.tsx`) draws the page again with new colors, releasing its WebGL contexts first; the download takes the wiring out of the layout.
- **Preview** (`src/studio/preview.tsx`): Play opens the page as it ships, over Studio, at Desktop, Laptop, Tablet, Phone or the window's width (keys 1 to 5), with a page switcher, reload (R) and a way to a tab of its own. Esc comes back. `/studio/preview` is the same in a tab, following Studio's saves.
- **Speed:** the template page shares Studio's main thread, so while it's out of view (behind the preview, say) it's paused with `content-visibility` and costs nothing. Copies are read as the pointer reaches Copy. A preloader covers Studio until its first page is drawn.

### Saving

Signed out, a project is kept in the browser. Signed in, it lives in Supabase (`projects_*` in `supabase/migrations`) and its address is `/studio?p=<id>`. Studio saves the whole project a moment after each change, if the account still has the version the change was made on; when another tab saved first, the project's live channel says so, that save arrives, is merged with yours page by page and edit by edit (`merge3` in `src/studio/state.ts`), and yours saves after it (`src/studio/cloud.ts`). Your drafts open from the account menu, or `/studio#library`.

### Exports

- **Copy for Figma** needs no plugin. The page is read from a hidden frame at each width and written in Figma's own clipboard format (`src/site/figma-*.ts`): auto layout, components, named layers, vectors, gradients, effects and real text layout. Large pastes are encoded before the click, since Chrome only allows a copy for a moment after one.
- **Download project** (`POST /api/export`) and **Send to GitHub** (`/api/github/*`) hand over the same thing: the template's own code (the files in `scripts/template-source.mjs`, minus basedraft's wiring and base path) with the project's pages written in as pages and its text edits written into the source. A new repository gets the whole site. An existing one gets a pull request: just the changed files if it's already a copy of the template, the whole site otherwise.

### The site

- **Template view** (`/view/<slug>`): a template full window, every page clickable, with a card bottom right: Open in Studio, and its code on GitHub. The site's "Open full screen" links go here.
- **Analytics** (`src/instrumentation-client.ts`, `src/site/analytics.tsx`): PostHog, through `/ingest` on the site's own address, and Google Analytics, in production only. Signed-in people are identified by their account; a handful of named events mark the moments that matter (copies, downloads, GitHub sends, sign-ups).

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
| `SEND_EMAIL_HOOK_SECRET` | The Send Email hook's secret, which signs each sign-in code Supabase asks the site to send |
| `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` | basedraft's emails, sent through Resend from `hello@basedraft.site` |
| `WHOP_API_KEY`, `WHOP_COMPANY_ID`, `WHOP_TIP_PRODUCT` | "Buy me a Claude plan": a key that may make checkouts, plans and products, the company (`biz_...`) the payments go to, and optionally the product (`prod_...`) they sit under |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Continue with Google: an OAuth client whose redirect is `<site>/api/auth/callback/google` (development needs `http://localhost:3400/api/auth/callback/google` on it too) |
| `NEXT_PUBLIC_SITE_URL` | This site's address |
| `ZUNO_URL`, `NOMA_URL`, `AUREN_URL` | Where each template zone is deployed |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Send to GitHub. An OAuth app whose callback is `<site>/api/github/callback` |
| `BD_SESSION_SECRET` | Seals the GitHub token in its httpOnly cookie. Required in production |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_GA_ID` | Analytics, production only. Public ids |
| `CONVEX_DEPLOYMENT` | Only until the move is done: `scripts/convex-to-supabase.mjs` reads Convex with it |

Development and the live site share the one Supabase project.

## Deploying

basedraft runs on Cloudflare Workers, on the free plan, at https://basedraft.site, with the Supabase project `rgrnoosyaistemnmmiwl` behind it. One command builds and deploys everything (Node 22, for wrangler):

    node scripts/cf-deploy.mjs            # build and deploy
    node scripts/cf-deploy.mjs --dry-run  # build, and check the worker's size (the free plan allows 3 MB gzipped)

1. **The app**, built for Workers by [OpenNext](https://opennext.js.org/cloudflare) with the public settings in `.env.cloudflare`. Pages prerendered at build are served from the asset store (`open-next.config.ts`); images are served as they are. `src/proxy.ts` is left out of this build: on Cloudflare `cloudflare/worker.ts` wraps OpenNext's worker and guards the previews.
2. **The templates**, built as plain static files (`BD_STATIC=1`, see each template's `next.config.ts`) and served from the asset store under `/live/<slug>` (`scripts/cf-templates.mjs`). Only their preview pages pass through the worker, for the guard; their scripts and styles don't.
3. **The templates' code**, as Download project packs it, in the KV namespace `TEMPLATES`, which `src/server/site.ts` reads on Cloudflare (`BD_SOURCE=kv`).
4. **Wrangler** deploys it all (`wrangler.jsonc`). The templates are then rebuilt for local `next start`.

Two workarounds in the script, until OpenNext catches up with Next 16.4: it adds `preview-props.json` to the manifests OpenNext inlines, and makes the instrumentation hook load (basedraft has none) resolve to nothing.

Settings: public ones are in `wrangler.jsonc` `vars` (and built in from `.env.cloudflare`); secrets go in with `npx wrangler secret put`: `BD_SESSION_SECRET`, `SEND_EMAIL_HOOK_SECRET`, `RESEND_API_KEY`, `WHOP_API_KEY`, `WHOP_COMPANY_ID`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` once Send to GitHub's OAuth app exists, with its callback at `<site>/api/github/callback`. The plain ones (`EMAIL_FROM`) are in `vars`. A change to the database is a new file in `supabase/migrations`, applied with `supabase db push`.

Locally, each template is its own Next app (`next start` on 4101 to 4103) and `next.config.ts` rewrites `/live/<slug>` to it.

## basedraft's own design

- **Quiet grays, a trace of blue.** Cool near-white pages in light mode; neutral grays with no hue in dark (`globals.css`), and light or dark follows the system until you pick (`src/site/color-mode.tsx`). Blue is kept to a trace: small marks use a near-neutral tint with slate ink (`bg-brand-soft`, `text-brand-ink`), and active states lean on ink and grays. Templates keep their own colors.
- **Type.** Instrument Sans for the big sizes, Inter for text, Geist Mono for code, all through `next/font/google` (`src/app/layout.tsx`). One scale in `@theme`: display 72, headline 48, title 32, heading 18, lead 18, body 16, ui 14, meta 12.
- **The hero's light, and quiet cards.** Heroes, stages, scenes and feature panels wear one soft surface (`bd-paper`) lit blue, lilac and mint, arranged one of four ways (`glow-b`, `glow-c`, `glow-d`; `Stage`, `Scene`, `glowAt`). In dark mode the hero, the footer and the announcement stay light paper (`.bd-light` re-applies the light tokens inside them). Gallery cards (components, blocks, templates) are a flat, very light neutral gray instead (`bd-panel`), so a page of them stays calm. Gradient surfaces wear fine, faint dots (`public/textures/dots-fine*.png`); the hero carries the animated dot field (`src/site/dot-field.tsx`). Textures come from `node scripts/textures.mjs`.
- **Buttons.** Every button is a pill. The important action is charcoal inside a brushed-metal edge (`btn-metal`; `btn.ink`, `btnLg.ink`, `btnLg.onPaper` in `src/site/sheet.tsx`).
- **Code is colored.** Commands go through `ShellLine` (`src/site/shell-line.tsx`) and code blocks through the `--code-*` colors; never plain black text.
- **Icons.** Phosphor's duotone (the default across the site, `SiteShell`), with arrows, carets, crosses and pluses in outline. Templates are shown by their own app icons (`public/logos`, `templateLogo`).
- **The mark** is two sheets in ink, the one behind a little lighter (`src/site/logo.tsx`, `src/app/icon.svg`, `public/mark.svg`).
- **Around every page:** an announcement strip (closed for good once you close it; `announce-script.ts` keeps it from flashing), then the header: a plain bar at the top that gathers into a frosted capsule as you scroll. On the docs pages (`/components`, `/blocks`) it stays a plain full-width bar with a hairline, the way a docs site is laid out, and those pages have no footer. Elsewhere the footer is one big light card, ending in the name drawn as a live GPU dither the way Zuno draws its own (`src/site/wordmark.tsx`).
- **Copy:** US English, plain words, no em dashes.
- **Thumbnails** are real renders: `npm run shots` (or `shots -- studio | sections | templates`) while the app runs.
- **Share cards** are real renders too: every page's 1200 by 630 card, the hero's light with the page's icon, name and a line, drawn at `/dev/og` and saved by `node scripts/og.mjs` (while the app runs) into `public/og`. `src/site/og.ts` points each page at its own; released templates only.

## basedraft UI (the components library)

The components ship as the npm package `@basedraft/ui` (`packages/ui`), and their pages live at `/components`.

- **One source.** Each component is one self-contained file in `src/registry/ui/<name>.tsx` (react, motion and Phosphor only, colors from the `--bd-*` tokens and `src/registry/extras.css`). The site, the package and the single-file downloads all read these files.
- **One folder of docs per component.** `src/registry/entries/<name>/` holds `meta.json` (name, title, group, line, order), `doc.ts` (usage, when to use it, parts and props, examples, keyboard, accessibility) and `demo.tsx` (the live demo and one per example). A component appears on the site once its `meta.json` exists.
- **`node scripts/registry.mjs`** after any change: it gathers the folders into `src/registry/catalog.ts` and `catalog-demos.tsx`, writes the sources and export names the pages show, `public/ui` (each file, `basedraft.css`, `index.json`) and `public/llms.txt`.
- **`npm run ui:build`** builds the package into `packages/ui/dist`, every component in it: an ES module per component with its `"use client"`, types, `styles.css` (theme, materials and the compiled styles, no Tailwind needed) and `theme.css` (for Tailwind v4 projects). Publishing is `npm publish --access public` from `packages/ui`, once logged in to npm.

## Accounts and data (Supabase)

Supabase holds the accounts (Supabase Auth), the data (Postgres), the live channel each project saves through (Realtime) and the images older drafts put in templates (Storage). It's all in one migration, `supabase/migrations/20261020000000_basedraft.sql`:

- **The functions are the API.** Every table has row level security on and no policies, so the browser can't read or write one; it calls the functions in the `public` schema (`supabase.rpc()`), which decide who may do what, as whoever is signed in. `src/lib/api.ts` types each one. In the browser, `src/site/db.ts` runs them: `useRpc` shows one's result, shared by every component asking, and fetched again after a change, on sign in and out, when the tab comes back, and when a live channel says so; `change` makes a change and says what it changes. The server calls them as the signed-in person from the session cookie (`src/server/supabase.ts`).
- **Live channels.** Each project has a private channel, `project:<id>`, that only people who may view it can join (a policy on `realtime.messages`). Triggers announce each save there (its rev and the tab that made it), and Studio fetches what changed.
- **Images** are in the public `images` bucket, each account in a folder of its own id. Studio no longer uploads them; drafts that swapped an image before still show and export it.
- **Left from the bigger Studio:** sharing (`projects_people`, `projects_invite` and the rest), versions (`versions_*`, and the one `projects_save` keeps every ten minutes), comments (`comments_*`) and saved sections (`saved_*`) are still in the database, unused by the site.

**Sign in:** an email and a 6-digit code, or Google (and GitHub, once it's turned on). A first sign in makes the account; signing up puts your name on it as it's made. Supabase asks the site to send each code (the Send Email hook, `src/app/api/auth/email`), so it goes out in basedraft's own email through Resend; Google comes back through `/api/auth/callback/google`, GitHub and the links in emails through `/api/auth/callback`. The session is a cookie on this site, kept fresh by the browser, so the server reads the same one. `src/site/auth.tsx` keeps the same card, modal (`openAuth()`), `/sign-in` and `/sign-up` pages and `useAuth()` shape.

Settings in the Supabase dashboard (Authentication):

- **Email:** OTP length 6, OTP expiry 600 seconds (both set).
- **URL configuration:** site URL `https://basedraft.site`; redirect URLs `http://localhost:3400/**` and `https://basedraft.site/**` (both set).
- **Hooks, Send Email:** on: HTTPS, `https://basedraft.site/api/auth/email`, with the secret in `SEND_EMAIL_HOOK_SECRET`. Turned off, Supabase sends its own email instead, with a sign-in link (which `/api/auth/callback` also takes), and only to the project's team.
- **Rate limits:** 100 emails an hour.
- **Sign In / Providers, Google:** on, with the site's Google client id and secret. Google sign in goes through the site, not Supabase's address (`src/server/google.ts`): Google sends people back to `<site>/api/auth/callback/google`, the address its OAuth client already allows (and the one its consent screen names), and the site hands Supabase Google's ID token (`signInWithIdToken`). So the site needs `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` too.
- **Sign In / Providers, GitHub:** off. Turned on, it uses Supabase's own flow, with `https://rgrnoosyaistemnmmiwl.supabase.co/auth/v1/callback` as the GitHub OAuth app's callback.

### Moved from Convex (October 20, 2026)

Everything moved: the code, the settings (the Worker's secrets and vars), and the data, copied by `scripts/convex-to-supabase.mjs --prod` (4 accounts, 3 purchases, 8 projects with their versions, comments and share, and an image). Accounts kept their emails, already confirmed, so people sign in with a code as before; they're signed out once, since Better Auth's sessions don't carry over. Projects kept their Convex ids, so old links still open them.

Nothing runs on Convex any more. Whop's old webhook (which Convex forwarded to `/api/whop/webhook`) went with the paywall: delete it in Whop's dashboard (Developer, Webhooks), and the Convex project with it.

## Buy me a Claude plan (Whop)

basedraft sells nothing. The one payment is optional: "Buy me a Claude plan", in the header, the phone menu and the footer, opens a dialog (`src/site/tip.tsx`) where anyone types any amount from $1 to $2,000, with Claude's plans ($20 Pro, $100 Max 5x, $200 Max 20x) as presets. No sign in.

1. **Pay:** the dialog posts the amount to `/api/tip`, which makes a Whop checkout for exactly that amount (`src/server/whop.ts`): a one-time plan made on the spot, hidden from the store, under one product (`WHOP_TIP_PRODUCT`, or one Whop finds or makes by the identifier `basedraft-claude-plan`). The dialog sends the person on to Whop's checkout page.
2. **Back:** Whop sends them to `/?tip=thanks`, where the site says thank you (`src/site/shell.tsx`).
3. **Not connected:** without `WHOP_API_KEY` and `WHOP_COMPANY_ID`, `GET /api/tip` says so and the dialog shows "Payments are being connected" instead of a working button.

The key needs Whop's `checkout_configuration:create`, `plan:create`, `access_pass:create` and `access_pass:update` permissions.

## Email (Resend)

Templates are in `src/server/emails/templates.ts`: the sign-in code and the welcome email (once per account, after its first sign in). They're tables and inline styles with a dark mode, and their two images (the mark and the dithered band) are served from `public/email` at content-hashed addresses on the live site, written by `node scripts/email-assets.mjs`. See them all at `/dev/email` in development.

## License

MIT, for all of it: the site, Studio, the templates and basedraft UI. See `LICENSE`.
