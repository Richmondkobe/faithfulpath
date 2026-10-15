import { requireActiveMember } from "@/lib/member-gate";
import { notFound } from "next/navigation";
import { tbymHtmlResponse, findUnit, getCompleted, readUnitFile, unitHtml } from "@/lib/tbym-new";

/** A lesson page of the test edition. Members only. */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/members/courses/talk-before-you-marry-new/[unit]">
) {
  const { unit: slug } = await ctx.params;
  const unit = findUnit(slug);
  if (!unit) notFound();
  await requireActiveMember();
  return tbymHtmlResponse(unitHtml(unit, await readUnitFile(unit, "page.html"), await getCompleted()));
}
