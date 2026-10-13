# Before You Say Yes — new edition (hidden test course)

Built alongside the live course, never instead of it. Members only, not linked
from anywhere, `noindex`. Address: `/members/courses/before-you-say-yes-new`.

What it holds: all 21 lessons, each approved by the reviewer as finished
production (Reviews 1–51, 11–13 October 2026), recorded by Richmond.

## Files

- `lesson-01/` to `lesson-21/`, each `page.html` and `player.html`: Richmond's
  reviewed pages, unchanged (the "3 Finished Lesson" files). `CHECKSUMS.sha256`
  records them. A new approved version replaces the file and its checksum together.

## Keeping members' data safe

- Progress is saved in `course_progress` with its own course_slug,
  `before-you-say-yes-new`, through the member's own session (RLS). It never
  reads or writes the live course's progress or reflections.
- The reflections on the lesson pages are never saved or sent: the pages have
  no code for it.
- `node scripts/verify-bysy-new.mjs` checks this, and that the pages are byte
  for byte the reviewed files.

## What the website changes as each page is sent out (`lib/bysy-new.ts`)

Fonts from this site; the tab title; a small "Test edition" banner; the player
and recording from this site; "Need help?" to the contact page; "Finding Help
Where You Live" to /before-you-say-yes/resources (new tab); "Leave this page"
replaces the page with a neutral one (as the live course does); and "I have
completed this lesson" saves progress, then shows the page's own thank-you line
with "Stop here for today" (course page) and "Continue to Lesson N ›"
(Lesson 21: "Back to the course page").

## Recordings (not in git)

Private bucket `course-media`, folder `audio/before-you-say-yes-new/`:
`bysy-lesson-01.mp3` to `bysy-lesson-21.mp3`. Upload with
`bash scripts/bysy-new-publish.sh` (or one at a time:
`npm run media:upload -- path/to/bysy-lesson-01.mp3 --course before-you-say-yes-new`).

## Switching it on

`lib/bysy-new-live.ts`: `BYSY_NEW_LIVE`. Listing it on /members and retiring
the previous edition are separate steps, as they were for the Reset.

## Removing it

Delete `lib/bysy-new.ts`, `lib/bysy-new-live.ts`,
`app/members/courses/before-you-say-yes-new/`,
`content/courses/before-you-say-yes-new/`, `scripts/verify-bysy-new.mjs`,
`scripts/render-bysy-new.ts`, `scripts/bysy-new-publish.sh`, and its one line
in `next.config.ts`. Nothing else depends on them.
