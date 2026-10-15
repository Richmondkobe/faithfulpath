# Faithful Path Community

The website at https://faithfulpathcommunity.com: Pastor Richmond Kobe's
articles, books, courses, membership and Talk to a Pastor sessions. Next.js
(see `AGENTS.md`: this version differs from older guides), Supabase for
accounts and data, Stripe for payments, deployed on Vercel from `main`.

## Running it

    npm install
    cp .env.example .env.local   # then fill in the values
    npm run dev                  # http://localhost:3000

## Where things are

- `app/` — the pages. `app/members/` is the members area; its courses are in
  `app/members/courses/`.
- `content/` — written content in files: the About page, legal pages, and each
  course's lessons. Course lesson pages are Richmond's approved files, served
  unchanged; each course folder's README lists what the site changes as a page
  is sent out. Lesson pages follow `docs/LESSON-TEMPLATE.md`.
- `lib/` — the code behind the pages. `app/globals.css` holds the brand colours
  (navy and gold); pages use their names, never colour codes.
- `scripts/` — checks and tools.

## Checks before a change goes live

    npx tsc --noEmit
    npm run lint
    npm run verify:fj          # Following Jesus pages are the approved files
    npm run verify:reset-new   # and the same for the other three courses
    npm run verify:bysy-new
    npm run verify:tbym-new
    npm run verify:lessons     # lesson pages follow docs/LESSON-TEMPLATE.md

Course recordings live in the private Supabase bucket `course-media`
(`npm run media:upload`), never in git.
