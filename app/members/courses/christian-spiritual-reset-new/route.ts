import { requireActiveMember } from "@/lib/member-gate";
import { getCompleted, homeHtml, resetHtmlResponse } from "@/lib/reset-new";
import { getReviewSavedAt } from "@/lib/reset-new-review";

/** The test edition's contents page. Members only; signed out goes to /membership, as /members does. */
export async function GET() {
  // Signed out goes to /membership; a lapsed membership to /members, which explains it.
  await requireActiveMember();
  const [completed, reviewSavedAt] = await Promise.all([getCompleted(), getReviewSavedAt()]);
  return resetHtmlResponse(homeHtml(completed, reviewSavedAt));
}
