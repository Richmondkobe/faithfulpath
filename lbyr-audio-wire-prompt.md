# Wire the "Lead Before You're Ready" recordings into the course

The course is built and hidden in production (`LBYR_PUBLISHED = false`). Every lesson page currently shows a "Recording coming soon" panel where the `SlidePlayer` belongs. All ten recordings now exist. Wire them in exactly as you did for When Your Mind Won't Rest: **Lesson 1 first as a preview, then wait for "go", then 02–10.**

## What is in the folder

`content/courses/lead-before-youre-ready/lesson-01/ … lesson-10/`, each containing:

| File | Purpose |
|---|---|
| `lbyr-lesson-NN.mp3` | The recording. Upload to the `course-media` bucket at `audio/lead-before-youre-ready/lbyr-lesson-NN.mp3`. |
| `pilot.html` | The synced slide deck. Extract `DATA` from its `<script>` — `DATA.slides` (title, kicker, body, list, chips, quote/ref, sub, note, prayer, autoPause, narration) and `DATA.timings` (slide start times in seconds, one per slide) — into the lesson's `slides.json`, the same shape the WYMWR extractor produces. The `ART` map in the same script holds the inline SVG line illustrations keyed by each slide's `art` field; carry them over the same way as WYMWR. |
| `timings.json` | The same timings array on its own. |
| `lbyr-lesson-NN-narration.txt` | The narration as recorded; matches the lesson page transcript. |

All ten pilots use the same slide schema as WYMWR, plus these field names which WYMWR also used: `chips` (numbered chips), `list` (bulleted list), `note` (accent-bordered note), `sub` (muted line), `quote`/`ref` (Scripture slide), `prayer` (italic body), `autoPause` (player stops at the end of this slide and shows "Paused for reflection").

## Rules

- Replace the "Recording coming soon" panel with `SlidePlayer` on each lesson once its files are in place. The transcript accordion stays beneath, unchanged.
- The auto-pause slide behaviour, the "two seconds after Amen" ending, playback speed and keyboard controls are whatever `SlidePlayer` already does; change nothing in the component unless a pilot needs something it lacks, and tell me if so.
- Do not touch any lesson text. Do not add analytics. Do not store anything new.
- `pilot.html`, mp3s and narration files must not be served or committed as pages (add to `.gitignore` as with WYMWR if they are not already covered).
- After 01–10 are wired: run the full verification, confirm each lesson plays on the preview URL, then merge. Keep `LBYR_PUBLISHED = false` — I will say "publish" separately.
- Report back with the Lesson 1 preview URL and anything you had to decide.
