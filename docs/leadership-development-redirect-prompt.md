# Task: Article address changed — add redirect and update links

Read CLAUDE.md first and follow it.

The article previously at `/articles/church-leadership-training` ("Leadership Development in the Church: How to Raise Up Leaders Who Last") has been renamed in the admin. Its new slug is `christian-leadership-development` and its new title is "Christian Leadership Development: How to Train New Leaders Who Last". The old address now returns 404.

1. In next.config.ts, add a permanent redirect from `/articles/church-leadership-training` to `/articles/christian-leadership-development`. Add a short comment: renamed by Richmond, 22 October 2026. Make sure nothing in lib/gone-paths.ts or the proxy matcher catches it.
2. In app/guides/[slug]/page.tsx (around line 139) there is a related-reading link with href `/articles/church-leadership-training` and title "Church Leadership Training: How to Raise Up Leaders Who Last". Change the href to `/articles/christian-leadership-development` and the title to "Christian Leadership Development: How to Train New Leaders Who Last".
3. Search the whole codebase (excluding node_modules and .next) for any other `/articles/church-leadership-training` links and update them the same way.
4. Search body_md of all rows in the Supabase `articles` table for the text `/articles/church-leadership-training`. Replace ONLY that link target with `/articles/christian-leadership-development` (change nothing else in the article text). Tell me which articles you changed.
5. `npm run build` must pass. Commit to main and push. After the deploy, confirm the old address redirects and the new address loads.

Standing rule: never change, cancel, refund or "clean up" any member row, subscription or payment without asking me first.
