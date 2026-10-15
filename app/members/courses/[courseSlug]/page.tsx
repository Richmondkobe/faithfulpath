import { notFound, redirect } from "next/navigation";
import { RESET_NEW_PATH } from "@/lib/reset-new";
import { RESET_SLUG } from "@/lib/reset-simple-links";

/**
 * The previous edition of The Christian Spiritual Reset, retired on 11 October
 * 2026. Its course page now only sends visitors to the current edition. Every
 * other course has a folder of its own, so this answers for no other course.
 *
 * Still served under this address, and kept: the certificate a member earned
 * (certificate/route.ts), and the previous edition's downloads and resources.
 */
export default async function RetiredCourse({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  if (courseSlug === RESET_SLUG) redirect(RESET_NEW_PATH);
  notFound();
}
