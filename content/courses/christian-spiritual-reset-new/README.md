# The Christian Spiritual Reset — new edition (hidden test course)

Built alongside the live course, never instead of it. Members only, not linked
from anywhere, `noindex`. Address: `/members/courses/christian-spiritual-reset-new`.

What it holds now: the two approved pilots, Lesson 1 and Session 1
(reviewer: "integration-ready", 8 October 2026), Lesson 2 (script approved
in Review 8), Lesson 3 (Review 10), Lesson 4 (Review 12), Lesson 5 (Review 14),
Lesson 6 (Review 16), Lesson 7 (Review 18) and Lesson 8 (Review 20), all
recorded by Richmond. Lesson 6's plan guide works
on the page only and saves nothing; so do Lesson 7's four intention boxes. Lesson 8's seven-psalm week ticks are not saved. Lesson 4's check-in ticks are never saved or sent: the page has no
script for them.

## Keeping members' data safe

- Progress is saved in `course_progress` with its own course_slug,
  `christian-spiritual-reset-new`, through the member's own session (RLS).
  It never reads or writes the live course (`christian-spiritual-reset`),
  reflections, quiz scores or the journal, and it never deletes anything.
- `node scripts/verify-reset-new.mjs` checks this, and that the pages below
  are byte for byte the reviewed files.

## Files

- `lesson-01/` to `lesson-08/`, `session-01/` (each `page.html` and
  `player.html`): Richmond's reviewed pages, unchanged.
  `CHECKSUMS.sha256` records them. A new approved version replaces the file
  and its checksum together.
- `downloads/`: Chapters 1 to 8 and Session One cut from the book (with the
  title and copyright pages), the Lesson 1 to 8 worksheets, the
  Session 1 workbook pages, and "If you are not sure you belong to Christ".

What the website changes as each page is sent out (`lib/reset-new.ts`):
fonts from this site; the tab title; the preview note removed and a small
"Test edition" banner added; the player and recordings from this site; the
placeholder links pointed at the downloads, the contact page and Finding Help
Where You Live; the finish buttons save progress and link to the course page
or to the next unit ("Continue to Lesson 9 ›" reads "Back to the course
page ›" until Lesson 9 is built).

## Recordings (not in git)

Private bucket `course-media`, folder `audio/christian-spiritual-reset-new/`:
`reset-lesson-01.mp3`, `reset-lesson-02.mp3`, `reset-lesson-03.mp3`,
`reset-lesson-04.mp3`, `reset-lesson-05.mp3`, `reset-lesson-06.mp3`, `reset-lesson-07.mp3`, `reset-lesson-08.mp3`,
`reset-session-01.mp3`, `guided-prayer-01.mp3`,
`timer-opening-10.mp3`, `timer-opening-15.mp3`, `timer-closing.mp3`,
`guided-silence-5.mp3`, `guided-silence-10.mp3`, `guided-silence-15.mp3`.
Upload each with:

    npm run media:upload -- path/to/file.mp3 --course christian-spiritual-reset-new

These are copies; the live course's recordings in `audio/` are not touched.

## Removing it

Delete `lib/reset-new.ts`, `app/members/courses/christian-spiritual-reset-new/`,
`content/courses/christian-spiritual-reset-new/` and
`scripts/verify-reset-new.mjs`, and its one line in `next.config.ts`
(`outputFileTracingIncludes`). Nothing else depends on them.
