import type { Metadata } from "next";

import NotFoundPage from "@/components/NotFoundPage";

export const metadata: Metadata = {
  title: "Page not found | Faithful Path Community",
  robots: { index: false, follow: false },
};

/**
 * Where proxy.ts sends the retired Zyro URLs, rewriting to here with a 410.
 *
 * It renders the site's not-found page, and deliberately does not call
 * notFound(): notFound() sets its own 404 and overrides the 410 the rewrite
 * carries, which defeats the point. Verified by testing the built server —
 * with notFound() these paths answered 404, without it they answer 410.
 *
 * Not linked from anywhere. Reached directly it is an ordinary 200, which is
 * why it is marked noindex.
 */
export default function Gone() {
  return <NotFoundPage />;
}
