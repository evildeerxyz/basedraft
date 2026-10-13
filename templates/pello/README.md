# pello: a landing page template for HR and people products

A landing site for an HR system that answers policy questions, approves time off, runs payroll and gets new hires ready. It's dressed as **pello**, a fictional HR product, shown running a fictional company called Fieldwork (214 people, six teams, four countries), so every section has real names, numbers and requests in it. Swap in your own and ship.

Built with Next.js 16, React 19, Tailwind CSS 4 and Motion. The page is drawn on a frame: hairlines run its length either side of the content, a rule crosses between sections, and white cards sit on a cool grey with a crisp lift. The product is shown working in every section, and every face is printed as a dither.

## What's inside

- **13 pages and a 404.** Home, product, pricing, customers, company, careers, a blog with four posts, security, book a demo, sign in, privacy and terms.
- **A live inbox in the hero.** Fieldwork's requests come in with the person's face; pello works through each one's checks before it decides. Open any request to see how it went.
- **Rules you change on the page.** The time off rules are a settings form (minimum notice, how many can be out, who decides, calendar checks). Change one and Grace's request is checked again: approved, or sent to her manager.
- **A handbook that cites itself.** Pick a question or type your own. pello answers word by word beside the handbook page it read, with the line it used marked.
- **A payroll run** for four countries that counts up, checks itself against last month and explains every change, then posts the payslips when you approve.
- **Everything else** in working cards: a new starter's list that ticks itself off, a week before and after pello, a year of the company by team, and one personnel file seen by different people (what they can't see is blacked out).
- **Every face printed.** A small dither engine (`src/components/site/dither.tsx`) prints photos in the page's own inks with an ordered 8 × 8 Bayer pattern, so a new palette prints them too. The closing section's background is a mosaic of the whole company.
- **Its own controls:** dropdowns, switches and segmented choices with full keyboard support, never the browser's, and visible focus rings.
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

**Colors.** Four variables at the top of `globals.css` decide the look: `--pl-page`, `--pl-surface`, `--pl-ink` and `--pl-accent`. Every other shade (lines, muted text, shadows) is mixed from them, so changing those four is enough. The dithered photos read the same variables, so they print in your colors too.

**Photos.** Swap any file in `public/photos` for your own (keep the name, or change it in `src/lib/photos.ts`). They're printed by the dither, so any photo comes out in the same style.

**Type.** Funnel Display for headlines, Funnel Sans for everything else, and Geist Mono for times and numbers. All three load with `next/font` in the root layout.

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
- The inbox pauses when it's off screen or the tab is hidden.
- Every page is prerendered as static HTML.

## Tech stack

Next.js 16 (App Router), React 19, Tailwind CSS 4, Motion, Phosphor icons, TypeScript.

## Credits

Photos are from [Unsplash](https://unsplash.com), under the [Unsplash License](https://unsplash.com/license). Each file's source is listed in `public/photos/CREDITS.txt`. Brand marks are from the CC0 [logos](https://github.com/gilbarbara/logos) set, and belong to their owners.
