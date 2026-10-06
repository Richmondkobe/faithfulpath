import { NextResponse, type NextRequest } from "next/server";
import { findCourse, findLesson } from "@/lib/following-jesus";
import { learnerWithAccess } from "@/lib/following-jesus-access";
import { completeLesson } from "@/lib/fj-progress";
import { fromThisSite } from "@/lib/fj-request";

/** "✓ I have completed this lesson". Buyers only, and only from this site's pages. */
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/courses/following-jesus/[course]/[page]/complete">
) {
  if (!fromThisSite(request)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const { course: courseSlug, page } = await ctx.params;
  const course = findCourse(courseSlug);
  const lesson = course?.launched ? findLesson(course, page) : null;
  if (!course || !lesson) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const learner = await learnerWithAccess(course);
  if (!learner) return NextResponse.json({ error: "Not signed in to this course." }, { status: 403 });

  try {
    const result = await completeLesson(learner, course, lesson);
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("Could not complete lesson:", err);
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }
}
