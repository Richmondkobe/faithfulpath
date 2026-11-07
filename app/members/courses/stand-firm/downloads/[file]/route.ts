import { NextResponse } from "next/server";
import { requireActiveMember } from "@/lib/member-gate";
import { LEADERS_GUIDE, readLeadersGuide } from "@/lib/stand-firm";

/** The Stand Firm Leader's Guide. Members only; it is not under public/. */
export async function GET(_request: Request, ctx: RouteContext<"/members/courses/stand-firm/downloads/[file]">) {
  // Signed out goes to /membership; a lapsed membership to /members, which explains it.
  await requireActiveMember();
  const { file } = await ctx.params;
  if (file !== LEADERS_GUIDE) return new Response("Not found.", { status: 404 });
  const pdf = await readLeadersGuide();
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.byteLength),
      "Content-Disposition": `attachment; filename="${LEADERS_GUIDE}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
