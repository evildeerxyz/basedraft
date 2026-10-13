# pello: a landing page template for HR and people products

A landing site for an HR system that answers policy questions, approves time off, runs payroll and gets new hires ready. It's dressed as **pello**, a fictional HR product, shown running a fictional company called Fieldwork (214 people, six teams, four countries), so every section has real names, numbers and requests in it. Swap in your own and ship.

Built with Next.js 16, React 19, Tailwind CSS 4 and Motion. Every section has a working piece of the product in it, drawn in HTML, so you can change any word.

## What's inside

- **13 pages and a 404.** Home, product, pricing, customers, company, careers, a blog with four posts, security, book a demo, sign in, privacy and terms.
- **A live org chart in the hero.** Fieldwork's teams and people on a canvas. Requests travel from a person to pello and back, the feed beside it fills in as they're handled, and the counters go up. Drag anyone (their team follows), or click someone to send a request for them.
- **A handbook chat.** Pick a question or type your own. pello reads the policy, answers word by word, shows the passage it used, and offers to do the thing you asked about. A question it can't answer goes to a person.
- **A time off request, start to finish.** Four steps that play on their own. Switch on a busy week and the request breaks a rule, so it goes to the manager to decide.
- **Onboarding that ticks itself off**, a **payroll run for four countries** that counts up and explains every change, **a week in a calendar** that rearranges itself, **a chart** with a team picker, **a record seen by five different people**, a **pricing slider** and a **drag carousel** of customer stories.
- **Its own dropdown**, never the browser's, with full keyboard support, and visible focus rings everywhere.
- **Reduced motion respected** throughout. The org chart only runs while it's on screen.

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
| Blog posts | `src/lib/posts.ts` |
| Your own team, on the company page | `src/lib/team.ts` |
| Colors | `src/app/globals.css` |
| Typefaces | `src/app/layout.tsx` |

**Colors.** Four variables at the top of `globals.css` decide the look: `--pl-page`, `--pl-surface`, `--pl-ink` and `--pl-accent`. Every other shade (lines, muted text, the dark band) is mixed from them, so changing those four is enough. The org chart and the chart read the same variables, through `src/lib/palette.ts`.

**Type.** Inter Tight for everything, and Geist Mono for times and a few numbers. Both load with `next/font` in the root layout.

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
- The org chart pauses when it's off screen or the tab is hidden.
- Every page is prerendered as static HTML.

## Tech stack

Next.js 16 (App Router), React 19, Tailwind CSS 4, Motion, Phosphor icons, TypeScript.
