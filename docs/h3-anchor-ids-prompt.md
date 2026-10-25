# Task: Give article h3 headings an id so tables can link to them

Read CLAUDE.md first and follow it.

In components/ArticleBody.tsx, h2 headings already get `id={headingId(children)}` and the class `scroll-mt-6`. h3 headings do not, so in-page links like `#who-am-i-in-christ` to an h3 do nothing.

1. Give the h3 renderer the same `id={headingId(children)}` and add `scroll-mt-6` to its className. Change nothing else about its styling.
2. `npm run build` must pass. Commit to main and push.
3. After deploy, open https://faithfulpathcommunity.com/articles/womens-bible-study-topics#who-am-i-in-christ and confirm it jumps to that heading (the article text may be updated by Richmond shortly before or after you do this; if the heading is not there yet, just confirm the h3 elements on any article now have ids).

Standing rule: never change, cancel, refund or "clean up" any member row, subscription or payment without asking me first.

## Also
4. The article with slug `womens-bible-study-topics` has no category. Set its `category` in the Supabase `articles` table to the "New to Faith & Discipleship" category (use the matching slug from lib/categories.ts). Change nothing else in that row.
