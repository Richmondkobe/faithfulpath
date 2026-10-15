import { NextResponse, type NextRequest } from "next/server";
import { RESET_NEW_PATH } from "@/lib/reset-new";
import { RESET_SLUG } from "@/lib/reset-simple-links";

/**
 * The retired Reset edition's two PDFs, its workbook and session guide
 * (Richmond, 15 October 2026). The current edition has a workbook for each
 * session instead, so both open its course page, where those are.
 */
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/members/courses/[courseSlug]/downloads/[downloadSlug]">
) {
  const { courseSlug } = await ctx.params;
  if (courseSlug !== RESET_SLUG) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.redirect(new URL(RESET_NEW_PATH, request.url), 308);
}
