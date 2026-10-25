# Task: Redirect old Bible study methods URL to the new beginners' article

Read CLAUDE.md first and follow it.

A new article is live at `/articles/how-to-study-the-bible-for-beginners`.

The old Zyro URL `/bible-study-methods` had ~440 Google impressions and is currently gone (410). Add a permanent redirect from `/bible-study-methods` to `/articles/how-to-study-the-bible-for-beginners`, and remove it from lib/gone-paths.ts and the gone matcher (in lib/gone-paths.ts and proxy.ts) so the redirect runs.

`npm run build` must pass. Commit to main and push. After deploy, confirm on the live site that /bible-study-methods redirects and the new article loads. Reply in one or two lines.

Standing rule: never change, cancel, refund or "clean up" any member row, subscription or payment without asking me first.
