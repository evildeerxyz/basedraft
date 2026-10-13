# pello: a landing page template for HR and people products

A landing site for an HR system that answers policy questions, approves time off, runs payroll and gets new hires ready. It's dressed as **pello**, a fictional HR product, shown running a fictional company called Fieldwork (214 people, six teams, four countries), so every section has real names, numbers and requests in it. Swap in your own and ship.

Built with Next.js 16, React 19, Tailwind CSS 4 and Motion. It's printed rather than rendered: white paper, black ink and one vermilion, every photo dithered in those inks, and the product shown as the paperwork it replaces (forms, stamps, a staff badge, payslips, a redacted file). Every section has a working piece of the product in it, drawn in HTML, so you can change any word.

## What's inside

- **13 pages and a 404.** Home, product, pricing, customers, company, careers, a blog with four posts, security, book a demo, sign in, privacy and terms.
- **A staff wall in the hero.** Twelve of Fieldwork's people, dithered. As pello handles someone's request, their photo is scanned again in vermilion and stamped with what happened, and the day's log beside the wall fills in. Click anyone to send a request for them.
- **Every photo printed.** A small dither engine (`src/components/site/dither.tsx`) prints photos in the page's own inks with an ordered 8 × 8 Bayer pattern. They develop as they come into view and rescan when they change. Gradients are printed the same way.
- **A handbook chat.** Pick a question or type your own. pello answers word by word, and beside it is the handbook page it read, with the line it used marked. It offers to do the thing you asked about, and a question it can't answer goes to a person.
- **A time off request, start to finish.** Four steps filed like folders, ending in a stamp. Switch on a busy week and the request breaks a rule, so it goes to the manager to decide.
- **Onboarding that ticks itself off** beside a new starter's badge, a **payroll run for four countries** printed as payslips, **a week in a calendar** that rearranges itself, **a chart** with a team picker, **a personnel file seen by five different people** (what they can't see is blacked out), a **pricing ruler** and a **drag carousel** of customer stories.
- **Its own dropdown**, never the browser's, with full keyboard support, and visible focus rings everywhere.
- **Reduced motion respected** throughout. Anything that plays on its own waits until someone is on the page, and only runs while it's on screen.

## Use this template

```bash
npm install
npm run dev
```

Open [http://localhost:3005](http://localhost:3005). To build for production:

```bash
npm run build
npm start
```

## Make it yours

| What | Where |
| --- | --- |
| Name, description and URL | `src/lib/site.ts` |
| The company it's shown running, its teams and people | `src/lib/people.ts` |
| The hero's feed of requests | `src/lib/happenings.ts` |
| Customer stories and quotes | `src/lib/customers.ts` |
| Photos | `public/photos`, by person (`people/<id>.jpg`), customer and team member name, with credits in `CREDITS.txt` |
| Blog posts | `src/lib/posts.ts` |
| Your own team, on the company page | `src/lib/team.ts` |
| Colors | `src/app/globals.css` |
| Typefaces | `src/app/layout.tsx` |

**Colors.** Four variables at the top of `globals.css` decide the look: `--pl-page`, `--pl-surface`, `--pl-ink` and `--pl-accent`. Every other shade (lines, muted text, the dark bands) is mixed from them, so changing those four is enough. The dithered photos and fields read the same variables, so they print in your colors too.

**Photos.** Swap any file in `public/photos` for your own (keep the name, or change it in `src/lib/photos.ts`). They're printed by the dither, so any photo comes out in the same style.

**Type.** Barlow Condensed for headlines, Barlow for everything else, and Geist Mono for times and numbers. All three load with `next/font` in the root layout.

## Environment variables

| Name | What it's for |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | The site's public URL, for social cards, canonical links and the sitemap |

## Project structure

```
src/
  app/
    layout.tsx            fonts, metadata
    globals.css           colors and base styles
    (site)/               every page, with the nav and footer around them
  components/
    home/                 the home page's sections
    product/, pages/      pieces used on the inner pages
    site/                 nav, footer, logo, dropdown, buttons and page heads
  lib/                    the made-up company and everything said about it
```

## Accessibility and performance

- Every interactive piece works with a keyboard: the dropdowns, the slider, the steps, the chart's measures and the carousel's buttons.
- Motion follows the visitor's reduced motion setting.
- The staff wall and the moving fields pause when they're off screen or the tab is hidden.
- Every page is prerendered as static HTML.

## Tech stack

Next.js 16 (App Router), React 19, Tailwind CSS 4, Motion, Phosphor icons, TypeScript.

## Credits

Photos are from [Unsplash](https://unsplash.com), under the [Unsplash License](https://unsplash.com/license). Each file's source is listed in `public/photos/CREDITS.txt`.
