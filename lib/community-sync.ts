import { supabaseAdmin } from "@/lib/supabase/admin";
import { addToCommunityGroup } from "@/lib/mailerlite-community";

/**
 * Adds a community member to the MailerLite group and records how it went on
 * their profile, for the admin page. Run from after(), once the person has
 * already joined, so it never holds them up.
 *
 * The record is written with the service-role client: by the time this runs
 * the response has gone, so there is no cookie jar to refresh a session into.
 * It writes only the two MailerLite columns of this one profile.
 */
export async function syncCommunityMember(p: {
  userId: string;
  email: string;
  fullName: string;
  country: string;
}): Promise<string | null> {
  const error = await addToCommunityGroup({ email: p.email, fullName: p.fullName, country: p.country });
  if (error) console.error(`MailerLite: could not add a community member: ${error}`);
  const { error: saveError } = await supabaseAdmin
    .from("community_profiles")
    .update(error ? { mailerlite_error: error } : { mailerlite_synced_at: new Date().toISOString(), mailerlite_error: null })
    .eq("user_id", p.userId);
  if (saveError) console.error("MailerLite status not saved:", saveError.message);
  return error;
}
