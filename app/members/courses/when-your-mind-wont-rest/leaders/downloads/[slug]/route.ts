import { readFile } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { getSessionEmail } from "@/lib/auth";
import { getMemberByEmail, isActive } from "@/lib/members";
import { coursePath, findLeadersDownload, readPageFile } from "@/lib/mind-course";
import { getPageAnswers, readJson, LEADERS_ACK_INDEX } from "@/lib/mind-progress";
import { mindLeadersHref } from "@/lib/mind-links";

/**
 * The three group downloads: the Group Agreement, the Leader's Checklist and
 * the Leaders' Guidance PDF.
 *
 * All three sit behind the acknowledgement, and the check is here rather than
 * only on the page — a direct URL must not reach them. The files live in the
 * content folder rather than public/ for exactly that reason: anything under
 * public/ is a plain URL that works for anyone given it.
 */
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/members/courses/when-your-mind-wont-rest/leaders/downloads/[slug]">
) {
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.redirect(new URL("/membership", request.url), 307);
  }

  const member = await getMemberByEmail(email);
  if (!isActive(member)) {
    return NextResponse.redirect(new URL("/membership", request.url), 307);
  }

  // The acknowledgement, re-checked on every request.
  const answers = await getPageAnswers("leaders");
  const ack = readJson<{ read_safety_and_safeguarding?: boolean }>(
    answers,
    LEADERS_ACK_INDEX
  );
  if (ack?.read_safety_and_safeguarding !== true) {
    return NextResponse.redirect(new URL(mindLeadersHref(), request.url), 307);
  }

  const { slug } = await ctx.params;
  const file = findLeadersDownload(slug);
  if (!file) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Two of the three are Markdown, which is served as a printable page rather
  // than as a file the browser would only download and not open.
  if (file.endsWith(".md")) {
    const page = readPageFile(file);
    if (!page) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return new NextResponse(page.body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `inline; filename="${slug}.txt"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const pdf = await readFile(coursePath(file));
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.byteLength),
      "Content-Disposition": `attachment; filename="${slug}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
