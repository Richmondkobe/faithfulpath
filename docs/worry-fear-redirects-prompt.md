# Task: Redirect old fear/anxiety URLs to the new worry article

Read CLAUDE.md first and follow it.

A new article is live at `/articles/what-does-the-bible-say-about-worry` ("What Does the Bible Say About Worry, Fear and Anxiety?").

These old Zyro URLs had Google impressions and are currently gone (410) or 404. Point each at the new article with a permanent redirect, and remove the first three from lib/gone-paths.ts AND the proxy matcher (GONE_MATCHER) so the redirect actually runs:
- `/overcoming-fear-trusting-god`
- `/fearless-faith-living-boldly-in-gods-promises`
- `/fears-holding-me-back-christian-perspective`
- `/spiritual-counseling-for-anxiety` (check what it does now first; if it already redirects somewhere, tell me instead of changing it)

Also add the overthinking article as a related link only if there is an existing related-links mechanism; otherwise skip that.

`npm run build` must pass. Commit to main and push. After deploy, check all four old URLs on the live site and report a table: old URL, what it does now.

Standing rule: never change, cancel, refund or "clean up" any member row, subscription or payment without asking me first.
