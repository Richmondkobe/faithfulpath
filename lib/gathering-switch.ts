/**
 * The Weekly Gathering, on or off. Off while the gathering is on hold
 * (Richmond, 12 November 2026).
 *
 * Off hides it everywhere a visitor or member would see it: the community
 * tab and home card, the /community page's "What members get" item and
 * description, the home page's "The next gathering" section and the welcome
 * email's gathering line. /community/gathering sends people to the community
 * home.
 *
 * Nothing is deleted: the gathering pages, the admin's gathering settings and
 * the community_gatherings rows all stay. To bring it back, set this to true
 * and deploy.
 */
export const GATHERING_ON = false;
