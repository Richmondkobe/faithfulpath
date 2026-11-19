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
    // The free community signs people in with the same accounts.
    "/community/:path*",
    // The header's "My account", which reads the session to choose where to go.
    "/account",
    // The gone URLs. Spelled out rather than built from GONE_PATHS, because a
    // matcher is read at build time; lib/gone-paths.ts keeps the two together.
    // Several entries because one matcher may not exceed 4096 characters.
    "/(understanding-john-653-56-eat-my-flesh-drink-my-blo|christian-mental-health-podcasts|christian-dating-apps|fruits-vs-gifts-of-the-holy-spirit-explained-fruits|christian-dating-and-long-distance|can-satan-be-forgiven|1-timothy-5-17-18-explained|mark-823-symbolism|youth-ministry-lessons-parables|the-minor-prophets|lower-cholesterol-christian-guide|what-does-the-bible-say-about-masturbation|ark-of-the-covenant-today|polygamy-in-scripture|women-in-ministry|healing-from-religious-trauma-reclaim-your-faith|the-role-of-the-holy-spirit-in-modern-christian-life|can-loved-ones-in-heaven-see-us-on-earth|salt-dating-app|interracial-marriage-bible|bible-number-symbolism|biblical-guidance-for-toxic-relationships|what-does-the-bible-say-about-monogamy|the-bible-monogamy|did-god-approve-polygamy-in-the-bible|who-created-god|christian-views-on-ivf-and-surrogacy|karate-and-christianity|book-of-revelation-meaning|understanding-natural-disasters-a-biblical-perspective|animal-sacrifices-christianity|christian-dating-and-courtship|faith-based-time-management|church-grant-writing-ministries|christian-leadership-retreats-women|sermon-preparation-tools|nursing-home-outreach-church-ministryd-meaningful|build-self-confidence-through-faith-a-simple-guide|launching-christian-nonprofit|christian-podcast-ideas|christian-money-millennials|christian-vocation-vs-career|bible-universal-salvation|faith-based-fitness-programs|polygamy-in-the-old-testament-vs-monogamy-today|christian-perspectives-on-psychedelic-therapy|youth-ministry-burnout-prevention|start-budgeting-christian|2-corinthians-12-7-theories|was-mary-sinless-insights-on-immaculate-conception|strong-marriage-biblical-principles|christian-dating-and-faith|church-plant-fundraising-templates|does-god-play-favorites-reconciling-his-impartiality-and-israels-chosen-status|is-it-ever-okay-to-lie|christian-dating-online-safety|marys-journey-after-jesus|develop-more-patience-christian|christian-dating-and-prayer|strength-in-faith-living-with-chronic-illness|trusting-god-through-career-changes|reconcile-science-creation-genesis|how-to-forgive-someone-who-hurt-you-deeply|joy-in-the-journey|christian-dating-and-patience|stewardship-secrets|christian-homeschooling|healing-through-faith|mental-health-stigma-in-church|bible-based-time-management-for-moms-practical-time-blocking-to-prioritize-faith-family|mindful-prayer-journal-|forgiveness-and-healing-a-path-to-renewal|women-pastors-in-the-bible|understanding-the-mark-of-the-beast-in-revelation-13|the-untold-stories-of-women-who-shaped-the-early-church|strengthen-your-marriage-through-faith-and-communicationcouples-communication|spiritual-growth-journey|living-our-faith-today|living-in-harmony-|habits-of-a-faithful-life|family-time-tips|faithful-freedom-faith-based-approach)",
    "/(faithful-foundations-christian-life|does-the-bible-teach-universal-salvation-exploring-key-verses-and-their-meaning|deepening-your-faith-deeper-connection-with-god|connected-in-christ|christian-fasting-benefits|christian-book-store/christian-women-books|christian-book-store/christian-ministry-books|christian-book-store/christian-leadership-books|christian-book-store/christian-biographies-church-history|bible-insights-on-mental-health-challenges-bible-mental-health|ai-and-the-bible-a-christian-perspective-artificial-intelligence|anchored-in-faith|ancient-wisdom-for-modern-challenges|angels-and-demons-their-impact-on-todays-world|are-all-sins-equal|authority-over-demons|balance-work-family-faith|become-more-christ-like-character|bible-against-ivf-surrogacy|bible-based-decision-making-for-teens|bible-burial-vs-cremation|bible-journaling-for-couples|bible-say-about-tattoos|bibles-predictions-end-of-the-world-explained-bible-end-of-the-world|biblical-wisdom-for-resolving-relationship-conflictsresolving-conflict|birth-control-perspectives-among-christians|blood-for-atonement|book-of-revelation-literal-or-symbolic-interpretations|breaking-family-curses-guide|calling-to-ministry-confirmation|can-dead-people-communicate-with-the-living|can-people-in-heaven-see-earth|catholic-dating|christian-dating-after-divorce-healing-and-faith|christian-dating-after-divorce-tips-for-healing|christian-dating-and-communication|christian-dating-and-compatibility|christian-dating-and-family|christian-dating-and-forgiveness|christian-dating-and-spiritual-growth|christian-dating-questions|christian-ethics-social-justice|christian-leadership-thick-skin|christian-marriage-strength|christian-parenting-tips|christian-responses-to-ai-ethics|christian-responses-to-cryptocurrency|christian-view-on-body-image|christian-views-on-drinking-alcohol-a-biblical-context|christians-and-medication-for-mental-health-christians-mental-health|church-planting-funding-ideas|david-and-bathsheba-lessons|different-types-of-spiritual-gifts|divine-healing-today-does-god-still-heal-in-our-world|do-animals-have-souls|does-the-bible-justify-violence-in-gods-name-bible-violence|euphrates-river-prophecy-today|ezer-kenegdo-meaning|faith-based-career-transition-coaching|faithful-choices|finding-joy-in-hard-times-bible-teachings|forgiveness-testimony|fruits-vs-gifts-of-the-holy-spirit-explained-fruits-of-the-holy-spirit|genesis-4-15-mystery|gods-nature-old-vs-new-testament-explained|great-falling-away-apostasy|handle-different-religious-beliefs-relationship|hope-in-christ-preparing-for-death-with-peace|how-can-i-develop-more-self-discipline-christian-habits|how-can-i-lower-my-blood-pressure-christian-guide|how-to-rediscover-joy-in-walk-with-god|how-to-start-a-prayer-journal-a-christian-guide)",
    "/(importance-of-water-baptism|integrating-mental-health-with-christian-faith-mental-health-treatment|is-it-ethical-to-eat-meat-christian-perspective|jesus-eat-my-flesh-meaning|life-begins-at-conception-bible|love-languages-gospel|manage-money-wisely-with-biblical-principles|mothers-day-fathers-day-biblical-honor|multicultural-ministry-strategies|overcome-anxiety-with-faith-and-daily-practices|overcoming-procrastination-with-biblical-wisdom|prayer-in-christian-teaching|prayer-life-discipline|preparing-for-death-faith-christ|problem-of-evil-simple-answer|proverbs-for-workplace-wisdom|psychedelic-therapy-christian-perspective|rebuild-my-life-after-a-major-disruption|rebuild-trust-in-relationships-a-faith-based-guide|reconciling-gods-command-in-deuteronomy-71-2|redeeming-the-time-ephesians-5|renewed-spirit|resolve-sexual-differences-marriage|salvation-after-death-insights-from-1-peter-46|should-euthanasia-be-legal-christian-view|sons-of-god-genesis-6-1-4|spiritual-growth|strength-in-faith|teaching-parables-of-jesus|the-end-times-biblical-teaching|the-trinity-relationships-model|track-my-spending-christian|trust-gods-timing-finding-patience-in-struggles|understanding-bible-contradictions-common-misunderstandings|understanding-jobs-suffering-and-divine-purpose-job-suffering|understanding-john-653-56-eat-my-flesh-drink-my-blood|understanding-judas-iscariots-betrayal-and-accountability|understanding-leviticus-2013-on-homosexuality|understanding-old-testament-laws-in-christianity|understanding-pauls-thorn-in-the-flesh-and-blood|untold-stories-of-women-in-the-early-church-women-in-early-church|virtual-prayer-group-platforms|who-wrote-the-book-of-hebrews-unpacking-the-mystery|why-did-god-command-abraham-sacrifice-isaac|why-didnt-jesus-write-the-bible|why-didnt-jesus-write-the-bible-understanding-his-teachings-jesus-teachings|women-pastors-bible|are-miracles-still-happening-today|bible-based-decision-making-frameworks|biblical-truths-on-singleness-and-marriage|build-healthy-habits-to-strengthen-your-faith|can-women-teach-in-church-a-biblical-examination-1-timothy-212|christian-dating-for-men|christian-responses-to-social-justice|death-penalty-for-homosexuality|esthers-faith-in-crisis|ethical-obligations-climate-change-christian|faith-and-science-for-skeptics|grace-under-pressure|mental-health-testimony|overcome-seasonal-depression-with-faith|pauls-thorn-in-the-flesh|people-who-never-hear-about-jesus|proverbs-wisdom-christians|psalms-raw-emotion-and-divine-truth-for-everyday-faith|purity-for-christian-men|remarriage-after-divorce-adultery-biblical|signs-of-spiritual-attack|teaching-psalms-emotional-healing|why-did-god-allow-polygamy|why-have-you-forsaken-me|women-in-church-leadership)",
  ],
};
