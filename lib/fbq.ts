// Helpers for firing Meta Pixel events from Client Components.
//
// The pixel loads with strategy="afterInteractive", so an effect in a child
// component can easily run before the snippet has defined window.fbq. Firing
// blind would silently drop the event, so callers wait for it instead.

type Fbq = (...args: unknown[]) => void;

/**
 * Run `cb` once window.fbq exists. Returns a cleanup function for the effect.
 * Gives up quietly after `timeoutMs` — an ad blocker means fbq never arrives,
 * which is not an error worth surfacing.
 */
export function withFbq(cb: (fbq: Fbq) => void, timeoutMs = 8000): () => void {
  if (typeof window === "undefined") return () => {};

  if (window.fbq) {
    cb(window.fbq);
    return () => {};
  }

  const startedAt = Date.now();
  const timer = setInterval(() => {
    if (window.fbq) {
      clearInterval(timer);
      cb(window.fbq);
    } else if (Date.now() - startedAt > timeoutMs) {
      clearInterval(timer);
    }
  }, 200);

  return () => clearInterval(timer);
}

/**
 * Session-scoped guard so a refresh does not re-fire a conversion. Paired with
 * an eventID on the event itself, which is what deduplicates across sessions.
 * sessionStorage throws in some privacy modes, hence the try/catch.
 */
export function alreadyTracked(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

export function markTracked(key: string): void {
  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    // Private mode with storage disabled — the eventID still dedupes.
  }
}
