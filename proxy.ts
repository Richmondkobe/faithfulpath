import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isGonePath } from "@/lib/gone-paths";

// Supabase stores the session in cookies and rotates the access token as it
// expires. Server Components cannot write cookies, so the refresh has to happen
// here, before the route renders — otherwise an expired token logs the admin out
// mid-session.
export async function proxy(request: NextRequest) {
  // The old Zyro URLs with no replacement, answered before anything else: they
  // are public paths with no session to refresh, and the rewrite is what puts
  // the 410 on the response. /gone renders the ordinary not-found page.
  if (isGonePath(request.nextUrl.pathname)) {
    return NextResponse.rewrite(new URL("/gone", request.url), { status: 410 });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Do not remove: this call is what triggers the token refresh and the
  // Set-Cookie headers above.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Only the routes that care about a session. The public store and the Stripe
  // webhook do not need cookie handling. /members and the auth callback do:
  // without the refresh here a member is silently signed out when their access
  // token expires.
  matcher: [
    "/admin/:path*",
    "/login",
    "/members/:path*",
    // The Following Jesus courses sign people in with the same accounts, and
    // their lessons are behind it.
    "/courses/:path*",
    "/api/courses/:path*",
    "/auth/:path*",
    // The gone URLs. Spelled out rather than built from GONE_PATHS, because a
    // matcher is read at build time; lib/gone-paths.ts keeps the two together.
    "/(understanding-john-653-56-eat-my-flesh-drink-my-blo|christian-mental-health-podcasts|christian-dating-apps|fruits-vs-gifts-of-the-holy-spirit-explained-fruits|christian-dating-and-long-distance|can-satan-be-forgiven|1-timothy-5-17-18-explained|mark-823-symbolism|youth-ministry-lessons-parables|the-minor-prophets|lower-cholesterol-christian-guide|what-does-the-bible-say-about-masturbation)",
  ],
};
