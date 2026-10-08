import { NextResponse, type NextRequest } from "next/server";
import { activeMemberLearner, findUnit, signedUnitAudio } from "@/lib/reset-new";

/**
 * One of a unit's recordings: a short redirect to a signed URL in the private
 * bucket, made fresh each time, so a page left open for an hour still plays.
 * ?download=1 asks the browser to save it (the one-file guided silence).
 */
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/members/courses/christian-spiritual-reset-new/[unit]/audio/[file]">
) {
  const { unit: slug, file } = await ctx.params;
  const unit = findUnit(slug);
  if (!unit) return new Response("Not found.", { status: 404 });
  if (!(await activeMemberLearner())) return new Response("Sign in to listen.", { status: 403 });

  const url = await signedUnitAudio(unit, file, request.nextUrl.searchParams.has("download"));
  if (!url) return new Response("This recording is not available just now.", { status: 404 });
  return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "private, no-store" } });
}
