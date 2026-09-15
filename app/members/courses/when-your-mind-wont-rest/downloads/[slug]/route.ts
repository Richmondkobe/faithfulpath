import { readFile } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { getSessionEmail } from "@/lib/auth";
import { getMemberByEmail, isActive } from "@/lib/members";
import { coursePath, findDownload } from "@/lib/mind-course";

/**
 * The Course Journal and Practical Toolkit.
 *
 * Member-gated, and served from the content folder so this check stands
 * between the file and the reader. Linked from the Welcome page, the course
 * home and Lesson 20.
 */
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/members/courses/when-your-mind-wont-rest/downloads/[slug]">
) {
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.redirect(new URL("/membership", request.url), 307);
  }

  const member = await getMemberByEmail(email);
  if (!isActive(member)) {
    return NextResponse.redirect(new URL("/membership", request.url), 307);
  }

  const { slug } = await ctx.params;
  const download = findDownload(slug);
  if (!download) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const pdf = await readFile(coursePath(download.file));
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.byteLength),
      "Content-Disposition": `attachment; filename="${slug}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
