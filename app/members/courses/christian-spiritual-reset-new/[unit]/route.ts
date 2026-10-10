import { requireActiveMember } from "@/lib/member-gate";
import { notFound } from "next/navigation";
import { findGuide, findUnit, getCompleted, guideHtml, readGuideFile, readUnitFile, resetHtmlResponse, unitHtml } from "@/lib/reset-new";

/** A lesson or session page of the test edition, or one of its guide pages. Members only. */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/members/courses/christian-spiritual-reset-new/[unit]">
) {
  const { unit: slug } = await ctx.params;
  const unit = findUnit(slug);
  const guide = unit ? null : findGuide(slug);
  if (!unit && !guide) notFound();
  // Signed out goes to /membership; a lapsed membership to /members, which explains it.
  await requireActiveMember();
  if (guide) return resetHtmlResponse(guideHtml(guide, await readGuideFile(guide)));
  if (!unit) notFound();
  return resetHtmlResponse(unitHtml(unit, await readUnitFile(unit, "page.html"), await getCompleted()));
}
