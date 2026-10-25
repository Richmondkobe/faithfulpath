# Task: Redirect old dating-tips URL + check internal links in new articles

Read CLAUDE.md first and follow it.

## 1. Redirect
The old Zyro page `/christian-dating-tips` had ~900 Google impressions but was never brought across, so it now returns 404. A new article covering the same topic is live at `/articles/christian-dating-tips`.

- In next.config.ts, add a permanent redirect from `/christian-dating-tips` to `/articles/christian-dating-tips`, in the "Old Zyro pages with an article that answers the same question" block.
- Check it is NOT in lib/gone-paths.ts or the proxy matcher (remove it there if it is).
- `npm run build` must pass. Commit to main and push (small, safe change; no preview needed).
- After deploy, confirm https://faithfulpathcommunity.com/christian-dating-tips redirects to the new article.

## 2. Internal link check (read-only, do not edit articles)
For these published articles, read body_md from the Supabase `articles` table and list every internal link (starting with `/`):
- christian-dating-tips
- pentecostal-christian-dating
- christian-leadership-training
- christian-mens-retreat-themes
- spiritual-gates-explained
- apocrypha-controversy

For each link, check that the target exists: an `/articles/<slug>` must be a PUBLISHED row in `articles`; `/guides/...`, `/talk-to-a-pastor`, `/membership`, `/before-you-say-yes/resources`, `/articles` must be real routes. Report a simple table: article, link, OK or BROKEN. Do not change any article text — just report.

Standing rule: never change, cancel, refund or "clean up" any member row, subscription or payment without asking me first.
