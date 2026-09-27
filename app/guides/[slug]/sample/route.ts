import { notFound } from "next/navigation";

import { getPublishedProductBySlug } from "@/lib/products-db";
import { supabaseAdmin, samplePath } from "@/lib/supabase/admin";
import { COVERS_BUCKET } from "@/lib/storage";

/**
 * The free sample of a book, streamed from our own domain.
 *
 * The file itself is in the public covers bucket, so it could be linked
 * directly — but a Supabase public object is served with Supabase's headers, and
 * X-Robots-Tag cannot be added to them. A sample that is the first chapter of a
 * book we sell should not be competing with the book's own page in search
 * results, so it is served from here instead, with the header set.
 *
 * Inline rather than as an attachment: a reader who wants a look should get a
 * look, not a file in their downloads folder.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Only for a book that is actually on sale, so an unpublished draft's sample
  // cannot be fetched by guessing the slug.
  const guide = await getPublishedProductBySlug(slug);
  if (!guide) notFound();

  const { data, error } = await supabaseAdmin.storage
    .from(COVERS_BUCKET)
    .download(samplePath(slug));
  if (error || !data) notFound();

  return new Response(await data.arrayBuffer(), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${slug}-sample.pdf"`,
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
