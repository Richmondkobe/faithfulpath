import { getViewer, lbyrHtmlResponse, readPage, requireLbyrNewOpen, welcomeHtml } from "@/lib/lbyr-new";

/** Start Here, page 1. Open to anyone, so the course can be seen before joining. */
export async function GET() {
  requireLbyrNewOpen();
  const { learner, active } = await getViewer();
  return lbyrHtmlResponse(welcomeHtml(await readPage("welcome.html"), { signedIn: Boolean(learner), active }));
}
