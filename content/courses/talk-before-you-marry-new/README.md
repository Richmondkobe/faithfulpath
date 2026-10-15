# Talk Before You Marry — new edition (hidden test course)

Built alongside the live course, never instead of it, the same way as the
Before You Say Yes new edition. Members only, not linked from anywhere,
`noindex`. Address: `/members/courses/talk-before-you-marry-new`.

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

Fonts from this site (Noto Serif Hebrew, on the lessons that use it, still from
Google); the tab title; a small "Test edition" banner; the player and recording
from this site; "Need help now?" and "Finding Help Where You Live" to
/before-you-say-yes/resources (new tab); "Talk to a Pastor" to
/talk-to-a-pastor (new tab); "Need help?" to the contact page; and "I have
completed this lesson" saves progress, then shows the page's own thank-you line
with "Stop here for today" (course page) and "Continue to Lesson N ›"
(Lesson 15: "Back to the course page").

## Recordings (not in git)

Private bucket `course-media`, folder `audio/talk-before-you-marry-new/`:
`tbym-lesson-01.mp3` to `tbym-lesson-15.mp3`. Upload with
`bash scripts/tbym-new-publish.sh` (or one at a time:
`npm run media:upload -- path/to/tbym-lesson-01.mp3 --course talk-before-you-marry-new`).

## Switching it on

`lib/tbym-new-live.ts`: `TBYM_NEW_LIVE`. Listing it on /members and retiring
the previous edition are separate steps, as they were for Before You Say Yes.

## Removing it

Delete `lib/tbym-new.ts`, `lib/tbym-new-live.ts`,
`app/members/courses/talk-before-you-marry-new/`,
`content/courses/talk-before-you-marry-new/`, `scripts/verify-tbym-new.mjs`,
`scripts/render-tbym-new.ts`, `scripts/tbym-new-publish.sh`, and its one line
in `next.config.ts`. Nothing else depends on them.
