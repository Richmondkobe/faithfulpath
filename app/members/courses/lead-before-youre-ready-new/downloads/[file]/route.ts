import { NextResponse } from "next/server";
import { requireActiveMember } from "@/lib/member-gate";
import { requireLbyrNewOpen, signedDownload } from "@/lib/lbyr-new";

/** The Leader's Guide PDF: a redirect to a one-minute signed URL in the private bucket. Members only. */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/members/courses/lead-before-youre-ready-new/downloads/[file]">
) {
  requireLbyrNewOpen();
  // Signed out goes to /membership; a lapsed membership to /members, which explains it.
  await requireActiveMember();
  const { file } = await ctx.params;
  const url = await signedDownload(file);
  if (!url) return new Response("This download is not available just now.", { status: 404 });
  return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "private, no-store" } });
}
