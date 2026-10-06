import type { NextRequest } from "next/server";

/**
 * Whether a POST came from a page on this site. The Following Jesus pages save
 * with fetch() and the browser's cookies, so without this another site could
 * make a signed-in learner's browser write to their account. Browsers send
 * Origin on every cross-site POST; a request without it is not from a page.
 */
export function fromThisSite(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return origin !== null && origin === request.nextUrl.origin;
}
