# pello: a landing page template for HR and people products

A landing site for an HR system that answers policy questions, approves time off, runs payroll and gets new hires ready. It's dressed as **pello**, a fictional HR product, shown running a fictional company called Fieldwork (214 people, six teams, four countries), so every section has real names, numbers and requests in it. Swap in your own and ship.

Built with Next.js 16, React 19, Tailwind CSS 4 and Motion. The home page tells one working day at Fieldwork, Friday, October 30: the first screen is the end of it, and each section after is one moment from it, with its time in the margin on a line the whole day runs along. White paper, ink and one vermilion for what pello is doing right now, set in Geist, with every face printed as a dither.

## What's inside

- **13 pages and a 404.** Home, product, pricing, customers, company, careers, a blog with four posts, security, book a demo, sign in, privacy and terms.
- **The day, live, in the hero.** A clock, and pello's log of requests as they come in, the newest opened while pello works through its checks. Open any of them to see what it checked, or undo it. Under both, the whole day as a strip, six minutes to a bar, with the page's moments marked on it; point at a bar to see what was going on.
- **09:12, rules you change on the page.** Grace asks for time off in Slack. The rules pello checked are a settings form beside the thread (notice, how many can be out, who decides, calendar checks): change one and her request is checked again.
- **10:05, a handbook that cites itself.** Pick a question or type your own. pello answers word by word beside the handbook page it read, with the line it used marked.
- **11:30, payday** for four countries: totals count up as they're checked against last month, every change is explained, and nothing is paid until a person approves.
- **13:20, a new starter's list** over a printed photo of his desk, ticking off its last item.
- **14:40, a call that isn't a rule's.** Ravi goes over the hours limit; pello asks his lead, with three things it can do, and does whichever is picked.
- **15:55, one personnel file** seen by different people: what they can't see is blacked out, and pello's answer follows the same rules.
- **16:40, a week before and after pello**, with the hours of paperwork and of people counting to their new totals.
- **Customers on ink:** a printed portrait beside the quote, and every company's result as a ledger you pick from. Then pricing worked out for your size, plans as rows you open, and every question answered in the open.
- **Every face printed.** A small dither engine (`src/components/site/dither.tsx`) prints photos in the page's own inks with an ordered 8 × 8 Bayer pattern, so a new palette prints them too.
- **Its own controls:** dropdowns, switches, sliders and tabs with full keyboard support, never the browser's, and visible focus rings.
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
| The day: its date, the time the page opens, its moments and the strip | `src/lib/day.ts` |
| Customer stories and quotes | `src/lib/customers.ts` |
| Photos | `public/photos`, by person (`people/<id>.jpg`), customer and team member name, with credits in `CREDITS.txt` |
| Blog posts | `src/lib/posts.ts` |
| Your own team, on the company page | `src/lib/team.ts` |
| Colors | `src/app/globals.css` |
| Typefaces | `src/app/layout.tsx` |

**Colors.** Four variables at the top of `globals.css` decide the look: `--pl-page`, `--pl-surface`, `--pl-ink` and `--pl-accent`. Every other shade (lines, muted text, shadows) is mixed from them, so changing those four is enough. The dithered photos read the same variables, so they print in your colors too.

**Photos.** Swap any file in `public/photos` for your own (keep the name, or change it in `src/lib/photos.ts`). They're printed by the dither, so any photo comes out in the same style.

**Type.** Geist for everything, and Geist Mono for times and numbers. Both load with `next/font` in the root layout.

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
    home/                 the home page's sections, one file each
    pages/                pieces used on the inner pages
    site/                 nav, footer, logo, dropdown, buttons and page heads
  lib/                    the made-up company and everything said about it
```

## Accessibility and performance

- Every interactive piece works with a keyboard: the dropdowns, the sliders, the day strip (arrow keys move along it), the tabs and every choice.
- Motion follows the visitor's reduced motion setting.
- The hero's log pauses when it's off screen or the tab is hidden.
- Every page is prerendered as static HTML.

## Tech stack

Next.js 16 (App Router), React 19, Tailwind CSS 4, Motion, Phosphor icons, TypeScript.

## Credits

Photos are from [Unsplash](https://unsplash.com), under the [Unsplash License](https://unsplash.com/license). Each file's source is listed in `public/photos/CREDITS.txt`. Brand marks are from the CC0 [logos](https://github.com/gilbarbara/logos) set, and belong to their owners.
