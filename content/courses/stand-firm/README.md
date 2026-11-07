# Stand Firm course — content package v1

Stand Firm: A Christian Course on Spiritual Warfare and the Armour of God.
12 lessons in 4 parts, by Pastor Richmond Kobe. Every page here is final and approved by his reviewer.
Do not edit any wording, Scripture or illustration in these files.

## What is in this package

| Folder | Contents |
|---|---|
| start-here/ | `index.html` (Start Here) and `how-this-course-works.html`. The "Begin Lesson 1" button in how-this-course-works.html has `href="#lesson-1"` as a placeholder to point at Lesson 1. |
| lessons/01 … lessons/12 | Each holds `index.html` (the lesson page), `player.html` (the slide-and-narration player, shown in an iframe on the lesson page with `src="player.html"`) and `sf-lesson-NN.mp3` (the narration, loaded by the player with `<audio id="aud" src="sf-lesson-NN.mp3">`). |
| plan/ | `index.html` — the standalone My Stand Firm Plan page. It shows a completion line from `window.SF_COMPLETED` (number of lessons complete) and `window.SF_DONE_DATE` (date text), or from `?done=N` in the URL. |
| downloads/ | `Stand-Firm-Leaders-Guide.pdf` — the Leader's Guide (30 pages), a free download for members. |

## Lesson titles

| # | Part | Title |
|---|---|---|
| 1 | Part 1 · Understanding the Battle | What Is Spiritual Warfare? |
| 2 | Part 1 | A Real Enemy, Already Defeated |
| 3 | Part 1 | How the Enemy Works |
| 4 | Part 2 · The Armour of God | Be Strong in the Lord and the Belt of Truth |
| 5 | Part 2 | The Breastplate of Righteousness and the Shoes of Peace |
| 6 | Part 2 | The Shield of Faith and the Helmet of Salvation |
| 7 | Part 2 | The Sword of the Spirit and Praying at All Times |
| 8 | Part 3 · Standing Firm in Everyday Life | Is This a Spiritual Attack? |
| 9 | Part 3 | Submit, Resist and Worship |
| 10 | Part 3 | Together and Free |
| 11 | Part 4 · Living in Victory | Guarding Your Heart and Passing Faith On |
| 12 | Part 4 | Until He Comes: Stand Firm |

## Notes about the pages

- Pages are self-contained HTML. They store nothing and make no network requests, apart from Google Fonts. The player keeps only one setting in localStorage (`sf-reduce-motion`).
- Lesson 12's page includes its own My Stand Firm Plan form (the final narration says "you'll find My Stand Firm Plan on the lesson page"). The standalone plan page in plan/ is the same plan on its own page.
- Links already in the pages: https://faithfulpathcommunity.com/talk-to-a-pastor, /membership, /guides/stand-firm, and mailto:info@faithfulpathcommunity.com.
- Scripture quotations are from the ESV; the ESV notice is already on every page.
