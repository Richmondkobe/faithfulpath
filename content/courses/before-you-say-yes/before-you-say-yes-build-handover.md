# Before You Say Yes — build handover

Where the implementation has got to, for whoever picks it up next.

Read `before-you-say-yes-course-build-notes.md` first and in full — it is the
constraints, and several exist because a learner may be monitored by the person
the course is about. This file says only what has been done against them and
what has not.

**Status: live.** `BYSY_PUBLISHED` in `lib/bysy-links.ts` is `true`, published
19 September 2026, and the members card links to the course. Every item on the
pre-publish checklist was run and passed first (the results are at the foot of
this file), and the checklist was re-run against the published build.

Setting that constant back to `false` withdraws the course cleanly: the card
disappears and nothing links to it, while the pages keep answering for anyone
already part-way through.

§6 is satisfied: the register is filled from a real check, and
**Last reviewed: 18 September 2026** is back on the resources page, read from
the shared file as before. The date rests on every entry having a *known
status*, not on every entry being verified — 82 verified, 2 outstanding,
2 confirm-directly, 1 corrected-not-verified-to-standard, and the emergency
numbers block recorded as out of scope by design.

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

A third was wrong the same way: the no-scheduling check scanned `lib` and the
route folder but not `components/`, which is where every component lives, so a
`setInterval` added to a dated-entries component was scanned by nothing. **Both
false negatives in this course have been a scan set that did not include the
file the rule was about** — check what a check looks at before believing what it
says.

All three were found by simulating the failure the check exists to catch, and
watching whether it failed. Do that before believing any of them. When the
page-reading check was tested this way it also found two pages that had been
missed by reading — Lessons 1 and 10.

Six more checks written since then failed to fire the first time, and every one
of them was reading the wrong text rather than reasoning wrongly:

- Two read an **import line** instead of the JSX, so the monitoring note looked
  present and looked early whatever the component rendered.
- Three matched a **substring**: `<JointGate` matched `<JointGateXX`, a map key
  renamed to `…-a-lifeX` still contained the slug it used to be, and `reveal()`
  did not match `onClick={reveal}`.
- One searched the **whole file** for a slug that also appears as a recall
  target, and reported all three joint tools wired while one of them had none.
- One looked for the course's **URL** to prove nothing links to it, but the URL
  lives inside the card component, so rendering that card from an unguarded page
  matched nothing.

The pattern across all of them: the check looked at text that was true for a
reason other than the one it was testing. Before believing a check, break the
thing it is about and watch it fail.

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
| Exit control, options, tables, gates, recall | `components/bysy/` |
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

**Dated entries (§7).** `components/bysy/DatedEntries.tsx` — a log the learner
adds to over time, on Lesson 5's nine windows and Lesson 7's ten green flags,
with the page's own list as the categories. It never prompts, never counts and
never totals; the copy says outright that we will not remind them, because a
course that nudged someone to keep watching the person they are dating would
teach the habit it exists to interrupt. Lesson 5's privacy note comes from its
page text and is not duplicated; Lesson 7 is not on §4's list and has none.
Entries display newest first without reordering what is stored.

**Evidence tables (§7).** `components/bysy/EvidenceTable.tsx` — addable rows,
300-character fields enforced in the browser and again on the server, no counts
or totals anywhere. Wired to Lesson 4 Part B. The monitoring note is a prop, not
a default: §4 lists the pages it belongs on, and repeating it everywhere makes
the course feel unsafe rather than safety-aware.

---

## What remains

Nothing blocking. Two things worth doing:

1. **Two register counts disagree with its own rows.** The Summary states 67
   verified where the tables give 82, and 3 confirm-directly where the tables
   give 2 — the Ark Foundation sits in its own two-column table and is not
   counted as a row. Neither affects the date, and the outstanding count, which
   the date does rest on, agrees and is asserted.
2. **Five entries are not fully verified**, named on the page rather than left
   to be discovered: the Ark Foundation's phone number, Karma Nirvana's helpline
   email and MoneyTalks' weekend hours are being confirmed with the services;
   Thailand's DMH 1323 and Credit Counselling Canada have not yet been checked
   against the operator's own source.

## The register is evidence of a check, not of a changed page

This is the failure mode to watch, and it has happened six times.

A row in the register records that somebody checked something and what they
found. It does not record that the page was then edited. Kenya's 911 was
corrected in the register — it connects on some networks only — while the page
went on listing it beside 999 and 112 as though it were national. Scanning for
the rest found five more:

| Recorded | What the page said |
|---|---|
| StepChange covers all four UK nations; approved money adviser in Scotland | Read as England-and-Wales, with Scottish and NI readers sent elsewhere |
| CAS Money Talk Team 0800 028 1456 | Named the organisation, gave no number |
| Advice NI 0800 0838 018, Mon–Fri 9:30am–5:30pm | Named the organisation, gave no number |
| Australia: counselling is not regulated under the National Scheme | Sent counsellors to PACFA/ACA without saying so |
| New Zealand: *counsellor* is not a protected title | Sent counsellors to NZAC without saying so |

All six are now applied. The last two are worth noticing as a pattern: the page
carries that warning for the UK, where it was written, and omitted it for the
two countries where it had actually been verified.

`node scripts/bysy-resource-register.mjs --scan` re-runs it.

**What the scan proves.** It compares exact strings — every phone number in a
verified row against the numbers printed on the page, in both directions — and
it lists the rows whose notes use correction language, for a human to check one
by one. Numbers and domains are what it can settle.

**What it does not prove.** A correction recorded in wording the pattern does
not recognise will not be listed. An opening time, an eligibility rule or a
confidentiality statement that changed without any digit changing will pass
unseen. Nor can it tell whether a verified row was ever true — only whether the
page agrees with what the row says. And it cannot match rows to page entries one
by one: the page names services in prose, the register groups some and splits
others, and every matcher tried produced confident nonsense.

So the scan narrows the gap; it does not close it. **The register remains
evidence that a check happened, not evidence that the page was changed.** After
any review, read the corrections list against the page by hand.

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

## The checklist, run in full

Run on 19 September 2026 against the live course, 35 pages fetched with a real
member session — not read off the code.

| Item | Result |
|---|---|
| 35 content pages, excluding the course home (§1) | 35 pages, all HTTP 200 |
| No page stores a safety selection, planned action or timing (§4) | The four safety controls — the exit control, Lesson 6's next step, the choice lists and the joint gate — import no write action and make no fetch. Every write in the course goes through `saveToolRows` or `markCourseComplete`, and neither is reachable from any of them. |
| Lesson 19 Part A runs locally; Part E has no input fields (§4) | No input, textarea, select or form on the page at all. The site footer's signup form used to render a name and email field here, and on the other 34 pages; it no longer does. |
| No analytics label names abuse, fear, leaving or coercion (§4) | No analytics call of any kind exists in the course — no gtag, no dataLayer, no tracker. There is no label to name anything. |
| Joint tools save to one account only (§5) | No write action takes a user, partner or account parameter; every `user_id` comes from the session. An unauthenticated caller invoking the fetch action directly got an empty result. |
| Completion record avoids "ready", "prepared", "certified" (§2) | Labelled "Completed Before You Say Yes". The only uses of those words are denials, and the check distinguishes a claim from a denial. |
| Every page carries the persistent support link and the exit control (§3) | Present on all 35, along with `noindex`. |

## The verification register

`content/before-you-say-yes-resources-register.md`, read by
`scripts/bysy-resource-register.mjs`. Markdown rather than a data file, because
the people doing the checking write and read it. The JSON version it replaced is
gone.

Five statuses, and only one of them means nobody has looked:

| Status | Meaning |
|---|---|
| Verified | Checked against the operator's own published information |
| Outstanding | Not yet checked against the operator's own source |
| Confirm directly | Public sources do not carry the detail; needs an enquiry |
| Corrected, not verified to standard | An error was corrected from evidence, without a full check |
| Out of scope by design | Presented as a starting point, not verified entry by entry, and the page says so |

The last is the emergency-numbers block, and it is a decision rather than a gap:
establishing each number properly needs a government or regulator source, and
for most countries only press and directory reporting exists. The page now says
that where the numbers are, under the list rather than above it — nobody in an
emergency should read a paragraph of provenance before reaching a number.

`npm run verify:bysy` fails if a row carries a status nobody agreed, if a section
of the page has no rows, if the summary understates what is outstanding, or if
the date is shown while any of that is true. Each was tested by breaking it.

What the check deliberately does not do is match rows to page entries one by
one. The page names services in prose, the register groups some and splits
others, and every fuzzy matcher tried produced confident nonsense — 29 matches
for a row that covers one entry. Section coverage plus a known status on every
row is what can be asserted truthfully.

## The signup form

The site's footer mailing-list form rendered a name and email field on all 35
pages, Lesson 19 included. It was never course content and stored nothing from
the course, which is why every other check here passed it — and it was still the
wrong thing at the foot of a page about leaving safely, on a course written for
people who may be monitored.

`components/FooterSignup.tsx` now returns null on this course's routes. It is
done there rather than in the course's own layout because a nested layout cannot
remove what a parent has already rendered. The public resources page at `/before-you-say-yes/resources` is now covered
too: it is the same helplines outside the member gate, read by the same people
for the same reasons. The form is unchanged everywhere else on the site.

Both guards are asserted separately. One passing is not evidence about the
other, and it would be easy to remove the one that is not being tested.

## Commands

```
npm run verify:bysy      structure, labels, routes, export policy, §3/§5/§6/§7
npm run verify:mind      the other course, unaffected
npm run verify:privacy   privacy and non-gating assertions
```
