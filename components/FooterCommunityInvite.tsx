"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { BYSY_BASE } from "@/lib/bysy-links";
import { HELP_PATH } from "@/lib/site";
import { JOINED_COOKIE } from "@/lib/community";

/**
 * The footer's invitation to the free community, in place of the newsletter
 * form (Richmond, 26 October 2026). The newsletter itself is untouched:
 * /api/subscribe and the "Website subscribers" group in MailerLite are as they
 * were, and components/FooterSignup.tsx is kept, unused, should the form be
 * wanted back.
 *
 * Hidden where the newsletter form was hidden, for the same reason (see
 * FooterSignup.tsx): Before You Say Yes and /help, which may be read on a
 * device someone else can see. Hidden on the community's own pages, which
 * already say all of this, and for anyone who has joined: the community home
 * sets a small cookie saying so (components/community/MarkJoined.tsx), read
 * here in the browser so every page stays cached.
 */

const JOINED = new RegExp(`(?:^|;\\s*)${JOINED_COOKIE}=1`);
const subscribe = () => () => {};
const joined = () => JOINED.test(document.cookie);
const onServer = () => false;

export default function FooterCommunityInvite() {
  const pathname = usePathname() ?? "";
  const hasJoined = useSyncExternalStore(subscribe, joined, onServer);
  if (hasJoined) return null;
  if ([BYSY_BASE, HELP_PATH, "/community"].some((p) => pathname.startsWith(p))) return null;

  return (
    <div className="mb-10 border-b border-line pb-10">
      <p className="text-xl text-navy" style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}>
        Join the Faithful Path Community
      </p>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted">
        Free. Prayer, a weekly gathering, and letters from Pastor Richmond.
      </p>
      <Link
        href="/community"
        className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-gold px-7 text-[15px] font-semibold text-night transition-colors hover:bg-gold-soft"
      >
        Join free
      </Link>
    </div>
  );
}
