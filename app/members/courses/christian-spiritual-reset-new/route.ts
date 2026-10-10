import { requireActiveMember } from "@/lib/member-gate";
import { activeMemberLearner, getCompleted, homeHtml, resetHtmlResponse } from "@/lib/reset-new";
import { getReviewSavedAt } from "@/lib/reset-new-review";
import { PLANS, getAcks, getPlan, recordAcks } from "@/lib/reset-new-plan";

/** The test edition's contents page. Members only; signed out goes to /membership, as /members does. */
export async function GET() {
  // Signed out goes to /membership; a lapsed membership to /members, which explains it.
  await requireActiveMember();
  const completed = await getCompleted();
  const learner = await activeMemberLearner();
  if (learner) {
    // Adds any acknowledgement now earned and not yet recorded; never changes one.
    try {
      await recordAcks(learner, completed);
    } catch (err) {
      console.error("Could not record the Reset acknowledgement:", err);
    }
  }
  const [reviewSavedAt, plan, acks] = await Promise.all([getReviewSavedAt(), getPlan(), getAcks()]);
  return resetHtmlResponse(homeHtml(completed, reviewSavedAt, { planLabel: plan ? PLANS[plan] : null, acks }));
}
