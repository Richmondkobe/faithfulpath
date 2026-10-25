"use client";

import { useEffect } from "react";
import { JOINED_COOKIE } from "@/lib/community";

/**
 * Remembers in this browser that the person has joined, so the footer stops
 * inviting them (FooterCommunityInvite). Only a yes/no; nothing about who
 * they are. Set on the community home, which every way of signing in to the
 * community reaches; cleared when they leave the community.
 */
export default function MarkJoined() {
  useEffect(() => {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${JOINED_COOKIE}=1; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax${secure}`;
  }, []);
  return null;
}
