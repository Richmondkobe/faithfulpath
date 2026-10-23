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
    "/(understanding-john-653-56-eat-my-flesh-drink-my-blo|christian-mental-health-podcasts|christian-dating-apps|fruits-vs-gifts-of-the-holy-spirit-explained-fruits|christian-dating-and-long-distance|can-satan-be-forgiven|1-timothy-5-17-18-explained|mark-823-symbolism|youth-ministry-lessons-parables|the-minor-prophets|lower-cholesterol-christian-guide|what-does-the-bible-say-about-masturbation|ark-of-the-covenant-today|polygamy-in-scripture|women-in-ministry|healing-from-religious-trauma-reclaim-your-faith|the-role-of-the-holy-spirit-in-modern-christian-life|can-loved-ones-in-heaven-see-us-on-earth|salt-dating-app|interracial-marriage-bible|ephesians-6-10-18-breakdown|bible-number-symbolism|biblical-guidance-for-toxic-relationships|what-does-the-bible-say-about-monogamy|the-bible-monogamy|did-god-approve-polygamy-in-the-bible|who-created-god|christian-views-on-ivf-and-surrogacy|karate-and-christianity|book-of-revelation-meaning|understanding-natural-disasters-a-biblical-perspective|animal-sacrifices-christianity|christian-dating-and-courtship|faith-based-time-management|church-grant-writing-ministries|christian-leadership-retreats-women|sermon-preparation-tools|nursing-home-outreach-church-ministryd-meaningful|build-self-confidence-through-faith-a-simple-guide|launching-christian-nonprofit|christian-podcast-ideas|christian-money-millennials|christian-vocation-vs-career|bible-universal-salvation|faith-based-fitness-programs|polygamy-in-the-old-testament-vs-monogamy-today|christian-perspectives-on-psychedelic-therapy|youth-ministry-burnout-prevention|start-budgeting-christian|2-corinthians-12-7-theories|was-mary-sinless-insights-on-immaculate-conception|strong-marriage-biblical-principles|christian-dating-and-faith|church-plant-fundraising-templates|does-god-play-favorites-reconciling-his-impartiality-and-israels-chosen-status|is-it-ever-okay-to-lie|christian-dating-online-safety|marys-journey-after-jesus|develop-more-patience-christian|christian-dating-and-prayer|strength-in-faith-living-with-chronic-illness|trusting-god-through-career-changes|reconcile-science-creation-genesis|how-to-forgive-someone-who-hurt-you-deeply|joy-in-the-journey|christian-dating-and-patience|stewardship-secrets|christian-homeschooling|healing-through-faith|mental-health-stigma-in-church|bible-based-time-management-for-moms-practical-time-blocking-to-prioritize-faith-family|mindful-prayer-journal-|forgiveness-and-healing-a-path-to-renewal|women-pastors-in-the-bible|understanding-the-mark-of-the-beast-in-revelation-13|the-untold-stories-of-women-who-shaped-the-early-church|strengthen-your-marriage-through-faith-and-communicationcouples-communication|spiritual-growth-journey|living-our-faith-today|living-in-harmony-|habits-of-a-faithful-life|family-time-tips|faithful-freedom-faith-based-approach|faithful-foundations-christian-life|does-the-bible-teach-universal-salvation-exploring-key-verses-and-their-meaning|deepening-your-faith-deeper-connection-with-god|connected-in-christ|christian-fasting-benefits|christian-book-store/christian-women-books|christian-book-store/christian-ministry-books|christian-book-store/christian-leadership-books|christian-book-store/christian-biographies-church-history|bible-insights-on-mental-health-challenges-bible-mental-health)",
  ],
};
