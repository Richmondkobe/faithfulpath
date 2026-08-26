import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const ADMIN_EMAIL = "info@faithfulpathcommunity.com";

/** The signed-in user's email, or null. Verified against Supabase, not just read off a cookie. */
export async function getSessionEmail(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email?.toLowerCase() ?? null;
}

export async function isAdmin(): Promise<boolean> {
  return (await getSessionEmail()) === ADMIN_EMAIL;
}

/**
 * Guard for every admin page and every admin server action. Server actions are
 * reachable by direct POST, so this has to run inside the action too — not just
 * in the layout that renders the form.
 */
export async function requireAdmin(): Promise<string> {
  const email = await getSessionEmail();
  if (email !== ADMIN_EMAIL) {
    redirect("/login");
  }
  return email;
}
