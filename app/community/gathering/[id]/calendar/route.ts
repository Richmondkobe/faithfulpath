import { NextResponse, type NextRequest } from "next/server";
import { getCommunityViewer } from "@/lib/community-db";
import { GATHERING_MINUTES, type Gathering } from "@/lib/community";

/**
 * "Add to calendar": the gathering as an .ics file, for community members
 * only, since it carries the Zoom link. Read through the member's own session,
 * so the table's policies apply here as on the page.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/community/gathering/[id]/calendar">) {
  const { id } = await ctx.params;
  const viewer = await getCommunityViewer();
  if (!viewer?.inCommunity) return NextResponse.redirect(new URL("/community/sign-in", request.url));

  const { data, error } = await viewer.supabase.from("community_gatherings").select("*").eq("id", id).maybeSingle();
  if (error || !data) return new NextResponse("Not found", { status: 404 });
  const g = data as Gathering;

  const start = new Date(g.starts_at);
  const end = new Date(start.getTime() + GATHERING_MINUTES * 60_000);
  const description = [g.description?.trim(), `Join on Zoom: ${g.zoom_url}`].filter(Boolean).join("\n\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Faithful Path Community//Weekly Gathering//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:gathering-${g.id}@faithfulpathcommunity.com`,
    `DTSTAMP:${icsDate(new Date(g.updated_at))}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(g.title)}`,
    `DESCRIPTION:${icsText(description)}`,
    `LOCATION:${icsText(g.zoom_url)}`,
    `URL:${g.zoom_url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new NextResponse(lines.map(fold).join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="faithful-path-gathering.ics"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

/** 20261102T120000Z */
const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

const icsText = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Lines longer than 75 bytes are folded, as RFC 5545 asks. */
function fold(line: string): string {
  const out: string[] = [];
  let current = "";
  for (const ch of line) {
    if (Buffer.byteLength(current + ch) > (out.length ? 74 : 75)) {
      out.push(current);
      current = ch;
    } else current += ch;
  }
  out.push(current);
  return out.join("\r\n ");
}
