import { requireActiveMember } from "@/lib/member-gate";
import { howHtml, lbyrHtmlResponse, readPage, requireLbyrNewOpen } from "@/lib/lbyr-new";

/** Start Here, page 2. Members only. */
export async function GET() {
  requireLbyrNewOpen();
  await requireActiveMember();
  return lbyrHtmlResponse(howHtml(await readPage("how-this-course-works.html")));
}
