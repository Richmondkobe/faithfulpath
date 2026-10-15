import { notFound, redirect } from "next/navigation";
import { RESET_NEW_PATH } from "@/lib/reset-new";
import { RESET_SLUG } from "@/lib/reset-simple-links";

/** A lesson of the retired Reset edition: sends visitors to the current edition. */
export default async function RetiredLesson({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  if (courseSlug === RESET_SLUG) redirect(RESET_NEW_PATH);
  notFound();
}
