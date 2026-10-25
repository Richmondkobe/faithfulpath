"use client";

import { useSyncExternalStore } from "react";

/**
 * The next gathering's date and time in the member's own time zone, read
 * from their browser: "Saturday 7 November, 8:00 PM (your time)". Until the
 * browser takes over it shows Bangkok time, labelled, so it is never wrong.
 */

const subscribe = () => () => {};
const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const serverZone = () => "";

const when = (iso: string, timeZone: string) => {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone });
  return `${day}, ${time}`;
};

export default function NextGatheringTime({ iso }: { iso: string }) {
  const zone = useSyncExternalStore(subscribe, browserZone, serverZone);
  return (
    <time dateTime={iso}>
      {zone ? `${when(iso, zone)} (your time)` : `${when(iso, "Asia/Bangkok")} (Bangkok time)`}
    </time>
  );
}
