import { NextResponse, type NextRequest } from "next/server";
import { fromThisSite } from "@/lib/fj-request";
import { activeMemberLearner } from "@/lib/reset-new";
import { getPlan, savePlan } from "@/lib/reset-new-plan";

/*
 * "Confirm my retreat plan" on Session 1: read and save the member's own plan.
 * Members only; saving only from this site's pages. Session 1 is the only unit
 * with the plan box.
 */
const NO_STORE = { "Cache-Control": "private, no-store" };
type Ctx = RouteContext<"/members/courses/christian-spiritual-reset-new/[unit]/plan">;

async function member(ctx: Ctx) {
  const { unit } = await ctx.params;
  if (unit !== "session-01") return { error: NextResponse.json({ error: "Not found." }, { status: 404 }) };
  const learner = await activeMemberLearner();
  if (!learner) return { error: NextResponse.json({ error: "Not signed in." }, { status: 403 }) };
  return { learner };
}

export async function GET(_request: NextRequest, ctx: Ctx) {
  const m = await member(ctx);
  if ("error" in m) return m.error;
  try {
    return NextResponse.json({ plan: await getPlan() }, { headers: NO_STORE });
  } catch (err) {
    console.error("Could not load the retreat plan:", err);
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
  const plan = body && typeof body === "object" ? (body as { plan?: unknown }).plan : undefined;
  try {
    if ((await savePlan(m.learner, plan)) === "invalid") return NextResponse.json({ error: "Not understood." }, { status: 400 });
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (err) {
    console.error("Could not save the retreat plan:", err);
    return NextResponse.json({ error: "Could not save." }, { status: 500, headers: NO_STORE });
  }
}
