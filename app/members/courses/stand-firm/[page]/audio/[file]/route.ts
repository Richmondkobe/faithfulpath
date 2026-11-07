import { NextResponse } from "next/server";
import { activeMemberLearner, findLesson, signedLessonAudio } from "@/lib/stand-firm";

/**
 * A lesson's recording: a short redirect to a signed URL in the private
 * bucket, made fresh each time, so a page left open for an hour still plays.
 */
export async function GET(_request: Request, ctx: RouteContext<"/members/courses/stand-firm/[page]/audio/[file]">) {
  const { page: slug, file } = await ctx.params;
  const lesson = findLesson(slug);
  if (!lesson) return new Response("Not found.", { status: 404 });
  if (!(await activeMemberLearner())) return new Response("Sign in to listen.", { status: 403 });

  const url = await signedLessonAudio(lesson, file);
  if (!url) return new Response("This recording is not available just now.", { status: 404 });
  return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "private, no-store" } });
}
