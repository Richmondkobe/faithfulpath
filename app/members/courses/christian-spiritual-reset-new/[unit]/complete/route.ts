import { NextResponse, type NextRequest } from "next/server";
import { fromThisSite } from "@/lib/fj-request";
import { activeMemberLearner, completeUnit, findUnit } from "@/lib/reset-new";

/** "✓ I have completed …": saves to this edition's progress only. Members only, from this site's pages only. */
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/members/courses/christian-spiritual-reset-new/[unit]/complete">
) {
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
    console.error("Could not complete Reset unit:", err);
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }
}
