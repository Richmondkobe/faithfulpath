import { notFound, redirect } from "next/navigation";
import { RESET_NEW_PATH } from "@/lib/reset-new";
import { RESET_SLUG } from "@/lib/reset-simple-links";

/**
 * The retired Reset edition's printable resources (Richmond, 15 October 2026):
 * each opens the lesson of the current edition that now carries it. One with
 * no match opens the course page.
 */
const CURRENT_HOME: Record<string, string> = {
  "digital-boundary-agreement": "lesson-09",
  "retreat-packing-checklist": "lesson-09",
  "emergency-information-card": "lesson-11",
  "testing-worksheet": "lesson-12",
  "two-week-plan": "lesson-13",
  "rule-of-life-template": "lesson-14",
};

export default async function RetiredResource({
  params,
}: {
  params: Promise<{ courseSlug: string; resourceSlug: string }>;
}) {
  const { courseSlug, resourceSlug } = await params;
  if (courseSlug !== RESET_SLUG) notFound();
  const unit = CURRENT_HOME[resourceSlug];
  redirect(unit ? `${RESET_NEW_PATH}/${unit}` : RESET_NEW_PATH);
}
