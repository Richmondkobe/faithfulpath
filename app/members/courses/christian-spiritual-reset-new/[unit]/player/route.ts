import { notFound } from "next/navigation";
import { activeMemberLearner, findUnit, playerHtml, readUnitFile, resetHtmlResponse } from "@/lib/reset-new";

/** The timed slides, framed by the unit page. Behind the same check as the page. */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/members/courses/christian-spiritual-reset-new/[unit]/player">
) {
  const { unit: slug } = await ctx.params;
  const unit = findUnit(slug);
  if (!unit) notFound();
  if (!(await activeMemberLearner())) return new Response("Sign in to watch this.", { status: 403 });
  return resetHtmlResponse(playerHtml(unit, await readUnitFile(unit, "player.html")));
}
