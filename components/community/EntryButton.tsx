"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { COMMUNITY_HOME, COMMUNITY_JOIN, COMMUNITY_SIGN_IN } from "@/lib/community";

// "Join free" for a visitor, "Go to the community" for someone signed in.
// Read from the session cookie in the browser, as AccountLink does, so
// /community itself stays a static page. A stale cookie costs nothing: the
// community home sends anyone not signed in to the sign-in page.

const SIGNED_IN = /(?:^|;\s*)sb-[a-z0-9]+-auth-token(?:\.\d+)?=/;
const subscribe = () => () => {};
const signedIn = () => SIGNED_IN.test(document.cookie);
const onServer = () => false;

export default function EntryButton({ tone = "gold" }: { tone?: "gold" | "navy" }) {
  const isSignedIn = useSyncExternalStore(subscribe, signedIn, onServer);
  const button =
    tone === "gold"
      ? "bg-gold text-night hover:bg-gold-soft"
      : "bg-navy text-sun hover:bg-night";
  return (
    <div className="flex flex-col items-center gap-3">
      <Link
        href={isSignedIn ? COMMUNITY_HOME : COMMUNITY_JOIN}
        className={`flex min-h-14 w-full max-w-xs items-center justify-center rounded-xl px-8 text-[17px] font-semibold transition-colors ${button}`}
      >
        {isSignedIn ? "Go to the community" : "Join free"}
      </Link>
      {!isSignedIn && (
        <Link
          href={COMMUNITY_SIGN_IN}
          className={`text-sm underline underline-offset-4 ${tone === "gold" ? "text-sand hover:text-gold-soft" : "text-muted hover:text-gold-text"}`}
        >
          Already joined? Sign in
        </Link>
      )}
    </div>
  );
}
