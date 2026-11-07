import { notFound } from "next/navigation";
import { requireActiveMember } from "@/lib/member-gate";
import {
  findLesson,
  findPage,
  getCompleted,
  lessonHtml,
  pageHtml,
  readLessonFile,
  readPageFile,
  sfHtmlResponse,
} from "@/lib/stand-firm";

/** A Stand Firm lesson, or Start Here, How this course works or My Stand Firm Plan. Members only. */
export async function GET(_request: Request, ctx: RouteContext<"/members/courses/stand-firm/[page]">) {
  const { page: slug } = await ctx.params;
  const lesson = findLesson(slug);
  const page = lesson ? null : findPage(slug);
  if (!lesson && !page) notFound();
  // Signed out goes to /membership; a lapsed membership to /members, which explains it.
  await requireActiveMember();
  const completed = await getCompleted();
  if (lesson) return sfHtmlResponse(lessonHtml(lesson, await readLessonFile(lesson, "index.html"), completed));
  if (!page) notFound();
  return sfHtmlResponse(pageHtml(page, await readPageFile(page), completed));
}
