import { NextResponse, type NextRequest } from "next/server";
import { getSessionEmail } from "@/lib/auth";
import { getMemberByEmail } from "@/lib/members";
import { getJournal } from "@/lib/journal";
import { getMindJournal } from "@/lib/mind-journal";
import { buildJournalPdf } from "@/lib/journal-pdf";

const COURSE_SLUG = "christian-spiritual-reset";

/**
 * The member's journal as a PDF, built on request.
 *
 * Nothing is stored: it is assembled from the member's own rows each time, and
 * getJournal reads through the cookie-backed client, so RLS — not this handler
 * — is what guarantees a member can only ever export their own entries.
 *
 * Open to any status. A cancelled member keeps what they wrote; only the course
 * itself closes. Editing stays behind requireActiveMember in the save actions.
 */
export async function GET(request: NextRequest) {
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.redirect(new URL("/membership", request.url), 307);
  }

  const member = await getMemberByEmail(email);
  if (!member) {
    return NextResponse.redirect(new URL("/members", request.url), 307);
  }

  // Everything the member has written, whichever course it came from — one
  // document, because it is one journal to them.
  const [reset, mind] = await Promise.all([getJournal(COURSE_SLUG), getMindJournal()]);
  const journals = [reset, mind].filter((j): j is NonNullable<typeof j> => j !== null);
  if (journals.length === 0) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const pdf = await buildJournalPdf({ journals, memberEmail: email });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.byteLength),
      "Content-Disposition": `attachment; filename="faithful-path-journal.pdf"`,
      // A private document assembled per member: never cache it anywhere.
      "Cache-Control": "private, no-store",
    },
  });
}
