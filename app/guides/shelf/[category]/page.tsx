import { notFound } from "next/navigation";
import BooksStore, { booksMetadata } from "@/components/BooksStore";
import { BOOK_CATEGORIES, isBookCategorySlug } from "@/lib/book-categories";

/**
 * One category's shelf of the books store, saved like /guides itself.
 *
 * Visitors never see this address: /guides?category=<slug> is served from it
 * by a rewrite in next.config.ts, so the links people share keep working and
 * the store keeps one canonical address, /guides (from booksMetadata). Only
 * the four categories are built; any other value never reaches here, and
 * /guides shows the whole store for it, as it always has.
 */
export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return BOOK_CATEGORIES.map((c) => ({ category: c.slug }));
}

export const metadata = booksMetadata;

export default async function BookShelf({ params }: PageProps<"/guides/shelf/[category]">) {
  const { category } = await params;
  if (!isBookCategorySlug(category)) notFound();
  return <BooksStore active={category} />;
}
