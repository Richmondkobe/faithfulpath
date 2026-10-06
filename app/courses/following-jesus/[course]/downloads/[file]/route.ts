import { notFound } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import { coursePath, findCourse } from "@/lib/following-jesus";
import { learnerWithAccess } from "@/lib/following-jesus-access";
import { signedDownload } from "@/lib/fj-storage";

/**
 * A course PDF — a chapter, a worksheet or the Leader's Guide. Buyers are sent
 * on to a signed URL that lasts a minute; anyone else goes back to the ways to
 * buy. The link on the page is this route, never the storage URL, so a copied
 * link only works for someone who has bought the course.
 */
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/courses/following-jesus/[course]/downloads/[file]">
) {
  const { course: courseSlug, file } = await ctx.params;
  const course = findCourse(courseSlug);
  if (!course || !course.launched) notFound();

  if (!(await learnerWithAccess(course))) {
    return NextResponse.redirect(new URL(`${coursePath(course)}#buy`, request.url), 307);
  }

  const url = await signedDownload(course, file);
  if (!url) notFound();

  return NextResponse.redirect(url, {
    status: 307,
    headers: { "Cache-Control": "private, no-store" },
  });
}
