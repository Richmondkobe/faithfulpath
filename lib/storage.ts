// Bucket names and upload helpers. Safe to import from Client Components — it
// holds no keys. The service-role client re-exports the bucket names from here.

import { slugify } from "@/lib/products";

export const COVERS_BUCKET = "covers";
export const GUIDES_BUCKET = "guides";

export function safeFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
  const cleanBase = slugify(base) || "file";
  const cleanExt = ext.replace(/[^a-z0-9]/g, "");
  return cleanExt ? `${cleanBase}.${cleanExt}` : cleanBase;
}

export function storagePath(slug: string, fileName: string): string {
  return `${slug}/${Date.now()}-${safeFileName(fileName)}`;
}

/**
 * The shape storagePath() produces. The browser now chooses the path, so the
 * server checks it against this before writing it to the database.
 */
export const STORAGE_PATH = /^[a-z0-9][a-z0-9-]*\/\d{10,}-[a-z0-9-]+(?:\.[a-z0-9]+)?$/;

/**
 * Uploads straight from the browser to Supabase Storage, authorised by the
 * admin's own session. Files never pass through a server action, which is what
 * kept them under the platform's request body limit.
 *
 * supabase-js uploads with fetch and so reports no progress; XHR does, and a
 * 7MB PDF on a slow connection needs a progress bar to not look frozen.
 */
export function uploadWithProgress({
  bucket,
  path,
  file,
  accessToken,
  onProgress,
}: {
  bucket: string;
  path: string;
  file: File;
  accessToken: string;
  onProgress?: (percent: number) => void;
}): Promise<string> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!base || !anon) {
    return Promise.reject(new Error("Supabase is not configured in the browser."));
  }

  const endpoint =
    `${base}/storage/v1/object/${bucket}/` +
    path.split("/").map(encodeURIComponent).join("/");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint, true);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("apikey", anon);
    xhr.setRequestHeader("x-upsert", "false");
    if (file.type) xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve(path);
        return;
      }
      // Storage returns JSON errors; fall back to the status when it does not.
      let detail = `${xhr.status} ${xhr.statusText}`;
      try {
        const body = JSON.parse(xhr.responseText);
        if (body?.message) detail = body.message;
      } catch {
        // Not JSON — keep the status line.
      }
      if (xhr.status === 401 || xhr.status === 403) {
        detail = "Your admin session was refused by storage. Reload and sign in again.";
      }
      reject(new Error(`${file.name}: ${detail}`));
    };

    xhr.onerror = () =>
      reject(new Error(`${file.name}: the connection dropped during upload.`));
    xhr.onabort = () => reject(new Error(`${file.name}: upload cancelled.`));

    xhr.send(file);
  });
}
