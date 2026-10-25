# Verse of the day: what is left to do

Status (26 October 2026): built and committed on the `verse-of-the-day`
branch, **not merged and not live**. Waiting for Crossway to approve the ESV
API application (expected 3–4 weeks). Nothing on main or the live site
depends on it.

## What is already on this branch

- `content/verses.json`: 366 references, one per date (01-01 to 12-31,
  including 02-29). References only, no Bible text.
- `lib/verses.ts`: fetches the ESV wording from api.esv.org with
  `ESV_API_KEY`, caches each reference for 30 days, falls back to the
  previous day's verse if a fetch fails, and holds the ESV notice.
- `components/community/VerseOfTheDay.tsx`: the card ("VERSE OF THE DAY",
  the verse, the reference, a Share button that copies it, the ESV notice),
  changing at midnight in the visitor's own time zone.
- `app/community/home/page.tsx`: the card at the top of the community home,
  shown only when the text could be fetched.

## What is left, once the key arrives

1. **Read Crossway's API terms** on the approval email or api.esv.org and
   confirm the use fits (the key is believed to be for non-commercial use;
   the card is free and members-only, but the site also sells books and a
   membership). Note any display rule they ask for (for example a link to
   esv.org) so it can be added to the card.
2. **Add the key locally:** in `.env.local`, a line `ESV_API_KEY=<the key>`.
   Never print or commit it.
3. **Add the key in Vercel:** Project faithfulpath → Settings → Environment
   Variables → `ESV_API_KEY`, Production, Sensitive.
4. **Bring the branch up to date:** `git checkout verse-of-the-day`, then
   `git rebase main` (main will have moved on), and run `npm run build`.
5. **Check every reference:** fetch all 366 references from the ESV API once
   (in batches, without storing the text) and confirm each returns text and
   is 1–3 verses. Fix any reference that fails in `content/verses.json`.
6. **Restart the local site** (`npm run dev`) so it reads the new key, open
   `/community/home` as a signed-in member, and check the card: the verse,
   the reference, Share copies it, and the ESV notice is the full one.
7. **Phone screenshot** of `/community/home` with the card, saved to
   `~/Desktop/Faithful Path Website Audit/Community screenshots/`, and show
   it to Richmond.
8. **Wait for "publish"**, then fast-forward main to the branch, push, and
   confirm Vercel deploys it to production. Check the card on the live
   community home after signing in.
