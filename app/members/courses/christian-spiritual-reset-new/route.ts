import { requireActiveMember } from "@/lib/member-gate";
import { getCompleted, homeHtml, resetHtmlResponse } from "@/lib/reset-new";

/** The test edition's contents page. Members only; signed out goes to /membership, as /members does. */
export async function GET() {
  // Signed out goes to /membership; a lapsed membership to /members, which explains it.
  await requireActiveMember();
  return resetHtmlResponse(homeHtml(await getCompleted()));
}
