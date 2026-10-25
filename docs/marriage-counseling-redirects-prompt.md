# Task: Point old marriage/counseling URLs at the right new pages

Read CLAUDE.md first and follow it.

A new article is live at `/articles/christian-marriage-counseling` ("Christian Marriage Counseling: What to Expect, Biblical Guidance and How to Find Help").

1. CHANGE the existing redirect for `/christian-marriage-counseling` (currently → `/articles/christian-marriage-help-real-problem`) so it now goes to `/articles/christian-marriage-counseling`.

2. These old Zyro URLs still had Google impressions in the last 3 months. For each, first check what it currently does on the live site (redirect, 410 or 404). If it currently returns 404 (or is in lib/gone-paths.ts), add a permanent redirect as listed and remove it from gone-paths/the proxy matcher if present. If it already redirects somewhere, leave it alone and tell me where it goes.
   - `/christian-counseling-service` → `/talk-to-a-pastor`
   - `/christian-dating-and-marriage` → `/articles/christian-dating-tips`
   - `/rebuild-trust-after-infidelity-christian-marriage` → `/articles/christian-marriage-counseling`

3. `npm run build` must pass. Commit to main and push. After deploy, check each of the four old URLs on the live site and report a table: old URL, what it does now.

Standing rule: never change, cancel, refund or "clean up" any member row, subscription or payment without asking me first.
