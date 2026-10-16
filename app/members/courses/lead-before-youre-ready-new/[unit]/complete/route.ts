import { NextResponse, type NextRequest } from "next/server";
import { fromThisSite } from "@/lib/fj-request";
import { activeMemberLearner, completeUnit, findUnit, lbyrNewOpen } from "@/lib/lbyr-new";

/**
 * "I have completed this lesson": saves to this edition's progress only.
 * Members only, from this site's pages only. The request has no body: nothing
 * typed on the page is sent, and nothing about it is logged.
 */
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/members/courses/lead-before-youre-ready-new/[unit]/complete">
) {
  if (!lbyrNewOpen()) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!fromThisSite(request)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  const { unit: slug } = await ctx.params;
  const unit = findUnit(slug);
  if (!unit) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const learner = await activeMemberLearner();
  if (!learner) return NextResponse.json({ error: "Not signed in." }, { status: 403 });
  try {
    await completeUnit(learner, unit);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("Could not complete Lead Before You're Ready lesson:", err);
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }
}
