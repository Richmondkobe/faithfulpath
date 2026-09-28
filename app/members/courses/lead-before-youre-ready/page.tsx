import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireActiveMember } from "@/lib/member-gate";
import { getCourseProgress } from "@/lib/course-progress";
import {
  LBYR_LESSON_COUNT,
  LBYR_SLUG,
  lbyrLessonHref,
  lbyrLessonSlug,
  lbyrStartHereHref,
  requireLbyrPublished,
} from "@/lib/lbyr-course";

export const metadata: Metadata = {
  title: "Lead Before You’re Ready | Faithful Path Community",
  robots: { index: false, follow: false },
};

/**
 * The course's entry point from the members' area.
 *
 * A member who has not started goes to Start Here. One who has goes straight to
 * their next unfinished lesson — the same fix made on When Your Mind Won't
 * Rest, so returning does not mean walking past a welcome page every time.
 */
export default async function LbyrCourse() {
  await requireActiveMember();
  requireLbyrPublished();

  const progress = await getCourseProgress(LBYR_SLUG);
  const done = (n: number) => Boolean(progress.get(lbyrLessonSlug(n))?.completed_at);

  const started = Array.from({ length: LBYR_LESSON_COUNT }, (_, i) => i + 1).some(done);
  if (!started) redirect(lbyrStartHereHref);

  const next = Array.from({ length: LBYR_LESSON_COUNT }, (_, i) => i + 1).find(
    (n) => !done(n)
  );
  redirect(next ? lbyrLessonHref(next) : lbyrStartHereHref);
}
