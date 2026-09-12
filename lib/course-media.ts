import { supabaseAdmin } from "@/lib/supabase/admin";

// Course recordings live in a private Supabase bucket, not in the repo and not
// under public/. Two reasons: a single video is larger than git will take, and
// anything under public/ is a plain URL that works for anyone it is forwarded
// to. Here the only way to the file is a short-lived URL this module signs,
// and it is only ever called from a page that has already checked the
// membership.

export const MEDIA_BUCKET = "course-media";

/** Long enough to watch a session through, short enough that a copied URL dies. */
const SIGNED_URL_SECONDS = 60 * 60;

export type MediaKind = "videos" | "audio";

function keyFor(kind: MediaKind, file: string): string | null {
  if (!/^[a-z0-9-]+\.(mp4|mp3)$/.test(file)) return null;
  return `${kind}/${file}`;
}

/**
 * A signed URL for a recording, or null when it has not been uploaded yet —
 * which is what keeps the "coming soon" placeholders showing until Richmond
 * records each piece.
 */
export async function signedMediaUrl(
  kind: MediaKind,
  file: string
): Promise<string | null> {
  const key = keyFor(kind, file);
  if (!key) return null;

  const { data, error } = await supabaseAdmin.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(key, SIGNED_URL_SECONDS);

  // A missing object is the ordinary case before a recording exists, so it is
  // not worth logging; anything else is.
  if (error) {
    if (!/not found|does not exist/i.test(error.message)) {
      console.error(`Could not sign ${key}:`, error.message);
    }
    return null;
  }
  return data?.signedUrl ?? null;
}

/** Signs several at once, keyed by the file name asked for. */
export async function signedMediaUrls(
  kind: MediaKind,
  files: string[]
): Promise<Record<string, string | null>> {
  const unique = [...new Set(files)];
  const signed = await Promise.all(unique.map((f) => signedMediaUrl(kind, f)));
  return Object.fromEntries(unique.map((f, i) => [f, signed[i]]));
}
