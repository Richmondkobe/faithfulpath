import { requireActiveMember } from "@/lib/member-gate";
import { getCompleted, lbyrHtmlResponse, planHtml, readPage, requireLbyrNewOpen } from "@/lib/lbyr-new";

/** My Leadership Plan, the closing page, with the member's completion record. Members only. */
export async function GET() {
  requireLbyrNewOpen();
  await requireActiveMember();
  return lbyrHtmlResponse(planHtml(await readPage("my-leadership-plan.html"), await getCompleted()));
}
