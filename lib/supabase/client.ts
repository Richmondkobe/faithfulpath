"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser client, anon key, auth only. Nothing in the browser queries products
// or purchases — RLS would refuse anyway.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
