import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { SUPPORT_PAGES, findCourse, storageFolder, supportFile } from "@/lib/following-jesus";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { DOWNLOADS_BUCKET } from "@/lib/fj-storage";

/**
 * A Support Page from the course's book, for anyone: no purchase, no sign-in.
 * The lessons name these pages for people who may be in danger, and help is
 * never behind a payment (Richmond, 8 October 2026). Opens in the browser
 * rather than downloading, through a one-minute signed URL.
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/courses/following-jesus/[course]/support/[page]">
) {
  const { course: courseSlug, page } = await ctx.params;
  const course = findCourse(courseSlug);
  const support = SUPPORT_PAGES.find((p) => p.slug === page);
  if (!course || !course.launched || !support) notFound();

  const { data, error } = await supabaseAdmin.storage
    .from(DOWNLOADS_BUCKET)
    .createSignedUrl(`${storageFolder(course)}/${supportFile(support.slug)}`, 60);
  if (error || !data?.signedUrl) {
    console.error(`Could not sign ${support.slug} for ${course.key}:`, error?.message);
    notFound();
  }

  return NextResponse.redirect(data.signedUrl, {
    status: 307,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
