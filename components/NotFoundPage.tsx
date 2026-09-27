import Link from "next/link";

/**
 * The page a reader sees when a URL does not lead anywhere.
 *
 * Shared by two callers, which is the whole reason it is a component rather
 * than markup inside a page:
 *
 *  - app/not-found.tsx, for an ordinary 404.
 *  - app/gone/page.tsx, which proxy.ts rewrites the retired Zyro URLs to with
 *    a 410 status.
 *
 * The wording does not distinguish the two. A reader who has followed an old
 * link does not need to be told which status code they received; they need
 * somewhere to go next. The difference is for crawlers, and it is carried by
 * the status, not by the text.
 */
export default function NotFoundPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 pt-16 pb-20 sm:pt-24">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
        Nothing here
      </p>
      <h1
        className="mt-4 text-[2.5rem] leading-[1.08] tracking-[-0.02em] text-[#2B2118] sm:text-[3.25rem]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        That page isn&rsquo;t here
      </h1>
      <p
        className="mt-5 max-w-xl text-lg leading-relaxed text-[#2B2118]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
      >
        It may have been moved or taken down, or the address may have a typo in
        it. Nothing is wrong on your side.
      </p>

      <div className="mt-10 rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-7 py-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#8B5E34]">
          Where to go instead
        </p>
        <ul className="mt-4 space-y-3 text-lg leading-relaxed">
          <li>
            <Link
              href="/articles"
              className="text-[#8B5E34] underline underline-offset-4"
            >
              Browse the articles
            </Link>{" "}
            — the writing on faith, dating, marriage and the mind.
          </li>
          <li>
            <Link
              href="/talk-to-a-pastor"
              className="text-[#8B5E34] underline underline-offset-4"
            >
              Talk to a pastor
            </Link>{" "}
            — if you came looking for help with something of your own.
          </li>
          <li>
            <Link
              href="/"
              className="text-[#8B5E34] underline underline-offset-4"
            >
              Start from the beginning
            </Link>{" "}
            — the home page.
          </li>
        </ul>
      </div>
    </main>
  );
}
