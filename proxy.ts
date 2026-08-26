import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Supabase stores the session in cookies and rotates the access token as it
// expires. Server Components cannot write cookies, so the refresh has to happen
// here, before the route renders — otherwise an expired token logs the admin out
// mid-session.
export async function proxy(request: NextRequest) {
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
  // webhook do not need cookie handling.
  matcher: ["/admin/:path*", "/login"],
};
