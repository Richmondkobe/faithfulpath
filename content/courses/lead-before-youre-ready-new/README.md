# Lead Before You're Ready — new edition (October 2026)

Live since 16 October 2026 (`LBYR_NEW_LIVE` in `lib/lbyr-new-live.ts`):
listed on /members, its Welcome page linked from /courses, in the sitemap and
open to search engines (every other page stays noindex).

The September edition (`content/courses/lead-before-youre-ready/`) is retired
(`LBYR_OLD_RETIRED`): its card is off /members and `next.config.ts` sends its
addresses here (temporary redirects; its Concerns page to the new one).
Nothing was deleted: its pages, its recordings in
`course-media/audio/lead-before-youre-ready/` and its members' progress rows
are kept, and setting `LBYR_OLD_RETIRED` to false restores it.

Address: `/members/courses/lead-before-youre-ready-new`.

| Address | Who |
|---|---|
| `/welcome` | Anyone; non-members see "Join the membership" and "Sign in" under it |
| `/concerns-care-and-reporting` | Anyone (the September page's words, shared component) |
| `/` (course page), `/how-this-course-works` | Active members |
| `/lesson-01` … `/lesson-10`, each with `/player`, `/audio/<file>`, `/complete` | Active members |
| `/my-leadership-plan` | Active members |
| `/downloads/leaders-guide.pdf` | Active members (signed URL, one minute) |

## Files

Richmond's finished files, unchanged, from
`~/Desktop/Lead Before You're Ready Course/`. `CHECKSUMS.sha256` records them;
a new approved version replaces the file and its checksum together.

- `welcome.html`, `how-this-course-works.html` (00 Start Here)
- `lesson-NN/page.html` and `lesson-NN/player.html`
  (`Open-This-Lesson-Page.html` and `player.html` from each lesson's
  "3 Finished Lesson")
- `my-leadership-plan.html` (04 My Leadership Plan)

## Not in git

- Recordings: private bucket `course-media`, folder
  `audio/lead-before-youre-ready-new/`, `lbyr-lesson-01.mp3` to `-10.mp3`.
  Not `audio/lead-before-youre-ready/`: the September recordings are there
  under the same names. Upload with
  `npm run media:upload -- path/to/lbyr-lesson-01.mp3 --course lead-before-youre-ready-new`.
- Leader's Guide: private bucket `course-downloads`,
  `lead-before-youre-ready-new/leaders-guide.pdf`.

## What the website changes as each page is sent out (`lib/lbyr-new.ts`)

Every page: fonts from this site (`fonts/lbyr-*.woff2`, the same families
with every letter these pages use); noindex; a quiet course bar at the top
(not printed); `#concerns` links to the Concerns page (a new tab from pages
with writing boxes); and every writing box and tick starts empty each time
the page is shown, so answers are gone once the learner leaves.

- Welcome: "Next: How This Course Works" and "Go straight to Lesson 1" to
  their pages; for non-members, a membership card under the page.
- How This Course Works: "Begin Lesson 1" and "Back to Welcome".
- Lessons: the player from this site; "Chapter N of *Lead Before You're
  Ready*" links to the book's store page, `/guides/lead-before-youre-ready`
  (new tab, wording unchanged); "Stop here for today" goes to the course page;
  "I have completed this lesson" saves progress, then shows the page's own
  thank-you line and "Continue to Lesson N ›" (Lesson 10: "Go on to My
  Leadership Plan ›"). Transcript headings are marked level 3 for screen
  readers (nothing visible changes).
- Players: the recording from `/audio/…`, which redirects to a fresh signed
  URL.

## Keeping members' data safe

- Progress: `course_progress`, course_slug `lead-before-youre-ready-new`,
  lesson_slug `lesson-01` …, through the member's own session (RLS). Marking
  a lesson again keeps the first date. Nothing else is written.
- Nothing typed is saved or sent: the only request a lesson page makes is
  "complete", with no body. No analytics: these pages are whole documents
  and never load the site layout.
- The players do two things of their own: fetch their recording once (for
  smooth seeking) and remember the "still slides" setting in the browser.
- `npm run verify:lbyr-new` checks all of this, and that the pages are byte
  for byte the finished files. `npm run verify:lessons` holds the lessons to
  the template's shared rules.
