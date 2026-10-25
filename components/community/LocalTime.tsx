"use client";

import { useSyncExternalStore } from "react";

/**
 * A gathering's time in the visitor's own time zone, read from their browser.
 * Before the page has loaded in the browser (and for anything that cannot run
 * it) the Bangkok time is shown, labelled, so the time is never wrong — only
 * not yet converted.
 */

const subscribe = () => () => {};
const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const serverZone = () => "";

const format = (iso: string, timeZone: string) =>
  new Date(iso).toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  });

export default function LocalTime({ iso }: { iso: string }) {
  const zone = useSyncExternalStore(subscribe, browserZone, serverZone);
  const bangkok = format(iso, "Asia/Bangkok");
  if (!zone) {
    return (
      <p>
        <time dateTime={iso} className="text-xl text-navy">
          {bangkok}
        </time>{" "}
        <span className="text-muted">(Bangkok time)</span>
      </p>
    );
  }
  const place = zone.replace(/^.*\//, "").replace(/_/g, " ");
  return (
    <div>
      <p>
        <time dateTime={iso} className="text-xl font-semibold text-navy">
          {format(iso, zone)}
        </time>
      </p>
      <p className="mt-1 text-[15px] text-muted">
        Your time ({place}){zone !== "Asia/Bangkok" && <> · {bangkok} in Bangkok</>}
      </p>
    </div>
  );
}
