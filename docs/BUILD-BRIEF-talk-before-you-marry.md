# Build brief: Talk Before You Marry course pages

*For Claude Code, working in the faithfulpath project. Read this whole file before writing any code. Follow CLAUDE.md and the existing conventions in this project first. Where this brief and the existing code conflict on how something is built, follow the existing code; where they conflict on what the course must say or do, follow this brief.*

## What you are building
A members-only, fourteen-lesson Christian premarital course, *Talk Before You Marry*, plus a Start Here page, a Safety and Support page and a Facilitator Guide page. Build it the same way the existing courses in this project are built (for example *When Your Mind Won't Rest*): reuse the existing course data structure, lesson page component, progress and completion logic, and the members "Your courses" card. Do not invent a parallel system.

## Source files (all in `docs/`)
- `COURSE-DESIGN-Talk-Before-You-Marry.md`: the approved course design (Version 1.3). Read Sections 3 to 5 first.
- `LESSON-TEMPLATE.md`: the Faithful Path lesson template. The eleven sections and their order are fixed.
- `tbym-lesson-01-draft.md` to `tbym-lesson-14-draft.md`: the lesson content. Each file has: the learner page, the recording script and transcript, a worksheet, and "Notes for the reviewer". **Only the page, the transcript and the worksheet go on the site. The editorial note at the top, anything in [square brackets], the author's note above each script, and "Notes for the reviewer" must never appear on the site.**
- `talk-before-you-marry-start-here.md`, `talk-before-you-marry-safety-and-support.md`, `talk-before-you-marry-facilitator-guide.md`: the other three pages. Same rule about editorial notes and brackets.
- `tbym-lesson-01-preview.html`: the approved visual design for a lesson page. Match its layout, spacing and tone within this project's existing components and styles.

## Rules that must hold (do not change the wording of course content)
1. **Use the course text exactly as written.** Do not rewrite, shorten or "improve" it. If something looks wrong, tell the author; do not fix it silently.
2. **Nothing the learner writes is stored.** The lessons have no text boxes. "Let it settle" prompts are display only. Worksheets are downloadable files completed on the learner's own device or on paper; they are never uploaded. The only data stored for this course is the account and lesson-completion progress. Do not add analytics, tracking or logging of learner answers. Do not add a save-my-answers feature.
3. **Completion.** "Mark this lesson complete" records completion for that learner only. "Mark it unfinished" undoes it. "Stop here for today" leaves the page without marking anything complete. One partner must never be able to see the other's account or progress; check the database access rules (row-level security) enforce this.
4. **Section order per lesson is fixed:** title and Scripture; objectives; watch or listen; read the transcript (collapsed); take one step; if it helps, tell someone (**omitted on Lessons 3, 7 and 12**); go deeper; let it settle (exactly two prompts); need more support?; completion block; footer.
5. **Lesson 14 is the last lesson.** After it is complete, show the course completion message from the design doc, and the final buttons: Stop here for today, Return to Course Overview, a text link "Explore your next Faithful Path course or resource", and Mark it unfinished. There is no "Continue" button.
6. **Footer.** Lessons use the short footer (two support links, then the citation notice). Start Here and the Safety and Support page use the fuller footer (Home, Course overview, Contact, Privacy, Terms, plus the notice). The ESV and copyright notice text is in `talk-before-you-marry-start-here.md`.
7. **Safety and Support page.** Its regional directory must show only countries with verified entries. Until the directory is filled and verified, show the emergency-number message and a plain statement that no verified service is listed for that country. Ask the visitor to choose their country; do **not** detect location. Include a visible "Leave this page quickly" button. Do not put phone numbers into lesson pages. The candidate entries in `safety-directory-thailand-DRAFT.md` and `safety-directory-canada-DRAFT.md` are **not verified** and must not be published as they are.
8. **Start Here acknowledgement.** The learner must tick the safety acknowledgement before "Begin Lesson 1" appears. "Stop here for today" and "Visit Safety and Support" behave as described in that file.
9. **Placeholders.** Anything in [square brackets] on a page is an unresolved item for the author, not content. Where a real value is needed (the recording, the page link), use a clearly visible development placeholder and list it in your report. Never publish bracketed text.
10. **Recordings** are not ready. Build the player component with a "recording not yet available" state so pages work now and the audio or video can be added later.
11. **Accessibility.** Visible keyboard focus, semantic headings, the transcript available without JavaScript where feasible, colour contrast in both light and dark themes, and phone-width layouts.

## How to work
1. **Start with Lesson 1 only.** Build it end to end as a real page in the course, using the existing lesson component and data format. Add the course to the members "Your courses" list (title, one-line description, progress, "Go to the course") in the existing card style. The description is: "A fourteen-lesson Christian course that helps couples talk honestly about the things that are hard, before they marry."
2. Run the app locally, open the page at phone width and desktop width, and check both themes. Check that completing and un-completing works, and that no editorial text is showing.
3. **Stop and report** to the author: what you built, which files you added or changed, anything in this brief you could not follow or that conflicts with the existing code, and what you need from the author. Do not continue to Lesson 2 until the author says so.
4. After the author approves Lesson 1, build the remaining lessons from their draft files in the same way, then Start Here, Safety and Support and the Facilitator Guide, one at a time, reporting after each.

## Content checks to run on every lesson you add
- The page shows exactly the sections listed in rule 4 (with the "tell someone" exception).
- "Let it settle" has exactly two prompts and no input fields.
- The Scripture quotation matches the draft file word for word.
- No text in [square brackets], no "Draft", no "for review", no author's or reviewer's notes is visible.
- The transcript is the recording script with the italic movement headings and author's notes removed.
- Worksheet text is unchanged and is offered as a download or a printable view, and is not stored.
