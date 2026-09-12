import { readFile } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { getSessionEmail } from "@/lib/auth";
import { getMemberByEmail, isActive } from "@/lib/members";
import { downloadPath, getDownload } from "@/lib/course";

/**
 * Streams a course PDF to a member.
 *
 * The files sit in the content folder rather than public/ precisely so that
 * this check stands between them and the reader — anything under public/ is a
 * plain URL that works for anyone who is given it, membership or not.
 *
 * A signed-out request is redirected to /membership rather than refused, so the
 * link still leads somewhere useful if it is shared or bookmarked.
 */
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/members/courses/[courseSlug]/downloads/[downloadSlug]">
) {
  const membership = new URL("/membership", request.url);

  const email = await getSessionEmail();
  if (!email) return NextResponse.redirect(membership, 307);

  const member = await getMemberByEmail(email);
  if (!isActive(member)) return NextResponse.redirect(membership, 307);

  const { courseSlug, downloadSlug } = await ctx.params;
  const meta = getDownload(courseSlug, downloadSlug);
  const path = downloadPath(courseSlug, downloadSlug);
  if (!meta || !path) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const file = await readFile(path);
  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(file.byteLength),
      "Content-Disposition": `attachment; filename="${downloadSlug}.pdf"`,
      // A member's own copy, never a shared cache.
      "Cache-Control": "private, no-store",
    },
  });
}
