import { NextResponse, type NextRequest } from "next/server";
import { getSessionEmail } from "@/lib/auth";
import { getMemberByEmail, isActive } from "@/lib/members";
import { getMindCourse, getCountingLessons } from "@/lib/mind-course";
import { getFinishedLessons, getPageAnswers, CERT_NAME_INDEX } from "@/lib/mind-progress";
import { buildMindCertificate } from "@/lib/mind-certificate";
import { MIND_BASE, slugFromFile } from "@/lib/mind-links";

/**
 * The foundation certificate.
 *
 * Eligibility is the twenty-one lessons marked finished, and nothing else.
 * Module 0, the pauses, the Pattern Finder, journal answers, worksheets,
 * next-faithful-step responses and the whole of Module 5 are all excluded —
 * this handler never reads any of them, which is the surest way for them not
 * to count.
 *
 * Nothing is stored: the PDF is built from the member's record each time, so a
 * name corrected today appears on the next download.
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

  const lessons = getCountingLessons();
  const finished = await getFinishedLessons();
  const outstanding = lessons.filter((l) => !finished.get(slugFromFile(l.file))?.finished);

  // Not finished, or no name to print: send them back to the course, since
  // both are things they can put right.
  if (outstanding.length > 0) {
    return NextResponse.redirect(new URL(MIND_BASE, request.url), 307);
  }

  const answers = await getPageAnswers("certificate");
  const name = (answers.get(CERT_NAME_INDEX) ?? "").trim();
  if (!name) {
    return NextResponse.redirect(new URL(`${MIND_BASE}#certificate-name`, request.url), 307);
  }

  const course = getMindCourse();
  const completion = course.completion as {
    certificate: { wording: string; footer: string };
  };

  const pdf = await buildMindCertificate({
    name,
    wording: completion.certificate.wording,
    footer: completion.certificate.footer,
    issuedOn: new Date(),
    notice: course.scripture.notice,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.byteLength),
      "Content-Disposition": `attachment; filename="when-your-mind-wont-rest-certificate.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
