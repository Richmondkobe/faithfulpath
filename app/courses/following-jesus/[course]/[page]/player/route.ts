import { notFound } from "next/navigation";
import { findCourse, findLesson } from "@/lib/following-jesus";
import { learnerWithAccess } from "@/lib/following-jesus-access";
import { htmlResponse } from "@/lib/fj-html";
import { playerPage } from "@/lib/fj-lessons";
import { signedLessonAudio } from "@/lib/fj-storage";

/**
 * A lesson's timed slides, framed by the lesson page. Behind the same check as
 * the lesson: the signed URL for the recording is only ever written into a
 * page a buyer asked for.
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/courses/following-jesus/[course]/[page]/player">
) {
  const { course: courseSlug, page } = await ctx.params;
  const course = findCourse(courseSlug);
  const lesson = course?.launched ? findLesson(course, page) : null;
  if (!course || !lesson) notFound();

  if (!(await learnerWithAccess(course))) {
    return new Response("Sign in to watch this lesson.", { status: 403 });
  }

  const audio = await signedLessonAudio(course, lesson);
  if (!audio) {
    console.error(`No recording in storage for ${course.key} ${lesson.slug}.`);
    return new Response("This recording is not available just now. Please try again later.", { status: 503 });
  }

  return htmlResponse(await playerPage(course, lesson, audio), { cache: "private" });
}
