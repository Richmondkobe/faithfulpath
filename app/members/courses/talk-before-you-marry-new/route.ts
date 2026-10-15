import { requireActiveMember } from "@/lib/member-gate";
import { tbymHtmlResponse, getCompleted, homeHtml } from "@/lib/tbym-new";

/** The test edition's contents page. Members only; signed out goes to /membership, as /members does. */
export async function GET() {
  await requireActiveMember();
  return tbymHtmlResponse(homeHtml(await getCompleted()));
}
