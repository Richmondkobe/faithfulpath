import { requireActiveMember } from "@/lib/member-gate";
import { notFound } from "next/navigation";
import { findUnit, getCompleted, readUnitFile, resetHtmlResponse, unitHtml } from "@/lib/reset-new";

/** A lesson or session page of the test edition. Members only. */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/members/courses/christian-spiritual-reset-new/[unit]">
) {
  const { unit: slug } = await ctx.params;
  const unit = findUnit(slug);
  if (!unit) notFound();
  // Signed out goes to /membership; a lapsed membership to /members, which explains it.
  await requireActiveMember();
  return resetHtmlResponse(unitHtml(unit, await readUnitFile(unit, "page.html"), await getCompleted()));
}
