# When Your Mind Won't Rest — Module 2 content (draft for review)

Module 2 — Recognise Your Overthinking Pattern (Chapters 6–12). Course map v3 governs structure; the same conventions as Module 1 apply (see README-module-1).

## What is in this package

- `checkins/m2-pattern-finder.md` — the unscored Pattern Finder that opens the module (seven patterns + "I am not sure"; multi-select; suggests lessons, never reorders or hides the module; nothing stored as a label).
- `lessons/06…12` — the seven teaching lessons in the approved template. Length: Lessons 6 and 8 ~900–950 words (complex practical); Lessons 7, 9, 10, 11 and 12 ~1,000–1,100 (each carries a safety boundary: trauma, abuse patterns, OCD/scrupulosity, compulsive checking, caregiver strain and coercive control).
- `resources/06…12` — the seven worksheets from the chapter exercises, under their printed names and numbers. The Chapter 6 and 11 worksheets carry their safety boxes at the top.
- `checkins/m2-pause.md` + `resources/23-the-worry-cycle-map.md` — the Module 2 pause ("Name the cycle"), which uses the book's own Worry-Cycle Map (Toolkit 23), once only.

## Notes for review

- Every "Before you begin" gathers the chapter's own safety box(es), so context-specific safety appears before the exercise (Lessons 7, 8 and 10 especially).
- Lesson 8's and Lesson 9's worksheets keep the book's "Before you begin" notes about abusive or unsafe people at the top of the resource page.
- Navigation swaps as in Module 1, plus "in the toolkit at the back of the book" → "in the Course Journal and Practical Toolkit".
- The quick-access page (Module 0) now resolves for Lessons 6–12: the resource files it points to exist in this package.

## Rendering note (for Claude Code and reviewers)

"Read the complete chapter" is a plain H2 section in every lesson file, deliberately without raw `<details>` HTML: the site's Markdown renderer (react-markdown) does not render raw HTML, and Markdown inside an HTML block would not be parsed. As in the live Spiritual Reset course, Claude Code wraps everything from that heading to the next H2 in a single collapsed `<details>` element at render time, with the chapter's H3 headings visible and anchored inside it, and no nested disclosures. This is the same behaviour the reviewer asks for, produced by the site rather than the file.

Resource pages carry `resource_safety_required: true` where a safety box precedes the exercise (Worksheets 6, 7, 8, 9 and 11): the platform must never render such a worksheet, including from the quick-access page, without its box.
