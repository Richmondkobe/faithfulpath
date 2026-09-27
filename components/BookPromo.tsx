import Link from "next/link";

import { BOOK_COPY, type BookSlug } from "@/lib/book-promo";

/**
 * The book box at the foot of an article.
 *
 * The compact shape the leadership articles already used: a rule, a question,
 * the book in italics, what it covers, and a link. Not the longer "The book
 * this comes from" section the dating articles carry, because that one opens
 * by naming the chapter the article was drawn from, which is only true where
 * somebody wrote it by hand.
 */
export default function BookPromo({ book }: { book: BookSlug }) {
  const copy = BOOK_COPY[book];

  return (
    <aside className="mt-14 border-t border-[#E5D9C7] pt-8">
      <p className="text-lg leading-relaxed">
        <strong className="font-medium text-[#2B2118]">{copy.hook}</strong>{" "}
        <em>{copy.title}</em> is {copy.body}{" "}
        <Link
          href={`/guides/${book}`}
          className="font-medium text-[#8B5E34] underline underline-offset-4 transition-colors hover:text-[#2B2118]"
        >
          Read more about the guide →
        </Link>
      </p>
    </aside>
  );
}
