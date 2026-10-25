import { redirect } from "next/navigation";

/**
 * The community had its own sign-in until 26 October 2026; there is now one
 * sign-in for everyone. Kept so old links and bookmarks still work.
 */
export default function CommunitySignIn() {
  redirect("/members/login");
}
