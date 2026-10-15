// Client-safe URLs and the flag for the Reset's simple layer.
//
// lib/reset-simple.ts reads the content from disk, so anything a Client
// Component needs lives here instead — the same split Before You Say Yes uses,
// for the same reason: node:fs must never reach the browser bundle.

export const RESET_SLUG = "christian-spiritual-reset";

