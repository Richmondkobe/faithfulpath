# The lesson template

The shape every lesson page in a Faithful Path course should take, written down
after "When Your Mind Won't Rest" was rebuilt to it and shipped. It is the
standard pattern for new courses, not a description of one course.

The working implementation is
`app/members/courses/when-your-mind-wont-rest/lessons/[slug]/page.tsx`. Read
that before building a new one; this page explains what it is doing and why, so
that a second course does not have to rediscover it by argument.

## The principle

**A lesson is built for somebody with no prior instruction.** A learner who has
never seen the course before should be able to open a page and know what to do
next without being told, and without reading anything that explains the page
itself. Aim it at a capable sixteen-year-old: not because members are not
adults, but because someone arriving anxious, tired or interrupted has roughly
that much attention to spare, and a page that needs concentration to navigate
has spent the concentration the lesson needed.

In practice that means:

- **Short sentences.** If a sentence has two clauses of instruction in it, it is
  two sentences.
- **One action per step.** A section that asks for two things is two sections,
  or one of them is not really being asked for.
- **Nothing timed, scored or counted** except the single completion flag. No
  streaks, no percentages, no "you have answered 7 of 10", no marking.
- **Everything optional except the one main practice** — and even that does not
  gate completion. A member may finish a lesson having decided the step is not
  for them, and the page says so in as many words.
- **Say what is true rather than what is comforting.** "Seen only by you" is a
  claim about storage; if the storage does not provide it, the page does not say
  it. See "Privacy wording" below.

## The section order

Exactly this, top to bottom. The order is the interface: a member who learns it
on Lesson 1 does not have to learn it again.

1. **Lesson title and Scripture.** The module name and key verse reference as a
   quiet uppercase line above the title.
2. **Objectives** — three or four bullets, introduced by "In this lesson, you
   will learn to:". Written from that lesson's real content. See "Written fresh,
   every time" below.
3. **Watch or listen** — the player, then the duration line: *"About X minutes,
   plus one short pause."* X is computed from the deck (the last slide's start
   plus the time it holds the screen) rather than typed in, so it cannot drift
   from the recording.
4. **Read the transcript** — a closed disclosure directly under the recording it
   belongs to, labelled "Read the transcript — every word of the recording, in
   writing". It sits here, not at the foot of the page, so a member who would
   rather read finds it where the listening was. A member who never opens the
   player loses nothing, which is also what makes a JavaScript player safe.
5. **Take one step** — the one main practice, in the recording's own words.
6. **If it helps, tell someone** — secondary and optional, *inside* the previous
   section under a hairline rule, in the quiet label style. It is a suggestion
   for a member who has someone safe to tell, not a second requirement. Giving it
   a full-sized heading of its own makes the lesson look like it asks for two
   things.
7. **Go deeper** — the worksheet card and the complete-chapter card, side by
   side. When a lesson has only one of them, the single card runs full width
   rather than leaving half an empty row that reads as a broken link. Both cards
   say they are optional and that the lesson finishes without them.
8. **Let it settle** — one or two reflection prompts with somewhere to write.
   Reflection only: nothing scored, nothing with an answer to reveal, no recall
   questions and no true-or-false. An earlier draft had ten questions with
   Scripture blanks and an answer link; it read as marking, which is the wrong
   way to end a lesson about a restless mind.
9. **Need more support?** — the lesson's own safety sentence plus the link to
   the course's "when this course is not enough" page. **Before** the completion
   panel, not after: somebody struggling should meet it before being asked
   whether they are done.
10. **Completion**, in this sequence and no other:
    - "Ready to finish for today?", then the note that the worksheet, the chapter
      and the reflection prompts are not required, then **Mark this lesson
      complete**.
    - Only that press writes completion. Afterwards: "You have finished this
      lesson. It stays open to you. Come back whenever you want to.", then
      **Stop here for today** (primary, dark, returns to the course home) and
      **Continue to Lesson N** (secondary, outlined, with the next lesson's
      title underneath), then **Mark it unfinished** as a quiet link.
11. **Footer links and the citation notice** — the persistent support links and
    the ESV notice, or the equivalent citation or legal notice for a course that
    does not quote Scripture. These belong in the course layout, not on each
    route, or one page will eventually be missed.

### Why stopping is the primary button

Both completion buttons mark the lesson finished; the only difference is whether
the member is carried onward. Stopping is the dark one on purpose. A course
about a mind that will not stop, whose page pushes hardest towards the next
lesson, is teaching the opposite of what it says. Neither button is a
requirement — the lesson is already finished by the time they appear.

### Completion is pressed, never inferred

There is no scroll tracking, no `IntersectionObserver` at the foot of the page,
and no handler on the end of the recording. Reaching the bottom does nothing.
Exactly one call site writes the flag — the button in
`components/mind/FinishLesson.tsx` — and a new course should keep it that way. A
page that quietly decides on a member's behalf that they are done has taken the
one decision the lesson was leaving to them.

## Written fresh, every time

Objectives, reflection prompts, the worksheet and chapter links, and the support
wording are **written per lesson from that lesson's own content**. They are never
copied from another lesson and never genericised into something that would fit
any lesson in the course.

- **Objectives** come from the lesson's own slides. Lesson 7's are repair, learn,
  continue and release because those are the four things its tool actually names;
  Lesson 16's are its six movements; Lesson 20's are its trellis and its five
  areas. A bullet that would be true of every lesson tells a member nothing about
  this one.
- **Prompts must not repeat the lesson's own practice.** If "Take one step"
  already asks the member to write a shaming sentence and rewrite it truthfully,
  the prompts at the foot of the page ask something else — where that sentence
  was learned, what they would say to a friend who felt it. Asking the same thing
  twice at opposite ends of a page is the single easiest mistake to make here,
  because a prompt pattern reused across twenty lessons will collide with some of
  them.
- **Support wording is the lesson's own.** Each names the particular thing that
  lesson's subject can mask — a prayer that cannot be stopped, a routine that
  must be done in order, a person who is not safe. It is a quiet sentence in the
  lesson's pastoral voice, not a bordered clinical warning panel.

Per-lesson writing lives beside the deck, one file each:

    content/courses/<slug>/lesson-NN/objectives.json   { "objectives": [ … ] }
    content/courses/<slug>/lesson-NN/questions.json    { "intro": …, "questions": [ … ] }

## Privacy wording

Member answers go to the member's own row, and row level security scopes every
read to the member who wrote them. No page, admin screen or export reads them
back, and `verify:privacy` holds that. What is **not** true is that nobody else
*could* read them: the text sits in an ordinary column, and whoever administers
the database can reach it. There is no application-level encryption.

So the page says what is true — *"It is not shown to anyone in the course and is
not used to measure anything"* — rather than "seen only by you". Check this
against the actual storage before writing any privacy line in a new course. The
wording is a claim, and a claim about storage has to be true of the storage.

## Enforce the template, do not just describe it

A document drifts. This one will. The structure itself is held by an automated
check, and a new course should add its own rather than trusting this page.

`scripts/verify-mind-course.mjs` (`npm run verify:mind`) walks every counting
lesson and fails the build when one is not built to the template:

- `slides.json` exists — otherwise the page silently renders as written text
- a narration file exists — otherwise the transcript is quietly missing
- `objectives.json` lists **three or four** objectives
- `questions.json` holds **one or two** prompts, every one of them
  `kind: "reflection"` — a scored or answerable prompt fails
- the lesson file contains the complete chapter *and* a `chapter:` number to
  name it by — otherwise the Go deeper card vanishes with no error

These are the failures worth catching precisely because none of them is an
error. Each one falls back to something that still renders, so the lesson does
not break; it simply becomes a different page from the other twenty, and nobody
notices until a member does.

**Test the check by breaking it.** A verification that has never failed has not
been verified. Truncate an objectives list, delete a `questions.json`, confirm
both fail, then restore. The same applies to any check added for a new course.

## What the route provides, and what a course provides

The route renders the template; the course supplies the content. Nothing about
the ordering, the styling or the button logic should be re-decided per lesson —
that is what makes it a template rather than twenty-one similar pages.

| Piece | Where it comes from |
| --- | --- |
| Section order, styling, button logic | the lesson route, once, for every lesson |
| Slides, timings, duration line | `lesson-NN/slides.json`, extracted from the deck |
| Transcript | `lesson-NN/*-narration.txt`, one paragraph per slide |
| Objectives | `lesson-NN/objectives.json` |
| Reflection prompts | `lesson-NN/questions.json` |
| The one practice | the deck's "Do this now" slide, read by `practiceFrom` |
| Tell someone | the lesson file's `action:` front matter |
| Worksheet | the manifest's resource registry, by filename |
| Complete chapter | the lesson file's chapter section and `chapter:` number |
| Support sentence | the lesson file's `support:` front matter |
| Footer links, citation notice | the course manifest, rendered by the layout |

Relevant code: `lib/mind-slides.ts` (readers for all of the per-lesson files),
`components/mind/FinishLesson.tsx`, `components/mind/NextFaithfulStep.tsx` (its
`secondary` prop is the tell-someone styling),
`components/mind/LessonQuestions.tsx`, and the chapter route at
`lessons/[slug]/chapter/page.tsx`.
