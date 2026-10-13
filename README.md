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
npm run dev        # basedraft on :3400 with hot reload, the templates on :4101 to :4103, Convex watching convex/
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
  app/api/           auth (Better Auth, passed to Convex), export (the site as a zip), github/* (connect, repos, push)
  server/            site.ts builds a project's whole site, github.ts sends it, guard.ts gates both
  site/              chrome, page blocks, live.ts (the catalog), and the Figma and Paper exporters
  studio/            Studio: canvas, panels, export dialogs, the tour and hints (guide.tsx)
  lib/               zip, rewrite-text (writing text edits into source)
convex/              Convex: Better Auth (auth.ts), its routes (http.ts) and component (convex.config.ts)
templates/           zuno, noma, auren
scripts/             run.mjs (all apps), zones.mjs (ports), template-source.mjs (what a buyer gets), shots.mjs
```

### Studio

- **Canvas** (`src/studio/canvas.tsx`): every breakpoint side by side at full page height, drawn by the template itself in same-origin frames. A camera moves over the board: panning and pinching move one GPU layer every frame without rendering React, and the pages are drawn again at the new size once a zoom comes to rest. Anything sized to the window (a 100vh hero) is pinned at a real window's height first (`src/site/frame-fit.ts`).
- **Text edits** (`src/site/text-edits.ts`): double-click any text. An edit is "in this scope, the nth text reading X now reads Y", laid over the page wherever it's drawn, so the template's code never changes until you export.
- **Pages:** the template's home to start, pages you add (blank or copied), and the template's own pages, editable too.
- **Colors** (`src/site/theme.ts`, `src/studio/colors.tsx`): six palettes made for each template, and its four colors (accent, page, cards, text) to change one by one. The template's other shades follow from those four, mixed the way it mixes its own. The colors are laid over the template's CSS variables in the canvas, the preview, Figma copies and the code you download (added to the end of its `globals.css`; Zuno's JS palette gets them too). A few rules cover places a template writes a color into a class (Noma's button hovers and text on the accent).
- **Preview** (`src/studio/preview.tsx`): Play opens the page as it ships, over Studio, at Desktop, Laptop, Tablet, Phone or the window's width (keys 1 to 5), with a page switcher, reload (R) and a way to a tab of its own. Esc comes back. `/studio/preview` is the same in a tab, following Studio's saves.
- **Help:** a four-step tour the first time, a hint line above the toolbar that follows what you're doing, and every shortcut under `?`. A preloader covers Studio until its first page is drawn.

### Working together

Signed in, a project lives in Convex (`convex/projects.ts`) and its address is `/studio?p=<id>`. Studio saves the whole project a moment after each change, if the account still has the version the change was made on; when someone else saved first, their save arrives, is merged with yours page by page and edit by edit (`merge3` in `src/studio/state.ts`, also used so undo never takes out a teammate's change), and yours saves after it (`src/studio/cloud.ts`).

- **Sharing:** with people by email (edit or view), with your whole team, or as a view-only link. Invites are emailed.
- **Teams** (`/team`, `convex/teams.ts`): the Team plan's ten seats. The owner invites by email (`/invite/<token>`, a link that works once, for that address), resends, cancels and removes; anyone can leave. Everyone on a team whose owner has Team has Pro while they're on it.
- **Live:** everyone's cursor on the page they're on, their faces in the top bar, and their selections in their colors (`convex/presence.ts`).
- **Comments** (C): a pin on any section at any breakpoint, with replies, resolve and delete, listed in the inspector while commenting (`convex/comments.ts`).
- **Library and history:** your drafts, your team's, the ones shared with you and your saved sections; versions you name, and one kept every ten minutes of editing.

### Exports

- **Copy for Figma** needs no plugin. The page is read from a hidden frame at each width and written in Figma's own clipboard format (`src/site/figma-*.ts`): auto layout, components, named layers, vectors, gradients, effects and real text layout. Large pastes are encoded before the click, since Chrome only allows a copy for a moment after one.
- **Download project** (`POST /api/export`) and **Send to GitHub** (`/api/github/*`) hand over the same thing: the template's own code (the files in `scripts/template-source.mjs`, minus basedraft's wiring and base path) with the project's pages written in as pages and its text edits written into the source. A new repository gets the whole site. An existing one gets a pull request: just the changed files if it's already a copy of the template, the whole site otherwise.

### The site

- **Template view** (`/view/<slug>`): a template full window, every page clickable, with a card bottom right: its price, Buy, and Open in Studio. The site's "Open full screen" links go here.
- **Analytics** (`src/instrumentation-client.ts`, `src/site/analytics.tsx`): PostHog, through `/ingest` on the site's own address, and Google Analytics, in production only. Signed-in people are identified by their account; a handful of named events mark the moments that matter (copies, downloads, GitHub sends, sign-ups, comments, invites, shares).

## Environment

See `.env.example`. In `.env.local`:

| Variable | For |
| --- | --- |
| `CONVEX_DEPLOYMENT` | The Convex deployment `npx convex dev` pushes to (dev: `qualified-snake-29`) |
| `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL` | That deployment's `.convex.cloud` and `.convex.site` addresses |
| `NEXT_PUBLIC_SITE_URL` | This site's address |
| `ZUNO_URL`, `NOMA_URL`, `AUREN_URL` | Where each template zone is deployed |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Send to GitHub. An OAuth app whose callback is `<site>/api/github/callback` |
| `BD_SESSION_SECRET` | Seals the GitHub token in its httpOnly cookie. Required in production |
| `BD_EXPORT_OPEN` | Lets a production deployment hand out template code before purchases are connected. Leave it off in public |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_GA_ID` | Analytics, production only. Public ids |

On the Convex deployment (`npx convex env set NAME value`), where Better Auth runs:

| Variable | For |
| --- | --- |
| `SITE_URL` | This site's address, which Better Auth trusts |
| `BETTER_AUTH_SECRET` | Signs sessions. Any long random string |
| `BETTER_AUTH_API_KEY` | Better Auth's dashboard (the `dash` plugin) and the email service that sends sign-in codes |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Optional: Continue with Google. Callback `<site>/api/auth/callback/google` |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Optional: Continue with GitHub. Callback `<site>/api/auth/callback/github` |
| `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO` | basedraft's emails, sent through Resend from `hello@basedraft.site` |
| `WHOP_API_KEY`, `WHOP_WEBHOOK_SECRET` | Whop checkout, and its webhook at `<deployment>.convex.site/whop/webhook` |
| `WHOP_PLAN_ZUNO`, `WHOP_PLAN_NOMA`, `WHOP_PLAN_AUREN`, `WHOP_PLAN_PRO`, `WHOP_PLAN_TEAM` | Each product's Whop plan id |
| `BD_PREVIEW_ALLOWED` | `1` on a development deployment only: lets "Preview Pro" make a team without the Team plan |

To connect the Better Auth dashboard, give it the deployment's site address (`https://qualified-snake-29.convex.site`) with the base path `/api/auth`: that's where Better Auth answers.

## Deploying

Deploy each template as its own project from `templates/<slug>`, then basedraft with the zone URLs set. The export routes read template sources at request time; `next.config.ts` traces exactly the files in `scripts/template-source.mjs` into those functions, so no `.env`, build output or `node_modules` ships with them. Until accounts and purchases are real, production refuses to hand out template code unless `BD_EXPORT_OPEN=1`.

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

## Accounts (Better Auth on Convex)

Better Auth runs inside Convex (`convex/auth.ts`), with its users, sessions and sign-in codes in the Better Auth component's tables. The site's `/api/auth` passes every request through to it (`src/lib/auth-server.ts`), so the session cookie is the site's own, and `ConvexBetterAuthProvider` (`src/site/convex.tsx`) signs Convex in as the same person, so queries know who's asking (`auth:getCurrentUser`).

- **Sign in:** an email and a 6-digit code (Better Auth's email OTP, sent by its email service), or Google and GitHub once their keys are set. A first sign in makes the account; signing up also saves your name.
- **In the UI:** `src/site/auth.tsx` keeps the same card, modal (`openAuth()`), `/sign-in` and `/sign-up` pages and `useAuth()` shape as before, now backed by `authClient`.
- **Still samples:** drafts, saved sections and shared pages in the Library. They're next to move into Convex.

## Selling and delivery (Whop)

Payments run on Whop; what someone owns lives in Convex (`purchases`), tied to their basedraft account.

1. **Buy:** every Buy and Get Pro button goes to `/checkout?product=<zuno|auren|pro|team>`. Signed out, that's sign up first and straight back. Then `checkout:start` (Convex) opens a Whop checkout for the product's plan, with the buyer's basedraft id and email as metadata, and sends them to it.
2. **Paid:** Whop's `payment.succeeded` webhook lands at `<deployment>.convex.site/whop/webhook`, signed per Standard Webhooks and checked in `convex/whop.ts`. It records the purchase (each event once, however often Whop delivers it), and `refund.created` or an ended membership takes it away again.
3. **Delivered:** the purchase schedules the order email (`convex/delivery.ts`): download the site as a zip, or send it to GitHub. Both links go to `/purchases`, which lists everything the buyer owns, updates the moment a payment lands, and runs the download or GitHub flow from the email's link. Purchases match by account and by email, so buying before signing up works.
4. **Gated:** see below.

### What's gated

- **Pro only (signed in, with Pro or Team):** Copy for Figma, Copy for Paper, Download SVG, the whole site to Figma, and section code on the component pages.
- **Pro, or owning the template:** code export in Studio, Download project and Send to GitHub. `/api/export` and `/api/github/push` check it on the server (`purchases:owns`), in development too.
- **Free for everyone:** Studio itself, with every template and section to try, and JSON export. Every template is paid: $79 each, or all of them with Pro.
- **Signed out is always Free.** Pro comes only from a purchase in Convex (`src/site/plan.ts`).
- **Previewing Pro, development only:** the switch on the Pro page (or in the Pro card) turns Pro on for a signed-in account without buying it, shows "Pro preview" in the top bar and Studio, and sends an `x-bd-preview` header the server honors only outside production. `BD_EXPORT_OPEN=1` opens code export on a deployment, for a private preview.

To connect Whop: make a product and plan for each of Zuno, Noma, Auren, Pro and Team, set their plan ids, `WHOP_API_KEY` and the webhook's `WHOP_WEBHOOK_SECRET` on the Convex deployment, and subscribe the webhook to `payment.succeeded` and `refund.created`.

## Email (Resend)

Templates are in `convex/emails/templates.ts`: the sign-in code, the welcome email (sent 20 seconds after an account is made, so it has the name), the order email for a template or for Pro, a team invite and a shared draft. They're tables and inline styles with a dark mode, and their two images (the mark and the dithered band) are served by the deployment at content-hashed addresses, written by `node scripts/email-assets.mjs`. See them all at `/dev/email` in development.

## License

Pro covers the buyer's own products. Team adds client work and seats. No license allows reselling the templates.
