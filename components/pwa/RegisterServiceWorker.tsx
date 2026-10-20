"use client";

import { useEffect } from "react";

/**
 * Registers public/sw.js, which shows an offline page when there is no
 * internet and does nothing else (see the file). Production builds only, so
 * `next dev` is untouched.
 *
 * updateViaCache "none": the browser checks sw.js itself on every visit,
 * never from its cache, so a change to it is picked up straight away.
 */
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // Without it the site works exactly as before; nothing to report.
      });
  }, []);
  return null;
}
