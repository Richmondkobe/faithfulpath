import { notFound } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import { FINISH_FIRST, SERIES_LISTED, SERIES_PATH, findCourse, offersOpenCourse, tabTitle } from "@/lib/following-jesus";
import { getLearner, getOwnedOffers } from "@/lib/following-jesus-access";
import { getCourseProgress } from "@/lib/fj-progress";
import { htmlResponse, linkSupportPages, readCoursePage, websitePage } from "@/lib/fj-html";
import { welcomePage } from "@/lib/fj-welcome";

/**
 * A course's welcome page. Public, so anyone can see what the course is before
 * buying; under it, the ways to buy and the sign-in, or the owner's way in.
 *
 * A route handler rather than a page: the reviewed HTML is a whole document,
 * and serving it as one keeps it exactly as approved — and keeps the site
 * layout, with its analytics, off it entirely.
 */
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/courses/following-jesus/[course]">
) {
  const { course: slug } = await ctx.params;
  const course = findCourse(slug);
  if (!course) notFound();
  // Establish, Grow and Multiply are on the series page as "Coming soon".
  if (!course.launched) return NextResponse.redirect(new URL(SERIES_PATH, request.url), 307);

  const learner = await getLearner();
  const offers = learner ? await getOwnedOffers() : new Set<never>();
  const progress = learner && offersOpenCourse(offers, course) ? await getCourseProgress(course) : null;

  const page = websitePage(await readCoursePage(course, "welcome.html"), {
    title: tabTitle(course.fullTitle),
    // Search engines may list a course page only once both the series and
    // the course are switched on.
    indexable: SERIES_LISTED && course.listed,
  });
  const html = linkSupportPages(page, course);
  return htmlResponse(welcomePage(html, course, learner, offers, progress, {
      finishFirst: request.nextUrl.searchParams.has(FINISH_FIRST),
    }));
}
