import { notFound } from "next/navigation";
import { activeMemberLearner, tbymHtmlResponse, findUnit, playerHtml, readUnitFile } from "@/lib/tbym-new";

/** The timed slides, framed by the lesson page. Behind the same check as the page. */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/members/courses/talk-before-you-marry-new/[unit]/player">
) {
  const { unit: slug } = await ctx.params;
  const unit = findUnit(slug);
  if (!unit) notFound();
  if (!(await activeMemberLearner())) return new Response("Sign in to watch this.", { status: 403 });
  return tbymHtmlResponse(playerHtml(unit, await readUnitFile(unit, "player.html")));
}
