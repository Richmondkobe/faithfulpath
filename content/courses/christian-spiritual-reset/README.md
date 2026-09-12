# Course content: The Christian Spiritual Reset (content v5, phase 3)

## Files
- course.json — course metadata. Six modules in order: m0 Start Here, m1 Why Your Soul Needs a Retreat, m2 Preparing to Meet With God, m3 Choose Your Retreat, m4 The Retreat Journey, m5 After the Retreat. Lesson sequence is the array order in course.json. `order` is the stable display number for countable lessons (matches in-text references such as "read Lesson 24"); reference lessons show no number. 27 countable lessons (types teaching and session); reference lessons never count toward progress.
- lessons/<slug>.md — lesson body in Markdown (GFM tables). Front matter fields:
  - title, module, order, source, type (teaching | session | reference)
  - video (optional): id of a video to embed above the text; show a "Video coming soon" placeholder until a file exists
  - route_choice: true (00-choose-your-route only): the two links whose text begins "I choose" render as buttons; clicking saves the route ("guided" | "quick") and navigates
  - **outcome** (teaching lessons): one sentence, shown under the title as "What this lesson will do for you"
  - **action** and **action_done** (teaching lessons): the "Your next step" text and its checkbox label. Ticking the checkbox marks the lesson complete (saved in course_progress.completed_at)
  - **action_followup** (Lesson 11 only): a secondary yes/no prompt shown under the checkbox
  - **final_action** and **final_done** (Lesson 28 only): a second, Day 30 stage. The first checkbox (`action_done`) marks the lesson complete as usual; the Day 30 stage sits immediately before the Integration Check-in and becomes available 30 days after the first checkbox was ticked, or immediately if the member presses "My month is complete". Ticking `final_done` marks the whole course complete
  - **resources** (optional list): slugs of files in resources/ to show in a "Resources" box placed between "In brief" and "Read the deeper teaching" (i.e. ABOVE the next step and the check-in). Rendered as view + print links. Required resources must never live only inside the collapsed deeper teaching
- Teaching-lesson body structure (in this order): `# Title`, `## Key Scripture` (a blockquote, reference marked ESV), `## In brief` (the condensed teaching, 600–1,100 words), `## Read the deeper teaching` (the full chapter — render everything from this heading to the end of the file inside a collapsed section that opens on click). Session lessons (13–22) and reference lessons keep their existing single-body structure.
- quizzes/NN.json — per countable lesson: `reflection` (free-text journal prompts, saved per member), `questions` (multiple choice; now EMPTY for every lesson — the old six-question quizzes are retired; keep the component for possible future use), and optionally **`checkin`** (see below). Session lessons have reflection only.
- resources/<slug>.md — printable pages (front matter: title, for). Six files: digital-boundary-agreement, retreat-packing-checklist, emergency-information-card, testing-worksheet, two-week-plan, rule-of-life-template.

## Page layout for a teaching lesson (top to bottom)
1. Module name · Lesson N
2. Title
3. "What this lesson will do for you" — `outcome`
4. Video placeholder (if `video`)
5. Key Scripture box
6. In brief
7. Resources box (if `resources`)
8. Read the deeper teaching (collapsed)
9. Check-in (if `checkin` in the quiz file) — for Lesson 28 the Day 30 stage text and its checkbox come BEFORE the check-in
10. Your next step — `action` + checkbox `action_done` (+ `action_followup` if present)
11. Reflection — textareas + Save
12. Previous / Next

## Check-ins (quizzes/NN.json → `checkin`)
Four types, all unscored, all saved per member (answers and outcome id) — store in course_reflections rows for that lesson at question_index 100+ (or a JSON blob at index 100) to avoid a migration; answers are private under existing RLS.
- **readiness** (04.json): `sections` (multi/single select) → evaluate `guidance` rules in `priority` order, first match wins. Rule syntax: `signs_has:a,b` (any ticked), `x_in:a,b` (single answer is one of), `signs_count_gte:N`, AND / OR / parentheses, `otherwise`. Show the matching guidance heading + text (+ cta link). If the matched rule has `block_continue`/`hide_action`: hide the Next-lesson link and the next-step checkbox and show the cta (Finding Help) instead.
- **safety** (05.json): `statements` (each a checkbox), `path` (single select, saved as the member's path), `confirm` (final checkbox), `help_link`. All statements + path + confirm required to tick; ticking confirm counts as completing the check-in.
- **discernment** (24.json): same rule engine as readiness (`warning_has`, `warning_not` = none of the listed ids ticked). `repeatable: true` — show a "Check another direction" button that clears and re-runs. The matched rule with `replace_primary` (immediate danger) replaces the primary Next button with the "Get Help Now" cta but does NOT lock the course.
- **integration** (28.json): `items` (labelled text fields with placeholders; `optional` where marked), `reflection_prompt` (one textarea), `confirm` (checkbox), `closing` text shown after confirm. `available_from: day30` — same availability rule as `final_action`.

## Videos and audio (phase 3)
- videos/<id>.md — script for a short video by Richmond (front matter: title, lesson, length, optional before_heading). A lesson references one with `video: <id>` or several with `videos: [<id>, …]`. Until a media file exists at public/course-media/videos/<id>.mp4, render a "Video coming soon" placeholder box with the script text beneath it under the heading "What Richmond says in this video" (the italic recording notes are not shown to members). When the .mp4 exists, render a player and keep the script collapsed beneath it as a transcript. Placement: `video` goes above the Key Scripture box (teaching lessons) or above "Before you begin" (sessions); each entry in `videos` goes immediately above the heading named in its `before_heading`.
- audio/<id>.md — script for an audio-only guided prayer (front matter: title, lesson, length). A session references it with `audio: <id>`. Render an audio player inside the session's "## Guided prayer" section, directly under that heading, when public/course-media/audio/<id>.mp3 exists; otherwise a small "Audio coming soon" note there and nothing else (the written prayer already follows). Do not show the audio script text to members.
- audio/silence-timers.md — opening and closing lines for the silence timers. In every session's "## Silence" section, render a timer control offering 5, 10, 20 and 30 minutes (and the length the session suggests, if different). Pressing start plays public/course-media/audio/timer-opening-<n>.mp3 if it exists, counts down silently, then plays timer-closing.mp3 if it exists; if the clips are missing, run a plain visible countdown with a gentle chime at the end. Keep the screen dim and static during the countdown; no notifications.

## Safety UI
- A persistent, small "Get Help Now" link (to 00-finding-help-where-you-live) in the lesson header area on Lessons 4, 5, 24, 27, 28 and all session lessons (13–22), and in the site footer of every course page.
- Every course page footer carries the Scripture notice: "Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved."

## Route logic (unchanged)
guided = first unfinished countable lesson in sequence; quick = 05, 09, 23, then first unfinished countable lesson.
