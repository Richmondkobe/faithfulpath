# Talk Before You Marry — current edition

The edition members take, listed on /members. Members only, `noindex`.
Address: `/members/courses/talk-before-you-marry-new`.

What it holds: all 15 lessons in four parts: Make Honesty Safe (1–2), Learn
the Skills (3–5), Walk Through the Nine Rooms (6–14) and Keep Talking (15).

## Files

- `lesson-01/` to `lesson-15/`, each `page.html` and `player.html`: Richmond's
  finished pages, unchanged (the "3 Finished Lesson" files). `CHECKSUMS.sha256`
  records them. A new approved version replaces the file and its checksum together.

## Keeping members' data safe

- Progress is saved in `course_progress` with its own course_slug,
  `talk-before-you-marry-new`, through the member's own session (RLS). It never
  reads or writes the live course's progress or reflections.
- The reflections on the lesson pages are never saved or sent: the pages have
  no code for it, and each keeps its "Nothing you type here is saved" notice.
- `node scripts/verify-tbym-new.mjs` checks this, and that the pages are byte
  for byte the finished files.

## What the website changes as each page is sent out (`lib/tbym-new.ts`)

Fonts from this site, Noto Serif Hebrew included; the tab title; a quiet bar back to the course page; the player and recording
from this site; "Need help now?" and "Finding Help Where You Live" to
/help (new tab); "Talk to a Pastor" to
/talk-to-a-pastor (new tab); "Need help?" to the contact page; and "I have
completed this lesson" saves progress, then shows the page's own thank-you line
with "Stop here for today" (course page) and "Continue to Lesson N ›"
(Lesson 15: "Back to the course page").

For screen readers, with nothing visible changed: each reflection box is tied
to its question (`aria-labelledby`); the transcript's headings are marked
level 3 (`aria-level`); and the progress dots read "Lesson N of 15".

## Recordings (not in git)

Private bucket `course-media`, folder `audio/talk-before-you-marry-new/`:
`tbym-lesson-01.mp3` to `tbym-lesson-15.mp3`. Upload one at a time with
`npm run media:upload -- path/to/tbym-lesson-01.mp3 --course talk-before-you-marry-new`.

## Live

Live for members and listed on /members since October 2026. The previous
edition is retired: its pages were removed in the website clean-up (Stage 3),
and `next.config.ts` redirects its old addresses here. Its members' progress
rows are untouched.

## Removing it

Delete `lib/tbym-new.ts`,
`app/members/courses/talk-before-you-marry-new/`,
`content/courses/talk-before-you-marry-new/`, `scripts/verify-tbym-new.mjs`,
`scripts/render-tbym-new.ts`, and its one line
in `next.config.ts`. Nothing else depends on them.
