import type { Metadata } from "next";

import NotFoundPage from "@/components/NotFoundPage";

export const metadata: Metadata = {
  title: "Page not found",
  // No robots setting: Next already marks every 404 noindex, and a second tag
  // only repeated it (website audit S14).
};

/**
 * The site's 404. Before this the bare Next.js default was served, which is
 * unstyled and offers a reader nothing to do next.
 */
export default function NotFound() {
  return <NotFoundPage />;
}
