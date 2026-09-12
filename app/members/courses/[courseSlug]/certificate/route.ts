import { NextResponse, type NextRequest } from "next/server";
import { getSessionEmail } from "@/lib/auth";
import { getMemberByEmail, isActive } from "@/lib/members";
import { getCourse, getLessons } from "@/lib/course";
import { getCompletion } from "@/lib/course-progress";
import { buildCertificate } from "@/lib/certificate";

/**
 * The completion certificate, generated on request.
 *
 * Nothing is stored: the PDF is built from the member's own completion record
 * each time, so it cannot exist for someone who has not finished, and a name
 * change is reflected the next time they download it.
 */
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/members/courses/[courseSlug]/certificate">
) {
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.redirect(new URL("/membership", request.url), 307);
  }

  const member = await getMemberByEmail(email);
  if (!isActive(member)) {
    return NextResponse.redirect(new URL("/membership", request.url), 307);
  }

  const { courseSlug } = await ctx.params;
  const course = getCourse(courseSlug);
  const lessons = getLessons(courseSlug);
  if (!course || lessons.length === 0) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const completion = await getCompletion(
    courseSlug,
    lessons[lessons.length - 1].slug
  );

  // Not finished, or no name to print: send them to the course rather than
  // refusing outright, since both are things they can put right.
  if (!completion.complete || !completion.name) {
    return NextResponse.redirect(
      new URL(`/members/courses/${courseSlug}`, request.url),
      307
    );
  }

  const pdf = await buildCertificate({
    name: completion.name,
    completedOn: completion.finishedAt ? new Date(completion.finishedAt) : new Date(),
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.byteLength),
      "Content-Disposition": `attachment; filename="${courseSlug}-certificate.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
