# Couples retreat article: redirects and link update

The article previously at /articles/couples-spiritual-reset-weekend has been rewritten and its slug changed (in the admin) to `christian-couples-retreat`. It is live at /articles/christian-couples-retreat.

Please do the following:

1. In `next.config.ts`, change the existing redirect for `/christian-marriage-retreats` so its destination is `/articles/christian-couples-retreat` (permanent: true). Point it directly at the new URL, with no redirect chain.
2. In `next.config.ts`, add a new permanent redirect: `/articles/couples-spiritual-reset-weekend` → `/articles/christian-couples-retreat`.
3. Check that neither old path is listed in `lib/gone-paths.ts` or matched in `proxy.ts`. If one is, remove it from both so the redirect works.
4. In `app/guides/[slug]/page.tsx` (around line 99), update the related link href from `/articles/couples-spiritual-reset-weekend` to `/articles/christian-couples-retreat`. If its link text uses the old title, update it to "Christian Couples Retreat: Themes, Activities and a Weekend Schedule".
5. Search the rest of the codebase (excluding node_modules and .next) for any other reference to `couples-spiritual-reset-weekend` and update it to the new URL.
6. If you can read the Supabase `articles` table, list (read only, do not edit) any article whose `body_md` contains `couples-spiritual-reset-weekend`, so I can update those links myself. The redirect will cover them in the meantime.
7. Run the build to check for errors, then commit and push to deploy.
8. After the deploy, confirm that both https://faithfulpathcommunity.com/christian-marriage-retreats and https://faithfulpathcommunity.com/articles/couples-spiritual-reset-weekend return a 308/301 straight to /articles/christian-couples-retreat.

Standing rule: never change, cancel, refund or "clean up" any member row, subscription or payment without asking me first.
