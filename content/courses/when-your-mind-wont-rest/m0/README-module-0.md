# When Your Mind Won't Rest — Module 0 "Start Here" content (draft for review)

Seven orientation and safety pages plus one quick-access tool (and its short night-time page). None counts towards completion; pages 04, 06, 07 and 08 are always accessible and never locked.

| File | Page | Source |
|------|------|--------|
| 00-welcome | Welcome: You Do Not Have to Solve Everything Today | The book's "A Note to the Reader", in Richmond's words, with new "what it can help with / what it does not promise / permission" sections. Video/audio placeholder. |
| 01-how-this-course-works | How This Course Works | New (lesson structure) + the journal boundaries from "How to Use This Book" |
| 02-choose-your-path-and-pace | Choose Your Path and Pace | The five paths from "How to Use This Book"; `choice` front matter saves the member's path (changeable, never affects progress) |
| 03-before-you-begin | Before You Begin: A Personal Intention | New; two questions with stable IDs, private, optional, saved to the journal |
| 04-when-this-course-is-not-enough | When This Course Is Not Enough | The book's page in full under scannable headings (book → course swaps only), plus two sections built from the book's own wording elsewhere: severe sleep disruption (Chapter 20) and pregnancy/after birth (Chapter 13's box); a Get help now control after the suicide section; the three-statement acknowledgement with stable IDs (`acknowledgement` front matter: stores checked status and date only, locks nothing, dismissible, repeats on return to the page only, never a course-wide modal, not safety information) |
| 05-if-you-are-not-sure-you-belong-to-christ | If You Are Not Sure You Belong to Christ | The book's page in full; optional; Augustine note inline |
| 06-finding-help-where-you-live | Finding Help Where You Live | "Get help now" warning block at the top (no explanatory text above it), then the book's resources page as scannable lists with live links; `last_verified` and `review_required` in front matter, and the check date shown on the page. Contacts must be re-checked regularly — outdated information here can cause direct harm |
| 07-my-mind-is-restless-right-now | My Mind Is Restless Right Now | The book's "one chapter when you are overwhelmed" list; `entries` front matter maps each line to its lesson, lesson title, resource file and resource label. `render_list_from_entries: true` — Claude Code should generate the visible list from `entries` so the routes are not maintained twice; the Markdown list is a fallback and the build should validate that it matches. The Lesson 6–12 resource files exist (Module 2); Lessons 16–19 arrive with Modules 3–4. The night-time entry points to page 08, never to a worksheet |
| 08-night-time | It Is the Middle of the Night | The deliberately short night-time page: Night-Time Thought Download only, urgent exception, back to course home; links to no other exercise |

`resources/25-night-time-thought-download.md` is the printable worksheet (toolkit 25).

All files are UTF-8. Page `order` values are integers 0–8.
