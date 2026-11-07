import { requireActiveMember } from "@/lib/member-gate";
import { getCompleted, overviewHtml, sfHtmlResponse } from "@/lib/stand-firm";

/** The Stand Firm course overview. Members only; signed out goes to /membership, as /members does. */
export async function GET() {
  // Signed out goes to /membership; a lapsed membership to /members, which explains it.
  await requireActiveMember();
  return sfHtmlResponse(overviewHtml(await getCompleted()));
}
