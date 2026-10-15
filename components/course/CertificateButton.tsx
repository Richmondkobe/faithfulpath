import Link from "next/link";

/**
 * Shown once the course is complete. Without a name there is nothing to print
 * on the certificate, so the button asks for one and goes to the field rather
 * than producing something with a blank line on it.
 */
export default function CertificateButton({
  courseSlug,
  name,
  nameFieldHref,
  className = "",
}: {
  courseSlug: string;
  name: string | null;
  nameFieldHref: string;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-7 py-4 text-[15px] font-medium transition-colors";

  if (!name) {
    return (
      <Link
        href={nameFieldHref}
        className={`${base} border-[1.5px] border-navy text-navy hover:border-gold-text hover:text-gold-text ${className}`}
      >
        Add your name to download your certificate
      </Link>
    );
  }

  return (
    <Link
      href={`/members/courses/${courseSlug}/certificate`}
      className={`${base} bg-gold text-night hover:bg-gold-soft ${className}`}
    >
      Download your certificate
    </Link>
  );
}
