import { NextResponse, type NextRequest } from "next/server";
import { fromThisSite } from "@/lib/fj-request";
import { activeMemberLearner, completeUnit, findUnit, getCompleted } from "@/lib/reset-new";
import { recordAcks } from "@/lib/reset-new-plan";

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
    // The dated record on the course page. A failure here never undoes the completion;
    // the course page tries again when it is next opened.
    try {
      await recordAcks(learner, await getCompleted());
    } catch (err) {
      console.error("Could not record the Reset acknowledgement:", err);
    }
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("Could not complete Reset unit:", err);
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }
}
