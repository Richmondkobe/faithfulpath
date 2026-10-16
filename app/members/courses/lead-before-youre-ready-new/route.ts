import { requireActiveMember } from "@/lib/member-gate";
import { getCompleted, homeHtml, lbyrHtmlResponse, requireLbyrNewOpen } from "@/lib/lbyr-new";

/** The course page. Members only; signed out goes to /membership, as /members does. */
export async function GET() {
  requireLbyrNewOpen();
  await requireActiveMember();
  return lbyrHtmlResponse(homeHtml(await getCompleted()));
}
