import { cache } from "react";

import { createClient } from "@supabase/supabase-js";
import { COVERS_BUCKET, GUIDES_BUCKET } from "@/lib/storage";

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

// Defined in lib/storage.ts so Client Components can name the buckets without
// pulling this module — and the service role key — into the browser.
export { COVERS_BUCKET, GUIDES_BUCKET };

export function coverPublicUrl(path: string | null): string | null {
  if (!path) return null;
  return supabaseAdmin.storage.from(COVERS_BUCKET).getPublicUrl(path).data
    .publicUrl;
}

/**
 * The free sample of a book, in the public covers bucket.
 *
 * `samplePublicUrl` is the file's own address; the pages link to
 * /guides/<slug>/sample instead, which streams it from our own domain so the
 * response can carry X-Robots-Tag. A header cannot be set on a Supabase public
 * object, so a link straight to the bucket could not be kept out of an index.
 */
export const samplePath = (slug: string) => `samples/${slug}-sample.pdf`;

export function samplePublicUrl(slug: string): string {
  return supabaseAdmin.storage.from(COVERS_BUCKET).getPublicUrl(samplePath(slug))
    .data.publicUrl;
}

/** The slugs that actually have a sample uploaded. Read once per request. */
export const listSampleSlugs = cache(async (): Promise<Set<string>> => {
  const { data, error } = await supabaseAdmin.storage
    .from(COVERS_BUCKET)
    .list("samples", { limit: 200 });
  if (error || !data) return new Set();
  return new Set(
    data
      .map((o) => o.name.match(/^(.+)-sample\.pdf$/)?.[1])
      .filter((s): s is string => Boolean(s))
  );
});
