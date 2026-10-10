import { NextResponse, type NextRequest } from "next/server";
import { fromThisSite } from "@/lib/fj-request";
import { activeMemberLearner } from "@/lib/reset-new";
import { deleteReview, getReview, saveReview } from "@/lib/reset-new-review";

/*
 * My Day 30 Review on Lesson 16: read, save (part or all), and delete the
 * member's own review. Members only; saving and deleting only from this site's
 * pages. Lesson 16 is the only unit with a review.
 */
const NO_STORE = { "Cache-Control": "private, no-store" };
type Ctx = RouteContext<"/members/courses/christian-spiritual-reset-new/[unit]/review">;

async function member(ctx: Ctx) {
  const { unit } = await ctx.params;
  if (unit !== "lesson-16") return { error: NextResponse.json({ error: "Not found." }, { status: 404 }) };
  const learner = await activeMemberLearner();
  if (!learner) return { error: NextResponse.json({ error: "Not signed in." }, { status: 403 }) };
  return { learner };
}

export async function GET(_request: NextRequest, ctx: Ctx) {
  const m = await member(ctx);
  if ("error" in m) return m.error;
  try {
    return NextResponse.json(await getReview(), { headers: NO_STORE });
  } catch (err) {
    console.error("Could not load Day 30 Review:", err);
    return NextResponse.json({ error: "Could not load." }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest, ctx: Ctx) {
  if (!fromThisSite(request)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  const m = await member(ctx);
  if ("error" in m) return m.error;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Not understood." }, { status: 400 });
  }
  const changes = body && typeof body === "object" ? (body as { changes?: unknown }).changes : undefined;
  try {
    const result = await saveReview(m.learner, changes);
    if (result === "invalid") return NextResponse.json({ error: "Not understood." }, { status: 400 });
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (err) {
    console.error("Could not save Day 30 Review:", err);
    return NextResponse.json({ error: "Could not save." }, { status: 500, headers: NO_STORE });
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  if (!fromThisSite(request)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  const m = await member(ctx);
  if ("error" in m) return m.error;
  try {
    await deleteReview(m.learner);
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (err) {
    console.error("Could not delete Day 30 Review:", err);
    return NextResponse.json({ error: "Could not delete." }, { status: 500, headers: NO_STORE });
  }
}
