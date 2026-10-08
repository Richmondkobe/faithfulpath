import { requireActiveMember } from "@/lib/member-gate";
import { NextResponse } from "next/server";
import { readDownload } from "@/lib/reset-new";

/** A chapter, session or worksheet PDF of the test edition. Members only. */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/members/courses/christian-spiritual-reset-new/downloads/[file]">
) {
  // Signed out goes to /membership; a lapsed membership to /members, which explains it.
  await requireActiveMember();
  const { file } = await ctx.params;
  const pdf = await readDownload(file);
  if (!pdf) return new Response("Not found.", { status: 404 });
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.byteLength),
      "Content-Disposition": `attachment; filename="spiritual-reset-${file}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
