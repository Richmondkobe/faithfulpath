import { notFound } from "next/navigation";
import { requireActiveMember } from "@/lib/member-gate";
import {
  findUnit,
  getCompleted,
  lbyrHtmlResponse,
  readUnitFile,
  requireLbyrNewOpen,
  unitAdded,
  unitHtml,
} from "@/lib/lbyr-new";

/** A lesson page. Members only. */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/members/courses/lead-before-youre-ready-new/[unit]">
) {
  requireLbyrNewOpen();
  const { unit: slug } = await ctx.params;
  const unit = findUnit(slug);
  if (!unit || !unitAdded(unit)) notFound();
  await requireActiveMember();
  return lbyrHtmlResponse(unitHtml(unit, await readUnitFile(unit, "page.html"), await getCompleted()));
}
