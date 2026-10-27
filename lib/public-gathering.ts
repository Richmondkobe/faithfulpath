import { supabaseAdmin } from "@/lib/supabase/admin";
import { nextOccurrence, type Gathering } from "@/lib/community";

/**
 * The next weekly gathering for public pages (home page): its title and start
 * time only. The Zoom link is never returned here — it stays for members, on
 * the community home. Read with the service role because the table has no
 * public policy; a failure shows nothing rather than breaking the page.
 */
export async function publicNextGathering(): Promise<{ title: string; start: string } | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("community_gatherings")
      .select("id, title, starts_at, repeats_weekly, skipped_dates, created_at")
      .order("starts_at", { ascending: true });
    if (error || !data) return null;
    const all = data.map((g) => ({ ...g, description: null, zoom_url: "", updated_at: g.created_at })) as Gathering[];
    const { next } = nextOccurrence(all, Date.now());
    return next ? { title: next.gathering.title, start: next.start } : null;
  } catch {
    return null;
  }
}
