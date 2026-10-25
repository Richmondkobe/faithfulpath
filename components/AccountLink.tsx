"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

// "Sign in" for a visitor, "My account" for someone signed in.
//
// Read in the browser rather than on the server: a session check in the root
// layout would make every page render per visitor, losing the caching the
// articles, books and home page rely on. Supabase keeps the session in a
// cookie the browser can read (sb-<project>-auth-token, sometimes split into
// .0, .1); its presence is enough to choose the label. Signed in goes to
// /account, which sends a member or buyer to /members and someone who has
// only joined the free community to the community home (Richmond, 26
// October 2026); a stale cookie lands on the sign-in page, so costs nothing.
// It said "My courses" until then, which a free community member does not
// have.

const SIGNED_IN = /(?:^|;\s*)sb-[a-z0-9]+-auth-token(?:\.\d+)?=/;
const subscribe = () => () => {};
const signedIn = () => SIGNED_IN.test(document.cookie);
const onServer = () => false;

export default function AccountLink({ className }: { className?: string }) {
  const isSignedIn = useSyncExternalStore(subscribe, signedIn, onServer);
  return (
    // A plain link for /account: it is a redirect, not a page to prefetch.
    isSignedIn ? (
      <a href="/account" className={className}>
        My account
      </a>
    ) : (
      <Link href="/members/login" className={className}>
        Sign in
      </Link>
    )
  );
}
