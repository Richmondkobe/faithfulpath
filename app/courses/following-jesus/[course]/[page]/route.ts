import { notFound } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import { coursePath, findCourse, findLesson } from "@/lib/following-jesus";
import { learnerWithAccess } from "@/lib/following-jesus-access";
import { htmlResponse } from "@/lib/fj-html";
import { completionPage, lessonPage } from "@/lib/fj-lessons";

/**
 * A lesson (lesson-01 … lesson-08) or the completion page. For buyers only:
 * anyone else, signed in or not, goes back to the welcome page's ways to buy,
 * which also has the sign-in.
 */
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/courses/following-jesus/[course]/[page]">
) {
  const { course: courseSlug, page } = await ctx.params;
  const course = findCourse(courseSlug);
  if (!course || !course.launched) notFound();

  const lesson = findLesson(course, page);
  const isCompletion = course.completionPage?.slug === page;
  if (!lesson && !isCompletion) notFound();

  const learner = await learnerWithAccess(course);
  if (!learner) {
    return NextResponse.redirect(new URL(`${coursePath(course)}#buy`, request.url), 307);
  }

  const html = lesson ? await lessonPage(course, lesson) : await completionPage(course);
  return htmlResponse(html, { cache: "private" });
}
