import { requireActiveMember } from "@/lib/member-gate";
import { notFound } from "next/navigation";
import { bysyHtmlResponse, findUnit, getCompleted, readUnitFile, unitHtml } from "@/lib/bysy-new";

/** A lesson page of the test edition. Members only. */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/members/courses/before-you-say-yes-new/[unit]">
) {
  const { unit: slug } = await ctx.params;
  const unit = findUnit(slug);
  if (!unit) notFound();
  await requireActiveMember();
  return bysyHtmlResponse(unitHtml(unit, await readUnitFile(unit, "page.html"), await getCompleted()));
}
