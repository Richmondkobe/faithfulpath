import type { Metadata } from "next";

import NotFoundPage from "@/components/NotFoundPage";

export const metadata: Metadata = {
  title: "Page not found | Faithful Path Community",
  robots: { index: false, follow: false },
};

/**
 * The site's 404. Before this the bare Next.js default was served, which is
 * unstyled and offers a reader nothing to do next.
 */
export default function NotFound() {
  return <NotFoundPage />;
}
