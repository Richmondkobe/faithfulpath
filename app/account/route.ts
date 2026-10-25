import { NextResponse, type NextRequest } from "next/server";
import { getSessionEmail } from "@/lib/auth";
import { getMemberByEmail } from "@/lib/members";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { COMMUNITY_HOME } from "@/lib/community";
import { hasBooks } from "@/lib/book-library";

/**
 * Where the header's account link goes for someone signed in (AccountLink).
 * The link cannot tell from the browser what kind of account it is, so it
 * comes here and is sent on:
 *
 *   * anyone with a membership row (any status), a Following Jesus purchase,
 *     or the admin: /members, exactly as before;
 *   * someone who has joined the free community: the community home
 *     (Richmond, 26 October 2026);
 *   * someone who has only bought a book: "Your books" (/members/books);
 *   * anyone else signed in: /members, as before, which explains properly.
 *
 * Signed out goes to the sign-in page, as the link always did. Nothing is
 * written; this only reads.
 */
export async function GET(request: NextRequest) {
  const to = (path: string) => NextResponse.redirect(new URL(path, request.url));
  const email = await getSessionEmail();
  if (!email) return to("/members/login");

  try {
    if (await getMemberByEmail(email)) return to("/members");
    const { count } = await supabaseAdmin
      .from("course_purchases")
      .select("id", { count: "exact", head: true })
      .eq("email", email);
    if (count) return to("/members");

    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from("community_profiles").select("user_id").maybeSingle();
    if (data) return to(COMMUNITY_HOME);
    if (await hasBooks(email)) return to("/members/books");
  } catch (err) {
    console.error("Account link: could not tell the account apart; sending to /members:", err instanceof Error ? err.message : err);
  }
  return to("/members");
}
