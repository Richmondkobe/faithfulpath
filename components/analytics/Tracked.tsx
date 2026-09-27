"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";
import type { ReactNode } from "react";

/**
 * The funnel buttons, wrapped so they can report a click.
 *
 * The pages these sit on are Server Components, and track() runs in the
 * browser, so the button itself has to be a Client Component. Each one takes
 * only an event name and, at most, a slug: no form contents, no email address,
 * no intake answer, nothing a person typed. A slug is a page identifier, the
 * same one already in the URL.
 */
type Props = {
  event: string;
  slug?: string;
  className?: string;
  children: ReactNode;
};

const send = (event: string, slug?: string) =>
  track(event, slug ? { slug } : undefined);

/** An external link — the booking page, or the sample PDF. */
export function TrackedAnchor({
  href,
  target,
  rel,
  event,
  slug,
  className,
  children,
}: Props & { href: string; target?: string; rel?: string }) {
  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={className}
      onClick={() => send(event, slug)}
    >
      {children}
    </a>
  );
}

/** An internal link. */
export function TrackedLink({ href, event, slug, className, children }: Props & { href: string }) {
  return (
    <Link href={href} className={className} onClick={() => send(event, slug)}>
      {children}
    </Link>
  );
}

/**
 * A form's submit button. The click is reported and the submit proceeds — the
 * event is not awaited, so a slow or blocked analytics request cannot delay or
 * prevent a purchase.
 */
export function TrackedSubmit({ event, slug, className, children }: Props) {
  return (
    <button type="submit" className={className} onClick={() => send(event, slug)}>
      {children}
    </button>
  );
}
