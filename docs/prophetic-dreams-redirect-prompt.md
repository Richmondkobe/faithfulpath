# Prophetic dreams article: redirects

A new article is live at /articles/prophetic-dreams-in-the-bible.

Please do the following:

1. In `next.config.ts`, add these permanent redirects (permanent: true), each pointing directly to `/articles/prophetic-dreams-in-the-bible` with no redirect chain:
   - `/understanding-prophetic-dreams-in-christianity-a-guide-to-divine-communication-and-interpretation`
   - `/divine-dreams-biblical-guidance`
   Add a comment: "Old Zyro dream pages, redirected by Richmond, 23 October 2026".
2. Check whether either old path is listed in `lib/gone-paths.ts` or matched in `proxy.ts`. If one is, remove it from both so the redirect works.
3. Search the codebase (excluding node_modules and .next) for any reference to either old path and update it to the new URL.
4. If you can read the Supabase `articles` table, list (read only, do not edit) any other article whose title or slug mentions "dream", so I can check that it doesn't compete with this one.
5. Run the build to check for errors, then commit and push to deploy.
6. After the deploy, confirm that both old addresses return a 308/301 straight to /articles/prophetic-dreams-in-the-bible.

Standing rule: never change, cancel, refund or "clean up" any member row, subscription or payment without asking me first.
