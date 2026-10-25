export const SITE = {
  name: "Faithful Path Community",
  url: "https://faithfulpathcommunity.com",
  // Richmond's wording, 17 October 2026 (website audit V22).
  tagline: "Pastoral guidance for the next faithful step",
  bookingUrl: "https://cal.com/getclb/talk-to-a-pastor",
  price: "US$60",
};

/**
 * Stripe's customer portal login page (Richmond, 26 October 2026): someone
 * types the email they pay with and Stripe emails them a link to manage or
 * cancel a monthly gift or the membership. Change it here and every link on
 * the site follows.
 */
export const STRIPE_PORTAL_LOGIN_URL = "https://billing.stripe.com/p/login/dRm6oH1Iz3Q90vK55Y1B600";
export const PORTAL_LABEL = "Manage or cancel my monthly gift or membership";

export const COUNTRIES = [
  "Canada", "United States", "Ghana", "Philippines", "Thailand",
  "Kenya", "Rwanda", "Uganda", "Nigeria", "Singapore",
];

/** Finding Help Where You Live: crisis lines and support by country. Moved
 * from /before-you-say-yes/resources, which redirects here. */
export const HELP_PATH = "/help";
