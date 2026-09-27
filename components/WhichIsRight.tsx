import Link from "next/link";

/**
 * The three ways to work with Faithful Path, side by side.
 *
 * On /guides and /membership, because those are the two pages where somebody
 * is deciding between them — and where, without this, the answer to "what is
 * the difference between the US$29 book and the US$19 month?" is nowhere on the
 * page.
 *
 * `here` marks the option the reader is already looking at. It stays in the
 * list, because the comparison is the point and removing a row would leave two
 * prices and no sense of where the third sits, but it is not a link to itself.
 */
const OPTIONS = [
  {
    need: "A book to read and print",
    action: "Buy a book — US$29, PDF, yours to keep",
    href: "/guides",
  },
  {
    need: "Guided lessons, audio, journal and retreat tools, plus future courses",
    action: "Join the membership — US$19 a month, cancel any time",
    href: "/membership",
  },
  {
    need: "A private conversation",
    action: "Talk to a Pastor — US$60 for one hour",
    href: "/talk-to-a-pastor",
  },
];

export default function WhichIsRight({ here }: { here?: string }) {
  return (
    <section className="mt-12 max-w-2xl rounded-sm border border-[#E5D9C7] bg-[#F3EADC] px-6 py-7">
      <h2
        className="text-xl leading-snug text-[#2B2118]"
        style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
      >
        Which is right for you?
      </h2>

      <dl className="mt-5 space-y-4">
        {OPTIONS.map((o) => (
          <div
            key={o.href}
            className="grid gap-x-6 gap-y-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
          >
            <dt className="leading-relaxed text-[#6B5F53]">{o.need}</dt>
            <dd className="leading-relaxed">
              {o.href === here ? (
                <span className="text-[#2B2118]">
                  {o.action}{" "}
                  <span className="text-[#8B5E34]">— you are here</span>
                </span>
              ) : (
                <Link
                  href={o.href}
                  className="font-medium text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
                >
                  {o.action}
                </Link>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
