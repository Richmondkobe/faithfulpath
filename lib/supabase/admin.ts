import { createClient } from "@supabase/supabase-js";

// Service-role client. RLS is on with no policies, so every read or write of
// products / purchases / storage has to go through this. It must never reach
// the browser — the guard below turns a bad import into a loud crash rather
// than a leaked key.
if (typeof window !== "undefined") {
  throw new Error(
    "lib/supabase/admin.ts was imported into client code. The service role key must stay on the server."
  );
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set."
  );
}

export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const COVERS_BUCKET = "covers";
export const GUIDES_BUCKET = "guides";

export function coverPublicUrl(path: string | null): string | null {
  if (!path) return null;
  return supabaseAdmin.storage.from(COVERS_BUCKET).getPublicUrl(path).data
    .publicUrl;
}
