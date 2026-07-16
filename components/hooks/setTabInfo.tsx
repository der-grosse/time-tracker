import { useQuery } from "convex/react";
import { useNow } from "./useNow";
import { formatDuration, startOfWeek } from "@/lib/time";
import { useEffect, useMemo } from "react";
import { api } from "@/convex/_generated/api";

export const useSetTabInfo = () => {
  const now = useNow();
  const weekStart = startOfWeek(now);
  const slots = useQuery(api.timeSlots.list, { since: weekStart });
  const running = useMemo(() => slots?.find((s) => s.end === undefined) ?? null, [slots]);

  // Reflect the running slot's elapsed time in the tab title.
  useEffect(() => {
    document.title = running
      ? `${formatDuration(Math.max(0, now - running.start))} · time-tracker`
      : "time-tracker";
    return () => {
      document.title = "time-tracker";
    };
  }, [running, now]);

  // Swap the favicon while a slot is running.
  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = running ? "/favicon_active.ico" : "/favicon.ico";
    return () => {
      if (link) link.href = "/favicon.ico";
    };
  }, [running]);
};
