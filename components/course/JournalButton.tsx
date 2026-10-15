import Link from "next/link";

/**
 * "Download my journal (PDF)". A plain link to the route handler, which builds
 * the document from the member's own rows — so it works without JavaScript and
 * there is nothing to keep in sync on the client.
 */
export default function JournalButton({
  variant = "secondary",
  className = "",
}: {
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-7 py-4 text-[15px] font-medium transition-colors";
  const look =
    variant === "primary"
      ? "bg-gold text-night hover:bg-gold-soft"
      : "border-[1.5px] border-navy text-navy hover:border-gold-text hover:text-gold-text";

  return (
    <Link href="/members/journal/download" prefetch={false} className={`${base} ${look} ${className}`}>
      Download my journal (PDF)
    </Link>
  );
}
