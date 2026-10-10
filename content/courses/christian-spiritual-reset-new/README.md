# The Christian Spiritual Reset — new edition (hidden test course)

Built alongside the live course, never instead of it. Members only, not linked
from anywhere, `noindex`. Address: `/members/courses/christian-spiritual-reset-new`.

What it holds now: the two approved pilots, Lesson 1 and Session 1
(reviewer: "integration-ready", 8 October 2026), Lesson 2 (script approved
in Review 8), Lesson 3 (Review 10), Lesson 4 (Review 12), Lesson 5 (Review 14),
Lesson 6 (Review 16), Lesson 7 (Review 18), Lesson 8 (Review 20),
Lesson 9 (Review 22), Lesson 10 (Review 24), Lesson 11 (Review 26), Session 2 (Review 28), Session 3 (Review 30), Session 4 (Review 32), Session 5 (Review 34), Session 6 (Review 36), Session 7 (Review 38), Session 8 (Review 40), Session 9 (Review 41), Session 10 (Review 43) Lesson 12 (Review 45) and Lesson 13 (Review 47), all recorded by Richmond. Lesson 6's plan guide works
on the page only and saves nothing; so do Lesson 7's four intention boxes. Lesson 8's seven-psalm week ticks and Lesson 9's device and packing ticks are not saved; nor is Lesson 11's Before My Retreat or Lesson 12's testing worksheet, or Lesson 13's two-week plan and Jethro questions, or the plan chooser on Sessions 2 to 10 (it only shows the chosen plan's steps). Lesson 4's check-in ticks are never saved or sent: the page has no
script for them.

## Keeping members' data safe

- Progress is saved in `course_progress` with its own course_slug,
  `christian-spiritual-reset-new`, through the member's own session (RLS).
  It never reads or writes the live course (`christian-spiritual-reset`),
  reflections, quiz scores or the journal, and it never deletes anything.
- `node scripts/verify-reset-new.mjs` checks this, and that the pages below
  are byte for byte the reviewed files.

## Files

- `lesson-01/` to `lesson-13/`, `session-01/` to `session-10/` (each `page.html` and
  `player.html`): Richmond's reviewed pages, unchanged.
- `guides/first-30-days.html`: "Your First 30 Days Home", the short page at the
  start of Part 4 (no recording, nothing to complete), listed on the course page
  just before Lesson 12 and linked from Lessons 12 and 13.
  `CHECKSUMS.sha256` records them. A new approved version replaces the file
  and its checksum together.
- `downloads/`: Chapters 1 to 8, Chapters 9 and 10 together (`chapter-09.pdf`), Chapters 11 to 14, and Sessions One to Ten cut from the book (with the
  title and copyright pages), the Lesson 1 to 13 worksheets, the
  Session 1 to 10 workbook pages (Session 3 with cards to cut out, Session 4 with a lament page), and "If you are not sure you belong to Christ".

What the website changes as each page is sent out (`lib/reset-new.ts`):
fonts from this site; the tab title; the preview note removed and a small
"Test edition" banner added; the player and recordings from this site; the
placeholder links pointed at the downloads, the contact page and Finding Help
Where You Live; the finish buttons save progress and link to the course page
or to the next unit (Lesson 11 leads on to Session 1, Session 1 to Session 2, and Session 2 to Session 3; Session 3 has one button only, back to the course page, because every plan takes a break before the next session; so has Session 4, which also has "Skip this session and rest", back to the course page with nothing recorded; and so has Session 5, with the same skip button; and Session 6, optional, whose "Set this session aside for now" also records nothing; and Sessions 7 to 9, one button, labelled by plan; and Session 10, the last, whose one button reads "Finish my retreat" ("Finish my three-hour reset" on that plan), back to the course page, because Lesson 12 is for the first morning home; and Lesson 12, "Stop here for today" only, because Lesson 13 is for later in the first week; and Lesson 13, the same, because Lesson 14 is for week 3). The guide page gets the same fonts, banner and links, and its "Back to the course page" button.

## Recordings (not in git)

Private bucket `course-media`, folder `audio/christian-spiritual-reset-new/`:
`reset-lesson-01.mp3`, `reset-lesson-02.mp3`, `reset-lesson-03.mp3`,
`reset-lesson-04.mp3`, `reset-lesson-05.mp3`, `reset-lesson-06.mp3`, `reset-lesson-07.mp3`, `reset-lesson-08.mp3`, `reset-lesson-09.mp3`, `reset-lesson-10.mp3`, `reset-lesson-11.mp3`, `reset-lesson-12.mp3`, `reset-lesson-13.mp3`,
`reset-session-01.mp3`, `guided-prayer-01.mp3`, `reset-session-02.mp3`, `guided-prayer-02.mp3`, `reset-session-03.mp3`, `guided-prayer-03.mp3`, `reset-session-04.mp3`, `guided-prayer-04.mp3`, `reset-session-05.mp3`, `guided-prayer-05.mp3`, `reset-session-06.mp3`, `guided-prayer-06.mp3`, `reset-session-07.mp3`, `guided-prayer-07.mp3`, `reset-session-08.mp3`, `guided-prayer-08.mp3`, `reset-session-09.mp3`, `guided-prayer-09.mp3`, `reset-session-10.mp3`, `guided-prayer-10.mp3`,
`timer-opening-10.mp3`, `timer-opening-15.mp3`, `timer-opening-20.mp3`, `timer-closing.mp3`,
`guided-silence-5.mp3`, `guided-silence-10.mp3`, `guided-silence-15.mp3`, `guided-silence-20.mp3`.
Upload each with:

    npm run media:upload -- path/to/file.mp3 --course christian-spiritual-reset-new

These are copies; the live course's recordings in `audio/` are not touched.

## Removing it

Delete `lib/reset-new.ts`, `app/members/courses/christian-spiritual-reset-new/`,
`content/courses/christian-spiritual-reset-new/` and
`scripts/verify-reset-new.mjs`, and its one line in `next.config.ts`
(`outputFileTracingIncludes`). Nothing else depends on them.
