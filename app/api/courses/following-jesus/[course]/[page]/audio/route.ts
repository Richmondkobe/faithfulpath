import { NextResponse } from "next/server";
import { findCourse, findLesson } from "@/lib/following-jesus";
import { learnerWithAccess } from "@/lib/following-jesus-access";
import { signedLessonAudio } from "@/lib/fj-storage";

/**
 * A fresh signed URL for a lesson's recording, for the player to pick up when
 * the one in the page has lapsed. Buyers only, like the page itself.
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/courses/following-jesus/[course]/[page]/audio">
) {
  const { course: courseSlug, page } = await ctx.params;
  const course = findCourse(courseSlug);
  const lesson = course?.launched ? findLesson(course, page) : null;
  if (!course || !lesson) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (!(await learnerWithAccess(course))) {
    return NextResponse.json({ error: "Not signed in to this course." }, { status: 403 });
  }

  const url = await signedLessonAudio(course, lesson);
  if (!url) return NextResponse.json({ error: "Not available." }, { status: 503 });

  return NextResponse.json({ url }, { headers: { "Cache-Control": "private, no-store" } });
}
