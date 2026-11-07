import { notFound } from "next/navigation";
import { activeMemberLearner, findLesson, playerHtml, readLessonFile, sfHtmlResponse } from "@/lib/stand-firm";

/** The slides and narration, framed by the lesson page. Behind the same check as the page. */
export async function GET(_request: Request, ctx: RouteContext<"/members/courses/stand-firm/[page]/player">) {
  const { page: slug } = await ctx.params;
  const lesson = findLesson(slug);
  if (!lesson) notFound();
  if (!(await activeMemberLearner())) return new Response("Sign in to watch this.", { status: 403 });
  return sfHtmlResponse(playerHtml(lesson, await readLessonFile(lesson, "player.html")));
}
