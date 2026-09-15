# When Your Mind Won't Rest — Module 1 content (draft for review)

Source: the published book PDF (10 Sept 2026). Course map v3 governs structure.

## What is in this package

- `lessons/01…05` — the five teaching lessons of Module 1, in the approved template: outcome · Before you begin · Key Scripture (ESV) · One truth to carry with you (100–150 words) · The lesson (600–850 words; Lessons 3–5 run to about 1,100 as safety lessons) · Read the complete chapter (the chapter's teaching sections, collapsed, with its own headings) · Pause and notice · Guided prayer (the chapter's own) · Your next faithful step (the chapter's "One action for today") · Journal reflection (three of the chapter's questions) · Worksheet · Closing declaration (the chapter's own) · If you need more support · Continue or rest here.
- `resources/01…05` — the five worksheets as printable resource pages, taken from the chapter exercises (fuller than the toolkit's condensed versions), each carrying the book's once-only and safety wording. Worksheet 4 is marked **Not for group sharing**.
- `checkins/m1-pause.md` — the unscored Module 1 pause.

## Conventions

- Lesson 3 uses the display title "Anxiety, Faith and Shame"; the chapter heading inside the disclosure keeps the book's title.
- "Read the complete chapter" is a plain H2 section in each lesson file (no raw HTML). As in the Spiritual Reset course, the site wraps everything from that heading to the next H2 in a collapsed disclosure, with the chapter's H3 headings visible inside it. Safety boxes inside the chapter are blockquotes with a bold heading line. The file deliberately contains no raw `<details>` HTML: react-markdown does not render raw HTML and would not parse Markdown inside it, so the site produces the disclosure at render time, exactly as the live Spiritual Reset course does.
- Navigation language in the complete chapters is swapped to lesson and module references ("Chapter 4" → "Lesson 4", "Part Three" → "Module 3", "this book" → "this course", the box heading "When this may need more than a workbook" → "When you may need more than this course", "at the end of this book" → "the Finding Help Where You Live page"). No other wording is changed. The chapters' own Reflection, Guided Prayer, Workbook Exercise, One Action, Closing Declaration and "Next" preview are not repeated inside the disclosure because each appears in its own section or resource.
- Front matter: `action_responses` (the three private options) and `finish_label` ("I have finished this lesson for today") replace the Spiritual Reset's `action_done` checkbox; completion never depends on the next faithful step. `support` is the lesson's context-specific support line.
- Scripture: ESV throughout; every Key Scripture box is marked (ESV).

## Still to come

Start Here pages, Modules 2–5, the Pattern Finder, the remaining pauses, the toolkit PDF, Using This Course With Others, course.json and the Claude Code prompt.
