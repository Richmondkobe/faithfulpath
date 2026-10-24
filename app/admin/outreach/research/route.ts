import { ADMIN_EMAIL, getSessionEmail } from "@/lib/auth";
import { outreachClient } from "@/lib/outreach-db";
import { isOutreachGoal } from "@/lib/outreach";
import { RESEARCH_TOPICS, runResearch, type ProgressEvent } from "@/lib/outreach-research";

// A run is a handful of API calls with web searches, then a check of each site:
// two to four minutes, so well past the default limit.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * POST /admin/outreach/research — runs the research agent and streams its
 * progress back as one JSON object per line.
 *
 * Admin only. JSON only, which a form on another site cannot send without the
 * browser asking first, so a run cannot be started from elsewhere.
 */
export async function POST(request: Request) {
  if ((await getSessionEmail()) !== ADMIN_EMAIL) {
    return Response.json({ error: "Sign in as the admin." }, { status: 401 });
  }
  if (!(request.headers.get("content-type") ?? "").startsWith("application/json")) {
    return Response.json({ error: "Expected JSON." }, { status: 415 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY is not set for this site." }, { status: 500 });
  }

  const body = (await request.json().catch(() => ({}))) as { goal?: string; topic?: string; count?: number };
  const goal = body.goal ?? "";
  const topic = body.topic ?? "";
  const count = body.count === 10 ? 10 : 5;
  if (!isOutreachGoal(goal)) return Response.json({ error: "Choose a goal." }, { status: 400 });
  if (!(RESEARCH_TOPICS as readonly string[]).includes(topic)) {
    return Response.json({ error: "Choose a topic." }, { status: 400 });
  }

  // The admin's own session, so the table's RLS authorises every write.
  const db = await outreachClient();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: ProgressEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      try {
        const summary = await runResearch({ goal, category: topic, count, db }, send);
        send({ type: "done", summary });
      } catch (err) {
        send({ type: "error", message: err instanceof Error ? err.message : "The run failed." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
    },
  });
}
