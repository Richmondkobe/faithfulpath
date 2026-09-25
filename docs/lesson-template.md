# Faithful Path Lesson Template

**Standard pattern for all Faithful Path courses.**
Source: the *When Your Mind Won't Rest* lesson page, as built and shipped.
Status: Faithful Path master lesson template — Version 1.0. Adjust per topic (see "Adapting to a new course").

**Scope:** this is a *lesson-page* template. It is not the structure for retreat sessions, check-ins, route-selection pages, safety pages, course introductions, or final course-completion pages. Those page types need their own templates.

**Short lessons:** the standard structure should remain recognisable, but brevity is permitted. Sections should not be filled with unnecessary content merely to make the page look complete.

---

## 1. Purpose and voice

Every lesson page should feel like a pastor sitting beside the learner, not a clinic handout or a scored program.

**Voice rules**
- Pastoral, warm, unhurried. Plain words. Short sentences.
- Invite, never command. "Take one step," not "Complete this task."
- Nothing is scored, graded, timed against the learner, or diagnostic.
- Scripture (or the course's source text) is the anchor, not decoration.
- Avoid clinical vocabulary (symptoms, assessment, treatment, patient, disorder, intervention). Prefer: burden, season, step, rest, practice, care, walk with someone.
- Rest is allowed. Stopping for today is a good outcome, never a failure.
- Where a topic is sensitive, point gently to a pastor, a trusted person, or a qualified professional. Do not play counsellor or doctor on the page.

---

## 2. Section order (fixed)

Sections should appear in this order whenever they are included. Required sections must not be removed, reordered or merged without updating this file. Section 6 may be omitted when it would not serve the learner safely or appropriately.

| # | Section | Requirement |
|---|---------|-------------|
| 1 | Lesson title and Scripture | Required |
| 2 | Objectives | Required |
| 3 | Watch or listen | Required |
| 4 | Read the transcript | Required |
| 5 | Take one step | Required |
| 6 | If it helps, tell someone | Optional |
| 7 | Go deeper | Required; layout varies |
| 8 | Let it settle | Required |
| 9 | Need more support? | Required |
| 10 | Completion block | Required |
| 11 | Footer links and citation notice | Required |

---

## 3. Section specifications

### 1. Lesson title and Scripture
- Lesson number and title.
- One primary Scripture passage: reference plus the short quoted text (or a faithful paraphrase where the licence requires it).
- Optional single-line subtitle in a pastoral tone.
- Non-Scripture courses: use the course's anchor quotation or source line in the same position.

### 2. Objectives
- 3 to 4 bullets, pulled from that lesson's real content. Never generic filler.
- Phrase as what the learner will see, understand, or practise, in gentle language.
- Lead-in line: "In this lesson, you will learn to:" — each bullet completes that sentence.

### 3. Watch or listen
- Video and/or audio player.
- Duration line, in this form: **"About X minutes, plus one short pause."**
- If there is no pause point in the lesson, drop the "plus one short pause" clause. Do not leave it in by default.

### 4. Read the transcript
- Full transcript, collapsed by default and expandable.
- Same wording as the recording. Readable headings and paragraph breaks.
- Supports learners who prefer reading, are hard of hearing, or are somewhere they cannot play audio.

### 5. Take one step
- **One** main practice. Not a list of tasks.
- Short pastoral framing, then the practice in plain steps.
- Closing line that gives permission: it is fine to do it imperfectly or come back later.
- The step must come from the lesson's actual teaching.

### 6. If it helps, tell someone
- Included when appropriate; always optional for the learner.
- Some lessons, particularly grief or unsafe-relationship lessons, should not automatically encourage disclosure. Leave this section out there.
- Secondary and visually lighter than "Take one step."
- One or two sentences suggesting the learner share the lesson or what they are carrying with a trusted person (spouse, friend, pastor, small group).
- Never implies the learner must disclose anything.

### 7. Go deeper
- Two cards side by side: **Worksheet** and **Complete chapter**.
- If one is missing (for example, a lesson with no worksheet), show a **single full-width card** for what exists. Never show an empty or disabled placeholder card.
- Each card: title, one line of description, one clear button.

### 8. Let it settle
- Exactly two optional reflection prompts.
- Reflection only: nothing scored, nothing graded, nothing with a right answer to reveal. No recall questions, no true-or-false, no fill-in-the-blank.
- Each prompt has a text box, and the learner may save what they write. The writing is private, optional, and counted towards nothing — the lesson finishes whether or not a word is typed.
- Say what is true about where the writing goes. It is not shown to anyone in the course and is not used to measure anything; do not promise a secrecy the storage does not provide (see "Privacy wording" in Section 5).
- Prompts are phrased as quiet questions for prayer or thought, not homework.
- Prompts must not repeat the practice "Take one step" has already asked for. This is the easiest mistake to make, because a prompt pattern reused across a course will collide with some of its lessons.

### 9. Need more support?
- Placed **before** completion, not after.
- Pastoral invitation: talk to a pastor, a trusted believer, or a qualified professional when the burden is heavier than one lesson can carry.
- Link or contact route to Faithful Path pastoral guidance (per the site's current offer).
- Topic-specific safety line where needed (see Section 5).

### 10. Completion block
Flow, in this exact order:

1. Prompt: **"Ready to finish for today?"**
2. Button: **"Mark this lesson complete."**
3. After it is marked, show three actions:
   - **"Stop here for today"** (primary)
   - **"Continue to Lesson [N]"** with the next lesson's title beneath it (secondary; replaced by the completion message on the final lesson)
   - **"Mark it unfinished"** (tertiary, low emphasis)

Notes:
- "Stop here for today" is primary by design. Rest is the default, continuing is the option.
- Both buttons mark the lesson complete. The only difference is whether the learner is carried onward.
- Completion is pressed, never inferred. No scroll tracking, no observer at the foot of the page, no handler on the end of the recording — reaching the bottom does nothing. Keep it to one call site.
- On the final lesson, replace the "Continue" button with a course-completion message. It stands exactly where Continue stands on every other lesson, in the same quiet register as the rest of the page — no banner, no congratulation, nothing that treats finishing as a score. "Stop here for today" stays.
- The message is content, not chrome: it lives in the final lesson's `completion_message:` front matter, so each course writes its own. `verify:mind` fails the build if the last lesson has none.

### 11. Footer links and citation notice
- The course's persistent support links, then the citation notice. In *When Your Mind Won't Rest* that is two links — **Need more support?** and **My Mind Is Restless Right Now** — followed by the ESV notice.
- The links come from the course manifest and are rendered by the course layout, not by the lesson route. Put them on each page individually and one page will eventually be missed.
- A new course chooses its own support links. Two is the shipped pattern: one for a learner who needs help beyond the course, one for a learner in difficulty right now.
- **Scripture courses:** ESV copyright notice (or the translation used, with its required notice).
- **Non-Scripture courses:** the equivalent citation or legal notice, such as book copyright, quotation permissions, or a paraphrase note.
- Where a course leans on paraphrase, include a line encouraging learners to read the passage in a Bible they trust.

---

## 4. Page skeleton (copy for each new lesson)

```md
# Lesson [N]: [Title]
**Scripture:** [Reference] — "[short text]"

## In this lesson, you will learn to:
- [Objective 1]
- [Objective 2]
- [Objective 3]
- [Objective 4, optional]

## Watch or listen
[Player]
About [X] minutes, plus one short pause.

## Read the transcript
[Collapsed transcript]

## Take one step
[One practice, in plain pastoral language]

## If it helps, tell someone
[Include only when appropriate. One or two optional sentences.]

## Go deeper
[ Worksheet card ]  [ Complete chapter card ]
(single full-width card if one is missing)

## Let it settle
- [Reflection prompt 1]  [text box]
- [Reflection prompt 2]  [text box]
[Save my private reflection]  (optional, private, counted towards nothing)

## Need more support?
[Pastoral invitation + link + topic safety line if needed]

## Ready to finish for today?
[Mark this lesson complete]
  → [Stop here for today] (primary)
  → [Continue to Lesson N+1: Title] (secondary)
  → [Mark it unfinished]

---
[Need more support?] [My Mind Is Restless Right Now] · [ESV notice or equivalent citation notice]
```

---

## 5. Adapting to a new course

Change freely: content, Scripture, wording of prompts, number of lessons, topic-specific support lines.
Do not change: section order, the completion flow, the "nothing scored" rule, "Need more support?" before completion, one main practice per lesson.

**Written fresh, every time**

Objectives, reflection prompts, worksheet and chapter links, and support wording are written per lesson from that lesson's own content. Never copied from another lesson, and never genericised into something that would fit any lesson in the course. A bullet that would be true of every lesson tells the learner nothing about this one.

**Privacy wording**

Saved reflections go to the learner's own row, and row level security scopes every read to the learner who wrote them. No page, admin screen or export reads them back, and `verify:privacy` holds that. What is not true is that nobody else *could* read them: the text sits in an ordinary column, and whoever administers the database can reach it. There is no application-level encryption.

So the page says what is true — *"It is not shown to anyone in the course and is not used to measure anything"* — rather than "seen only by you". Check this against the actual storage before writing any privacy line in a new course. The wording is a claim, and a claim about storage has to be true of the storage.

**Topic notes**
- **Worry, burnout, grief (e.g. *When Your Mind Won't Rest*):** keep support language gentle and pastoral. No diagnostic framing.
- **Marriage and premarital (e.g. *Talk Before You Marry*):**
  - "Take one step" is often a conversation between two people. Frame it as an invitation to sit down together, and keep private writing private.
  - "If it helps, tell someone" can point to a pastor or mentor couple.
  - "Need more support?" must include a plain safety line: if there is fear, coercion, or intimidation, stop joint exercises and seek confidential help from a trained person outside the relationship. Do not present joint exercises as the answer to unsafe situations.
  - Footer: book copyright line (© Richmond Kobe, Faithful Path Community) in place of, or alongside, the ESV notice.
- **Leadership and ministry (e.g. *Lead Before You're Ready*):** "Take one step" may be a small act of service or a conversation with an overseer.
- **Dating and discernment (e.g. *Before You Say Yes*):** same safety line as marriage where relevant.
- **Content boundary:** keep materials within the author's stated Christian teaching scope; do not add material outside it.

---

## 6. Review checklist (for the third-party reviewer)

Please read one finished lesson page against this list and answer in your own words.

1. Does the tone feel like a pastor speaking, or like a clinic or a course platform?
2. Is any wording too clinical, too technical, or too pushy?
3. Is it clear the learner may rest and stop at any time?
4. Is there exactly **one** main step, and is it doable in ordinary life?
5. Does "Let it settle" read as quiet reflection, with nothing that feels like a quiz or homework?
6. Is "Need more support?" easy to find, kind, and clear about when to seek help outside the course?
7. Does the completion flow feel gentle, with "Stop here for today" as the natural first choice?
8. Are the citation and legal notices accurate and visible?
9. Would a first-time visitor know what to do next at every point?
10. What would you change, add, or remove?

---

## 7. Change log

| Date | Change |
|------|--------|
| 2026-09-25 | First written reference, captured from the shipped *When Your Mind Won't Rest* lesson page. |
| 2026-09-25 | Version 1.0 after review: table header fixed, "optional" clarified for section 6, short-lesson rule and page-type scope added. |
| 2026-09-25 | Reconciled with what shipped: Let it settle keeps its saved private reflections; footer is the course's two support links plus the citation notice; objectives lead-in is "In this lesson, you will learn to:". Added the privacy wording, the written-fresh rule, the completion-is-pressed rule, and a note that the final-lesson completion message is not built. |
