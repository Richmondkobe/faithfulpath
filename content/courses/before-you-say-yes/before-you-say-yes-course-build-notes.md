# Before You Say Yes — Course Build Notes

Implementation decisions agreed during the content build, 17 September 2026.
These are constraints, not suggestions. Several exist because a learner using
this course may be monitored by the person the course is about.

---

## 1. Structure

**35 pages**, plus the course home.

| Section | Pages |
|---|---|
| Module 0 — Start Here | 6 |
| Help Me With My Relationship Right Now | 1 |
| Teaching lessons (Modules 1–5) | 20 |
| Module pauses (after Modules 1, 2, 3, 4) | 4 |
| My Next Faithful Step (Module 5 conclusion) | 1 |
| Module 6 — engagement threshold | 3 |

Module 0: Welcome · If You Are Not Sure You Belong to Christ · How This
Course Works · Choose Your Route · A Note on Safety · Finding Help Where You Live

Modules 1–5 follow the book's five parts: Lessons 1–3, 4–7, 8–12, 13–16, 17–20.

Module 6: Before You Say Yes to Engagement · Questions Before Engagement ·
What Comes Next?

**Course home** has three entry points — Take the Complete Course · Help Me With
My Relationship Right Now · Prepare for Engagement — plus a persistent support
link visible on every page (see §3).

**Progress display must show 35 course-content pages**, excluding the course
home — the home page is not page 1 of 36. The route chooser must name the pause
pages each route passes through.

---

## 2. The non-negotiable: nothing scores

No page, tool or section produces a score, total, percentage, threshold,
recommendation or verdict. This holds without exception.

- No summing or averaging of any answer set.
- No "if yes to all three" logic, no scoring gates and no pass/fail. Safety
  routing and consent checks are permitted, but they must never generate a score
  or relationship verdict.
- Decision sections are **naming tools**: the learner describes their situation
  in their own words, then selects a path. Every such section carries a line
  stating that no combination of answers produces the decision.
- Selecting a path unlocks nothing, blocks nothing and scores nothing.
- For ordinary, non-safety outcomes selected on a pause page, reflect the choice
  above the Continue button ("You chose: I need to strengthen some areas first")
  and allow it to be changed at any time. **Never save, persist or reflect a
  safety-related choice.** If one is selected, the safety route appears locally
  for that session only. This matters most for `Prioritise safety and specialist
  support` on the Module 4 pause.

Completion record: the platform's normal completion record applies, but its
label must never use *ready*, *prepared*, *certified* or any equivalent.
"Completed Before You Say Yes" is acceptable. Anything implying readiness for
marriage is not — the name is what a learner may show someone else.

---

## 3. Safety architecture

### Persistent support link
`Finding Help Where You Live` is reachable from every page of the course,
without completing anything. It appears in course navigation and in the
"Need support?" section of every lesson.

Persistent line, site-wide:
> Are you afraid, under pressure or unsure whether you are safe? Get support.

### Leave this page
A persistent exit control remains visible while the learner scrolls. It leaves
the course immediately in the same tab and opens the agreed neutral destination.

- **Do not record the click in behavioural analytics or in any user-visible
  activity history.** A generic label is not sufficient, because associated page
  data can still expose the destination or the action.
- **Must not claim** that it removes browser, network or account history.
  Wording: leave this page, with a note that browsing activity may still be
  visible to someone monitoring the device.

### Safety acknowledgement (Module 0, A Note on Safety)
- **One** button, labelled `I understand — continue`.
- Three acknowledgement statements displayed above it; no individual tick boxes,
  no stored per-statement responses.
- Stored as **ordinary page progress only**. Never a specially named record.
- The Finding Help link stays visible above the button. Nobody in danger should
  have to pass an acknowledgement to reach support.

### Routing rule
Where a learner indicates a safety concern, the support route is displayed
**immediately** and replaces the other options — it never sits beside them as
one choice among several.

Safety forks always come **before** ordinary procedural advice on the same
page. (Lesson 11's fraud response and Lesson 19's ending guidance are both built
this way: the "is this safe?" question precedes the standard steps.)

---

## 4. Storage — the hard limits

### Never stored, anywhere in the course
- That a learner selected `Seek specialist safety support` or any equivalent
  safety path.
- Any planned action arising from a safety concern.
- Any date or time attached to such an action.

This applies to Lesson 6's next-step options, Lesson 19 Parts A and E, and
My Next Faithful Step. It applies to any future page offering a safety route.
**A stored choice is a record of intent, and a record of intent is what is
dangerous on a monitored account.**

### Lesson 19 specifically
- **Part A (the safety question) runs locally. Individual answers are not saved.**
- Any `Yes` or `Not sure` displays the specialist-support route immediately.
- **Part E has no input fields at all.** It is informational: the prompts show
  what a specialist may help the learner consider. The actual safety plan is
  created and stored only in the way the specialist recommends.

### Analytics
No event, label, property or segment anywhere in the course may name abuse,
fear, leaving, coercion, forced marriage or safety concerns. No
`abuse_warning_accepted`, no `exit_plan_started`, no `afraid_to_leave`. Even the
label attached to a saved event can disclose something on account-history or
administrative screens.

### Sensitive worksheet content
- Part D of Lesson 9 and the incident fields in Lesson 6 must not become
  repositories of explicit or potentially evidential material. Field guidance and
  character limits should discourage narrative detail; no prompt asks for it.
- No worksheet content in any email notification, ever.
- Account numbers, passwords, card details and document identifiers are never
  requested anywhere in the course (Lesson 11 states this explicitly).

### Export

Decided 18 September 2026, during implementation. This was a gap in these notes
rather than a question about them: §5 protects the private part of a joint tool
in the interface, and an export is a second way for the same content to reach
the other person — in a file that can be forwarded, printed or found.

**Nothing is exportable unless something says it is.** This started as a list of
exclusions, which was the wrong shape: "How This Course Works" tells learners to
complete most tools alone first, and Lessons 1, 2, 4, 7, 8, 9 and 10 each repeat
it for their own tool, so a list of exclusions is always one lesson behind the
content — and the lesson it is behind is the one nobody re-read. Two pages were
missed by reading and found by the check. The allowlist is empty; an export must
name what it includes, which is what §4 requires it to tell the learner anyway.

**Named explicitly, and never exportable:**

- The private parts of the three joint tools — Lesson 8 Part A, Lesson 15 Part A,
  and each person's separately-answered questions before engagement.
- Lesson 9 Part A and Lesson 12 Part A.
- Any tool whose page instructs the learner to answer alone.

**Nothing from Lesson 19 is exportable at all.** Not Part A, which is not stored
in the first place, and not Parts B to E.

If inclusion is ever offered it is a separate, deliberately worded choice that
names what would be included and warns that an exported file can be read by
anyone who obtains it. **Never a single "export everything" button** — the
learner must know what is in the file before it exists.

**Enforced by `npm run verify:bysy`.** Any file that both serves a document and
reaches this course's content must import `lib/bysy-export-policy`, or the check
fails. It was tested by simulating the two ways the exclusion would plausibly be
lost: a new export route inside the course, and the shared journal export gaining
this course in a path with no "bysy" in its name. Both fail the check.

What the check cannot do is judge whether the policy was *applied* correctly
once imported. It proves the author met the rule, not that they obeyed it. The
exclusions themselves — Lesson 19 in full, and the parts answered alone — are
asserted separately against `lib/bysy-export-policy.ts`.

### Monitoring-privacy note
Standard note shown on the tools for Lessons 5, 6, 9, 10, 11, 12, 13, 14, 15,
16, 17, 18, 19, 20 and on Questions Before Engagement, and before any download,
print, email or share:

> **Privacy and safety.** Your answers save to your account. If someone may
> monitor your account, device or browser activity, do not record information
> here that could place you at risk. Use a safer device where possible, or leave
> the tool blank and visit Finding Help Where You Live.

Do **not** place it beside every ordinary journal box. Repeating it everywhere
makes the course feel unsafe rather than safety-aware.

---

## 5. Joint tools

Three tools have a shared section: Lesson 8 (Personal Boundaries and Dating
Agreement, Part B), Lesson 15 (Life Compatibility Reflection, Part B) and
Questions Before Engagement.

- The private part is completed **alone and first**, always.
- **Completing the private part does not entitle either person to see the
  other's worksheet.** Each person chooses what to communicate.
- The tool saves to **one account**. It is not a two-person form.
- The shared section is entered by the account holder **after both have agreed
  the wording**.
- The interface must never suggest or imply that the other person has access to
  the account, or that their answers are stored here.
- Every joint section carries a gate: do not complete it together where fear,
  coercion, monitoring or retaliation is present.

---

## 6. Finding Help Where You Live

**Single source of truth.** The country lists render from the same repository
file that produces the public resources page at `/before-you-say-yes/resources`
(`content/before-you-say-yes-resources-page.md`). Do not duplicate the
helplines into the course. Update the file once; the public online resources page and the course support
page both change. The published PDF remains a separate edition and must not be
assumed to update automatically.

**Review status.** The page displays:

> Resource review in progress. Always confirm current details on the service's
> official website.

This stays until a source-by-source verification pass is complete. A "last
reviewed" date may only be shown once a human has checked each entry against an
authoritative source — telephone number or contact method, official website,
intended audience and country, hours/language/cost claims, whether the service
is independent/governmental/clinical/emergency, whether it still describes
itself as operating, and the date and source used. Verification metadata lives
beside the source file, not in the rendered page. An automated link check
supplements this; it does not establish accuracy.

Do not display a retrospective date based on when the file was last edited.

**Page structure:** guidance written once for the course (go now · seek
specialist advice promptly · which help for which problem · consider it · what
good help looks like · questions to ask) plus the country lists rendered from
the shared file. Digital-safety note at the top.

---

## 7. Interface details

- **Tables and repeating fields:** the "What I feel / What I know" table in
  Lesson 4 Part B, and all evidence-recording sections, must allow the learner
  to add rows rather than offering a fixed number.
- **Dated entries:** Lesson 5's Character Observation Sheet and Lesson 7's green
  flags are records kept over time. Support returning and adding dated entries;
  do **not** prompt on a schedule, which turns observation into monitoring.
- **Cross-lesson recall:** Lessons 7, 15, 17, 18 and Questions Before Engagement
  refer to earlier tools. Provide a collapsed, learner-initiated control such as
  `View my earlier answers`; **do not display previous answers automatically.**
  Show the monitoring-privacy note before opening them, and never include
  recalled answers in notifications, previews or emails.
- **Route chooser** (Module 0): four routes, changeable at any time, remembering
  position. Routes are starting points, never restrictions — no lesson is locked.
  Each route description names the pause pages it genuinely reaches, e.g.
  `Start Here → Lessons 1–3 → Module 1 Pause → Lessons 4–7 → Module 2 Pause`.
  The route copy is updated to this form during implementation.
- **Help Me With My Relationship Right Now:** twelve problem-based entries, each
  opening the relevant lesson. It is a routing page, not a teaching lesson. It
  must appear prominently on the course home and remain in navigation.

---

## 8. Content constraints carried through every lesson

These were applied consistently and should survive any future editing:

- **Pattern and severity, never repetition alone.** Some conduct is serious the
  first time. No page may imply that a single serious incident carries less
  weight than a repeated minor one.
- **Effort is available, never owed.** No worksheet, trial period or review
  creates an obligation to continue. Nobody must try something first in order to
  earn the right to say no.
- **A freely given no is sufficient.** No page asks a learner to prove a case,
  assemble evidence or win an argument in order to decline.
- **Green flags are not credits that offset harm.** Strengths never cancel
  violence, coercion, stalking, serious deception or control.
- **Repair language applies to ordinary failures only** — never to violence,
  sexual coercion, stalking, threats or coercive control.
- **Do not raise an incident merely to complete a tool.** Where addressing
  something could bring intimidation, punishment, surveillance or danger, the
  learner records that and seeks individual support instead.
- **No investigation.** No page invites accessing private accounts, contacting
  former partners or relatives behind someone's back, obtaining confidential
  records, or asking friends to report on the person.
- **Specialist first, pastor alongside.** Where past harm surfaces, a specialist
  service leads; a trusted pastor may support spiritually alongside, provided
  they understand their limits and do not press towards confrontation,
  reconciliation or joint counselling.
- **Independence is not seniority.** Where a church leader is the source of
  pressure, routes must go outside that leader's influence — not merely to
  someone more senior in the same structure.

---

## 9. Lesson template (all 20 teaching lessons)

1. Lesson outcome
2. Key Scripture
3. Core teaching (700–950 words target; Lessons 6, 9, 10, 13, 19, 20 exceed it
   because cutting would cost safety distinctions or fairness qualifications)
4. Practical tool — written out **in full**, every statement and prompt
5. Next faithful step
6. Journal reflection (one or two questions, not a second worksheet)
7. Need support?
8. Continue

**Written prayers only in Lessons 6, 13, 16, 19 and 20**, placed at the end of
the core teaching before the tool, never as a ninth template section. No audio
prayers.

Lessons 6, 9, 10, 13 and 19 carry a short `Before you begin` notice above the
outcome, with the support and exit links.
