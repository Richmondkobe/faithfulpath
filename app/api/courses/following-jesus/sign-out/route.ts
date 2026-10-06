import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SERIES_PATH } from "@/lib/following-jesus";

/** Signs out from a course page and returns to it. Only ever within the series. */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const next = String(form.get("next") ?? "");
  const safeNext = next.startsWith(`${SERIES_PATH}/`) || next === SERIES_PATH ? next : SERIES_PATH;

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL(safeNext, request.url), 303);
}
