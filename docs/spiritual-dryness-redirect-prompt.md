# Spiritual dryness article: redirects and link check

The article previously at /articles/how-to-pray-when-you-feel-nothing has been rewritten and its slug changed (in the admin) to `spiritual-dryness`. It is live at /articles/spiritual-dryness.

Please do the following:

1. In `next.config.ts`, add these permanent redirects (permanent: true), each pointing directly to `/articles/spiritual-dryness` with no redirect chain:
   - `/articles/how-to-pray-when-you-feel-nothing`
   - `/overcome-spiritual-dryness-and-reconnect-with-faith`
   Add a comment: "Spiritual dryness article rewritten and renamed by Richmond, 23 October 2026".
2. Check whether either old path is listed in `lib/gone-paths.ts` or matched in `proxy.ts`. If one is, remove it from both so the redirect works.
3. Search the codebase (excluding node_modules and .next) for any reference to either old path and update it to the new URL.
4. If you can read the Supabase `articles` table, list (read only, do not edit) any article whose `body_md` contains `how-to-pray-when-you-feel-nothing`, with its title and slug, so I can update those links myself. The redirect will cover them in the meantime.
5. Check the sitemap: open `app/sitemap.ts` (or wherever the sitemap is generated) and confirm that https://faithfulpathcommunity.com/sitemap.xml includes all published articles, including /articles/spiritual-dryness and /articles/how-to-disciple-a-new-believer. Report what you find, and whether robots.txt points to the sitemap. Don't change anything about the sitemap yet; just report.
6. Run the build to check for errors, then commit and push to deploy.
7. After the deploy, confirm that both old addresses return a 308/301 straight to /articles/spiritual-dryness.

Standing rule: never change, cancel, refund or "clean up" any member row, subscription or payment without asking me first.
