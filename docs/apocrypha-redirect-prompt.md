# Task: Redirect the old Apocrypha URL to the new article

Read CLAUDE.md first and follow it.

The old Zyro page `/exploring-the-apocrypha-guide` ranked at position 2 on Google for "apocrypha controversy" but was never brought across, so it now returns 404. A new article covering the same topic is live at `/articles/apocrypha-controversy`.

1. In next.config.ts, add a permanent (308) redirect from `/exploring-the-apocrypha-guide` to `/articles/apocrypha-controversy`, in the block of "Old Zyro pages with an article that answers the same question".
2. Make sure `/exploring-the-apocrypha-guide` is NOT in lib/gone-paths.ts or the proxy matcher (it should not be, but check).
3. `npm run build` must pass.
4. This is a small, safe change: commit it to main and push so Vercel deploys it. No preview needed.
5. After the deploy, check that https://faithfulpathcommunity.com/exploring-the-apocrypha-guide redirects to /articles/apocrypha-controversy, and tell me the result.

Standing rule: never change, cancel, refund or "clean up" any member row, subscription or payment without asking me first.
