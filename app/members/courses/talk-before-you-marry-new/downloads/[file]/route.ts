import { requireActiveMember } from "@/lib/member-gate";
import { NextResponse } from "next/server";
import { readDownload } from "@/lib/tbym-new";

/** The Talk Before You Marry Leader's Guide PDF. Members only. */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/members/courses/talk-before-you-marry-new/downloads/[file]">
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
      "Content-Disposition": `attachment; filename="talk-before-you-marry-${file}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
