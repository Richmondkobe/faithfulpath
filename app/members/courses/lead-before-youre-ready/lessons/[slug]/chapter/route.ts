import { notFound } from "next/navigation";

import { requireActiveMember } from "@/lib/member-gate";
import { LBYR_LESSON_COUNT, requireLbyrPublished } from "@/lib/lbyr-course";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { GUIDES_BUCKET } from "@/lib/storage";

/**
 * The book chapter a lesson was drawn from, served to a signed-in member.
 *
 * The book's own pages rather than a reconstruction of them: the chapters carry
 * italicised Greek and Hebrew and two tables, none of which survives text
 * extraction, and there is no reviewed copy to check a rebuild against. These
 * are cut from the book by scripts/build-lbyr-chapters.mjs.
 *
 * They live in the private guides bucket, beside the book. The store's free
 * samples are public on purpose; a chapter is what the book is sold for, so it
 * is streamed from here and reachable no other way. The membership check and
 * the publish gate both apply, and the response says noindex.
 *
 * Inline, not an attachment: a reader following "Read Chapter 3" wants to read
 * it, not to find it in their downloads.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  await requireActiveMember();
  requireLbyrPublished();

  const { slug } = await params;
  const order = Number(slug);
  if (!Number.isInteger(order) || order < 1 || order > LBYR_LESSON_COUNT) notFound();

  const path = `lead-before-youre-ready/chapters/chapter-${String(order).padStart(2, "0")}.pdf`;
  const { data, error } = await supabaseAdmin.storage.from(GUIDES_BUCKET).download(path);
  if (error || !data) notFound();

  return new Response(await data.arrayBuffer(), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="lead-before-youre-ready-chapter-${String(order).padStart(2, "0")}.pdf"`,
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "private, max-age=600",
    },
  });
}
