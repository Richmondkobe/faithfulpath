import { NextResponse, type NextRequest } from "next/server";
import { getSessionEmail } from "@/lib/auth";
import { getMemberByEmail, isActive } from "@/lib/members";
import { getMindCourse } from "@/lib/mind-course";
import {
  getJourneyProgress,
  getPageAnswers,
  CERT_NAME_INDEX,
} from "@/lib/mind-progress";
import { buildMindBadge } from "@/lib/mind-certificate";
import { MIND_BASE, mindJourneyHref } from "@/lib/mind-links";

/**
 * The 30-day badge.
 *
 * Available on request once Day 30 has been visited — visited, not completed.
 * A member who opened Day 30 and chose "Not appropriate for me" has still
 * reached the end of the journey, and the badge says what it means on its face.
 */
export async function GET(request: NextRequest) {
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.redirect(new URL("/membership", request.url), 307);
  }

  const member = await getMemberByEmail(email);
  if (!isActive(member)) {
    return NextResponse.redirect(new URL("/membership", request.url), 307);
  }

  const journey = await getJourneyProgress();
  if (!journey.has(30)) {
    return NextResponse.redirect(new URL(mindJourneyHref(), request.url), 307);
  }

  const answers = await getPageAnswers("certificate");
  const name = (answers.get(CERT_NAME_INDEX) ?? "").trim();
  if (!name) {
    return NextResponse.redirect(new URL(`${MIND_BASE}#certificate-name`, request.url), 307);
  }

  const pdf = await buildMindBadge({
    name,
    issuedOn: new Date(),
    notice: getMindCourse().scripture.notice,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.byteLength),
      "Content-Disposition": `attachment; filename="when-your-mind-wont-rest-30-day-badge.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
