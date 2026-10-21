import { VIDEOS } from "@/lib/videos";

// Each video's YouTube thumbnail, fetched once when the site is built and
// served from this site, so a page with a video makes no request to YouTube
// until someone presses play. Only the videos in lib/videos.ts.
export const dynamicParams = false;

export async function generateStaticParams() {
  return VIDEOS.map((v) => ({ id: v.id }));
}

export async function GET(_request: Request, { params }: RouteContext<"/videos/thumbnail/[id]">) {
  const { id } = await params;
  // The full-size picture, or the smaller one for a video that has none.
  for (const size of ["maxresdefault", "hqdefault"]) {
    const res = await fetch(`https://i.ytimg.com/vi/${id}/${size}.jpg`);
    if (res.ok) {
      return new Response(await res.arrayBuffer(), {
        headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400" },
      });
    }
  }
  return new Response("Not found", { status: 404 });
}
