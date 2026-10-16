import BooksStore, { booksMetadata } from "@/components/BooksStore";

// Saved and reused, as the book pages are (website audit P3): built at most
// every five minutes rather than on every visit. Saving a book in the admin
// refreshes it at once (app/admin/actions.ts). The category filter,
// /guides?category=…, is served from saved shelf pages by a rewrite in
// next.config.ts (app/guides/shelf/[category]), so this page no longer reads
// the address and can be saved.
export const revalidate = 300;

export const metadata = booksMetadata;

/** The whole store. */
export default function Guides() {
  return <BooksStore />;
}
