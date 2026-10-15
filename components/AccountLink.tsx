"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

// "Sign in" for a visitor, "My courses" for someone signed in.
//
// Read in the browser rather than on the server: a session check in the root
// layout would make every page render per visitor, losing the caching the
// articles, books and home page rely on. Supabase keeps the session in a
// cookie the browser can read (sb-<project>-auth-token, sometimes split into
// .0, .1); its presence is enough to choose the label. Both go to the same
// place: /members/login sends someone already signed in straight on to
// /members, so a stale cookie costs nothing.

const SIGNED_IN = /(?:^|;\s*)sb-[a-z0-9]+-auth-token(?:\.\d+)?=/;
const subscribe = () => () => {};
const signedIn = () => SIGNED_IN.test(document.cookie);
const onServer = () => false;

export default function AccountLink({ className }: { className?: string }) {
  const isSignedIn = useSyncExternalStore(subscribe, signedIn, onServer);
  return (
    <Link href={isSignedIn ? "/members" : "/members/login"} className={className}>
      {isSignedIn ? "My courses" : "Sign in"}
    </Link>
  );
}
