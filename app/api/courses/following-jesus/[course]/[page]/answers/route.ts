import { NextResponse, type NextRequest } from "next/server";
import { findCourse, findLesson } from "@/lib/following-jesus";
import { learnerWithAccess } from "@/lib/following-jesus-access";
import { readCoursePage } from "@/lib/fj-html";
import { saveAnswers } from "@/lib/fj-answers";
import { pageFields } from "@/lib/fj-answers-page";
import { getCourseProgress } from "@/lib/fj-progress";
import { fromThisSite } from "@/lib/fj-request";

/**
 * Saves a learner's own answers on a lesson or the completion page. Buyers
 * only, only from this site's pages, and only into their own rows (RLS).
 * Nothing here logs what was written.
 */
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/courses/following-jesus/[course]/[page]/answers">
) {
  if (!fromThisSite(request)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const { course: courseSlug, page } = await ctx.params;
  const course = findCourse(courseSlug);
  if (!course || !course.launched) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const lesson = findLesson(course, page);
  const isCompletion = course.completionPage?.slug === page;
  if (!lesson && !isCompletion) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const learner = await learnerWithAccess(course);
  if (!learner) return NextResponse.json({ error: "Not signed in to this course." }, { status: 403 });

  // Closed with the page itself until the course is complete.
  if (isCompletion && !(await getCourseProgress(course)).courseCompletedAt) {
    return NextResponse.json({ error: "Not open yet." }, { status: 403 });
  }

  let changes: unknown;
  try {
    changes = await request.json();
  } catch {
    return NextResponse.json({ error: "Not understood." }, { status: 400 });
  }

  const file = lesson ? `${lesson.slug}/lesson.html` : `${page}.html`;
  const fields = pageFields(await readCoursePage(course, file));

  try {
    const result = await saveAnswers(learner, course, page, fields, changes);
    if (result === "invalid") return NextResponse.json({ error: "Not understood." }, { status: 400 });
    return NextResponse.json({ saved: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("Could not save course answers:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }
}
