import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SERIES_PATH } from "@/lib/following-jesus";

/**
 * Signs out from a course page and returns to it. Only ever within the series.
 *
 * Only this browser: scope "local" ends this session and leaves the person
 * signed in on their phone or another computer. Supabase's default ("global")
 * ends every session for the account, which can sign out a window the person
 * is still using elsewhere. The membership's own sign-out is unchanged.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const next = String(form.get("next") ?? "");
  const safeNext = next.startsWith(`${SERIES_PATH}/`) || next === SERIES_PATH ? next : SERIES_PATH;

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "local" });

  return NextResponse.redirect(new URL(safeNext, request.url), 303);
}
