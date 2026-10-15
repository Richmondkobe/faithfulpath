import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The small print under a Buy, Join or Book button, and under the two forms
 * that collect an email address.
 *
 * One component so the wording sits in the same size, colour and measure
 * wherever it appears. It is deliberately quiet: it is there for the reader who
 * looks for it before paying, and it should not compete with the button above
 * it.
 */
export default function FinePrint({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`max-w-md text-[13px] leading-relaxed text-muted ${
        className ?? "mt-3"
      }`}
    >
      {children}
    </p>
  );
}

/** A link inside the small print, in the site's accent. */
export function FinePrintLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-gold-text underline underline-offset-4 transition-colors hover:text-navy"
    >
      {children}
    </Link>
  );
}
