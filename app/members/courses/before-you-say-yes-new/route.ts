import { requireActiveMember } from "@/lib/member-gate";
import { bysyHtmlResponse, getCompleted, homeHtml } from "@/lib/bysy-new";

/** The test edition's contents page. Members only; signed out goes to /membership, as /members does. */
export async function GET() {
  await requireActiveMember();
  return bysyHtmlResponse(homeHtml(await getCompleted()));
}
