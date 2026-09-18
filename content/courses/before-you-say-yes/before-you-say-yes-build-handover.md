# Before You Say Yes — build handover

Where the implementation has got to, for whoever picks it up next.

Read `before-you-say-yes-course-build-notes.md` first and in full — it is the
constraints, and several exist because a learner may be monitored by the person
the course is about. This file says only what has been done against them and
what has not.

**Status: not live.** The course is in the repo and reachable at
`/members/courses/before-you-say-yes` by anyone with an active membership who
types the URL. Nothing links to it. It must not be linked until the pre-publish
checklist at the foot of the file list has been run in full.

---

## The rule that matters most

**Test that a check fires before trusting it.** This applies to anything
touching §4 (storage) or §5 (joint tools).

Two checks written for this course were wrong:

- One was a false positive — it matched any file containing "export" and
  "download", and failed on a constants file holding three strings and no code.
  It announced itself.
- One was a false negative. The export check collected files with a `walk()`
  that took its output array from a closure and ignored the argument passed to
  it, so the list it scanned was always empty and it reported `ok` on
  everything. It would have sat there looking like protection indefinitely.

Both were found by simulating the failure the check exists to catch, and
watching whether it failed. Do that before believing any of them. When the
page-reading check was tested this way it also found two pages that had been
missed by reading — Lessons 1 and 10.

---

## What is built

| Piece | Where |
|---|---|
| Structure, routes, link wiring | `lib/bysy-course.ts` |
| URLs, client-safe | `lib/bysy-links.ts` |
| Shared wording and the field limit | `lib/bysy-wording.ts` |
| Route + tool storage | `lib/bysy-progress.ts` |
| Shared resources render (§6) | `lib/bysy-resources.ts` |
| Export policy (§4) | `lib/bysy-export-policy.ts` |
| Save action for tools | `app/members/courses/before-you-say-yes/actions.ts` |
| Course home, page route, safety chrome | `app/members/courses/before-you-say-yes/` |
| Exit control, Lesson 6 options, evidence table | `components/bysy/` |
| Assertions | `scripts/verify-bysy-course.mjs` → `npm run verify:bysy` |

**Structure.** This course has no `course.json`. Its structure is the file list
and its labels are `course-navigation.md`, both prose, so the structure is
declared in `lib/bysy-course.ts` and the verifier parses those two documents and
holds the code to them. The five routes are computed from the page list, not
written out, and come to the documented lengths: 15, 26, 13, 14, 35.

**Links.** The content carries no Markdown links at all; it names destinations
in prose. `linkReferences()` wires them: 56 support references to
`05-finding-help` (never the public resources page), 191 lesson and range links
(a range goes to its first lesson), the four pauses by their own titles, Module
6 to its first page. No page links to itself. Implementation comments are
stripped at read, so they are gone from the body and from anything derived
from it.

**Safety chrome (§3).** Support link, standing support line and the exit control
are in the layout, so a page added later cannot be the one that lacks them.
Verified present on all 35. The exit control leaves in the same tab to
`https://www.bbc.co.uk/weather` via `location.replace`, records nothing at all —
no analytics, no progress write, no server call — and says underneath that it
does not erase browsing history and that someone monitoring the device may still
see it.

**Support page (§6).** Its guidance is course text in the file; its eight
country sections and its review date render from
`content/before-you-say-yes-resources-page.md`. The date is read, never copied —
tested by changing the shared file and watching the page follow, and by removing
the date and watching it fall back to §6's review-in-progress notice. If the
shared file is missing, unreadable, empty, or has no sections, the page says so
and gives emergency guidance rather than rendering blank; it stays 200 in every
case, because a support page that 500s is the same silence by another route.

**Lesson 6's next step.** A control that routes rather than lists. Nothing
stored — no server action, no fetch, no state outliving the page. The lesson
asks for a person and a date; §4 forbids storing a planned action or a date
attached to one, so those are not fields and the instruction says to write it
somewhere outside the course. The two serious options take over the section
rather than sitting beneath it.

**Evidence tables (§7).** `components/bysy/EvidenceTable.tsx` — addable rows,
300-character fields enforced in the browser and again on the server, no counts
or totals anywhere. Wired to Lesson 4 Part B. The monitoring note is a prop, not
a default: §4 lists the pages it belongs on, and repeating it everywhere makes
the course feel unsafe rather than safety-aware.

---

## What remains

In this order.

1. **Dated entries (§7)** — Lesson 5's Character Observation Sheet and Lesson
   7's green flags. Records kept over time; support returning and adding dated
   entries, and **do not prompt on a schedule**, which turns observation into
   monitoring. Lesson 5 already carries its own privacy note in the page text —
   do not add a second. Lesson 7 is not in §4's monitoring-note list and needs
   none. Neither may count or total; §8 also forbids green flags acting as
   credits that offset harm.
2. **Cross-lesson recall (§7)** — Lessons 7, 15, 17, 18 and Questions Before
   Engagement. A collapsed, learner-initiated control such as `View my earlier
   answers`. Never display previous answers automatically, show the
   monitoring-privacy note before opening them, and never include recalled
   answers in notifications, previews or emails.
3. **The three joint tools (§5)** — Lesson 8 Part B, Lesson 15 Part B, Questions
   Before Engagement. Private part completed alone and first; it is never
   visible to the other person in the interface or in any export. The tool saves
   to one account and is not a two-person form. The shared section is entered by
   the account holder after both have agreed the wording. The interface must
   never suggest the other person has access. Every joint section carries a gate:
   do not complete it together where fear, coercion, monitoring or retaliation is
   present.
4. **Verification metadata file** — beside `content/before-you-say-yes-resources-page.md`,
   per §6. Outstanding since the review-date decision; the page's own review
   statement stands in for it meanwhile.
5. **Link from `/members`** — a card beside the other two courses. Build it but
   **do not link it** until the checklist passes.
6. **Completion record** — label must never use *ready*, *prepared*, *certified*
   or any equivalent. "Completed Before You Say Yes" is acceptable.
7. **Pre-publish checklist** — at the foot of the file list. Run last, in full.
   Four of its seven items are already proven; the rest depend on the tools.

Also unapplied: the pattern where a safety route **replaces** the other options
rather than sitting beneath them is agreed for the **Module 4 pause**, **My Next
Faithful Step** and **Lesson 16's next faithful step**. Lesson 6 is the worked
example.

Where a page asks for something §4 forbids storing, use `WRITE_ELSEWHERE` from
`lib/bysy-wording.ts` — one wording everywhere, so a learner recognises it rather
than reading it afresh.

---

## The export exclusion list, as it stands

Decided during implementation and recorded in build notes §4 (Export).

**Default deny.** Nothing is exportable unless the allowlist in
`lib/bysy-export-policy.ts` says so, and that allowlist is **empty**. This began
as a list of exclusions and that was the wrong shape: "How This Course Works"
tells learners to complete most tools alone first, and seven lessons repeat it
for their own tool, so an exclusion list is always one lesson behind the content.

Named explicitly, and never exportable:

| Page | Parts | Why |
|---|---|---|
| Lesson 19 — When to Walk Away | **all** | Nothing from Lesson 19 is exportable. Part A is not stored at all. |
| Lesson 1 | all | "Answer alone, in writing" — *found by the check, not by reading* |
| Lesson 2 | all | "Answer alone, in writing" |
| Lesson 4 | all | "Answer alone, in writing" |
| Lesson 7 | A, B, C | "Parts A to C are for you alone" |
| Lesson 8 | A | Private half of a joint tool |
| Lesson 9 | A | Answered alone |
| Lesson 10 | A | "Part A is yours alone" — *found by the check, not by reading* |
| Lesson 12 | A | Answered alone |
| Questions Before Engagement | A | Each person's separately-answered questions |

If inclusion is ever offered it is a separate, deliberately worded choice naming
what would be included, with `EXPORT_WARNING`. **Never a single "export
everything" button.**

`npm run verify:bysy` fails if: the allowlist stops being empty, a named page
stops being named, a page whose text says "answer alone" is not in the policy,
or any file that both serves a document and reaches this course's content does
not import the policy. It cannot judge whether the policy was *applied*
correctly once imported.

---

## Things that cost time

- **Restart `next dev` after adding a route folder.** New folders under an
  existing route are not always picked up; every page 404s until you do, with no
  error in the log.
- **A `"use server"` file may only export async functions.** `FIELD_LIMIT` had to
  move to `lib/bysy-wording.ts`.
- **Client components must not reach the reader.** `lib/bysy-course.ts` imports
  `node:fs`; anything a Client Component needs goes in `lib/bysy-links.ts` or
  `lib/bysy-wording.ts`. The same mistake broke the build twice on the previous
  course.
- **`splitAtHeading` ends at a heading of the same level or higher**, so
  splitting an H3 part does not swallow the parts after it.

## Commands

```
npm run verify:bysy      structure, labels, routes, export policy
npm run verify:mind      the other course, unaffected
npm run verify:privacy   privacy and non-gating assertions
```
