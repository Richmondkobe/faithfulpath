import { notFound } from "next/navigation";
import {
  activeMemberLearner,
  findUnit,
  lbyrHtmlResponse,
  playerHtml,
  readUnitFile,
  requireLbyrNewOpen,
  unitAdded,
} from "@/lib/lbyr-new";

/** The timed slides, framed by the lesson page. Behind the same check as the page. */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/members/courses/lead-before-youre-ready-new/[unit]/player">
) {
  requireLbyrNewOpen();
  const { unit: slug } = await ctx.params;
  const unit = findUnit(slug);
  if (!unit || !unitAdded(unit)) notFound();
  if (!(await activeMemberLearner())) return new Response("Sign in to watch this.", { status: 403 });
  return lbyrHtmlResponse(playerHtml(unit, await readUnitFile(unit, "player.html")));
}
