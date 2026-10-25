# Task: Articles page — card grid layout + search bar

Read CLAUDE.md first and follow it. Work on a new branch `articles-cards-search`, push it, and give me the Vercel preview link. Do NOT merge to main until I reply "publish".

Standing rule: never change, cancel, refund or "clean up" any member row, subscription or payment without asking me first.

## 1. Card grid (replace the plain list in components/ArticleIndex.tsx)

ArticleIndex is shared by /articles, /articles/page/[page] and /articles/category/[category] — change it once so all three match.

- Show articles as **cards in a grid**: 3 per row on desktop, 2 on tablet, 1 on phones. Widen the main container enough for 3 columns (the list currently sits in max-w-3xl).
- Each card (the whole card is one link to /articles/[slug]):
  - **Title** at the top (display font, navy, centred or left — whichever reads best).
  - **Excerpt** below it, clamped to about 4 lines.
  - **"Read more »"** in gold.
  - A thin divider, then a **footer line**: `Richmond Kobe · October 2026 · Church Leadership` (author · displayDate(published_at) · category label if it has one).
- Style: the site's existing navy-and-gold look (not orange). Thin gold border, rounded corners like the rest of the site, gentle shadow or border colour change on hover. Cards in a row should be equal height, with the footer pinned to the bottom.
- Keep everything else on the page as it is: heading, lede, CategoryRow filter buttons, pagination, and the "Talk to a Pastor" block at the bottom.
- The reference I liked is a 3-column grid of bordered cards with a centred title, short summary, "READ MORE »", and an author · date footer.

## 2. Search bar

- Add a search box under the lede and above the category buttons on /articles and the category pages. Placeholder: "Search articles — a word or phrase".
- Submitting goes to **/articles/search?q=...** (a GET form, so it works without JavaScript).
- The search page searches **published** articles only, matching the words or phrase in the **title, excerpt and body** (case-insensitive, Supabase `ilike` or Postgres full-text — your choice, but an exact phrase like "spiritual gates" must work). Put title matches first, then newest.
- Show results with the same cards, a line like `7 articles found for "prayer"`, the search box pre-filled, and a friendly empty state with a link back to all articles plus the Talk to a Pastor link.
- Escape the search text safely (no SQL or filter injection through the `q` value). Cap the query length at about 100 characters.
- The search results page must have `robots: { index: false, follow: true }` and must not be added to sitemap.xml.

## 3. Check before giving me the link

- `npm run build` passes with no errors.
- /articles, page 2, a category page and the search page all show the new cards.
- Searching "leadership", "Pentecostal" and the phrase "spiritual gates" each return sensible results; searching "zzzz" shows the empty state.
- The layout looks right at phone width (375px) — one card per row, no sideways scrolling.

When done, reply with the preview link and a short list of what changed.
