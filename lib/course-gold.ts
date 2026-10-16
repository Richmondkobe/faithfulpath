/**
 * Darker gold for text on the cream slides of the course players.
 *
 * The narrated players of Before You Say Yes, Talk Before You Marry and Lead
 * Before You're Ready set their refrains and slide numbers in the bright gold
 * #c9963f: 2.4 to 2.6:1 on the cream, under the 3:1 WCAG asks even of large
 * text (website audit A3 / V26). Richmond approved the fix on 17 October 2026:
 * those text items take the darker gold each course already uses for its small
 * labels, #8a6a24 (4.6 to 4.8:1 on the cream, paper and gold-tint cards).
 *
 * Added as the player is sent out, so the approved files and their checksums
 * stay unchanged. Only text changes: borders, buttons, dots and gold shapes
 * keep the bright gold, and the dark "not good" refrain keeps its own colour
 * (its rule is more specific). Each course passes its own data attribute, so
 * its check script can tell the addition from the approved file.
 */
export const PLAYER_TEXT_GOLD = "#8a6a24";

export function playerTextGold(attr: string, selectors: readonly string[]): string {
  return `<style ${attr}>${selectors.join(",")}{color:${PLAYER_TEXT_GOLD}}</style>`;
}
