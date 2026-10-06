import { readFile } from "node:fs/promises";
import { join } from "node:path";

// The Following Jesus pages' two families, served from this site so the pages
// ask Google for nothing. Only the three files made for them, by name.
const FILES = new Set([
  "fj-source-serif-4-normal.woff2",
  "fj-source-serif-4-italic.woff2",
  "fj-source-sans-3-normal.woff2",
]);

export async function GET(
  _request: Request,
  ctx: RouteContext<"/courses/following-jesus/fonts/[file]">
) {
  const { file } = await ctx.params;
  if (!FILES.has(file)) return new Response("Not found.", { status: 404 });

  const font = await readFile(join(process.cwd(), "fonts", file));
  return new Response(new Uint8Array(font), {
    headers: {
      "Content-Type": "font/woff2",
      // A day: scripts/fetch-fonts.mjs can refresh a file under the same name.
      "Cache-Control": "public, max-age=86400",
    },
  });
}
