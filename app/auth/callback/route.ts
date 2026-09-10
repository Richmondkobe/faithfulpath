import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Where the emailed sign-in link lands. Supabase sends the browser here with a
 * code, which is exchanged for the session cookies before redirecting on.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  // Only ever redirect within this site.
  const nextPath = url.searchParams.get("next") ?? "/members";
  const safeNext = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/members";

  if (!code) {
    return NextResponse.redirect(new URL("/members/login?error=link", url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth callback failed:", error.message);
    return NextResponse.redirect(new URL("/members/login?error=expired", url.origin));
  }

  return NextResponse.redirect(new URL(safeNext, url.origin));
}
